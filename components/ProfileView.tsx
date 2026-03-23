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

const card = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
}

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
    <div className="h-full overflow-y-auto px-4 py-5 space-y-3">
      {/* Avatar + name */}
      <div className="rounded-2xl p-4 flex items-center gap-4" style={card}>
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #ff2c3d 0%, #167fff 100%)' }}
        >
          👤
        </div>
        <div>
          <div className="font-semibold text-base" style={{ color: '#ffffff' }}>Игрок</div>
          <div
            className="mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-widest uppercase inline-block"
            style={{ background: 'rgba(255,44,61,0.15)', color: '#ff2c3d', border: '1px solid rgba(255,44,61,0.25)' }}
          >
            {title.current}
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Игр', value: stats.games },
          { label: 'Побед', value: stats.wins },
          { label: 'Win%', value: `${winPct}%` },
          { label: 'Серия', value: stats.streak },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-xl p-2.5 text-center" style={card}>
            <div className="text-xl font-bold" style={{ color: '#ffffff' }}>{value}</div>
            <div className="text-[9px] mt-0.5 uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Attempts */}
      <div className="rounded-2xl p-4 flex items-center justify-between" style={card}>
        <div>
          <div className="font-semibold text-sm" style={{ color: '#ffffff' }}>Доступно попыток</div>
          <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Обновляется в 00:00 МСК</div>
        </div>
        <div className="text-4xl font-bold" style={{ color: '#ff2c3d' }}>∞</div>
      </div>

      {/* Title progress */}
      {title.next && (
        <div className="rounded-2xl p-4" style={card}>
          <div className="flex items-center justify-between mb-2.5">
            <div className="text-xs font-semibold tracking-wide uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>До следующего уровня</div>
            <div className="text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide uppercase" style={{ background: 'rgba(22,127,255,0.15)', color: '#167fff' }}>
              {title.next}
            </div>
          </div>
          <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <div className="h-1.5 rounded-full transition-all duration-500" style={{
              width: `${Math.min(title.progress * 100, 100)}%`,
              background: 'linear-gradient(90deg, #ff2c3d, #167fff)',
            }} />
          </div>
          <div className="text-xs mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>
            {stats.games} / {title.nextAt} игр
          </div>
        </div>
      )}

      {/* Titles list */}
      <div className="rounded-2xl p-4" style={card}>
        <div className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'rgba(255,255,255,0.5)' }}>Уровни</div>
        <div className="space-y-1">
          {TITLES.map((t, i) => {
            const isCurrent = t === title.current
            const isUnlocked = stats.games >= THRESHOLDS[i]
            return (
              <div key={t} className="flex items-center justify-between rounded-xl px-3 py-2" style={{
                background: isCurrent ? 'rgba(255,44,61,0.12)' : 'transparent',
                borderLeft: isCurrent ? '2px solid #ff2c3d' : '2px solid transparent',
              }}>
                <span className="text-sm font-medium" style={{ color: isCurrent ? '#ffffff' : isUnlocked ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)' }}>{t}</span>
                <span className="text-[10px] uppercase tracking-wide" style={{ color: isCurrent ? '#ff2c3d' : 'rgba(255,255,255,0.25)' }}>
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
