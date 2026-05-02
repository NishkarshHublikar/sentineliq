import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'monospace'],
      },
      colors: {
        border:     'hsl(var(--border))',
        input:      'hsl(var(--input))',
        ring:       'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary:    { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary:  { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive:{ DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        muted:      { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent:     { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        card:       { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'fade-up':     { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'fade-in':     { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'slide-right': { '0%': { opacity: '0', transform: 'translateX(-8px)' }, '100%': { opacity: '1', transform: 'translateX(0)' } },
        'slide-down':  { '0%': { opacity: '0', transform: 'translateY(-8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'ping-slow':   { '0%': { transform: 'scale(1)', opacity: '1' }, '75%, 100%': { transform: 'scale(1.8)', opacity: '0' } },
        'pulse-glow':  { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.3' } },
        'count-up':    { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
      animation: {
        'fade-up':     'fade-up 0.4s ease both',
        'fade-in':     'fade-in 0.3s ease both',
        'slide-right': 'slide-right 0.35s cubic-bezier(0.16,1,0.3,1) both',
        'slide-down':  'slide-down 0.3s ease both',
        'ping-slow':   'ping-slow 1.5s cubic-bezier(0,0,0.2,1) infinite',
        'pulse-glow':  'pulse-glow 1.5s ease-in-out infinite',
        'count-up':    'count-up 0.4s ease both',
      },
    },
  },
  plugins: [],
}

export default config
