import pandas as pd
import numpy as np
from sklearn.naive_bayes import GaussianNB
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import pickle
import os


def train():
    dataset_path = os.path.join(os.path.dirname(__file__), '..', 'dataset', 'yield_data.csv')
    if not os.path.exists(dataset_path):
        print("Yield dataset not found. Please run generate_datasets.py first.")
        return

    df = pd.read_csv(dataset_path)
    X = df.drop(columns=['label'])
    y = df['label']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    model = GaussianNB()
    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    accuracy = accuracy_score(y_test, predictions)
    print(f"Yield Model Accuracy: {accuracy * 100:.2f}%")

    model_dir = os.path.join(os.path.dirname(__file__), '..', 'trained_models')
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, 'yield_model.pkl')

    with open(model_path, 'wb') as f:
        pickle.dump(model, f)

    print(f"Yield model saved as {os.path.basename(model_path)}")


if __name__ == '__main__':
    train()
