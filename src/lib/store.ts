import { create } from 'zustand'
import type {
  CrimeIncident, CrimeAlert, PatrolUnit,
  AppStats, LayerState, TabId, CityKey,
  TimeFilter, Role, Theme, CityConfig
} from '@/types'
import type { CrimeType } from '@/types'
import { CRIME_TYPES, CITIES, DISTRICTS, SEVERITIES, generateCrimes, rand, randInt } from '@/lib/utils'

interface AppStore {
  // ── UI state ──
  activeTab:   TabId
  activeCity:  CityKey
  role:        Role
  timeFilter:  TimeFilter
  activeTypes: Set<CrimeType>
  layers:      LayerState
  anomaly:     boolean
  theme:       Theme
  currentCity: CityConfig

  // ── Data ──
  crimes:  CrimeIncident[]
  alerts:  CrimeAlert[]
  patrols: PatrolUnit[]
  stats:   AppStats

  // ── Actions ──
  setTab:         (tab: TabId) => void
  setCity:        (city: CityKey) => void
  toggleRole:     () => void
  setTimeFilter:  (f: TimeFilter) => void
  toggleType:     (id: CrimeType) => void
  toggleLayer:    (k: keyof LayerState) => void
  pushCrime:      (crime: CrimeIncident) => void
  initCity:       (city: CityKey) => void
  initLocation:   (config: CityConfig) => void
  setTheme:       (theme: Theme) => void
  setRole:        (role: Role) => void
}

export const useAppStore = create<AppStore>((set, get) => ({
  // ── Defaults ──
  activeTab:   'map',
  activeCity:  'nyc',
  role:        'admin',
  timeFilter:  'all',
  activeTypes: new Set(CRIME_TYPES.map(t => t.id)) as Set<CrimeType>,
  layers:      { markers: true, heat: true, predict: false, patrol: false },
  anomaly:     false,
  theme:       'dark',
  currentCity: CITIES.nyc,
  crimes:      [],
  alerts:      [],
  patrols:     [],
  stats:       { total: 0, critical: 0, resolved: 0 },

  // ── Actions ──
  setTab: (tab) => set({ activeTab: tab }),

  setCity: (city) => {
    get().initCity(city)
    set({ activeCity: city, currentCity: CITIES[city] })
  },

  toggleRole: () =>
    set(s => ({ role: s.role === 'admin' ? 'officer' : 'admin' })),

  setTimeFilter: (timeFilter) => set({ timeFilter }),

  toggleType: (id) =>
    set(s => {
      const next = new Set(s.activeTypes)
      next.has(id) ? next.delete(id) : next.add(id)
      return { activeTypes: next }
    }),

  toggleLayer: (k) =>
    set(s => ({ layers: { ...s.layers, [k]: !s.layers[k] } })),

  setAnomaly: (anomaly) => set({ anomaly }),

  pushCrime: (crime) =>
    set(s => {
      const crimes  = [crime, ...s.crimes].slice(0, 300)
      const alerts  = [{ ...crime, time: new Date().toLocaleTimeString('en', { hour12: false }) }, ...s.alerts].slice(0, 40) as CrimeAlert[]
      const stats   = {
        total:    s.stats.total + 1,
        critical: crime.severity === 'critical' ? s.stats.critical + 1 : s.stats.critical,
        resolved: s.stats.resolved,
      }
      return { crimes, alerts, stats }
    }),

  initCity: (cityKey) => {
    const city = CITIES[cityKey]
    const crimes = generateCrimes(120, cityKey)
    const patrols: PatrolUnit[] = [
      { id: 1, zone: 'North District', lat: city.lat + 0.030, lng: city.lng - 0.040, risk: 89 },
      { id: 2, zone: 'Central',        lat: city.lat + 0.010, lng: city.lng + 0.020, risk: 82 },
      { id: 3, zone: 'East District',  lat: city.lat - 0.050, lng: city.lng + 0.060, risk: 74 },
      { id: 4, zone: 'West District',  lat: city.lat - 0.020, lng: city.lng - 0.070, risk: 61 },
      { id: 5, zone: 'South District', lat: city.lat + 0.060, lng: city.lng + 0.030, risk: 54 },
    ]
    const stats = {
      total:    crimes.length,
      critical: crimes.filter(c => c.severity === 'critical').length,
      resolved: crimes.filter(c => c.resolved).length,
    }
    set({ crimes, patrols, stats, alerts: [] })
  },

  initLocation: (config) => {
    const crimes = generateCrimes(120, 'nyc') // use NYC as base for seed data distribution
    // adjust crime coords to be near the new location
    const updatedCrimes = crimes.map(c => ({
      ...c,
      lat: config.lat + (c.lat - CITIES.nyc.lat),
      lng: config.lng + (c.lng - CITIES.nyc.lng),
    }))
    const patrols: PatrolUnit[] = [
      { id: 1, zone: 'Zone A', lat: config.lat + 0.030, lng: config.lng - 0.040, risk: 89 },
      { id: 2, zone: 'Zone B', lat: config.lat + 0.010, lng: config.lng + 0.020, risk: 82 },
      { id: 3, zone: 'Zone C', lat: config.lat - 0.050, lng: config.lng + 0.060, risk: 74 },
    ]
    const stats = {
      total:    updatedCrimes.length,
      critical: updatedCrimes.filter(c => c.severity === 'critical').length,
      resolved: updatedCrimes.filter(c => c.resolved).length,
    }
    set({ 
      activeCity: 'custom', 
      currentCity: config,
      crimes: updatedCrimes, 
      patrols, 
      stats, 
      alerts: [] 
    })
  },

  setTheme: (theme) => set({ theme }),

  setRole: (role) => set({ role }),
}))
