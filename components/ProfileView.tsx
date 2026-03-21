'use client'

import { useState, useEffect } from 'react'

const TITLES = ['Новичок', 'Ученик', 'Коллекционер', 'Охотник', 'Эксперт', 'Мастер', 'Чемпион', 'Легенда', 'Мифический', 'Вечный']
const THRESHOLDS = [0, 1, 5, 15, 30, 50, 100, 200, 300, 500]

function getTitle(games: number) {
  let idx = 0
  for (let i = THRESHOLDS.length - 1; i >= 0; i--) {
    if (games >= THRESHOLDS[i]) { idx = i; break }
  }
  return {
    current: TITLES[idx],
    next: idx < TITLES.length - 1 ? TITLES[idx + 1] : null,
    progress: idx < TITLES.length - 1 ? (games - THRESHOLDS[idx]) / (THRESHOLDS[idx + 1] - THRESHOLDS[idx]) : 1,
    nextAt: idx < TITLES.length - 1 ? THRESHOLDS[idx + 1] : null,
  }
}

interface Stats { games: number; wins: number; streak: number; lastDate: string }

export default function ProfileView() {
  const [stats, setStats] = useState<Stats>({ games: 0, wins: 0, streak: 0, lastDate: '' })

  useEffect(() => {
    try {
      const saved = localStorage.getItem('crane_stats')
      if (saved) setStats(JSON.parse(saved))
    } catch {}
  }, [])

  const winPct = stats.games > 0 ? Math.round(stats.wins / stats.games * 100) : 0
  const title = getTitle(stats.games)

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-3">
      {/* Avatar + name */}
      <div className="rounded-2xl p-4 flex items-center gap-4" style={{ background: 'rgba(26,27,38,0.8)', border: '1px solid rgba(230,184,255,0.1)' }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl flex-shrink-0" style={{ background: 'linear-gradient(135deg, #BB9AF7, #7AA2F7)' }}>
          👤
        </div>
        <div>
          <div className="font-black text-lg" style={{ color: '#C0CAF5' }}>Игрок</div>
          <div className="mt-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold inline-block" style={{ background: 'rgba(230,184,255,0.15)', color: '#E6B8FF' }}>
            {title.current}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Игр', value: stats.games },
          { label: 'Побед', value: stats.wins },
          { label: 'Процент', value: `${winPct}%` },
          { label: 'Серия', value: stats.streak },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl p-2.5 text-center" style={{ background: 'rgba(26,27,38,0.8)', border: '1px solid rgba(230,184,255,0.08)' }}>
            <div className="text-xl font-black" style={{ color: '#C0CAF5' }}>{value}</div>
            <div className="text-[9px] mt-0.5" style={{ color: '#565B7E' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Attempts */}
      <div className="rounded-2xl p-4 flex items-center justify-between" style={{ background: 'rgba(26,27,38,0.8)', border: '1px solid rgba(230,184,255,0.1)' }}>
        <div>
          <div className="font-bold text-sm" style={{ color: '#C0CAF5' }}>Доступно попыток</div>
          <div className="text-xs mt-0.5" style={{ color: '#565B7E' }}>Обновляется в 00:00 МСК</div>
        </div>
        <div className="text-4xl font-black" style={{ color: '#BB9AF7' }}>∞</div>
      </div>

      {/* Title progress */}
      {title.next && (
        <div className="rounded-2xl p-4" style={{ background: 'rgba(26,27,38,0.8)', border: '1px solid rgba(230,184,255,0.1)' }}>
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold" style={{ color: '#C0CAF5' }}>Прогресс до следующего титула</div>
            <div className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(230,184,255,0.1)', color: '#E6B8FF' }}>
              {title.next}
            </div>
          </div>
          <div className="w-full h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
            <div className="h-2 rounded-full transition-all duration-500" style={{
              width: `${Math.min(title.progress * 100, 100)}%`,
              background: 'linear-gradient(90deg, #BB9AF7, #7AA2F7)',
            }} />
          </div>
          <div className="text-xs mt-1.5" style={{ color: '#565B7E' }}>
            {stats.games} / {title.nextAt} игр
          </div>
        </div>
      )}

      {/* Titles list */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(26,27,38,0.8)', border: '1px solid rgba(230,184,255,0.1)' }}>
        <div className="text-sm font-bold mb-3" style={{ color: '#C0CAF5' }}>🏆 Титулы</div>
        <div className="space-y-1.5">
          {TITLES.map((t, i) => {
            const isCurrent = t === title.current
            const isUnlocked = stats.games >= THRESHOLDS[i]
            return (
              <div key={t} className="flex items-center justify-between rounded-xl px-3 py-2" style={{
                background: isCurrent ? 'rgba(230,184,255,0.15)' : isUnlocked ? 'rgba(187,154,247,0.06)' : 'rgba(255,255,255,0.02)',
              }}>
                <span className="text-sm font-semibold" style={{ color: isCurrent ? '#E6B8FF' : isUnlocked ? '#C0CAF5' : '#565B7E' }}>{t}</span>
                <span className="text-xs" style={{ color: isCurrent ? '#E6B8FF' : '#565B7E' }}>
                  {THRESHOLDS[i] === 0 ? 'старт' : `${THRESHOLDS[i]} игр`}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
