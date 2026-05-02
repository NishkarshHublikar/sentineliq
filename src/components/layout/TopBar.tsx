'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Radio, Brain, Map, Sun, Moon } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { LiveDot } from '@/components/ui/live-dot'
import { Tooltip } from '@/components/ui/tooltip'
import { useAppStore } from '@/lib/store'
import type { TabId } from '@/types'

const NAV_ITEMS: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: 'map',  label: 'Live Map',  icon: <Map size={13} /> },
  { id: 'dash', label: 'Analytics', icon: <Radio size={13} /> },
  { id: 'ml',   label: 'ML Model',  icon: <Brain size={13} /> },
]

export function TopBar() {
  const { activeTab, setTab, role, toggleRole, anomaly, theme, setTheme } = useAppStore()
  const [clock, setClock] = useState('')

  useEffect(() => {
    const tick = () =>
      setClock(new Date().toLocaleTimeString('en', { hour12: false }))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <motion.header
      className="glass flex h-[54px] flex-shrink-0 items-center gap-3 px-4 z-50"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <div className="flex h-[30px] w-[30px] items-center justify-center rounded-[8px] bg-blue-600 ring-2 ring-zinc-950 ring-offset-1 ring-offset-blue-600/30">
          <ShieldCheck size={15} className="text-white" strokeWidth={2} />
        </div>
        <div>
          <div className="text-[13px] font-semibold leading-none text-white tracking-tight">
            SentinelIQ
          </div>
          <div className="mt-0.5 text-[10px] text-zinc-500 leading-none tracking-wide">
            Crime Intelligence
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-1 h-5 w-px bg-white/[0.06]" />

      {/* Tab navigation */}
      <nav className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={[
              'relative flex items-center gap-1.5 rounded-lg border px-3 py-[5px] text-[12px] font-medium transition-all duration-150',
              activeTab === item.id
                ? 'border-white/[0.1] bg-zinc-800 text-white'
                : 'border-transparent text-zinc-500 hover:text-zinc-300',
            ].join(' ')}
          >
            <span className={activeTab === item.id ? 'text-blue-400' : 'text-zinc-500'}>
              {item.icon}
            </span>
            {item.label}
            {/* Active underline */}
            {activeTab === item.id && (
              <motion.span
                layoutId="tab-indicator"
                className="absolute inset-x-2 -bottom-[1px] h-px bg-blue-500"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}
          </button>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Status pills */}
      <div className="flex items-center gap-2">
        <Badge variant="live">
          <LiveDot size={6} />
          Live Feed
        </Badge>

        {anomaly && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
          >
            <Badge variant="critical">⚠ Anomaly Detected</Badge>
          </motion.div>
        )}
      </div>

      {/* Theme toggle */}
      <button
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-secondary/50 text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
      >
        {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
      </button>

      <div className="mx-1 h-5 w-px bg-border" />

      {/* Clock */}
      <span className="font-mono text-[12px] tracking-widest text-zinc-500 min-w-[68px]">
        {clock}
      </span>

      {/* Role toggle */}
      <Tooltip tip={`Switch to ${role === 'admin' ? 'Officer' : 'Admin'} view`}>
        <button
          onClick={toggleRole}
          className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-zinc-900 px-3 py-[5px] text-[12px] font-medium text-zinc-300 transition-colors hover:border-white/[0.14] hover:text-white"
        >
          <span className="flex h-[20px] w-[20px] items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white">
            {role === 'admin' ? 'A' : 'O'}
          </span>
          {role === 'admin' ? 'Administrator' : 'Officer'}
        </button>
      </Tooltip>
    </motion.header>
  )
}
