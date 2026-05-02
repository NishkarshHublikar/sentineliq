'use client'

import * as React from 'react'
import * as TooltipPrimitives from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

const TooltipProvider = TooltipPrimitives.Provider
const TooltipRoot     = TooltipPrimitives.Root
const TooltipTrigger  = TooltipPrimitives.Trigger

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitives.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitives.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitives.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      'z-50 overflow-hidden rounded-lg border border-zinc-700 bg-zinc-900',
      'px-3 py-1.5 text-[11px] text-zinc-300',
      'shadow-xl animate-fade-in',
      className
    )}
    {...props}
  />
))
TooltipContent.displayName = TooltipPrimitives.Content.displayName

/** Convenience wrapper: <Tooltip tip="..."><Button/></Tooltip> */
export function Tooltip({
  children,
  tip,
  side = 'top',
}: {
  children: React.ReactNode
  tip: string
  side?: 'top' | 'bottom' | 'left' | 'right'
}) {
  return (
    <TooltipProvider delayDuration={300}>
      <TooltipRoot>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side={side}>{tip}</TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  )
}

export { TooltipProvider, TooltipRoot, TooltipTrigger, TooltipContent }
