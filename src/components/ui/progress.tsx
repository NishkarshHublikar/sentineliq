import * as React from 'react'
import * as ProgressPrimitives from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitives.Root> {
  color?: string
  height?: number
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitives.Root>,
  ProgressProps
>(({ className, value = 0, color, height = 4, ...props }, ref) => (
  <ProgressPrimitives.Root
    ref={ref}
    className={cn('relative overflow-hidden rounded-full bg-zinc-800', className)}
    style={{ height }}
    {...props}
  >
    <ProgressPrimitives.Indicator
      className="h-full w-full flex-1 rounded-full transition-all duration-700 ease-out"
      style={{
        transform: `translateX(-${100 - (value || 0)}%)`,
        background: color ?? '#3b82f6',
      }}
    />
  </ProgressPrimitives.Root>
))
Progress.displayName = ProgressPrimitives.Root.displayName

export { Progress }
