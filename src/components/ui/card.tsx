'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  animate?: boolean
  delay?: number
  hover?: boolean
}

export function Card({
  className,
  children,
  animate = false,
  delay = 0,
  hover = false,
  ...props
}: CardProps) {
  const base = cn(
    'rounded-xl border border-white/[0.06] bg-zinc-900 overflow-hidden',
    hover && 'transition-colors hover:border-white/[0.1]',
    className
  )

  if (animate) {
    return (
      <motion.div
        className={base}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] }}
        {...(props as any)}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div className={base} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1 p-5 pb-3', className)}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        'text-[11px] font-semibold uppercase tracking-widest text-zinc-400',
        className
      )}
      {...props}
    />
  )
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 pt-0', className)} {...props} />
}
