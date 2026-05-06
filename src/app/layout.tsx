import type { Metadata } from 'next'
import '@/styles/globals.css'

export const metadata: Metadata = {
  title:       'SentinelIQ — Crime Intelligence Platform',
  description: 'Real-time crime hotspot prediction and live monitoring system',
  icons:       { icon: '/favicon.ico' },
}

import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="overflow-hidden h-screen">
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
