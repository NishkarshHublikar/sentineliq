'use client'

import * as React from 'react'
import * as SwitchPrimitives from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    className={cn(
      'peer inline-flex h-[18px] w-[32px] shrink-0 cursor-pointer items-center rounded-full border border-transparent',
      'transition-colors duration-200',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 focus-visible:ring-offset-zinc-950',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:bg-blue-500 data-[state=unchecked]:bg-zinc-700',
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        'pointer-events-none block h-[12px] w-[12px] rounded-full bg-white shadow-md',
        'ring-0 transition-transform duration-200',
        'data-[state=checked]:translate-x-[16px] data-[state=unchecked]:translate-x-[2px]'
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
