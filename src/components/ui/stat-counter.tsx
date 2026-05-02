'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'framer-motion'

interface StatCounterProps {
  value: number
  color?: string
  className?: string
}

export function StatCounter({ value, color, className }: StatCounterProps) {
  const spring = useSpring(0, { stiffness: 80, damping: 20 })
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString())

  useEffect(() => {
    spring.set(value)
  }, [value, spring])

  return (
    <motion.span
      className={className}
      style={{ color, fontFamily: "'Geist Mono', monospace" }}
    >
      {display}
    </motion.span>
  )
}
