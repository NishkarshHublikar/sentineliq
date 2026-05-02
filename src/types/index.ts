// ── Core domain types ────────────────────────────────────────────

export type CrimeType = 'violent' | 'property' | 'theft' | 'drug' | 'vandalism'
export type Severity   = 'critical' | 'high' | 'medium'
export type CityKey    = 'nyc' | 'la' | 'chicago' | 'houston' | 'custom'
export type TabId      = 'map' | 'dash' | 'ml'
export type Role       = 'admin' | 'officer'
export type TimeFilter = 'all' | '24h' | '7d' | 'night' | 'peak'
export type Theme      = 'light' | 'dark'

export interface CrimeIncident {
  id:         string
  lat:        number
  lng:        number
  typeId:     CrimeType
  severity:   Severity
  district:   string
  hour:       number
  ts:         Date
  resolved:   boolean
  isNew?:     boolean
  flash?:     number   // canvas ripple animation value 0–2
}

export interface CrimeAlert extends CrimeIncident {
  time: string         // formatted time string for display
}

export interface PatrolUnit {
  id:   number
  zone: string
  lat:  number
  lng:  number
  risk: number         // 0–100 risk score from ML model
}

export interface CityConfig {
  name: string
  lat:  number
  lng:  number
  zoom: number
}

export interface LayerState {
  markers: boolean
  heat:    boolean
  predict: boolean
  patrol:  boolean
}

export interface AppStats {
  total:    number
  critical: number
  resolved: number
}

export interface MLMetric {
  name:  string
  value: number
  color: string
}

export interface FeatureImportance {
  name:  string
  value: number
}

// ── API response types ────────────────────────────────────────────

export interface PredictResponse {
  riskScore:       number
  predictedType:   CrimeType
  probabilities:   Record<CrimeType, number>
  hotspots:        Array<{ lat: number; lng: number; risk: number }>
}

export interface AnomalyResponse {
  isAnomaly:    boolean
  score:        number
  recentCount:  number
  threshold:    number
}

// ── WebSocket event types ─────────────────────────────────────────

export interface WSCrimeEvent {
  type:    'new_crime'
  payload: CrimeIncident
}

export interface WSAnomalyEvent {
  type:    'anomaly'
  payload: AnomalyResponse
}

export type WSEvent = WSCrimeEvent | WSAnomalyEvent
