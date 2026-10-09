"""Train all ML models and run evaluation suite."""
import os
import sys

# Ensure backend root is on sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import ml.generate_datasets as generate_datasets
import ml.train_model as train_model
import ml.train_pest as train_pest
import ml.train_yield as train_yield
import ml.train_market_forecast as train_market_forecast
import ml.evaluation.evaluate_all as evaluate_all

if __name__ == '__main__':
    print('=== 1. Generating Datasets ===')
    generate_datasets.generate_crop_data()
    generate_datasets.generate_pest_data()
    generate_datasets.generate_yield_data()

    print('\n=== 2. Training Classification Models (GaussianNB) ===')
    train_model.train()
    train_pest.train()
    train_yield.train()

    print('\n=== 3. Training Market Price Forecast Regression Model (RandomForest) ===')
    train_market_forecast.train()

    print('\n=== 4. Running Evaluation Suite ===')
    evaluate_all.main()

    print('\n✅ All models trained, validated, and evaluated successfully!')
