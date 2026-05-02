'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { MapPin, ExternalLink } from 'lucide-react'
import { useFilteredCrimes } from '@/hooks/useFilteredCrimes'
import { useAppStore } from '@/lib/store'
import { CITIES, CRIME_TYPES, predictRisk } from '@/lib/utils'

declare global {
  interface Window {
    google: any
    __initGoogleMap: () => void
  }
}

const DARK_STYLE = [
  { elementType: 'geometry',           stylers: [{ color: '#1a2033' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a2033' }] },
  { elementType: 'labels.text.fill',   stylers: [{ color: '#8899bb' }] },
  { featureType: 'road',               elementType: 'geometry',        stylers: [{ color: '#263046' }] },
  { featureType: 'road.highway',       elementType: 'geometry',        stylers: [{ color: '#2c3e60' }] },
  { featureType: 'water',              elementType: 'geometry',        stylers: [{ color: '#0f1724' }] },
  { featureType: 'poi',                elementType: 'geometry',        stylers: [{ color: '#1e2b3f' }] },
  { featureType: 'poi.park',           elementType: 'geometry',        stylers: [{ color: '#1a2a1a' }] },
]

export function GoogleMap() {
  const mapRef       = useRef<HTMLDivElement>(null)
  const gmapRef      = useRef<any>(null)
  const heatmapRef   = useRef<any>(null)
  const markersRef   = useRef<any[]>([])
  const predCircRef  = useRef<any[]>([])
  const patrolRef    = useRef<any[]>([])
  const infoWinRef   = useRef<any>(null)

  const [loaded, setLoaded] = useState(false)
  const [keyInput, setKeyInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { layers, activeCity } = useAppStore()
  const crimes = useFilteredCrimes()
  const city   = CITIES[activeCity]

  const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  // Auto-init if env key is present
  useEffect(() => {
    if (API_KEY && API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY') {
      loadGoogleMaps(API_KEY)
    }
  }, [])

  function loadGoogleMaps(key: string) {
    setLoading(true); setError('')
    window.__initGoogleMap = () => {
      try {
        const map = new window.google.maps.Map(mapRef.current!, {
          center: { lat: city.lat, lng: city.lng },
          zoom: city.zoom,
          styles: DARK_STYLE,
          mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
          zoomControlOptions: { position: window.google.maps.ControlPosition.RIGHT_BOTTOM },
        })
        gmapRef.current  = map
        infoWinRef.current = new window.google.maps.InfoWindow()
        setLoaded(true); setLoading(false)
      } catch (e: any) {
        setError('Map failed to initialise: ' + e.message); setLoading(false)
      }
    }
    const s = document.createElement('script')
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=visualization&callback=__initGoogleMap`
    s.async = true; s.defer = true
    s.onerror = () => { setError('Google Maps failed to load — check your API key.'); setLoading(false) }
    document.head.appendChild(s)
  }

  // Re-center on city change
  useEffect(() => {
    if (!gmapRef.current) return
    gmapRef.current.setCenter({ lat: city.lat, lng: city.lng })
    gmapRef.current.setZoom(city.zoom)
  }, [activeCity])

  // Sync markers / heatmap
  useEffect(() => {
    if (!gmapRef.current || !loaded) return

    // Clear
    markersRef.current.forEach(m => m.setMap(null)); markersRef.current = []
    if (heatmapRef.current) { heatmapRef.current.setMap(null); heatmapRef.current = null }
    predCircRef.current.forEach(o => o.setMap(null)); predCircRef.current = []
    patrolRef.current.forEach(o => o.setMap(null));   patrolRef.current   = []

    const G = window.google.maps

    // Markers
    if (layers.markers) {
      for (const cr of crimes) {
        const type = CRIME_TYPES.find(t => t.id === cr.typeId) ?? CRIME_TYPES[0]
        const r    = cr.severity === 'critical' ? 7 : cr.severity === 'high' ? 5.5 : 4
        const m = new G.Marker({
          position: { lat: cr.lat, lng: cr.lng }, map: gmapRef.current,
          animation: cr.isNew ? G.Animation.BOUNCE : null,
          icon: { path: G.SymbolPath.CIRCLE, scale: r, fillColor: type.color, fillOpacity: 0.92, strokeColor: '#fff', strokeWeight: 1.4 },
        })
        m.addListener('click', () => {
          const risk = predictRisk(cr.lat, cr.lng, activeCity)
          infoWinRef.current.setContent(`
            <div style="font-family:Geist,sans-serif;padding:4px;min-width:180px">
              <b style="font-size:14px;color:#0B0F1A">${type.label}</b>
              <div style="margin:6px 0;font-size:12px;color:#6B7280">
                <div>District: <b style="color:#0B0F1A">${cr.district}</b></div>
                <div>Severity: <b style="color:${type.color}">${cr.severity.toUpperCase()}</b></div>
                <div>Risk: <b style="color:${risk > 0.6 ? '#ef4444' : '#22c55e'}">${(risk * 100).toFixed(1)}%</b></div>
              </div>
            </div>`)
          infoWinRef.current.open(gmapRef.current, m)
          if (cr.isNew) setTimeout(() => m.setAnimation(null), 2400)
        })
        markersRef.current.push(m)
      }
    }

    // Heatmap
    if (layers.heat && window.google.maps.visualization) {
      heatmapRef.current = new window.google.maps.visualization.HeatmapLayer({
        data: crimes.map(c => ({
          location: new G.LatLng(c.lat, c.lng),
          weight: c.severity === 'critical' ? 3 : c.severity === 'high' ? 2 : 1,
        })),
        map: gmapRef.current, radius: 38, opacity: 0.68, maxIntensity: 8,
        gradient: ['rgba(0,0,0,0)', 'rgba(30,100,255,0.4)', 'rgba(255,140,0,0.7)', 'rgba(255,40,0,0.9)'],
      })
    }

    // Prediction zones
    if (layers.predict) {
      const zones = [
        { lat: city.lat + 0.03, lng: city.lng - 0.04, risk: 0.89 },
        { lat: city.lat - 0.05, lng: city.lng + 0.06, risk: 0.74 },
        { lat: city.lat + 0.01, lng: city.lng + 0.02, risk: 0.82 },
      ]
      for (const z of zones) {
        const c = new G.Circle({ center: { lat: z.lat, lng: z.lng }, radius: 900 * z.risk, map: gmapRef.current, fillColor: '#4ADE80', fillOpacity: z.risk * 0.28, strokeColor: '#4ADE80', strokeOpacity: 0.65, strokeWeight: 1.5 })
        const lbl = new G.Marker({ position: { lat: z.lat, lng: z.lng }, map: gmapRef.current, icon: { path: G.SymbolPath.CIRCLE, scale: 0 }, label: { text: `RISK ${Math.round(z.risk * 100)}%`, color: '#4ADE80', fontSize: '10px', fontWeight: '700', fontFamily: 'Geist Mono, monospace' } })
        predCircRef.current.push(c, lbl)
      }
    }

    // Patrol units
    if (layers.patrol) {
      const units = [
        { id: 1, lat: city.lat + 0.03, lng: city.lng - 0.04 },
        { id: 2, lat: city.lat - 0.05, lng: city.lng + 0.06 },
        { id: 3, lat: city.lat + 0.01, lng: city.lng + 0.02 },
      ]
      for (const u of units) {
        const c = new G.Circle({ center: { lat: u.lat, lng: u.lng }, radius: 600, map: gmapRef.current, fillColor: '#3b82f6', fillOpacity: 0.08, strokeColor: '#3b82f6', strokeOpacity: 0.6, strokeWeight: 2 })
        const m = new G.Marker({ position: { lat: u.lat, lng: u.lng }, map: gmapRef.current, icon: { path: G.SymbolPath.CIRCLE, scale: 0 }, label: { text: 'P' + u.id, color: '#93c5fd', fontSize: '11px', fontWeight: '700', fontFamily: 'Geist Mono, monospace' } })
        patrolRef.current.push(c, m)
      }
    }
  }, [loaded, crimes, layers, activeCity, city])

  if (!loaded) {
    return (
      <div className="relative flex flex-1 items-center justify-center bg-[#09090b]">
        <div ref={mapRef} className="absolute inset-0 opacity-0" />
        <motion.div
          className="w-full max-w-[420px] rounded-2xl border border-white/[0.08] bg-zinc-900 p-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20">
            <MapPin size={22} className="text-blue-400" />
          </div>
          <h2 className="mb-1.5 text-[17px] font-semibold text-white">Connect Google Maps</h2>
          <p className="mb-5 text-[13px] leading-relaxed text-zinc-400">
            Enter your Google Maps JavaScript API key to activate the live satellite map.
          </p>

          <div className="mb-4 rounded-lg border border-white/[0.06] bg-zinc-950 p-3.5 text-[12px] leading-7 text-zinc-400 font-mono">
            1. <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">console.cloud.google.com</a><br/>
            2. Enable <strong className="text-zinc-300">Maps JavaScript API</strong><br/>
            3. APIs & Services → Credentials → Create API Key
          </div>

          {error && (
            <p className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
              {error}
            </p>
          )}

          <input
            type="text"
            value={keyInput}
            onChange={e => setKeyInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadGoogleMaps(keyInput.trim())}
            placeholder="AIzaSy..."
            className="mb-3 w-full rounded-lg border border-white/[0.08] bg-zinc-950 px-3 py-2.5 font-mono text-[13px] text-white placeholder-zinc-600 outline-none transition-colors focus:border-blue-500/60"
          />

          <button
            onClick={() => loadGoogleMaps(keyInput.trim())}
            disabled={loading || keyInput.length < 10}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? 'Loading…' : 'Activate Google Maps'}
            {!loading && <ExternalLink size={13} />}
          </button>

          <p className="mt-3 text-center text-[11px] text-zinc-600">
            Key used only in this browser session — never stored
          </p>
        </motion.div>
      </div>
    )
  }

  return <div ref={mapRef} className="flex-1" style={{ minHeight: '100%' }} />
}
