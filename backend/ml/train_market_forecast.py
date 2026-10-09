"""
TIME-SERIES MARKET PRICE FORECAST MODEL TRAINING SCRIPT
AgriSmart AI — Regression Model on Historical Mandi Prices

This script trains a regression model (RandomForestRegressor) to forecast future crop prices 
based on historical mandi price series, lag prices, moving averages, seasonal features, 
and forecast horizon (days ahead).

Evaluation uses strict time-based split (earlier dates for training, later dates for testing).
Metrics reported: MAE (Mean Absolute Error in ₹) and R² score.
Saved model: trained_models/market_forecast_model.pkl
"""

import os
import sys
import pickle
import pandas as pd
import numpy as np

from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

# Add backend directory to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from utils.db import get_db_connection

CROP_MAPPING = {
    'Rice': 0,
    'Wheat': 1,
    'Maize': 2,
    'Cotton': 3,
    'Tomato': 4,
    'Potato': 5
}

def train():
    print("=== Training Market Price Forecast Regression Model ===")
    conn = get_db_connection()
    query = """
        SELECT mandi_id, crop_name, price, price_date 
        FROM market_prices 
        WHERE status = 'Active' 
        ORDER BY mandi_id, crop_name, price_date ASC
    """
    df = pd.read_sql_query(query, conn)
    conn.close()

    if df.empty:
        print("[!] No price data found in database. Run generate_price_history.py first.")
        return

    df['price_date'] = pd.to_datetime(df['price_date'])
    df['crop_code'] = df['crop_name'].map(CROP_MAPPING).fillna(-1).astype(int)

    # Filter out unknown crops
    df = df[df['crop_code'] >= 0].copy()

    training_samples = []

    # Process each (mandi, crop) group chronologically
    grouped = df.groupby(['mandi_id', 'crop_name'])

    for (mandi_id, crop_name), group in grouped:
        group = group.sort_values('price_date').reset_index(drop=True)
        n = len(group)

        # Calculate lag and rolling features
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

            # Generate target samples for forecast horizons: 7, 14, 30 days into future
            for horizon in [7, 14, 30]:
                target_idx = i + horizon
                if target_idx < n:
                    target_price = prices[target_idx]
                    training_samples.append({
                        'mandi_id': mandi_id,
                        'crop_code': crop_code,
                        'current_price': current_price,
                        'lag_1': lag_1,
                        'lag_7': lag_7,
                        'rolling_7': rolling_7,
                        'day_of_week': day_of_week,
                        'month': month,
                        'forecast_days': horizon,
                        'price_date': current_date,
                        'target_price': target_price
                    })

    samples_df = pd.DataFrame(training_samples)
    print(f"[+] Engineered {len(samples_df)} time-series regression samples.")

    if samples_df.empty:
        print("[!] Insufficient data points for feature engineering.")
        return

    # Strict TIME-BASED Train/Test Split (80% early dates for train, 20% late dates for test)
    samples_df = samples_df.sort_values('price_date').reset_index(drop=True)
    split_idx = int(len(samples_df) * 0.80)

    train_df = samples_df.iloc[:split_idx]
    test_df = samples_df.iloc[split_idx:]

    feature_cols = [
        'mandi_id', 'crop_code', 'current_price', 'lag_1', 'lag_7',
        'rolling_7', 'day_of_week', 'month', 'forecast_days'
    ]

    X_train = train_df[feature_cols]
    y_train = train_df['target_price']

    X_test = test_df[feature_cols]
    y_test = test_df['target_price']

    print(f"[+] Time-based split: {len(X_train)} training rows (earlier dates), {len(X_test)} testing rows (later dates).")

    # Fit Regression Model
    model = RandomForestRegressor(n_estimators=120, max_depth=12, random_state=42, n_jobs=-1)
    model.fit(X_train, y_train)

    # Evaluate
    predictions = model.predict(X_test)
    mae = mean_absolute_error(y_test, predictions)
    r2 = r2_score(y_test, predictions)

    print(f"\n==========================================")
    print(f"Market Forecast Model Performance (Regression):")
    print(f"  Mean Absolute Error (MAE): Rs.{mae:.2f}")
    print(f"  R² Score:                  {r2:.4f}")
    print(f"==========================================\n")

    # Save trained model and metadata
    model_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'trained_models'))
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, 'market_forecast_model.pkl')

    save_payload = {
        'model': model,
        'feature_cols': feature_cols,
        'crop_mapping': CROP_MAPPING,
        'mae': mae,
        'r2': r2
    }

    with open(model_path, 'wb') as f:
        pickle.dump(save_payload, f)

    print(f"[+] Trained model saved successfully to: {os.path.basename(model_path)}")
    return mae, r2

if __name__ == '__main__':
    train()
