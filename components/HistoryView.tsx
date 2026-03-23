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
      <div className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Загрузка...</div>
    </div>
  )

  if (sessions.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <div className="text-4xl opacity-40">🎰</div>
      <div className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>Ещё никто не играл</div>
    </div>
  )

  const icons = { win: '🏆', miss: '💨', drop: '😬' }
  const colors = { win: '#FFD700', miss: '#ff2c3d', drop: '#ff7a45' }

  return (
    <div className="flex flex-col h-full px-4 py-5 gap-3 overflow-y-auto">
      <div className="text-xs font-semibold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>
        История игр
      </div>
      <div className="flex flex-col gap-2">
        {sessions.map(s => (
          <div
            key={s.id}
            className="rounded-xl px-4 py-3 flex items-center gap-3"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <span className="text-lg flex-shrink-0">{icons[s.outcome]}</span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium" style={{ color: colors[s.outcome] }}>
                {s.outcome === 'win' ? `Победа — ${s.prize?.name}` : s.outcome === 'drop' ? 'Уронил!' : 'Промах!'}
              </div>
              {s.fortune && (
                <div className="text-xs mt-0.5 italic truncate" style={{ color: 'rgba(255,255,255,0.35)' }}>«{s.fortune}»</div>
              )}
            </div>
            <div className="text-[10px] flex-shrink-0 tabular-nums" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {new Date(s.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
