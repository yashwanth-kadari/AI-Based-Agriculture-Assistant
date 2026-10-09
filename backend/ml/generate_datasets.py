"""Generate expanded training datasets for all ML models with realistic feature variance and noise."""
import os
import random
import csv

random.seed(42)
DATASET_DIR = os.path.join(os.path.dirname(__file__), '..', 'dataset')


def _write_csv(filename, rows, fieldnames):
    path = os.path.join(DATASET_DIR, filename)
    os.makedirs(DATASET_DIR, exist_ok=True)
    with open(path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)
    print(f'Wrote {len(rows)} rows to {filename}')


def _jitter(base, spread, lo=None, hi=None, noise_prob=0.08):
    """Add Gaussian/uniform jitter with occasional environmental noise/outliers."""
    val = base + random.gauss(0, spread)
    if random.random() < noise_prob:
        val += random.uniform(-spread * 2, spread * 2)
    if lo is not None:
        val = max(lo, val)
    if hi is not None:
        val = min(hi, val)
    return round(val, 2)


def generate_crop_data(n=500):
    profiles = {
        'Rice':   {'N': 80, 'P': 45, 'K': 40, 'temperature': 23.5, 'humidity': 88, 'ph': 6.8, 'rainfall': 235},
        'Maize':  {'N': 95, 'P': 25, 'K': 35, 'temperature': 24.5, 'humidity': 55, 'ph': 6.5, 'rainfall': 125},
        'Wheat':  {'N': 70, 'P': 42, 'K': 25, 'temperature': 21.5, 'humidity': 30, 'ph': 6.2, 'rainfall': 75},
        'Cotton': {'N': 110, 'P': 55, 'K': 48, 'temperature': 28.0, 'humidity': 50, 'ph': 7.2, 'rainfall': 90},
    }
    rows = []
    per_label = n // len(profiles)
    for label, base in profiles.items():
        for _ in range(per_label):
            rows.append({
                'N': _jitter(base['N'], 18, 40, 140, noise_prob=0.08),
                'P': _jitter(base['P'], 14, 10, 75, noise_prob=0.08),
                'K': _jitter(base['K'], 12, 10, 75, noise_prob=0.08),
                'temperature': _jitter(base['temperature'], 3.5, 14, 38, noise_prob=0.08),
                'humidity': _jitter(base['humidity'], 9, 15, 95, noise_prob=0.08),
                'ph': _jitter(base['ph'], 0.7, 4.8, 8.5, noise_prob=0.08),
                'rainfall': _jitter(base['rainfall'], 35, 30, 320, noise_prob=0.08),
                'label': label,
            })
    random.shuffle(rows)
    _write_csv('crop_data.csv', rows, ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall', 'label'])


def generate_pest_data(n=400):
    profiles = {
        'NoPest': {'N': 80, 'P': 40, 'K': 35, 'temperature': 24.0, 'humidity': 55, 'ph': 6.6, 'rainfall': 120},
        'Aphids': {'N': 70, 'P': 30, 'K': 25, 'temperature': 29.0, 'humidity': 85, 'ph': 6.4, 'rainfall': 200},
        'Locust': {'N': 95, 'P': 22, 'K': 35, 'temperature': 27.0, 'humidity': 45, 'ph': 6.5, 'rainfall': 60},
    }
    rows = []
    per_label = n // len(profiles)
    for label, base in profiles.items():
        for _ in range(per_label):
            rows.append({
                'N': _jitter(base['N'], 15, 45, 120, noise_prob=0.12),
                'P': _jitter(base['P'], 12, 10, 65, noise_prob=0.12),
                'K': _jitter(base['K'], 12, 10, 60, noise_prob=0.12),
                'temperature': _jitter(base['temperature'], 3.2, 18, 36, noise_prob=0.12),
                'humidity': _jitter(base['humidity'], 12, 30, 95, noise_prob=0.12),
                'ph': _jitter(base['ph'], 0.6, 5.2, 8.0, noise_prob=0.12),
                'rainfall': _jitter(base['rainfall'], 40, 30, 280, noise_prob=0.12),
                'label': label,
            })
    random.shuffle(rows)
    _write_csv('pest_data.csv', rows, ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall', 'label'])


def generate_yield_data(n=400):
    profiles = {
        'High': {'N': 90, 'P': 48, 'K': 42, 'temperature': 23.5, 'humidity': 65, 'ph': 6.7, 'rainfall': 160},
        'Medium': {'N': 70, 'P': 32, 'K': 28, 'temperature': 26.5, 'humidity': 55, 'ph': 6.3, 'rainfall': 110},
        'Low': {'N': 50, 'P': 20, 'K': 16, 'temperature': 31.0, 'humidity': 40, 'ph': 5.8, 'rainfall': 50},
    }
    rows = []
    per_label = n // len(profiles)
    for label, base in profiles.items():
        for _ in range(per_label):
            rows.append({
                'N': _jitter(base['N'], 15, 35, 115, noise_prob=0.12),
                'P': _jitter(base['P'], 10, 10, 65, noise_prob=0.12),
                'K': _jitter(base['K'], 10, 10, 60, noise_prob=0.12),
                'temperature': _jitter(base['temperature'], 3.0, 16, 36, noise_prob=0.12),
                'humidity': _jitter(base['humidity'], 10, 25, 90, noise_prob=0.12),
                'ph': _jitter(base['ph'], 0.6, 5.0, 8.0, noise_prob=0.12),
                'rainfall': _jitter(base['rainfall'], 38, 25, 260, noise_prob=0.12),
                'label': label,
            })
    random.shuffle(rows)
    _write_csv('yield_data.csv', rows, ['N', 'P', 'K', 'temperature', 'humidity', 'ph', 'rainfall', 'label'])


if __name__ == '__main__':
    os.makedirs(DATASET_DIR, exist_ok=True)
    generate_crop_data()
    generate_pest_data()
    generate_yield_data()
    print('All datasets generated successfully with realistic variance and noise.')
