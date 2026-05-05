'use client'

import { useEffect, useRef } from 'react'
import { useAppStore } from '@/lib/store'
import { CRIME_TYPES, CITIES, DISTRICTS, SEVERITIES, rand, randInt } from '@/lib/utils'
import type { CrimeType, Severity } from '@/types'

/**
 * useSocket — connects to the Socket.IO backend and pushes real-time
 * crime events into the global Zustand store.
 *
 * Falls back to a local simulation when NEXT_PUBLIC_WS_URL is not set.
 */
export function useSocket() {
  const { pushCrime, setAnomaly, currentCity } = useAppStore()
  const timerRef = useRef<NodeJS.Timeout[]>([])

  useEffect(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL

    // ── Real Socket.IO connection ──────────────────────────────────
    if (wsUrl && wsUrl !== 'http://localhost:4000') {
      let socket: any
      import('socket.io-client').then(({ io }) => {
        socket = io(wsUrl, { transports: ['websocket'] })

        socket.on('new_crime', (data: any) => {
          pushCrime({ ...data, ts: new Date(data.ts), isNew: true, flash: 1.8 })
        })

        socket.on('anomaly', (data: any) => {
          setAnomaly(true)
          setTimeout(() => setAnomaly(false), 9000)
        })
      })
      return () => { socket?.disconnect() }
    }

    // ── Local simulation (dev / demo) ─────────────────────────────
    const city = currentCity

    const push = () => {
      const type = CRIME_TYPES[randInt(0, CRIME_TYPES.length - 1)]
      pushCrime({
        id:       `live-${Date.now()}`,
        lat:      city.lat + rand(-0.09, 0.09),
        lng:      city.lng + rand(-0.09, 0.09),
        typeId:   type.id as CrimeType,
        severity: SEVERITIES[randInt(0, SEVERITIES.length - 1)] as Severity,
        district: DISTRICTS[randInt(0, DISTRICTS.length - 1)],
        hour:     new Date().getHours(),
        ts:       new Date(),
        resolved: false,
        isNew:    true,
        flash:    1.8,
      })
    }

    // Primary stream: every 3–5 s
    const schedule = () => {
      const t = setTimeout(() => { push(); schedule() }, rand(3200, 5000))
      timerRef.current.push(t)
    }
    schedule()

    // Burst mode: +25 % chance every 7 s
    const burst = setInterval(() => { if (Math.random() < 0.25) push() }, 7000)
    timerRef.current.push(burst)

    return () => {
      timerRef.current.forEach(clearTimeout)
      timerRef.current = []
    }
  }, [currentCity])
}
