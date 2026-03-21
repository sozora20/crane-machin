'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) router.push('/admin')
    else { setError('Неверный пароль'); setLoading(false) }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4" style={{ background: '#0B0C16' }}>
      <div className="glass-panel neon-border rounded-2xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-black gradient-text text-center mb-6">Вход в админку</h1>
        <form onSubmit={login} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl text-[#C0CAF5] text-sm outline-none"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(187,154,247,0.2)' }}
          />
          {error && <p className="text-sm text-[#FF6B9D] text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-[#1A1B26] transition-opacity disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #BB9AF7, #7AA2F7)' }}
          >
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}
