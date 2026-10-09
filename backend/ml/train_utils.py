"""Shared training utilities for Gaussian Naïve Bayes models."""
from sklearn.model_selection import train_test_split


def split_train_test(X, y, test_size=0.2, random_state=42):
    """Split data with stratification when each class has enough samples."""
    min_class_count = y.value_counts().min()
    if len(y) >= 10 and min_class_count >= 2:
        return train_test_split(X, y, test_size=test_size, random_state=random_state, stratify=y)
    return train_test_split(X, y, test_size=test_size, random_state=random_state)
