# SentinelIQ — Crime Hotspot Prediction & Live Monitoring System

![SentinelIQ](https://img.shields.io/badge/SentinelIQ-v1.0.0-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi)
![scikit-learn](https://img.shields.io/badge/scikit--learn-1.4-orange?style=for-the-badge&logo=scikit-learn)

A production-grade crime intelligence platform featuring real-time incident monitoring, ML-powered hotspot prediction, and interactive heatmap visualization — built with Next.js 14, Framer Motion, shadcn/ui, Radix UI, and Python FastAPI.

---

## Table of Contents

1. [Architecture](#architecture)
2. [Tech Stack](#tech-stack)
3. [Folder Structure](#folder-structure)
4. [Quick Start](#quick-start)
5. [Environment Variables](#environment-variables)
6. [Frontend Setup](#frontend-setup)
7. [WebSocket Server](#websocket-server)
8. [ML Training & API](#ml-training--api)
9. [Google Maps Integration](#google-maps-integration)
10. [Deployment](#deployment)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (Next.js)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Live Map │  │Analytics │  │ ML Panel │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│         │            │              │                   │
│   Zustand Store ─────┴──────────────┘                  │
│         │                                               │
└─────────┼───────────────────────────────────────────────┘
          │
    ┌─────┴──────┐          ┌──────────────┐
    │ Socket.IO  │          │  FastAPI ML  │
    │ WS Server  │          │  :8000       │
    │ Node.js    │          │              │
    │ :4000      │          │ /predict     │
    └─────┬──────┘          │ /anomaly     │
          │                 └──────┬───────┘
    ┌─────┴──────┐                 │
    │ PostgreSQL │         ┌───────┴──────┐
    │ (PostGIS)  │         │  models/     │
    │ or MongoDB │         │  crime_rf.pkl│
    └────────────┘         │  anomaly.pkl │
                           └──────────────┘
```

### Data Flow

1. **Live stream** — Socket.IO server emits crime events every 3–5 s
2. **Frontend** — Zustand store receives events, React re-renders map/alerts
3. **Prediction** — Frontend calls FastAPI `/predict` with lat/lng/time
4. **Anomaly** — IsolationForest flags surge events in real-time
5. **Patrol AI** — Rule-based + ML hybrid recommends patrol zones

---

## Tech Stack

| Layer       | Technology                                        |
|-------------|---------------------------------------------------|
| Frontend    | Next.js 14 (App Router), TypeScript               |
| UI Library  | shadcn/ui, Radix UI primitives                    |
| Animation   | Framer Motion 11                                  |
| Charts      | Recharts                                          |
| State       | Zustand                                           |
| Map         | HTML5 Canvas / Google Maps JavaScript API         |
| WebSocket   | Socket.IO (Node.js server)                        |
| ML          | Python — scikit-learn, FastAPI, joblib            |
| Styling     | Tailwind CSS v3                                   |
| Database    | PostgreSQL + PostGIS (or MongoDB)                 |

---

## Folder Structure

```
sentineliq/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with metadata
│   │   └── page.tsx            # Entry point → <Dashboard/>
│   ├── components/
│   │   ├── ui/                 # Atomic components (shadcn/ui style)
│   │   │   ├── badge.tsx       # Badge with CVA variants
│   │   │   ├── card.tsx        # Framer Motion animated card
│   │   │   ├── live-dot.tsx    # Animated ping indicator
│   │   │   ├── progress.tsx    # Radix Progress
│   │   │   ├── scroll-area.tsx # Radix ScrollArea
│   │   │   ├── separator.tsx   # Radix Separator
│   │   │   ├── stat-counter.tsx# Framer Motion number counter
│   │   │   ├── switch.tsx      # Radix Switch
│   │   │   └── tooltip.tsx     # Radix Tooltip
│   │   ├── layout/
│   │   │   ├── Dashboard.tsx   # Layout orchestrator
│   │   │   ├── Sidebar.tsx     # Filters, KPIs, anomaly status
│   │   │   └── TopBar.tsx      # Nav tabs, status pills, clock
│   │   ├── map/
│   │   │   ├── CrimeMap.tsx    # Canvas heatmap + incident renderer
│   │   │   ├── GoogleMap.tsx   # Google Maps integration + key gate
│   │   │   └── MapPanel.tsx    # Map + alert feed + patrol sidebar
│   │   ├── dashboard/
│   │   │   └── DashPanel.tsx   # Recharts analytics (4 charts)
│   │   └── ml/
│   │       └── MLPanel.tsx     # Model metrics, features, pipeline
│   ├── hooks/
│   │   ├── useSocket.ts        # Socket.IO / simulation hook
│   │   ├── useFilteredCrimes.ts# Memoized filter hook
│   │   └── useAnomalyDetector.ts# Surge detection hook
│   ├── lib/
│   │   ├── store.ts            # Zustand global store
│   │   └── utils.ts           # cn(), constants, predictRisk()
│   ├── types/
│   │   └── index.ts            # All TypeScript interfaces
│   └── styles/
│       └── globals.css         # Tailwind + CSS variables
├── scripts/
│   ├── train_model.py          # RF + IsolationForest training
│   ├── ml_api.py               # FastAPI prediction server
│   ├── ws-server.js            # Socket.IO WebSocket server
│   └── sample_crimes.csv       # Sample dataset (20 records)
├── models/                     # Auto-created by train_model.py
│   ├── crime_rf.pkl
│   ├── anomaly_iso.pkl
│   ├── label_encoder.pkl
│   └── meta.json
├── public/
├── .env.local.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Quick Start

### Prerequisites

- Node.js >= 18
- Python >= 3.10
- npm or yarn

### 1. Clone & install

```bash
# Install frontend dependencies
npm install

# Install Python dependencies
pip install fastapi uvicorn scikit-learn joblib numpy pandas
```

### 2. Configure environment

```bash
cp .env.local.example .env.local
# Edit .env.local and add your NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
```

### 3. Train ML models

```bash
python scripts/train_model.py
# Output: models/crime_rf.pkl, models/anomaly_iso.pkl
```

### 4. Start all services

```bash
# Terminal 1 — Next.js frontend
npm run dev                          # http://localhost:3000

# Terminal 2 — WebSocket server
node scripts/ws-server.js            # ws://localhost:4000

# Terminal 3 — ML prediction API
uvicorn scripts.ml_api:app --reload --port 8000
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable                           | Required | Description                              |
|------------------------------------|----------|------------------------------------------|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`  | Optional | Google Maps JS API key (enables real map)|
| `NEXT_PUBLIC_WS_URL`               | Optional | Socket.IO server URL (default: local sim)|
| `NEXT_PUBLIC_API_URL`              | Optional | REST API base URL                        |
| `DATABASE_URL`                     | Optional | PostgreSQL connection string             |
| `ML_API_URL`                       | Optional | FastAPI ML server URL                    |

If `NEXT_PUBLIC_WS_URL` is not set, the app runs in **demo mode** with a built-in crime event simulator — no backend needed.

---

## Frontend Setup

### Switching to Google Maps

By default the app renders crimes on a **Canvas map** (no API key required). To use the real Google Maps:

1. Set `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` in `.env.local`
2. In `src/components/map/MapPanel.tsx`, replace `<CrimeMap />` with `<GoogleMap />`

```tsx
// src/components/map/MapPanel.tsx
import { GoogleMap } from '@/components/map/GoogleMap'
// ...
<GoogleMap />   // ← replace <CrimeMap />
```

### Adding a new UI component

All UI primitives follow the shadcn/ui pattern:

```bash
# Install a new Radix primitive
npm install @radix-ui/react-dialog

# Create src/components/ui/dialog.tsx following the same pattern
# as switch.tsx / tooltip.tsx
```

---

## WebSocket Server

The Socket.IO server at `scripts/ws-server.js` emits two event types:

| Event        | Payload                              | Description              |
|--------------|--------------------------------------|--------------------------|
| `new_crime`  | `CrimeIncident`                      | New incident added       |
| `anomaly`    | `{ is_anomaly, recent_count, ... }`  | Surge threshold crossed  |
| `snapshot`   | `CrimeIncident[]`                    | Initial data on connect  |

### Connecting a real data source

Replace the `streamCrimes()` generator with a real source:

```js
// Example: PostgreSQL LISTEN/NOTIFY
const { Client } = require('pg')
const pg = new Client({ connectionString: process.env.DATABASE_URL })
await pg.connect()
await pg.query('LISTEN crime_events')

pg.on('notification', (msg) => {
  const crime = JSON.parse(msg.payload)
  io.emit('new_crime', crime)
})
```

---

## ML Training & API

### Training

```bash
python scripts/train_model.py
```

The script:
1. Generates 160,000 synthetic crime records with spatial clusters
2. Engineers features (time, location, weather, district)
3. Trains `RandomForestClassifier` with 5-fold GridSearchCV
4. Trains `IsolationForest` for anomaly detection
5. Saves `.pkl` models + `meta.json` to `models/`

### Prediction API

```bash
uvicorn scripts.ml_api:app --reload --port 8000
```

**POST /predict**
```json
{
  "lat": 40.7589, "lng": -73.9851,
  "hour": 22, "day_of_week": 5, "month": 3,
  "district": "Midtown",
  "prev_crimes_24h": 4,
  "temperature": 8.5, "precipitation": 0.0
}
```

Response:
```json
{
  "predicted_type": "violent",
  "risk_score": 0.847,
  "probabilities": { "violent": 0.847, "theft": 0.092, ... },
  "hotspots": [{ "lat": 40.74, "lng": -73.97, "risk": 0.71 }, ...]
}
```

**POST /anomaly**
```json
{ "events": [ { "lat": 40.75, "lng": -73.98, "hour": 23, "district": "Midtown" } ] }
```

---

## Google Maps Integration

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project
3. Enable **Maps JavaScript API** (required) + **Visualization library** (for heatmap)
4. **APIs & Services → Credentials → Create API Key**
5. Restrict the key to your domain (recommended)
6. Add to `.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
   ```

The `GoogleMap` component (`src/components/map/GoogleMap.tsx`) handles:
- Dynamic script loading with the key
- Dark tactical map style matching the SentinelIQ palette
- Native `HeatmapLayer` for density visualization
- Clickable incident markers with info windows
- Prediction zone circles
- Patrol unit overlays

---

## Deployment

### Frontend (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set env vars in Vercel dashboard or via CLI
vercel env add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
vercel env add NEXT_PUBLIC_WS_URL
```

### ML API (Railway / Render)

```dockerfile
# Dockerfile for ML API
FROM python:3.11-slim
WORKDIR /app
COPY scripts/ml_api.py scripts/
COPY models/ models/
RUN pip install fastapi uvicorn scikit-learn joblib numpy
CMD ["uvicorn", "scripts.ml_api:app", "--host", "0.0.0.0", "--port", "8000"]
```

### WebSocket Server (Railway / Fly.io)

```dockerfile
FROM node:20-slim
WORKDIR /app
COPY package.json .
RUN npm install socket.io express cors
COPY scripts/ws-server.js scripts/
CMD ["node", "scripts/ws-server.js"]
```

---

## License

MIT — built with ❤️ for public safety intelligence.
