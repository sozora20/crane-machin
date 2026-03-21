'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Prize {
  id: number; name: string; winProbability: number; isActive: boolean; totalGiven: number
}
interface Stats { total: number; wins: number; prizesGiven: number }

export default function AdminPage() {
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [newName, setNewName] = useState('')
  const [newProb, setNewProb] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const load = async () => {
    const [p, s] = await Promise.all([
      fetch('/api/admin/prizes').then(r => r.json()),
      fetch('/api/admin/stats').then(r => r.json()),
    ])
    setPrizes(p); setStats(s)
  }

  useEffect(() => { load() }, [])

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const createPrize = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    await fetch('/api/admin/prizes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, winProbability: parseFloat(newProb) }),
    })
    setNewName(''); setNewProb(''); setSaving(false); load()
  }

  const togglePrize = async (prize: Prize) => {
    await fetch(`/api/admin/prizes/${prize.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...prize, isActive: !prize.isActive }),
    })
    load()
  }

  const deletePrize = async (id: number) => {
    await fetch(`/api/admin/prizes/${id}`, { method: 'DELETE' })
    load()
  }

  return (
    <div className="min-h-dvh p-4" style={{ background: '#0B0C16' }}>
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-black gradient-text">Админ-панель</h1>
          <button onClick={logout} className="text-sm text-muted-foreground hover:text-[#FF6B9D] transition-colors">
            Выйти
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Всего игр', value: stats.total },
              { label: 'Побед', value: stats.wins },
              { label: 'Призов выдано', value: stats.prizesGiven },
            ].map(s => (
              <div key={s.label} className="glass-panel neon-border rounded-xl p-4 text-center">
                <div className="text-2xl font-black text-[#FFD700]">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Add prize */}
        <div className="glass-panel neon-border rounded-2xl p-4">
          <h2 className="text-sm font-bold text-[#C0CAF5] mb-3">Добавить приз</h2>
          <form onSubmit={createPrize} className="flex gap-2">
            <input value={newName} onChange={e => setNewName(e.target.value)}
              placeholder="Название" required
              className="flex-1 px-3 py-2 rounded-xl text-[#C0CAF5] text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(187,154,247,0.2)' }} />
            <input value={newProb} onChange={e => setNewProb(e.target.value)}
              placeholder="0.10" type="number" step="0.01" min="0" max="1" required
              className="w-24 px-3 py-2 rounded-xl text-[#C0CAF5] text-sm outline-none"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(187,154,247,0.2)' }} />
            <button type="submit" disabled={saving}
              className="px-4 py-2 rounded-xl font-bold text-[#1A1B26] text-sm disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #BB9AF7, #7AA2F7)' }}>
              {saving ? '...' : 'Создать'}
            </button>
          </form>
        </div>

        {/* Prizes list */}
        <div className="flex flex-col gap-2">
          {prizes.map(p => (
            <div key={p.id} className="glass-panel neon-border rounded-xl px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-semibold ${p.isActive ? 'text-[#C0CAF5]' : 'text-muted-foreground line-through'}`}>
                  {p.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  Вероятность: {(p.winProbability * 100).toFixed(0)}% · Выдано: {p.totalGiven}
                </div>
              </div>
              <button onClick={() => togglePrize(p)}
                className="text-xs px-3 py-1 rounded-lg transition-all"
                style={{ background: p.isActive ? 'rgba(158,206,106,0.15)' : 'rgba(255,255,255,0.05)', color: p.isActive ? '#9ECE6A' : '#565B7E' }}>
                {p.isActive ? 'Вкл' : 'Выкл'}
              </button>
              <button onClick={() => deletePrize(p.id)}
                className="text-xs px-3 py-1 rounded-lg transition-all"
                style={{ background: 'rgba(247,118,142,0.15)', color: '#F7768E' }}>
                Удалить
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
