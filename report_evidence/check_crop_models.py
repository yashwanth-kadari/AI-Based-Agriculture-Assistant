import os
import pickle
import pandas as pd
import numpy as np
from sklearn.naive_bayes import GaussianNB
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import StratifiedKFold, cross_val_score, train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix

def main():
    pkl_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', 'trained_models', 'crop_model.pkl'))
    dataset_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', 'dataset', 'crop_data.csv'))

    print("=== PART (a): Inspecting crop_model.pkl ===")
    if not os.path.exists(pkl_path):
        print(f"Error: {pkl_path} does not exist!")
        return

    with open(pkl_path, 'rb') as f:
        loaded_obj = pickle.load(f)

    if isinstance(loaded_obj, dict):
        model = loaded_obj.get('model')
        le = loaded_obj.get('label_encoder')
    else:
        model = loaded_obj
        le = None

    print(f"Loaded Object Type: {type(loaded_obj)}")
    print(f"Model Class: {model.__class__.__module__}.{model.__class__.__name__}")
    print(f"Has LabelEncoder: {le is not None}")
    if hasattr(model, 'get_params'):
        print("Model Parameters:")
        for k, v in model.get_params().items():
            print(f"  {k}: {v}")

    print("\n=== PART (b): Side-by-Side Evaluation on crop_data.csv ===")
    df = pd.read_csv(dataset_path)
    X = df.drop(columns=['label'])
    y = df['label']

    print(f"Dataset shape: {df.shape}")
    print(f"Classes ({len(y.unique())}): {sorted(y.unique().tolist())}")

    majority_baseline = float(y.value_counts(normalize=True).max() * 100.0)
    print(f"Majority Class Baseline: {majority_baseline:.2f}%")

    le = LabelEncoder()
    y_encoded = le.fit_transform(y)

    models = {
        'GaussianNB': GaussianNB(),
        'HistGradientBoostingClassifier': HistGradientBoostingClassifier(
            max_iter=150,
            learning_rate=0.08,
            max_depth=6,
            random_state=42
        )
    }

    results = {}

    for name, clf in models.items():
        print(f"\n--- Evaluating {name} ---")
        # 5-Fold Stratified CV (random_state=42)
        cv5 = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
        # For HistGradientBoostingClassifier with string labels vs encoded:
        # Note: HistGradientBoosting works with string or encoded labels, but let's check both or encoded
        cv5_scores = cross_val_score(clf, X, y_encoded, cv=cv5) * 100.0
        cv5_mean = cv5_scores.mean()
        cv5_std = cv5_scores.std()

        # 10-Seed Stability Check (seeds 0..9)
        seed_scores = []
        for seed in range(10):
            cv_seed = StratifiedKFold(n_splits=5, shuffle=True, random_state=seed)
            s = cross_val_score(clf, X, y_encoded, cv=cv_seed) * 100.0
            seed_scores.append(s.mean())
        seed_scores = np.array(seed_scores)

        # 80/20 Test Split
        X_train, X_test, y_train, y_test = train_test_split(
            X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
        )
        clf.fit(X_train, y_train)
        test_preds = clf.predict(X_test)
        test_acc = accuracy_score(y_test, test_preds) * 100.0

        results[name] = {
            'cv5_scores': cv5_scores.tolist(),
            'cv5_mean': cv5_mean,
            'cv5_std': cv5_std,
            'seed10_mean': seed_scores.mean(),
            'seed10_min': seed_scores.min(),
            'seed10_max': seed_scores.max(),
            'seed10_scores': seed_scores.tolist(),
            'test_acc': test_acc
        }

        print(f"5-Fold CV Scores: {[round(s, 2) for s in cv5_scores]}")
        print(f"5-Fold CV Accuracy: {cv5_mean:.2f}% ± {cv5_std:.2f}%")
        print(f"10-Seed Stability Mean: {seed_scores.mean():.2f}% (Min: {seed_scores.min():.2f}%, Max: {seed_scores.max():.2f}%)")
        print(f"Held-Out 80/20 Test Accuracy: {test_acc:.2f}%")

    print("\n=== SUMMARY COMPARISON ===")
    print(f"{'Metric':<35} | {'GaussianNB':<15} | {'HistGradientBoosting':<22}")
    print("-" * 78)
    print(f"{'5-Fold CV Mean':<35} | {results['GaussianNB']['cv5_mean']:.2f}%{'':<9} | {results['HistGradientBoostingClassifier']['cv5_mean']:.2f}%")
    print(f"{'5-Fold CV Std Dev':<35} | {results['GaussianNB']['cv5_std']:.2f}%{'':<9} | {results['HistGradientBoostingClassifier']['cv5_std']:.2f}%")
    print(f"{'10-Seed Stability Mean':<35} | {results['GaussianNB']['seed10_mean']:.2f}%{'':<9} | {results['HistGradientBoostingClassifier']['seed10_mean']:.2f}%")
    print(f"{'10-Seed Stability Range (Min-Max)':<35} | {results['GaussianNB']['seed10_min']:.2f}% - {results['GaussianNB']['seed10_max']:.2f}% | {results['HistGradientBoostingClassifier']['seed10_min']:.2f}% - {results['HistGradientBoostingClassifier']['seed10_max']:.2f}%")
    print(f"{'Held-Out 80/20 Test Accuracy':<35} | {results['GaussianNB']['test_acc']:.2f}%{'':<9} | {results['HistGradientBoostingClassifier']['test_acc']:.2f}%")

if __name__ == '__main__':
    main()
