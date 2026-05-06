'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { ShieldAlert, Loader2, ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function MfaPage() {
  const { data: session, update } = useSession()
  const [token, setToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const res = await fetch('/api/user/mfa/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      })
      const data = await res.json()
      
      if (data.success) {
        // Update session token with mfaVerified: true
        await update({ mfaVerified: true })
        router.push('/')
        router.refresh()
      } else {
        setError(data.error || 'Invalid code')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass w-full max-w-[400px] rounded-2xl border border-white/5 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-xl"
      >
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/20">
            <ShieldAlert className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-bold text-white">Two-Factor Authentication</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Enter the 6-digit code from your authenticator app to continue.
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <input
            type="text"
            autoFocus
            maxLength={6}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="000000"
            className="w-full rounded-xl border border-white/5 bg-white/5 py-4 text-center text-2xl font-mono tracking-[0.5em] text-white outline-none focus:border-indigo-500/50"
          />

          {error && (
            <div className="text-center text-xs text-red-400 bg-red-500/10 border border-red-500/20 py-2 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || token.length < 6}
            className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="mx-auto animate-spin" size={20} /> : (
              <span className="flex items-center justify-center gap-2">
                Verify Identity <ArrowRight size={16} />
              </span>
            )}
          </button>
        </form>

        <button
          onClick={() => router.push('/login')}
          className="mt-6 w-full text-xs text-zinc-500 hover:text-white transition-colors"
        >
          Cancel and go back
        </button>
      </motion.div>
    </div>
  )
}
