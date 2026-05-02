'use client'

import { useMemo } from 'react'
import { useAppStore } from '@/lib/store'

/**
 * useFilteredCrimes — derives the visible subset of crimes from the
 * global store based on active type filters and time window.
 */
export function useFilteredCrimes() {
  const { crimes, activeTypes, timeFilter } = useAppStore()

  return useMemo(() => {
    const now = Date.now()
    return crimes.filter(c => {
      if (!activeTypes.has(c.typeId)) return false
      const age = now - new Date(c.ts).getTime()
      if (timeFilter === '24h'  && age > 86_400_000)   return false
      if (timeFilter === '7d'   && age > 604_800_000)  return false
      if (timeFilter === 'night'  && !(c.hour >= 22 || c.hour <= 5))  return false
      if (timeFilter === 'peak'   && !(c.hour >= 18 && c.hour <= 22)) return false
      return true
    })
  }, [crimes, activeTypes, timeFilter])
}
