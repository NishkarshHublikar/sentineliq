'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { GoogleMap } from '@/components/map/GoogleMap'
import { VectorMap } from '@/components/map/VectorMap'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { LiveDot } from '@/components/ui/live-dot'
import { CRIME_TYPES, CITIES } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { useFilteredCrimes } from '@/hooks/useFilteredCrimes'

export function MapPanel() {
  const { alerts, patrols, currentCity } = useAppStore()
  const filtered = useFilteredCrimes()

  const LEGEND = [
    ...CRIME_TYPES.map(t => ({ label: t.label, color: t.color })),
    { label: 'Predicted zone', color: '#22c55e' },
    { label: 'Patrol unit',    color: '#3b82f6' },
  ]

  return (
    <div className="flex flex-1 overflow-hidden">

      {/* ── Map canvas ── */}
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY !== 'YOUR_GOOGLE_MAPS_API_KEY' ? (
          <GoogleMap />
        ) : (
          <VectorMap />
        )}

        {/* Legend overlay */}
        <motion.div
          className="absolute bottom-5 left-4 z-10 rounded-xl glass p-3"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Legend</p>
          {LEGEND.map((l, i) => (
            <div key={i} className="mb-1.5 flex items-center gap-2 text-[11px] text-foreground/70 last:mb-0">
              <span className="h-2 w-2 flex-shrink-0 rounded-full" style={{ background: l.color }} />
              {l.label}
            </div>
          ))}
        </motion.div>

        {/* Coord strip */}
        <div className="flex flex-shrink-0 items-center gap-5 border-t border-border bg-card px-4 py-1.5">
          <CoordItem label="City"    value={currentCity.name} />
          <CoordItem label="Visible" value={filtered.length.toString()} />
          <CoordItem label="Total"   value={useAppStore.getState().stats.total.toString()} />
        </div>
      </div>

      {/* ── Right panel ── */}
      <motion.aside
        className="flex w-[268px] flex-shrink-0 flex-col overflow-hidden border-l border-border bg-card"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        {/* Alert feed header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-border px-4 py-3 bg-secondary/30">
          <div className="flex items-center gap-2">
            <LiveDot size={7} />
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Live Alerts
            </span>
          </div>
          <Badge variant="critical">{alerts.length}</Badge>
        </div>

        {/* Alerts scroll */}
        <ScrollArea className="flex-1">
          <div className="p-2">
            <AnimatePresence initial={false}>
              {alerts.slice(0, 22).map((a, i) => {
                const type = CRIME_TYPES.find(t => t.id === a.typeId) ?? CRIME_TYPES[0]
                const borderColor =
                  a.severity === 'critical' ? '#ef4444' :
                  a.severity === 'high'     ? '#f59e0b' : '#3b82f6'
                const sevVariant =
                  a.severity === 'critical' ? 'critical' :
                  a.severity === 'high'     ? 'high'     : 'medium'

                return (
                  <motion.div
                    key={a.id}
                    layout
                    initial={{ opacity: 0, x: 20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="mb-2 overflow-hidden rounded-xl border border-border bg-secondary/20 hover:bg-secondary/40 transition-colors"
                    style={{ borderLeft: `3px solid ${borderColor}` }}
                  >
                    <div className="px-3 py-2.5">
                      <div className="mb-1 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: type.color }} />
                          <span className="text-[13px] font-bold text-foreground">{type.label}</span>
                        </div>
                        <Badge variant={sevVariant as any}>{a.severity.toUpperCase()}</Badge>
                      </div>
                      <p className="font-mono text-[11px] text-muted-foreground/80">
                        {a.district} · {a.lat.toFixed(4)}, {a.lng.toFixed(4)}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px] text-muted-foreground/60">{a.time}</p>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>

        <Separator />

        {/* Patrol deployment */}
        <div className="flex-shrink-0 p-3">
          <p className="mb-2.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            AI Patrol Deployment
          </p>
          <div className="space-y-2">
            {patrols.map((p, i) => {
              const riskColor =
                p.risk > 80 ? '#ef4444' : p.risk > 65 ? '#f59e0b' : '#22c55e'
              const riskBg =
                p.risk > 80 ? 'rgba(239,68,68,0.1)' : p.risk > 65 ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)'

              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-secondary/20 px-3 py-2"
                >
                  <div
                    className="flex h-[32px] w-[32px] flex-shrink-0 items-center justify-center rounded-lg font-mono text-[10px] font-bold"
                    style={{ background: riskBg, color: riskColor }}
                  >
                    P{p.id}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-bold text-foreground">
                      Unit {p.id} → {p.zone}
                    </p>
                    <div className="mt-1.5">
                      <Progress value={p.risk} color={riskColor} height={2} />
                    </div>
                  </div>
                  <span className="flex-shrink-0 font-mono text-[12px] font-semibold" style={{ color: riskColor }}>
                    {p.risk}%
                  </span>
                </motion.div>
              )
            })}
          </div>
        </div>
      </motion.aside>
    </div>
  )
}

function CoordItem({ label, value }: { label: string; value: string }) {
  return (
    <span className="text-[11px] text-muted-foreground">
      {label}{' '}
      <span className="font-mono text-primary">{value}</span>
    </span>
  )
}
