'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, Loader2, Globe } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { StatCounter } from '@/components/ui/stat-counter'
import { LiveDot } from '@/components/ui/live-dot'
import { useAppStore } from '@/lib/store'
import { CRIME_TYPES, CITIES } from '@/lib/utils'
import type { CityKey, CrimeType, TimeFilter } from '@/types'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
}
const item = {
  hidden: { opacity: 0, x: -8 },
  show:   { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
}

export function Sidebar() {
  const {
    activeTab, activeCity, setCity,
    activeTypes, toggleType,
    timeFilter, setTimeFilter,
    layers, toggleLayer,
    stats, anomaly,
    initLocation,
  } = useAppStore()

  const [mounted, setMounted] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<any[]>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSearch = async (q: string) => {
    if (!q.trim()) return
    setLoading(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5`)
      const data = await res.json()
      setResults(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const selectLocation = (r: any) => {
    initLocation({
      name: r.display_name.split(',')[0],
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      zoom: 12
    })
    setSearch('')
    setResults([])
  }

  const TIME_OPTIONS: Array<[TimeFilter, string]> = [
    ['all',   'All time'],
    ['24h',   'Last 24 hours'],
    ['7d',    'Last 7 days'],
    ['night', 'Night (10 pm – 6 am)'],
    ['peak',  'Peak (6 pm – 10 pm)'],
  ]

  const KPI_ITEMS = [
    { label: 'Total',    value: stats.total,    color: 'var(--foreground)' },
    { label: 'Critical', value: stats.critical, color: '#ef4444' },
    { label: 'Resolved', value: stats.resolved, color: '#22c55e' },
    { label: 'Patrols',  value: 5,              color: '#3b82f6' },
  ]

  return (
    <motion.aside
      className="flex w-[240px] flex-shrink-0 flex-col overflow-hidden border-r border-border bg-card"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <ScrollArea className="flex-1">
        <motion.div
          className="p-3 space-y-1"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* ── Search bar ── */}
          <SectionLabel>Location</SectionLabel>
          <div className="relative px-2 mb-4">
            <div className="relative group">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={13} />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  if (e.target.value.length > 2) handleSearch(e.target.value)
                }}
                placeholder="Search city..."
                className="w-full rounded-lg border border-border bg-secondary/30 py-1.5 pl-8 pr-3 text-[12px] outline-none transition-all focus:border-primary/50 focus:bg-secondary/50"
              />
              {loading && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" size={12} />}
            </div>

            <AnimatePresence>
              {results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute left-0 right-0 top-full z-50 mt-1 mx-2 overflow-hidden rounded-xl border border-border bg-popover shadow-2xl backdrop-blur-md"
                >
                  {results.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => selectLocation(r)}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] hover:bg-accent transition-colors border-b border-border last:border-0"
                    >
                      <MapPin size={11} className="text-muted-foreground" />
                      <span className="truncate text-foreground/80">{r.display_name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="px-2 space-y-1">
            {(Object.entries(CITIES) as [CityKey, typeof CITIES[CityKey]][]).filter(([k]) => k !== 'custom').map(([k, v]) => (
              <motion.button
                key={k}
                variants={item}
                onClick={() => setCity(k)}
                className={[
                  'flex w-full items-center gap-2.5 rounded-lg border px-2.5 py-[6px] text-[12px] font-medium text-left transition-all duration-150',
                  activeCity === k
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-transparent text-muted-foreground hover:bg-secondary/80 hover:text-foreground',
                ].join(' ')}
              >
                <span className={`h-1.5 w-1.5 flex-shrink-0 rounded-full ${activeCity === k ? 'bg-primary' : 'bg-muted'}`} />
                {v.name}
              </motion.button>
            ))}
            {activeCity === 'custom' && (
              <motion.div
                variants={item}
                className="flex items-center gap-2.5 rounded-lg border border-primary/30 bg-primary/10 px-2.5 py-[6px] text-[12px] font-medium text-primary"
              >
                <Globe size={13} className="text-primary" />
                <span className="truncate">Custom View</span>
              </motion.div>
            )}
          </div>

          <Separator className="my-4 opacity-50" />

          {/* ── Crime type filters ── */}
          <SectionLabel>Filters</SectionLabel>
          {CRIME_TYPES.map((t) => (
            <motion.button
              key={t.id}
              variants={item}
              onClick={() => toggleType(t.id as CrimeType)}
              className={[
                'flex w-full items-center gap-2 rounded-lg px-2.5 py-[7px] text-[12px] transition-all duration-150',
                activeTypes.has(t.id as CrimeType)
                  ? 'opacity-100 hover:bg-secondary/50'
                  : 'opacity-30 hover:opacity-50',
              ].join(' ')}
            >
              <span
                className="h-2 w-2 flex-shrink-0 rounded-full"
                style={{ background: t.color }}
              />
              <span className="flex-1 text-left text-foreground/80">{t.label}</span>
              <span className="font-mono text-[10px] text-muted-foreground">
                {mounted ? Math.floor(Math.random() * 60 + 30) : '--'}
              </span>
            </motion.button>
          ))}

          <Separator className="my-4 opacity-50" />

          {/* ── Time window ── */}
          <SectionLabel>Time Window</SectionLabel>
          <div className="px-2 space-y-1">
            {TIME_OPTIONS.map(([v, l]) => (
              <motion.button
                key={v}
                variants={item}
                onClick={() => setTimeFilter(v)}
                className={[
                  'w-full rounded-lg border px-2.5 py-[7px] text-left text-[12px] transition-all duration-150',
                  timeFilter === v
                    ? 'border-primary/30 bg-primary/10 font-medium text-primary'
                    : 'border-transparent text-muted-foreground hover:bg-secondary/80 hover:text-foreground',
                ].join(' ')}
              >
                {l}
              </motion.button>
            ))}
          </div>

          {/* ── Map layers (only on map tab) ── */}
          {activeTab === 'map' && (
            <>
              <Separator className="my-4 opacity-50" />
              <SectionLabel>Layers</SectionLabel>
              <div className="px-2 space-y-1">
                {([
                  ['markers', 'Incidents'],
                  ['heat',    'Heatmap'],
                  ['predict', 'Prediction'],
                  ['patrol',  'Patrol units'],
                ] as const).map(([k, l]) => (
                  <motion.div
                    key={k}
                    variants={item}
                    className="flex items-center justify-between rounded-lg px-2.5 py-[7px]"
                  >
                    <span className="text-[12px] text-muted-foreground">{l}</span>
                    <Switch
                      checked={layers[k]}
                      onCheckedChange={() => toggleLayer(k)}
                    />
                  </motion.div>
                ))}
              </div>
            </>
          )}

          <Separator className="my-4 opacity-50" />

          {/* ── Anomaly detector ── */}
          <div className="px-2">
            <motion.div
              variants={item}
              className={[
                'rounded-xl border p-3 transition-all duration-500',
                anomaly
                  ? 'border-red-500/30 bg-red-500/[0.08]'
                  : 'border-border bg-secondary/30',
              ].join(' ')}
            >
              <div className="flex items-center gap-2 mb-1">
                <LiveDot color={anomaly ? '#ef4444' : '#22c55e'} size={7} />
                <span className={`font-mono text-[11px] font-semibold ${anomaly ? 'text-red-300' : 'text-green-500'}`}>
                  {anomaly ? 'Surge Detected' : 'Baseline Normal'}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground">
                {anomaly ? 'Event rate above threshold' : 'No anomalies detected'}
              </p>
            </motion.div>
          </div>

        </motion.div>
      </ScrollArea>

      {/* ── KPI grid (pinned bottom) ── */}
      <div className="flex-shrink-0 border-t border-border bg-card/50 p-2.5 grid grid-cols-2 gap-1.5">
        {KPI_ITEMS.map(({ label, value, color }) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="rounded-lg border border-border bg-secondary/20 p-2.5"
          >
            <div className="text-[18px] font-semibold leading-none" style={{ fontFamily: "'Geist Mono', monospace", color }}>
              <StatCounter value={value} color={color} />
            </div>
            <div className="mt-1 text-[9px] uppercase tracking-widest text-muted-foreground">{label}</div>
          </motion.div>
        ))}
      </div>
    </motion.aside>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pb-1.5 pt-2 text-[10px] font-bold uppercase tracking-[1.8px] text-muted-foreground/60">
      {children}
    </p>
  )
}
