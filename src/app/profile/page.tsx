'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { Shield, Key, QrCode, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const [mfaStep, setMfaStep] = useState<'idle' | 'setup' | 'verify'>('idle')
  const [qrCode, setQrCode] = useState('')
  const [mfaSecret, setMfaSecret] = useState('')
  const [token, setToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const startMfaSetup = async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/user/mfa/setup', { method: 'POST' })
      const data = await res.json()
      if (data.qrCode) {
        setQrCode(data.qrCode)
        setMfaSecret(data.secret)
        setMfaStep('setup')
      } else {
        setError(data.error || 'Failed to start MFA setup')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const verifyMfa = async () => {
    setIsLoading(true)
    setError('')
    try {
      const res = await fetch('/api/user/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, secret: mfaSecret })
      })
      const data = await res.json()
      if (data.success) {
        setSuccess('MFA enabled successfully')
        setMfaStep('idle')
        await update({ mfaEnabled: true })
      } else {
        setError(data.error || 'Invalid verification code')
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const disableMfa = async () => {
    if (!confirm('Are you sure you want to disable MFA? This will reduce your account security.')) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/user/mfa/disable', { method: 'POST' })
      if (res.ok) {
        setSuccess('MFA disabled')
        await update({ mfaEnabled: false })
      }
    } catch (err) {
      setError('Failed to disable MFA')
    } finally {
      setIsLoading(false)
    }
  }

  if (!session) return null

  return (
    <div className="flex-1 overflow-auto bg-[#09090b] p-8">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white">Security Settings</h1>
          <p className="text-zinc-500">Manage your account security and authentication methods.</p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass rounded-2xl border border-white/5 bg-zinc-900/50 p-6"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="h-16 w-16 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                <Shield className="text-blue-400" size={32} />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">{session.user?.name}</h2>
                <p className="text-sm text-zinc-500">{session.user?.email}</p>
                <div className="mt-1 inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-blue-400 border border-blue-500/20">
                  {session.user?.role}
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Key size={14} /> Account Type
                </div>
                <div className="text-sm text-white">
                  {session.user?.email?.includes('google.com') ? 'Google OAuth' : 'Local Credentials'}
                </div>
              </div>
            </div>
          </motion.div>

          {/* MFA Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl border border-white/5 bg-zinc-900/50 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30">
                  <QrCode className="text-indigo-400" size={20} />
                </div>
                <h3 className="font-semibold text-white">Multi-Factor Auth</h3>
              </div>
              <div className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider border ${
                session.user?.mfaEnabled 
                  ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                  : 'bg-zinc-500/10 text-zinc-500 border-white/5'
              }`}>
                {session.user?.mfaEnabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>

            <p className="text-sm text-zinc-400 mb-6">
              Add an extra layer of security to your account by requiring a 6-digit code from your authenticator app.
            </p>

            {mfaStep === 'idle' && (
              <button
                onClick={session.user?.mfaEnabled ? disableMfa : startMfaSetup}
                disabled={isLoading}
                className={`w-full rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-[0.98] ${
                  session.user?.mfaEnabled
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500'
                }`}
              >
                {isLoading ? <Loader2 className="mx-auto animate-spin" size={20} /> : (
                  session.user?.mfaEnabled ? 'Disable MFA' : 'Setup Authenticator'
                )}
              </button>
            )}

            {mfaStep === 'setup' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex justify-center p-2 bg-white rounded-lg">
                  {qrCode && <img src={qrCode} alt="MFA QR Code" className="w-40 h-40" />}
                </div>
                <p className="text-[11px] text-center text-zinc-500">
                  Scan this QR code with Google Authenticator or Authy.
                </p>
                <button
                  onClick={() => setMfaStep('verify')}
                  className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
                >
                  I've scanned it
                </button>
              </motion.div>
            )}

            {mfaStep === 'verify' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-zinc-500">6-Digit Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="000000"
                    className="w-full rounded-xl border border-white/5 bg-white/5 py-2.5 px-4 text-center text-lg font-mono tracking-widest text-white outline-none focus:border-indigo-500/50"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setMfaStep('setup')}
                    className="flex-1 rounded-xl border border-white/5 bg-white/5 py-2.5 text-sm font-medium text-white hover:bg-white/10"
                  >
                    Back
                  </button>
                  <button
                    onClick={verifyMfa}
                    disabled={isLoading || token.length < 6}
                    className="flex-[2] rounded-xl bg-green-600 py-2.5 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="mx-auto animate-spin" size={20} /> : 'Verify & Enable'}
                  </button>
                </div>
              </motion.div>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20">
                <AlertCircle size={14} /> {error}
              </div>
            )}
            {success && (
              <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-xs text-green-400 border border-green-500/20">
                <CheckCircle2 size={14} /> {success}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
