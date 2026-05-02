"""
SentinelIQ — ML Prediction API (FastAPI)
=========================================
Serves trained Random Forest + IsolationForest models via REST.

Usage:
    pip install fastapi uvicorn joblib scikit-learn numpy
    uvicorn scripts.ml_api:app --reload --port 8000

Endpoints:
    POST /predict   — crime type prediction + risk score
    POST /anomaly   — anomaly detection check
    GET  /health    — health check
"""

from __future__ import annotations
import os
import json
import joblib
import numpy as np
from datetime import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ── Paths ─────────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_DIR = os.path.join(BASE_DIR, 'models')

# ── Load models ───────────────────────────────────────────────────
try:
    rf   = joblib.load(os.path.join(MODELS_DIR, 'crime_rf.pkl'))
    iso  = joblib.load(os.path.join(MODELS_DIR, 'anomaly_iso.pkl'))
    le   = joblib.load(os.path.join(MODELS_DIR, 'label_encoder.pkl'))
    with open(os.path.join(MODELS_DIR, 'meta.json')) as f:
        meta = json.load(f)
    CRIME_TYPES = meta['crime_types']
    DISTRICTS   = meta['districts']
except FileNotFoundError:
    print("⚠  Models not found. Run: python scripts/train_model.py")
    rf = iso = le = None
    CRIME_TYPES = ['violent', 'property', 'theft', 'drug', 'vandalism']
    DISTRICTS   = ['Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Midtown', 'Staten Island']

# ── App ───────────────────────────────────────────────────────────
app = FastAPI(title="SentinelIQ ML API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ───────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    lat:              float = Field(..., description="Latitude")
    lng:              float = Field(..., description="Longitude")
    hour:             int   = Field(..., ge=0, le=23)
    day_of_week:      int   = Field(..., ge=0, le=6)
    month:            int   = Field(..., ge=1, le=12)
    district:         str   = "Manhattan"
    prev_crimes_24h:  int   = Field(0, ge=0)
    temperature:      float = 15.0
    precipitation:    float = 0.0


class AnomalyRequest(BaseModel):
    events: list[dict]  # list of recent crime events


# ── Endpoints ─────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status":    "ok",
        "model":     "RandomForestClassifier" if rf else "not loaded",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.post("/predict")
def predict(req: PredictRequest):
    if rf is None:
        raise HTTPException(503, "Model not loaded. Run train_model.py first.")

    # Encode district
    district_enc = le.transform([req.district])[0] if req.district in DISTRICTS else 0

    X = np.array([[
        req.lat, req.lng,
        req.hour, req.day_of_week, req.month,
        district_enc, req.prev_crimes_24h,
        req.temperature, req.precipitation,
    ]])

    proba        = rf.predict_proba(X)[0]
    predicted    = rf.classes_[np.argmax(proba)]
    risk_score   = float(np.max(proba))

    # Build prediction hotspot grid (3×3 around request point)
    hotspots = []
    for dlat in [-0.02, 0, 0.02]:
        for dlng in [-0.02, 0, 0.02]:
            X_h = X.copy(); X_h[0, 0] += dlat; X_h[0, 1] += dlng
            p_h = rf.predict_proba(X_h)[0]
            hotspots.append({
                "lat":  round(req.lat + dlat, 4),
                "lng":  round(req.lng + dlng, 4),
                "risk": round(float(np.max(p_h)), 3),
            })

    return {
        "predicted_type":  predicted,
        "risk_score":      round(risk_score, 3),
        "probabilities":   dict(zip(rf.classes_, [round(float(p), 3) for p in proba])),
        "hotspots":        hotspots,
        "timestamp":       datetime.utcnow().isoformat(),
    }


@app.post("/anomaly")
def detect_anomaly(req: AnomalyRequest):
    if iso is None:
        raise HTTPException(503, "Anomaly model not loaded.")

    if len(req.events) < 2:
        return {"is_anomaly": False, "score": 0.0, "recent_count": len(req.events)}

    # Build feature matrix from recent events
    rows = []
    for e in req.events:
        district_enc = le.transform([e.get('district', 'Manhattan')])[0]
        rows.append([
            e.get('lat', 0), e.get('lng', 0),
            e.get('hour', 0), 0, 0,
            district_enc, 0, 15.0, 0.0,
        ])
    X = np.array(rows)

    scores      = iso.decision_function(X)
    predictions = iso.predict(X)
    n_anomaly   = int((predictions == -1).sum())
    mean_score  = float(np.mean(scores))
    threshold   = 8  # events/5min

    return {
        "is_anomaly":   n_anomaly > 0 or len(req.events) > threshold,
        "score":        round(mean_score, 3),
        "n_anomalous":  n_anomaly,
        "recent_count": len(req.events),
        "threshold":    threshold,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
