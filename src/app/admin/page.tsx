'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, Mail, Lock, Loader2, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Unauthorized administrative access')
      } else {
        router.push('/admin/users')
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected system error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] p-4">
      {/* Background patterns - More aggressive for Admin */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-amber-600/5 blur-[150px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] rounded-full bg-red-600/5 blur-[150px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass relative w-full max-w-[420px] overflow-hidden rounded-2xl border border-amber-500/10 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-2xl"
      >
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-600 shadow-lg shadow-amber-600/30 ring-1 ring-amber-400/50">
            <ShieldAlert className="text-white" size={28} />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase">Security Command</h1>
          <p className="mt-2 text-[11px] font-bold uppercase tracking-[2px] text-amber-500/80">Administrative Oversight Portal</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 ml-1">Admin Identifier</label>
            <div className="relative group">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-400 transition-colors" size={16} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sentineliq.gov"
                className="w-full rounded-xl border border-white/5 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none transition-all focus:border-amber-500/50 focus:bg-white/10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 ml-1">Command Password</label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-amber-400 transition-colors" size={16} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-white/5 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none transition-all focus:border-amber-500/50 focus:bg-white/10"
              />
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400 text-center font-medium"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={isLoading}
            className="group relative w-full overflow-hidden rounded-xl bg-amber-600 py-3 text-sm font-bold uppercase tracking-wider text-white transition-all hover:bg-amber-500 active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="mx-auto animate-spin" size={20} />
            ) : (
              <span className="flex items-center justify-center gap-2">
                Authorize Access <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </span>
            )}
          </button>
        </form>

        <p className="mt-10 text-center text-[10px] text-zinc-600 leading-relaxed font-medium">
          CRITICAL: Accessing this terminal without high-level clearance is a violation of federal security protocols. All sessions are encrypted and hard-logged.
        </p>
      </motion.div>
    </div>
  )
}
