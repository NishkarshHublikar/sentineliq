'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Radio, Brain, Map, Sun, Moon, LogOut, User, Settings } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import { Badge } from '@/components/ui/badge'
import { LiveDot } from '@/components/ui/live-dot'
import { Tooltip } from '@/components/ui/tooltip'
import { useAppStore } from '@/lib/store'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { TabId, Role } from '@/types'

const NAV_ITEMS: Array<{ id: TabId; label: string; icon: React.ReactNode }> = [
  { id: 'map',  label: 'Live Map',  icon: <Map size={13} /> },
  { id: 'dash', label: 'Analytics', icon: <Radio size={13} /> },
  { id: 'ml',   label: 'ML Model',  icon: <Brain size={13} /> },
]

export function TopBar() {
  const { data: session } = useSession()
  const { activeTab, setTab, setRole, anomaly, theme, setTheme } = useAppStore()
  const [clock, setClock] = useState('')

  useEffect(() => {
    if (session?.user?.role) {
      setRole(session.user.role as Role)
    }
  }, [session, setRole])

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
          <ShieldCheck size={15} className="text-primary-foreground" strokeWidth={2} />
        </div>
        <div>
          <div className="text-[13px] font-semibold leading-none text-foreground tracking-tight">
            SentinelIQ
          </div>
          <div className="mt-0.5 text-[10px] text-zinc-500 leading-none tracking-wide">
            Crime Intelligence
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-1 h-5 w-px bg-border" />

      {/* Tab navigation */}
      <nav className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={[
              'relative flex items-center gap-1.5 rounded-lg border px-3 py-[5px] text-[12px] font-medium transition-all duration-150',
              activeTab === item.id
                ? 'border-primary/20 bg-primary/10 text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
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

      {/* User profile */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-[5px] text-[12px] font-medium text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground">
            <div className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-blue-600 text-[9px] font-bold text-white overflow-hidden border border-white/10">
              {session?.user?.image ? (
                <img src={session.user.image} alt="User" className="h-full w-full object-cover" />
              ) : (
                <span>{session?.user?.name?.[0] || 'U'}</span>
              )}
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[11px] text-foreground font-semibold">{session?.user?.name?.split(' ')[0]}</span>
              <span className="text-[9px] text-zinc-500 uppercase tracking-tighter">{session?.user?.role}</span>
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
            <User size={14} className="mr-2" />
            Profile Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => window.location.href = '/profile'}>
            <Settings size={14} className="mr-2" />
            Security (MFA)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="text-red-400 focus:text-red-400" 
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut size={14} className="mr-2" />
            Sign Out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </motion.header>
  )
}
