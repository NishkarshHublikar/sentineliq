'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useFilteredCrimes } from '@/hooks/useFilteredCrimes'
import { useAppStore } from '@/lib/store'
import { CITIES, CRIME_TYPES, predictRisk } from '@/lib/utils'
import type { CityKey } from '@/types'

interface TooltipData {
  x: number; y: number
  lat: number; lng: number
  risk: number; near: number
}

interface CrimeMapProps {
  /** Override canvas city (defaults to store) */
  cityKey?: CityKey
}

export function CrimeMap({ cityKey }: CrimeMapProps) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const animRef     = useRef<number>(0)
  const mouseRef    = useRef({ x: 0, y: 0 })
  const [tooltip, setTooltip] = useState<TooltipData | null>(null)

  const { layers, activeCity } = useAppStore()
  const city    = CITIES[cityKey ?? activeCity]
  const crimes  = useFilteredCrimes()

  const ll2px = useCallback((lat: number, lng: number, W: number, H: number) => {
    const sc = 1850
    return { x: W / 2 + (lng - city.lng) * sc, y: H / 2 - (lat - city.lat) * sc }
  }, [city])

  const px2ll = useCallback((x: number, y: number, W: number, H: number) => {
    const sc = 1850
    return { lat: city.lat + (H / 2 - y) / sc, lng: city.lng + (x - W / 2) / sc }
  }, [city])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)

    // ── Background ──
    ctx.fillStyle = '#09090b'
    ctx.fillRect(0, 0, W, H)

    // ── Grid ──
    ctx.strokeStyle = 'rgba(255,255,255,0.025)'
    ctx.lineWidth = 1
    for (let x = 0; x < W; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
    for (let y = 0; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

    // ── City boundary ──
    const bw = W * 0.70, bh = H * 0.70
    const bx = (W - bw) / 2, by = (H - bh) / 2
    ctx.strokeStyle = 'rgba(59,130,246,0.07)'
    ctx.lineWidth = 1; ctx.setLineDash([8, 10])
    ctx.strokeRect(bx, by, bw, bh); ctx.setLineDash([])
    ctx.fillStyle = 'rgba(59,130,246,0.18)'
    ctx.font = '500 10px Geist Mono, monospace'
    ctx.fillText(city.name.toUpperCase(), bx + 12, by + 17)

    // ── Heatmap ──
    if (layers.heat && crimes.length > 0) {
      const idata = ctx.createImageData(W, H)
      const d = idata.data
      const res = 5
      for (let py = 0; py < H; py += res) {
        for (let px = 0; px < W; px += res) {
          let heat = 0
          for (const c of crimes) {
            const p = ll2px(c.lat, c.lng, W, H)
            const dist = Math.sqrt((px - p.x) ** 2 + (py - p.y) ** 2)
            if (dist < 100) heat += Math.exp(-dist * dist / 1600)
          }
          heat = Math.min(1, heat / 3)
          if (heat < 0.04) continue
          const r  = Math.floor(255 * Math.min(1, heat * 2.4))
          const g  = Math.floor(60 * Math.max(0, 1 - heat * 2) * heat)
          const al = Math.floor(185 * heat)
          for (let dy = 0; dy < res && py + dy < H; dy++)
            for (let dx = 0; dx < res && px + dx < W; dx++) {
              const idx = ((py + dy) * W + (px + dx)) * 4
              if (d[idx + 3] < al) {
                d[idx] = r; d[idx + 1] = g; d[idx + 2] = 20; d[idx + 3] = al
              }
            }
        }
      }
      ctx.putImageData(idata, 0, 0)
    }

    // ── Prediction overlay ──
    if (layers.predict) {
      const res = 10
      for (let py = 0; py < H; py += res)
        for (let px = 0; px < W; px += res) {
          const ll = px2ll(px, py, W, H)
          const rk = predictRisk(ll.lat, ll.lng, activeCity)
          if (rk > 0.18) {
            ctx.fillStyle = `rgba(34,197,94,${rk * 0.22})`
            ctx.fillRect(px, py, res, res)
          }
        }
      // Prediction zone rings
      const hots = [
        { lat: city.lat + 0.03, lng: city.lng - 0.04 },
        { lat: city.lat - 0.05, lng: city.lng + 0.06 },
        { lat: city.lat + 0.01, lng: city.lng + 0.02 },
      ]
      for (const h of hots) {
        const p = ll2px(h.lat, h.lng, W, H)
        ctx.strokeStyle = 'rgba(34,197,94,0.4)'
        ctx.lineWidth = 1.5; ctx.setLineDash([4, 5])
        ctx.beginPath(); ctx.arc(p.x, p.y, 52, 0, Math.PI * 2); ctx.stroke()
        ctx.fillStyle = 'rgba(34,197,94,0.05)'; ctx.fill()
        ctx.setLineDash([])
        ctx.fillStyle = 'rgba(34,197,94,0.6)'
        ctx.font = '600 9px Geist Mono, monospace'
        ctx.textAlign = 'center'
        ctx.fillText('HIGH RISK', p.x, p.y - 58)
        ctx.textAlign = 'left'
      }
    }

    // ── Patrol circles ──
    if (layers.patrol) {
      const units = [
        { lat: city.lat + 0.03, lng: city.lng - 0.04, id: 1 },
        { lat: city.lat - 0.05, lng: city.lng + 0.06, id: 2 },
        { lat: city.lat + 0.01, lng: city.lng + 0.02, id: 3 },
      ]
      for (const u of units) {
        const p = ll2px(u.lat, u.lng, W, H)
        ctx.strokeStyle = 'rgba(59,130,246,0.55)'
        ctx.lineWidth = 2
        ctx.beginPath(); ctx.arc(p.x, p.y, 36, 0, Math.PI * 2); ctx.stroke()
        ctx.fillStyle = 'rgba(59,130,246,0.07)'; ctx.fill()
        ctx.fillStyle = 'rgba(147,197,253,0.85)'
        ctx.font = '700 10px Geist Mono, monospace'
        ctx.textAlign = 'center'; ctx.fillText('P' + u.id, p.x, p.y + 4); ctx.textAlign = 'left'
      }
    }

    // ── Incident markers ──
    if (layers.markers) {
      for (const cr of crimes) {
        const p = ll2px(cr.lat, cr.lng, W, H)
        const type = CRIME_TYPES.find(t => t.id === cr.typeId) ?? CRIME_TYPES[0]
        const r = cr.severity === 'critical' ? 6 : cr.severity === 'high' ? 5 : 4

        // Flash ring for new incidents
        if ((cr.flash ?? 0) > 0) {
          ctx.globalAlpha = (cr.flash ?? 0) * 0.45
          ctx.strokeStyle = type.color; ctx.lineWidth = 1.5
          for (const rad of [14, 22, 32]) {
            ctx.beginPath(); ctx.arc(p.x, p.y, rad, 0, Math.PI * 2); ctx.stroke()
          }
          ctx.globalAlpha = 1;
          (cr as any).flash = Math.max(0, (cr.flash ?? 0) - 0.016)
        }

        // Glow halo
        ctx.globalAlpha = 0.20
        ctx.fillStyle = type.color
        ctx.beginPath(); ctx.arc(p.x, p.y, r + 4, 0, Math.PI * 2); ctx.fill()
        ctx.globalAlpha = 1

        // Core dot
        ctx.fillStyle = type.color
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill()

        // Critical severity ring
        if (cr.severity === 'critical') {
          ctx.strokeStyle = type.color; ctx.lineWidth = 1; ctx.globalAlpha = 0.4
          ctx.beginPath(); ctx.arc(p.x, p.y, r + 4, 0, Math.PI * 2); ctx.stroke()
          ctx.globalAlpha = 1
        }
      }
    }

    // ── Crosshair ──
    const mx = mouseRef.current.x, my = mouseRef.current.y
    ctx.strokeStyle = 'rgba(59,130,246,0.15)'; ctx.lineWidth = 1; ctx.setLineDash([3, 6])
    ctx.beginPath(); ctx.moveTo(mx, 0); ctx.lineTo(mx, H); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(0, my); ctx.lineTo(W, my); ctx.stroke()
    ctx.setLineDash([])
    ctx.strokeStyle = 'rgba(59,130,246,0.45)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(mx - 5, my); ctx.lineTo(mx + 5, my); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(mx, my - 5); ctx.lineTo(mx, my + 5); ctx.stroke()

    animRef.current = requestAnimationFrame(draw)
  }, [crimes, layers, city, ll2px, px2ll, activeCity])

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => {
      const par = canvas.parentElement!
      canvas.width  = par.clientWidth
      canvas.height = par.clientHeight
    })
    ro.observe(canvas.parentElement!)
    canvas.width  = canvas.parentElement!.clientWidth
    canvas.height = canvas.parentElement!.clientHeight
    return () => ro.disconnect()
  }, [])

  // Mouse interaction
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      mouseRef.current = { x, y }
      const ll   = px2ll(x, y, canvas.width, canvas.height)
      const risk = predictRisk(ll.lat, ll.lng, activeCity)
      const near = crimes.filter(c =>
        Math.abs(c.lat - ll.lat) < 0.012 && Math.abs(c.lng - ll.lng) < 0.012
      ).length
      if (near > 0 || risk > 0.15) {
        setTooltip({ x, y, lat: ll.lat, lng: ll.lng, risk, near })
      } else {
        setTooltip(null)
      }
    }
    canvas.addEventListener('mousemove', onMove)
    canvas.addEventListener('mouseleave', () => setTooltip(null))
    return () => {
      canvas.removeEventListener('mousemove', onMove)
      canvas.removeEventListener('mouseleave', () => setTooltip(null))
    }
  }, [crimes, city, px2ll, activeCity])

  // Animation loop
  useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)
    draw()
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [draw])

  const riskColor = tooltip
    ? tooltip.risk > 0.6 ? '#ef4444' : tooltip.risk > 0.35 ? '#f59e0b' : '#22c55e'
    : '#22c55e'

  return (
    <div className="relative flex-1 overflow-hidden">
      <canvas ref={canvasRef} className="block h-full w-full cursor-crosshair" />

      {/* Hover tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none absolute z-20 min-w-[160px] rounded-xl border border-white/[0.1] bg-zinc-900/95 px-3 py-2.5 shadow-2xl backdrop-blur-sm"
          style={{ left: tooltip.x + 16, top: tooltip.y - 10 }}
        >
          <div className="mb-1.5 font-mono text-[15px] font-semibold" style={{ color: riskColor }}>
            {(tooltip.risk * 100).toFixed(1)}% risk
          </div>
          <div className="space-y-0.5 font-mono text-[11px] text-zinc-400">
            <div>Nearby: <span className="text-zinc-200">{tooltip.near}</span></div>
            <div>{tooltip.lat.toFixed(4)}, {tooltip.lng.toFixed(4)}</div>
          </div>
        </div>
      )}
    </div>
  )
}
