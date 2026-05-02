'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'

/**
 * useAnomalyDetector — watches the alert feed and triggers an anomaly
 * flag when recent event rate exceeds the threshold.
 *
 * Mirrors the IsolationForest contamination logic from the Python backend.
 * Threshold: > 8 events in the last 5 minutes.
 */
export function useAnomalyDetector() {
  const { alerts, setAnomaly } = useAppStore()

  useEffect(() => {
    const recent = alerts.filter(
      a => Date.now() - new Date(a.ts).getTime() < 300_000
    ).length

    if (recent > 8) {
      setAnomaly(true)
      const t = setTimeout(() => setAnomaly(false), 9000)
      return () => clearTimeout(t)
    }
  }, [alerts, setAnomaly])
}
