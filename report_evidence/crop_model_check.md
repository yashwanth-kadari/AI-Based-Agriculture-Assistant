# Crop Model Discrepancy & Evaluation Check

## Executive Summary
- **Evaluation Script (`backend/ml/evaluation/evaluate_all.py`)**: Evaluates `GaussianNB` and reports **92.20%** 5-fold CV accuracy.
- **Model Training Script (`backend/ml/train_model.py`)**: Trains `HistGradientBoostingClassifier` (`max_iter=150`, `learning_rate=0.08`, `max_depth=6`, `random_state=42`) and saves it to `backend/trained_models/crop_model.pkl`.
- **Deployed Model**: The saved model `backend/trained_models/crop_model.pkl` loaded by `backend/ml/ml_model.py` (`predict_crop()`) is **`HistGradientBoostingClassifier`**, NOT `GaussianNB`.
- **Integrity**: Per instructions, no model files were overwritten or modified.

---

## 1. Inspection of `backend/trained_models/crop_model.pkl`

Loading `crop_model.pkl` with Python's `pickle` confirms:
- **Object Class**: `sklearn.ensemble._hist_gradient_boosting.gradient_boosting.HistGradientBoostingClassifier`
- **Label Encoder Bundled**: `False` (the model was trained directly on string class labels `['Cotton', 'Maize', 'Rice', 'Wheat']`)
- **Fitted Hyperparameters**:
  ```python
  {
      'loss': 'log_loss',
      'learning_rate': 0.08,
      'max_iter': 150,
      'max_leaf_nodes': 31,
      'max_depth': 6,
      'min_samples_leaf': 20,
      'l2_regularization': 0.0,
      'max_bins': 255,
      'categorical_features': 'from_dtype',
      'monotonic_cst': None,
      'interaction_cst': None,
      'warm_start': False,
      'early_stopping': 'auto',
      'scoring': 'loss',
      'validation_fraction': 0.1,
      'n_iter_no_change': 10,
      'tol': 1e-07,
      'verbose': 0,
      'random_state': 42,
      'class_weight': None
  }
  ```

---

## 2. Side-by-Side Evaluation Protocol

- **Dataset**: `backend/dataset/crop_data.csv` (500 samples, 7 numerical features: `N`, `P`, `K`, `temperature`, `humidity`, `ph`, `rainfall`, 1 label column)
- **Target Classes**: 4 classes (`Cotton`, `Maize`, `Rice`, `Wheat`), 125 samples each
- **Majority Class Baseline**: 25.00%
- **Validation Protocol**:
  1. Stratified 5-Fold Cross Validation (`shuffle=True`, `random_state=42`)
  2. 10-Seed Stability Protocol (Stratified 5-Fold CV across seeds 0 through 9)
  3. Stratified 80/20 Train/Test Split (`random_state=42`)

---

## 3. Side-by-Side Results

| Metric | Gaussian Naive Bayes (`GaussianNB`) | HistGradientBoostingClassifier | Delta (HGB - GNB) |
| :--- | :--- | :--- | :--- |
| **5-Fold CV Mean** | **92.20%** | **89.60%** | -2.60% |
| **5-Fold CV Std Dev** | **± 2.56%** | **± 2.87%** | +0.31% |
| **Fold 1 Score** | 92.00% | 93.00% | +1.00% |
| **Fold 2 Score** | 92.00% | 88.00% | -4.00% |
| **Fold 3 Score** | 90.00% | 86.00% | -4.00% |
| **Fold 4 Score** | 97.00% | 93.00% | -4.00% |
| **Fold 5 Score** | 90.00% | 88.00% | -2.00% |
| **10-Seed Stability Mean** | **92.26%** | **90.26%** | -2.00% |
| **10-Seed Min Score** | 91.60% | 89.20% | -2.40% |
| **10-Seed Max Score** | 92.80% | 91.20% | -1.60% |
| **Held-out Test (80/20)** | **93.00%** | **92.00%** | -1.00% |

---

## 4. Analysis & Conclusion

1. **Why `evaluate_all.py` reports 92.20%**:
   `backend/ml/evaluation/evaluate_all.py` hard-codes `GaussianNB()` for all classification evaluations (crop, pest, yield). On `crop_data.csv`, `GaussianNB()` yields exactly **92.20% ± 2.56%** 5-Fold CV accuracy.
2. **What is deployed**:
   `backend/ml/train_model.py` trains `HistGradientBoostingClassifier` and writes to `crop_model.pkl`. When Flask starts, `backend/ml/ml_model.py` loads `crop_model.pkl`. Therefore, **HistGradientBoostingClassifier is the model actually deployed in production**.
3. **Performance comparison**:
   - `GaussianNB` scores **92.20%** 5-fold CV (10-seed mean: 92.26%).
   - `HistGradientBoostingClassifier` scores **89.60%** 5-fold CV (10-seed mean: 90.26%).
   On this 500-sample dataset, `GaussianNB` outperforms `HistGradientBoostingClassifier` by approximately 2.6 percentage points on 5-fold CV.
