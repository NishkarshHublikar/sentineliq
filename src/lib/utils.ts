import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { CityConfig, CityKey, CrimeType } from '@/types'

// ── shadcn/ui cn helper ───────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ── Random helpers ────────────────────────────────────────────────
export const rand    = (a: number, b: number) => a + Math.random() * (b - a)
export const randInt = (a: number, b?: number) => {
  if (b === undefined) { b = a; a = 0 }
  const min = Math.ceil(Math.min(a, b))
  const max = Math.floor(Math.max(a, b))
  return Math.floor(Math.random() * (max - min + 1) + min)
}

// ── City configs ──────────────────────────────────────────────────
export const CITIES: Record<CityKey, CityConfig> = {
  nyc:     { name: 'New York City', lat: 40.7128,  lng: -74.0060,  zoom: 12 },
  la:      { name: 'Los Angeles',   lat: 34.0522,  lng: -118.2437, zoom: 11 },
  chicago: { name: 'Chicago',       lat: 41.8781,  lng: -87.6298,  zoom: 12 },
  houston: { name: 'Houston',       lat: 29.7604,  lng: -95.3698,  zoom: 11 },
}

// ── Crime type definitions ────────────────────────────────────────
export const CRIME_TYPES: Array<{
  id:    CrimeType
  label: string
  color: string
  dim:   string
}> = [
  { id: 'violent',   label: 'Violent',   color: '#ef4444', dim: 'rgba(239,68,68,0.15)'   },
  { id: 'property',  label: 'Property',  color: '#f59e0b', dim: 'rgba(245,158,11,0.15)'  },
  { id: 'theft',     label: 'Theft',     color: '#22c55e', dim: 'rgba(34,197,94,0.15)'   },
  { id: 'drug',      label: 'Drug',      color: '#a855f7', dim: 'rgba(168,85,247,0.15)'  },
  { id: 'vandalism', label: 'Vandalism', color: '#3b82f6', dim: 'rgba(59,130,246,0.15)'  },
]

export const DISTRICTS = [
  'Manhattan', 'Brooklyn', 'Queens', 'Bronx', 'Midtown', 'Staten Island',
]

export const SEVERITIES = ['critical', 'high', 'medium'] as const

// ── Severity color mapping ────────────────────────────────────────
export const SEVERITY_COLORS = {
  critical: { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  text: '#fca5a5' },
  high:     { bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', text: '#fcd34d' },
  medium:   { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.3)', text: '#93c5fd' },
}

// ── Design tokens (CSS-in-JS) ─────────────────────────────────────
export const TOKENS = {
  bg0: '#09090b', bg1: '#0f0f12', bg2: '#18181b', bg3: '#27272a', bg4: '#3f3f46',
  border:  'rgba(255,255,255,0.06)',
  border2: 'rgba(255,255,255,0.10)',
  border3: 'rgba(255,255,255,0.16)',
  text:  '#fafafa', text2: '#a1a1aa', text3: '#71717a', text4: '#52525b',
  blue:   '#3b82f6', blueDim: 'rgba(59,130,246,0.12)', blueBorder: 'rgba(59,130,246,0.3)',
  red:    '#ef4444', redDim:  'rgba(239,68,68,0.12)',   redBorder:  'rgba(239,68,68,0.3)',
  amber:  '#f59e0b', amberDim:'rgba(245,158,11,0.12)', amberBorder:'rgba(245,158,11,0.3)',
  green:  '#22c55e', greenDim:'rgba(34,197,94,0.12)',  greenBorder:'rgba(34,197,94,0.3)',
  purple: '#a855f7',
}

// ── Simulated RF risk prediction ──────────────────────────────────
export function predictRisk(lat: number, lng: number, cityKey: CityKey): number {
  const city = CITIES[cityKey]
  const hotspots = [
    { lat: city.lat + 0.030, lng: city.lng - 0.040, w: 0.9 },
    { lat: city.lat - 0.050, lng: city.lng + 0.060, w: 0.7 },
    { lat: city.lat + 0.010, lng: city.lng + 0.020, w: 0.8 },
    { lat: city.lat - 0.020, lng: city.lng - 0.070, w: 0.6 },
    { lat: city.lat + 0.060, lng: city.lng + 0.030, w: 0.5 },
  ]
  const raw = hotspots.reduce(
    (s, h) => s + h.w * Math.exp(-((lat - h.lat) ** 2 + (lng - h.lng) ** 2) / 0.0005),
    0
  )
  const hr = new Date().getHours()
  const timeBoost = hr >= 22 || hr <= 5 ? 1.3 : hr >= 18 ? 1.15 : 1.0
  return Math.min(1, raw * timeBoost)
}

// ── Generate synthetic crime dataset ─────────────────────────────
export function generateCrimes(n: number, cityKey: CityKey) {
  const city = CITIES[cityKey]
  const clusters = [
    { lat: city.lat + 0.030, lng: city.lng - 0.040, w: 3.0 },
    { lat: city.lat - 0.050, lng: city.lng + 0.060, w: 2.0 },
    { lat: city.lat + 0.010, lng: city.lng + 0.020, w: 2.5 },
    { lat: city.lat - 0.020, lng: city.lng - 0.070, w: 1.5 },
    { lat: city.lat + 0.060, lng: city.lng + 0.030, w: 1.0 },
  ]

  return Array.from({ length: n }, (_, i) => {
    const cl = clusters[randInt(0, clusters.length - 1)]
    const sigma = 0.018 / cl.w
    const type = CRIME_TYPES[randInt(0, CRIME_TYPES.length - 1)]
    const hr = randInt(0, 23)
    const daysAgo = randInt(0, 29)
    return {
      id:       `seed-${i}`,
      lat:      cl.lat + rand(-sigma * 2, sigma * 2),
      lng:      cl.lng + rand(-sigma * 2, sigma * 2),
      typeId:   type.id as CrimeType,
      severity: SEVERITIES[randInt(0, SEVERITIES.length - 1)],
      district: DISTRICTS[randInt(0, DISTRICTS.length - 1)],
      hour:     hr,
      ts:       new Date(Date.now() - daysAgo * 86400000 - hr * 3600000),
      resolved: Math.random() > 0.6,
      isNew:    false,
      flash:    0,
    }
  })
}

// ── Format helpers ────────────────────────────────────────────────
export const formatTime  = (d: Date) => d.toLocaleTimeString('en', { hour12: false })
export const formatCoord = (n: number, decimals = 4) => n.toFixed(decimals)
