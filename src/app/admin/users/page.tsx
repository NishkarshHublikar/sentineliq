'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, UserPlus, Search, Edit2, Trash2, 
  Shield, ShieldAlert, Loader2, X, Check,
  AlertCircle
} from 'lucide-react'
import { useSession } from 'next-auth/react'

interface User {
  _id: string
  name: string
  email: string
  role: 'admin' | 'officer'
  mfaEnabled: boolean
  createdAt: string
}

export default function AdminUsersPage() {
  const { data: session } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'officer' as 'admin' | 'officer'
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users')
      const data = await res.json()
      setUsers(data)
    } catch (err) {
      console.error('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const method = editingUser ? 'PATCH' : 'POST'
    const url = editingUser ? `/api/admin/users/${editingUser._id}` : '/api/admin/users'

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong')
      } else {
        setIsModalOpen(false)
        setEditingUser(null)
        setFormData({ name: '', email: '', password: '', role: 'officer' })
        fetchUsers()
      }
    } catch (err) {
      setError('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (id === session?.user?.id) {
      alert('You cannot delete your own administrative account.')
      return
    }
    if (!confirm('Are you sure you want to remove this user? This action cannot be undone.')) return

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      if (res.ok) fetchUsers()
      else {
        const data = await res.json()
        alert(data.error || 'Failed to delete user')
      }
    } catch (err) {
      alert('An error occurred')
    }
  }

  const openEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Password not required for edit
      role: user.role
    })
    setIsModalOpen(true)
  }

  return (
    <div className="flex-1 overflow-auto bg-[#09090b] p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="text-blue-500" /> User Management
            </h1>
            <p className="text-zinc-500">Control system access and manage personnel profiles.</p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => {
              setEditingUser(null)
              setFormData({ name: '', email: '', password: '', role: 'officer' })
              setIsModalOpen(true)
            }}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-500 active:scale-95"
          >
            <UserPlus size={18} /> Add New User
          </motion.button>
        </div>

        {/* Filters */}
        <div className="mb-6 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-xl border border-white/5 bg-zinc-900/50 py-2.5 pl-10 pr-4 text-sm text-white outline-none focus:border-blue-500/50"
          />
        </div>

        {/* Users Table */}
        <div className="glass overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/30 backdrop-blur-xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Name / Email</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Role</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500">Security</th>
                <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-zinc-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <Loader2 className="mx-auto animate-spin text-blue-500" size={32} />
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-zinc-500">
                    No users found matching your search.
                  </td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user._id} className="group hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-white">{user.name}</div>
                    <div className="text-xs text-zinc-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${
                      user.role === 'admin' 
                        ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' 
                        : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                    }`}>
                      {user.role === 'admin' ? <ShieldAlert size={10} /> : <Shield size={10} />}
                      {user.role}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs">
                      {user.mfaEnabled ? (
                        <span className="flex items-center gap-1 text-green-500">
                          <Check size={12} /> MFA Active
                        </span>
                      ) : (
                        <span className="text-zinc-600 italic">MFA Disabled</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEdit(user)}
                        className="rounded-lg bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-all"
                        title="Edit User"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button 
                        onClick={() => handleDelete(user._id)}
                        className="rounded-lg bg-red-500/10 p-2 text-red-500 hover:bg-red-500/20 transition-all"
                        title="Delete User"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass relative w-full max-w-lg overflow-hidden rounded-3xl border border-white/5 bg-zinc-900 p-8 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingUser ? 'Edit Personnel Profile' : 'Register New Personnel'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-full p-2 text-zinc-500 hover:bg-white/5 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-zinc-400 ml-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-xl border border-white/5 bg-white/5 py-2.5 px-4 text-sm text-white outline-none focus:border-blue-500/50"
                    placeholder="Officer Name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-zinc-400 ml-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full rounded-xl border border-white/5 bg-white/5 py-2.5 px-4 text-sm text-white outline-none focus:border-blue-500/50"
                    placeholder="name@sentineliq.gov"
                  />
                </div>

                {!editingUser && (
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-medium text-zinc-400 ml-1">Temporary Password</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full rounded-xl border border-white/5 bg-white/5 py-2.5 px-4 text-sm text-white outline-none focus:border-blue-500/50"
                      placeholder="••••••••"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[12px] font-medium text-zinc-400 ml-1">Access Role</label>
                  <div className="flex gap-2">
                    {(['officer', 'admin'] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setFormData({ ...formData, role: r })}
                        className={`flex-1 rounded-xl border py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                          formData.role === r 
                            ? 'border-blue-500 bg-blue-500/10 text-blue-400' 
                            : 'border-white/5 bg-white/5 text-zinc-500 hover:bg-white/10'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-lg bg-red-500/10 p-3 text-xs text-red-400 border border-red-500/20">
                    <AlertCircle size={14} /> {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-6 w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50 active:scale-95"
                >
                  {isSubmitting ? <Loader2 className="mx-auto animate-spin" size={20} /> : (
                    editingUser ? 'Save Changes' : 'Create Account'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
