'use client'

import { useEffect, useState } from 'react'

interface Session {
  id: number
  outcome: 'win' | 'miss' | 'drop'
  fortune: string | null
  createdAt: string
  prize: { name: string } | null
}

export default function HistoryView() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/game/history')
      .then(r => r.json())
      .then(data => { setSessions(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-muted-foreground text-sm">Загрузка...</div>
    </div>
  )

  if (sessions.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <div className="text-3xl">🎰</div>
      <div className="text-muted-foreground text-sm">Ещё никто не играл</div>
    </div>
  )

  const icons = { win: '🏆', miss: '💨', drop: '😬' }
  const colors = { win: '#FFD700', miss: '#FF6B9D', drop: '#FF9E64' }

  return (
    <div className="flex flex-col h-full p-4 gap-3 overflow-y-auto">
      <h2 className="text-xl font-black gradient-text text-center">История игр</h2>
      <div className="flex flex-col gap-2">
        {sessions.map(s => (
          <div key={s.id} className="glass-panel neon-border rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-xl flex-shrink-0">{icons[s.outcome]}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold" style={{ color: colors[s.outcome] }}>
                {s.outcome === 'win' ? `Победа — ${s.prize?.name}` : s.outcome === 'drop' ? 'Уронил!' : 'Промах!'}
              </div>
              {s.fortune && (
                <div className="text-xs text-muted-foreground italic truncate">«{s.fortune}»</div>
              )}
            </div>
            <div className="text-xs text-muted-foreground flex-shrink-0">
              {new Date(s.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
