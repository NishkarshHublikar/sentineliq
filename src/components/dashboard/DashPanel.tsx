'use client'

import { useMemo, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAppStore } from '@/lib/store'
import { randInt, CRIME_TYPES, DISTRICTS } from '@/lib/utils'

const GRID_COLOR   = 'hsl(var(--border))'
const TICK_COLOR   = 'hsl(var(--muted-foreground))'
const TOOLTIP_STYLE = (theme: string) => ({
  contentStyle: { 
    background: 'hsl(var(--card))', 
    border: '1px solid hsl(var(--border))', 
    borderRadius: 10, 
    fontSize: 12 
  },
  labelStyle:   { color: 'hsl(var(--foreground))' },
})

export function DashPanel() {
  const { theme } = useAppStore()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  /* 30-day trend */
  const trendData = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - 29 + i)
      return {
        date:      d.toLocaleDateString('en', { month: 'short', day: 'numeric' }),
        actual:    randInt(15, 74),
        predicted: i > 22 ? randInt(15, 68) : undefined,
      }
    })
  }, [])

  /* Crime type distribution */
  const pieData = useMemo(() =>
    CRIME_TYPES.map(t => ({ name: t.label, value: randInt(10, 50), color: t.color })),
  [])

  /* Peak hours */
  const hourData = useMemo(() =>
    Array.from({ length: 24 }, (_, h) => ({
      hour:  `${h}h`,
      count: randInt(
        h >= 22 || h <= 2 ? 32 : h >= 18 ? 50 : 10,
        h >= 22 || h <= 2 ? 56 : h >= 18 ? 76 : 32
      ),
    })),
  [])

  /* District comparison */
  const districtData = useMemo(() =>
    DISTRICTS.map((d, i) => ({
      district:  d,
      actual:    [142, 98, 115, 87, 176, 62][i],
      predicted: [155, 102, 120, 90, 182, 70][i],
    })),
  [])

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.07 } },
  }
  const cardAnim = {
    hidden: { opacity: 0, y: 12 },
    show:   { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  }

  if (!mounted) return <div className="flex-1 bg-background" />

  return (
    <ScrollArea className="flex-1">
      <motion.div
        className="grid grid-cols-2 gap-4 p-5"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* 30-day trend — full width */}
        <motion.div className="col-span-2" variants={cardAnim}>
          <Card>
            <CardHeader><CardTitle>30-Day Incident Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={140}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                  <XAxis dataKey="date" tick={{ fill: TICK_COLOR, fontSize: 10 }} tickLine={false} axisLine={false} interval={4} />
                  <YAxis tick={{ fill: TICK_COLOR, fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11, color: TICK_COLOR }} />
                  <Line type="monotone" dataKey="actual"    stroke="#3b82f6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="predicted" stroke="#22c55e" strokeWidth={1.5} dot={false} strokeDasharray="5 4" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pie chart */}
        <motion.div variants={cardAnim}>
          <Card className="h-full">
            <CardHeader><CardTitle>Incidents by Type</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="45%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip {...TOOLTIP_STYLE(theme)} />
                  <Legend wrapperStyle={{ fontSize: 11, color: TICK_COLOR }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Peak hours */}
        <motion.div variants={cardAnim}>
          <Card className="h-full">
            <CardHeader><CardTitle>Peak Hour Distribution</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={hourData} barSize={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                   <XAxis dataKey="hour" tick={{ fill: TICK_COLOR, fontSize: 9 }} tickLine={false} axisLine={false} interval={3} />
                  <YAxis tick={{ fill: TICK_COLOR, fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip {...TOOLTIP_STYLE(theme)} />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {hourData.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={entry.count > 52 ? 'hsl(var(--destructive))' : entry.count > 38 ? 'hsl(var(--warning))' : 'hsl(var(--primary))'}
                        fillOpacity={0.75}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* District comparison — full width */}
        <motion.div className="col-span-2" variants={cardAnim}>
          <Card>
            <CardHeader><CardTitle>District Comparison — Actual vs Predicted</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={130}>
                <BarChart data={districtData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} />
                   <XAxis dataKey="district" tick={{ fill: TICK_COLOR, fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: TICK_COLOR, fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip {...TOOLTIP_STYLE(theme)} />
                  <Legend wrapperStyle={{ fontSize: 11, color: TICK_COLOR }} />
                  <Bar dataKey="actual"    name="Actual"    fill="hsl(var(--primary))" fillOpacity={0.65} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="predicted" name="Predicted" fill="hsl(var(--chart-2))" fillOpacity={0.5}  radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </ScrollArea>
  )
}
