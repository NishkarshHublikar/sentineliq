'use client'

import { motion } from 'framer-motion'

interface LiveDotProps {
  color?: string
  size?: number
}

export function LiveDot({ color = '#22c55e', size = 8 }: LiveDotProps) {
  return (
    <span className="relative flex" style={{ width: size, height: size, flexShrink: 0 }}>
      <motion.span
        className="absolute inline-flex rounded-full"
        style={{ inset: 0, background: color }}
        animate={{ scale: [1, 1.8, 1.8], opacity: [1, 0, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
      />
      <span
        className="relative inline-flex rounded-full"
        style={{ width: size, height: size, background: color }}
      />
    </span>
  )
}
