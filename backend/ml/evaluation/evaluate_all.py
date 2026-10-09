"""
Comprehensive Evaluation & Accuracy Reporting Script for AgriSmart AI.
Evaluates all classification (Crop, Pest, Yield, Market Trend) and regression (Market Price Forecast) models.
Outputs results to ml/evaluation/accuracy_report.txt and ml/evaluation/results.json.
"""
import os
import sys
import json
import pickle
import pandas as pd
import numpy as np
from sklearn.naive_bayes import GaussianNB
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.metrics import accuracy_score, confusion_matrix, classification_report, mean_absolute_error, r2_score

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..')))
from utils.db import get_db_connection


def evaluate_classification_model(dataset_file, model_name):
    dataset_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', 'dataset', dataset_file))
    if not os.path.exists(dataset_path):
        return None

    df = pd.read_csv(dataset_path)
    X = df.drop(columns=['label'])
    y = df['label']

    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    majority_baseline = float(y.value_counts(normalize=True).max() * 100.0)

    model = GaussianNB()

    # 5-Fold CV
    cv5 = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv5_scores = cross_val_score(model, X, y_encoded, cv=cv5) * 100.0

    # 10 Random-Seed Stability
    seed_scores = []
    for seed in range(10):
        cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=seed)
        s = cross_val_score(model, X, y_encoded, cv=cv)
        seed_scores.append(s.mean() * 100.0)
    seed_scores = np.array(seed_scores)

    # Confusion matrix on 80/20 test split
    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded)
    model.fit(X_train, y_train)
    preds = model.predict(X_test)
    cm = confusion_matrix(y_test, preds)

    return {
        'model_name': model_name,
        'majority_class_baseline': round(majority_baseline, 2),
        'cv5_mean': round(float(cv5_scores.mean()), 2),
        'cv5_std': round(float(cv5_scores.std()), 2),
        'seed10_mean': round(float(seed_scores.mean()), 2),
        'seed10_min': round(float(seed_scores.min()), 2),
        'seed10_max': round(float(seed_scores.max()), 2),
        'confusion_matrix': cm.tolist(),
        'classes': le.classes_.tolist()
    }


def evaluate_market_forecast():
    conn = get_db_connection()
    if not conn:
        return None

    query = "SELECT mandi_id, crop_name, price, price_date FROM market_prices WHERE status = 'Active' ORDER BY mandi_id, crop_name, price_date ASC"
    df = pd.read_sql_query(query, conn)
    conn.close()

    if df.empty:
        return None

    CROP_MAPPING = {'Rice': 0, 'Wheat': 1, 'Maize': 2, 'Cotton': 3, 'Tomato': 4, 'Potato': 5}
    df['price_date'] = pd.to_datetime(df['price_date'])
    df['crop_code'] = df['crop_name'].map(CROP_MAPPING).fillna(-1).astype(int)
    df = df[df['crop_code'] >= 0].copy()

    training_samples = []
    for (mandi_id, crop_name), group in df.groupby(['mandi_id', 'crop_name']):
        group = group.sort_values('price_date').reset_index(drop=True)
        n = len(group)
        prices = group['price'].values
        dates = group['price_date'].dt.date.values
        crop_code = CROP_MAPPING[crop_name]
        for i in range(7, n):
            current_date = dates[i]
            current_price = prices[i]
            lag_1 = prices[i - 1]
            lag_7 = prices[i - 7]
            rolling_7 = np.mean(prices[i-7:i])
            day_of_week = current_date.weekday()
            month = current_date.month
            for horizon in [7, 14, 30]:
                target_idx = i + horizon
                if target_idx < n:
                    training_samples.append({
                        'mandi_id': mandi_id, 'crop_code': crop_code,
                        'current_price': current_price, 'lag_1': lag_1, 'lag_7': lag_7,
                        'rolling_7': rolling_7, 'day_of_week': day_of_week, 'month': month,
                        'forecast_days': horizon, 'price_date': current_date, 'target_price': prices[target_idx]
                    })

    samples_df = pd.DataFrame(training_samples).sort_values('price_date').reset_index(drop=True)
    split_idx = int(len(samples_df) * 0.80)
    train_df = samples_df.iloc[:split_idx]
    test_df = samples_df.iloc[split_idx:]

    feature_cols = ['mandi_id', 'crop_code', 'current_price', 'lag_1', 'lag_7', 'rolling_7', 'day_of_week', 'month', 'forecast_days']
    model = RandomForestRegressor(n_estimators=120, max_depth=12, random_state=42, n_jobs=-1)
    model.fit(train_df[feature_cols], train_df['target_price'])

    all_preds = model.predict(test_df[feature_cols])
    all_y = test_df['target_price'].values

    horizon_results = {}
    for h in [7, 14, 30]:
        sub = test_df[test_df['forecast_days'] == h]
        preds = model.predict(sub[feature_cols])
        y_true = sub['target_price'].values
        y_naive = sub['current_price'].values

        mae_model = float(mean_absolute_error(y_true, preds))
        r2_model = float(r2_score(y_true, preds))
        mae_naive = float(mean_absolute_error(y_true, y_naive))
        r2_naive = float(r2_score(y_true, y_naive))

        horizon_results[f'{h}_day'] = {
            'model_mae': round(mae_model, 2),
            'model_r2': round(r2_model, 4),
            'naive_mae': round(mae_naive, 2),
            'naive_r2': round(r2_naive, 4)
        }

    return {
        'model_name': 'Market Price Forecast (RandomForestRegressor - Time-Series Split)',
        'overall_mae': round(float(mean_absolute_error(all_y, all_preds)), 2),
        'overall_r2': round(float(r2_score(all_y, all_preds)), 4),
        'horizons': horizon_results
    }


def main():
    eval_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'evaluation'))
    os.makedirs(eval_dir, exist_ok=True)

    results = {
        'crop_recommendation': evaluate_classification_model('crop_data.csv', 'Crop Recommendation (GaussianNB)'),
        'pest_prediction': evaluate_classification_model('pest_data.csv', 'Pest Risk Prediction (GaussianNB)'),
        'yield_classification': evaluate_classification_model('yield_data.csv', 'Yield Category Classification (GaussianNB)'),
        'market_forecast_regression': evaluate_market_forecast()
    }

    # Write JSON results
    json_path = os.path.join(eval_dir, 'results.json')
    with open(json_path, 'w') as f:
        json.dump(results, f, indent=2)

    # Write human-readable text report
    report_path = os.path.join(eval_dir, 'accuracy_report.txt')
    lines = []
    lines.append("================================================================================")
    lines.append("                        AGRISMART AI — MODEL EVALUATION REPORT                  ")
    lines.append("================================================================================")
    lines.append("")

    for key in ['crop_recommendation', 'pest_prediction', 'yield_classification']:
        r = results[key]
        if not r:
            continue
        lines.append(f"--- MODEL: {r['model_name']} ---")
        lines.append(f"  Architecture                 : Gaussian Naive Bayes")
        lines.append(f"  Majority Class Baseline      : {r['majority_class_baseline']}%")
        lines.append(f"  5-Fold Cross-Validation      : {r['cv5_mean']}% ± {r['cv5_std']}%")
        lines.append(f"  10-Seed Stability (Mean)     : {r['seed10_mean']}%")
        lines.append(f"  10-Seed Stability (Min / Max): {r['seed10_min']}% / {r['seed10_max']}%")
        lines.append(f"  Classes                      : {', '.join(r['classes'])}")
        lines.append("")

    mr = results['market_forecast_regression']
    if mr:
        lines.append(f"--- MODEL: {mr['model_name']} ---")
        lines.append(f"  Overall Time-Series Split MAE: Rs.{mr['overall_mae']}")
        lines.append(f"  Overall Time-Series Split R² : {mr['overall_r2']}")
        lines.append("  Horizon Evaluation:")
        for h_key, h_data in mr['horizons'].items():
            lines.append(f"    - {h_key.replace('_', ' ').upper()}: Model MAE=Rs.{h_data['model_mae']}, R²={h_data['model_r2']} | Naive MAE=Rs.{h_data['naive_mae']}, R²={h_data['naive_r2']}")
        lines.append("")

    lines.append("================================================================================")
    report_text = "\n".join(lines)

    with open(report_path, 'w') as f:
        f.write(report_text)

    print(report_text)
    print(f"\n[+] Full accuracy report saved to {report_path}")
    print(f"[+] Full JSON evaluation saved to {json_path}")


if __name__ == '__main__':
    main()
