"""
SentinelIQ — ML Training Pipeline
==================================
Trains a Random Forest classifier to predict crime hotspots and
an IsolationForest for anomaly detection.

Usage:
    pip install pandas scikit-learn joblib numpy
    python scripts/train_model.py

Output:
    models/crime_rf.pkl      — crime type classifier
    models/anomaly_iso.pkl   — anomaly detector
    models/label_encoder.pkl — district label encoder
"""

import os
import json
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
import joblib

from sklearn.ensemble import RandomForestClassifier, IsolationForest
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.metrics import classification_report, roc_auc_score, confusion_matrix
from sklearn.pipeline import Pipeline

# ── Config ────────────────────────────────────────────────────────
RANDOM_STATE = 42
N_SAMPLES    = 160_000
MODELS_DIR   = os.path.join(os.path.dirname(__file__), '..', 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

CRIME_TYPES = ['violent', 'property', 'theft', 'drug', 'vandalism']
DISTRICTS   = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Midtown', 'Staten Island']

CITIES = {
    'nyc':     (40.7128, -74.0060),
    'la':      (34.0522, -118.2437),
    'chicago': (41.8781, -87.6298),
    'houston': (29.7604, -95.3698),
}


# ── 1. Synthetic dataset generation ──────────────────────────────
def generate_dataset(n: int = N_SAMPLES) -> pd.DataFrame:
    """Generate a realistic synthetic crime dataset with spatial clusters."""
    print(f"[1/5] Generating {n:,} synthetic crime records…")
    rng = np.random.default_rng(RANDOM_STATE)

    records = []
    for city_key, (base_lat, base_lng) in CITIES.items():
        n_city = n // len(CITIES)

        # Hotspot cluster centres for this city
        clusters = [
            (base_lat + 0.03,  base_lng - 0.04, 3.0),
            (base_lat - 0.05,  base_lng + 0.06, 2.0),
            (base_lat + 0.01,  base_lng + 0.02, 2.5),
            (base_lat - 0.02,  base_lng - 0.07, 1.5),
            (base_lat + 0.06,  base_lng + 0.03, 1.0),
        ]

        for _ in range(n_city):
            # Pick a cluster (weighted by intensity)
            weights = [c[2] for c in clusters]
            total   = sum(weights)
            probs   = [w / total for w in weights]
            ci      = rng.choice(len(clusters), p=probs)
            clat, clng, cw = clusters[ci]

            sigma = 0.018 / cw
            lat   = clat + rng.normal(0, sigma)
            lng   = clng + rng.normal(0, sigma)

            # Time features
            hour      = rng.integers(0, 24)
            day_week  = rng.integers(0, 7)
            month     = rng.integers(1, 13)

            # Crime type — biased by time of day
            night   = hour >= 22 or hour <= 5
            weights_type = {
                'violent':   0.30 if night else 0.15,
                'property':  0.20,
                'theft':     0.25,
                'drug':      0.15 if night else 0.05,
                'vandalism': 0.10,
            }
            wt = list(weights_type.values())
            wt_norm = [w / sum(wt) for w in wt]
            crime_type = rng.choice(CRIME_TYPES, p=wt_norm)

            # Simulated environmental features
            temp    = rng.normal(15 + 10 * np.sin((month - 3) * np.pi / 6), 5)
            precip  = rng.exponential(2)

            # Prior crimes in 24h (proxy)
            prev_24h = int(rng.poisson(3 + cw))

            district = rng.choice(DISTRICTS)

            records.append({
                'lat':          lat,
                'lng':          lng,
                'hour':         hour,
                'day_of_week':  day_week,
                'month':        month,
                'district':     district,
                'prev_crimes_24h': prev_24h,
                'temperature':  round(temp, 1),
                'precipitation': round(precip, 2),
                'crime_type':   crime_type,
                'city':         city_key,
            })

    return pd.DataFrame(records)


# ── 2. Feature engineering ────────────────────────────────────────
def engineer_features(df: pd.DataFrame):
    print("[2/5] Engineering features…")
    le = LabelEncoder()
    df['district_encoded'] = le.fit_transform(df['district'])

    feature_cols = [
        'lat', 'lng', 'hour', 'day_of_week', 'month',
        'district_encoded', 'prev_crimes_24h',
        'temperature', 'precipitation',
    ]
    X = df[feature_cols].values
    y = df['crime_type'].values
    return X, y, le, feature_cols


# ── 3. Train Random Forest ────────────────────────────────────────
def train_classifier(X, y):
    print("[3/5] Training RandomForest classifier…")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=RANDOM_STATE, stratify=y
    )

    # Quick grid search on a subset for speed
    rf = RandomForestClassifier(random_state=RANDOM_STATE, n_jobs=-1)
    param_grid = {
        'n_estimators': [200],
        'max_depth':    [12],
        'min_samples_split': [5],
    }
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=RANDOM_STATE)
    gs = GridSearchCV(rf, param_grid, cv=cv, scoring='f1_macro', n_jobs=-1, verbose=0)
    gs.fit(X_train, y_train)

    best_rf = gs.best_estimator_
    y_pred  = best_rf.predict(X_test)

    print("\n── Classification Report ──")
    print(classification_report(y_test, y_pred))
    print(f"Best params: {gs.best_params_}")

    return best_rf, X_test, y_test


# ── 4. Train IsolationForest (anomaly detection) ──────────────────
def train_anomaly(X):
    print("[4/5] Training IsolationForest anomaly detector…")
    iso = IsolationForest(
        n_estimators=100,
        contamination=0.05,
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )
    iso.fit(X)
    return iso


# ── 5. Save models ────────────────────────────────────────────────
def save_models(rf, iso, le, feature_cols):
    print("[5/5] Saving models…")
    joblib.dump(rf,  os.path.join(MODELS_DIR, 'crime_rf.pkl'))
    joblib.dump(iso, os.path.join(MODELS_DIR, 'anomaly_iso.pkl'))
    joblib.dump(le,  os.path.join(MODELS_DIR, 'label_encoder.pkl'))

    # Save feature metadata for the API
    meta = {
        'feature_cols': feature_cols,
        'crime_types':  CRIME_TYPES,
        'districts':    DISTRICTS,
        'trained_at':   datetime.utcnow().isoformat(),
    }
    with open(os.path.join(MODELS_DIR, 'meta.json'), 'w') as f:
        json.dump(meta, f, indent=2)

    print(f"  ✓ Saved to {MODELS_DIR}/")


# ── Entry point ───────────────────────────────────────────────────
if __name__ == '__main__':
    df               = generate_dataset()
    X, y, le, fcols  = engineer_features(df)
    rf, X_test, y_test = train_classifier(X, y)
    iso              = train_anomaly(X)
    save_models(rf, iso, le, fcols)
    print("\n✅ Training complete.")
