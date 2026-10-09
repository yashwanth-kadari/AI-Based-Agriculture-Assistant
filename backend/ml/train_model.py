import pandas as pd
import numpy as np
from sklearn.naive_bayes import GaussianNB
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import pickle
import os


def train():
    dataset_path = os.path.join(os.path.dirname(__file__), '..', 'dataset', 'crop_data.csv')
    if not os.path.exists(dataset_path):
        print("Dataset not found. Please run generate_datasets.py first.")
        return

    df = pd.read_csv(dataset_path)
    X = df.drop(columns=['label'])
    y = df['label']

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # GaussianNB matching evaluate_all.py
    model = GaussianNB()

    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(model, X, y, cv=cv)
    print(f"Crop Model 5-Fold Cross-Validated Accuracy: {cv_scores.mean() * 100:.2f}% ± {cv_scores.std() * 100:.2f}%")

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)
    test_accuracy = accuracy_score(y_test, predictions)
    print(f"Crop Model Held-Out Test Accuracy: {test_accuracy * 100:.2f}%")
    print("Confusion Matrix:")
    print(confusion_matrix(y_test, predictions))
    print("\nClassification Report:")
    print(classification_report(y_test, predictions))

    model_dir = os.path.join(os.path.dirname(__file__), '..', 'trained_models')
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, 'crop_model.pkl')

    with open(model_path, 'wb') as f:
        pickle.dump(model, f)

    print(f"Crop model saved as {os.path.basename(model_path)}")


if __name__ == '__main__':
    train()
