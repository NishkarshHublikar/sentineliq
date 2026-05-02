'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { TopBar }    from '@/components/layout/TopBar'
import { Sidebar }   from '@/components/layout/Sidebar'
import { MapPanel }  from '@/components/map/MapPanel'
import { DashPanel } from '@/components/dashboard/DashPanel'
import { MLPanel }   from '@/components/ml/MLPanel'
import { useAppStore } from '@/lib/store'
import { useSocket } from '@/hooks/useSocket'
import { useAnomalyDetector } from '@/hooks/useAnomalyDetector'

export function Dashboard() {
  const { activeTab, activeCity, initCity } = useAppStore()

  // Bootstrap data on mount
  useEffect(() => { initCity(activeCity) }, [])

  // Live WebSocket stream
  useSocket()

  // Anomaly detection watcher
  useAnomalyDetector()

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#09090b]">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex flex-1 flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'map' && (
              <motion.div
                key="map"
                className="flex flex-1 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MapPanel />
              </motion.div>
            )}
            {activeTab === 'dash' && (
              <motion.div
                key="dash"
                className="flex flex-1 overflow-hidden"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <DashPanel />
              </motion.div>
            )}
            {activeTab === 'ml' && (
              <motion.div
                key="ml"
                className="flex flex-1 overflow-hidden"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
              >
                <MLPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  )
}
