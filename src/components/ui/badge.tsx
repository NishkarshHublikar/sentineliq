import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-medium font-mono transition-colors border',
  {
    variants: {
      variant: {
        default:   'bg-zinc-800 text-zinc-400 border-zinc-700',
        critical:  'bg-red-500/12 text-red-300 border-red-500/30',
        high:      'bg-amber-500/12 text-amber-300 border-amber-500/30',
        medium:    'bg-blue-500/12 text-blue-300 border-blue-500/30',
        success:   'bg-green-500/12 text-green-300 border-green-500/30',
        live:      'bg-green-500/12 text-green-400 border-green-500/30',
        blue:      'bg-blue-500/12 text-blue-300 border-blue-500/30',
        purple:    'bg-purple-500/12 text-purple-300 border-purple-500/30',
        outline:   'bg-transparent text-zinc-400 border-zinc-700',
      },
    },
    defaultVariants: { variant: 'default' },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}
