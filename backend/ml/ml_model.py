"""
Root ML Prediction Service for AgriSmart AI.
Provides unified prediction interface calling actual trained models from trained_models/.
"""
import os
import pickle
import numpy as np
import pandas as pd


def _load_model(model_filename):
    model_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'trained_models', model_filename))
    if not os.path.exists(model_path):
        return None, None
    with open(model_path, 'rb') as f:
        data = pickle.load(f)
        if isinstance(data, dict) and 'model' in data:
            return data['model'], data.get('label_encoder')
        return data, None


def _safe_float(val, default):
    """Convert val to float; return default if val is None, '', or non-numeric."""
    if val is None or val == '':
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return default


FEATURE_COLUMNS = ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall']


def _build_feature_df(data, defaults):
    row = {
        'N': _safe_float(data.get('N'), defaults.get('N', 80.0)),
        'P': _safe_float(data.get('P'), defaults.get('P', 40.0)),
        'K': _safe_float(data.get('K'), defaults.get('K', 35.0)),
        'temperature': _safe_float(data.get('temperature'), defaults.get('temperature', 25.0)),
        'humidity': _safe_float(data.get('humidity'), defaults.get('humidity', 65.0)),
        'ph': _safe_float(data.get('ph'), defaults.get('ph', 6.5)),
        'rainfall': _safe_float(data.get('rainfall'), defaults.get('rainfall', 120.0)),
    }
    return pd.DataFrame([row], columns=FEATURE_COLUMNS)


def predict_crop(data):
    try:
        model, le = _load_model('crop_model.pkl')
        if model is None:
            return "Model not trained yet", 0.0

        df_features = _build_feature_df(data, {'N': 80, 'P': 40, 'K': 35, 'temperature': 25.0, 'humidity': 65.0, 'ph': 6.5, 'rainfall': 120.0})

        pred_code = model.predict(df_features)[0]
        if le is not None:
            prediction = le.inverse_transform([pred_code])[0]
        else:
            prediction = str(pred_code)

        probabilities = model.predict_proba(df_features)[0]
        confidence = float(np.max(probabilities)) * 100.0

        return prediction, round(confidence, 1)

    except Exception as e:
        print(f"Error in crop prediction: {e}")
        return "Error", 0.0


def predict_pest(data):
    try:
        model, _ = _load_model('pest_model.pkl')
        if model is None:
            return "Model not trained yet", 0.0

        df_features = _build_feature_df(data, {'N': 80, 'P': 40, 'K': 35, 'temperature': 25.0, 'humidity': 70.0, 'ph': 6.5, 'rainfall': 100.0})

        prediction = model.predict(df_features)[0]
        probabilities = model.predict_proba(df_features)[0]
        confidence = float(np.max(probabilities)) * 100.0

        return str(prediction), round(confidence, 1)
    except Exception as e:
        print(f"Error in pest prediction: {e}")
        return "Error", 0.0


def predict_yield(data):
    try:
        model, _ = _load_model('yield_model.pkl')
        if model is None:
            return "Model not trained yet", 0.0

        df_features = _build_feature_df(data, {'N': 70, 'P': 40, 'K': 35, 'temperature': 25.0, 'humidity': 60.0, 'ph': 6.5, 'rainfall': 120.0})

        prediction = model.predict(df_features)[0]
        probabilities = model.predict_proba(df_features)[0]
        confidence = float(np.max(probabilities)) * 100.0

        return str(prediction), round(confidence, 1)
    except Exception as e:
        print(f"Error in yield prediction: {e}")
        return "Error", 0.0




