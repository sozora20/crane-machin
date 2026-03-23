'use client'

import { useState } from 'react'

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const REWARDS = ['+1', '+1', '+2', '+1', '+2', '+3', '+5']

const card = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
}

export default function BoostView() {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    const url = typeof window !== 'undefined' ? window.location.href : ''
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }
  const dayIdx = (() => {
    const d = new Date().getDay()
    return d === 0 ? 6 : d - 1
  })()

  return (
    <div className="h-full overflow-y-auto px-4 py-5 space-y-3">
      <div className="mb-1">
        <h2 className="text-sm font-semibold tracking-widest uppercase" style={{ color: '#ff2c3d' }}>Буст-центр</h2>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Зарабатывай попытки для игры</p>
      </div>

      {/* Unlimited card */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,44,61,0.08)', border: '1px solid rgba(255,44,61,0.2)' }}>
        <div className="flex items-center gap-3">
          <div className="text-2xl">♾️</div>
          <div>
            <div className="font-semibold text-sm" style={{ color: '#ff2c3d' }}>Безлимитный режим активен</div>
            <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Неограниченное количество попыток — играй сколько хочешь</div>
          </div>
        </div>
      </div>

      {/* Daily calendar */}
      <div className="rounded-2xl p-4" style={card}>
        <div className="mb-3">
          <div className="font-semibold text-sm" style={{ color: '#ffffff' }}>Ежедневный календарь</div>
          <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>Заходи каждый день за бонусами</div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map((day, i) => {
            const isPast = i < dayIdx
            const isToday = i === dayIdx
            return (
              <div key={day} className="flex flex-col items-center gap-0.5 p-1.5 rounded-xl text-center" style={{
                background: isToday ? 'rgba(255,44,61,0.12)' : isPast ? 'rgba(22,127,255,0.08)' : 'rgba(255,255,255,0.03)',
                border: isToday ? '1px solid rgba(255,44,61,0.4)' : '1px solid transparent',
              }}>
                <span className="text-[9px] uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.35)' }}>{day}</span>
                <span className="text-sm">{isPast ? '✓' : isToday ? '🎁' : '·'}</span>
                <span className="text-[9px] font-bold" style={{ color: isToday ? '#ff2c3d' : isPast ? '#167fff' : 'rgba(255,255,255,0.3)' }}>{REWARDS[i]}</span>
              </div>
            )
          })}
        </div>
        <button className="w-full mt-3 py-2.5 rounded-xl text-xs font-semibold tracking-wider uppercase" style={{
          background: 'linear-gradient(135deg, #ff2c3d 0%, #167fff 100%)',
          color: '#ffffff',
        }}>
          ✓ Получено сегодня
        </button>
      </div>

      {/* Invite friends */}
      <div className="rounded-2xl p-4" style={card}>
        <div className="flex items-start gap-3">
          <div className="text-xl flex-shrink-0 mt-0.5">👫</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm" style={{ color: '#ffffff' }}>Пригласи друга</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold tracking-wide" style={{ background: 'rgba(255,44,61,0.15)', color: '#ff2c3d' }}>+1 ПОПЫТКА</span>
            </div>
            <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Получи +1 попытку за каждого друга, который сыграет хотя бы 1 игру</div>
            <button onClick={handleCopy} className="mt-2.5 w-full py-2 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all" style={{
              border: '1px solid rgba(255,44,61,0.3)',
              color: copied ? '#167fff' : '#ff2c3d',
              background: copied ? 'rgba(22,127,255,0.08)' : 'transparent',
            }}>
              {copied ? '✓ Скопировано!' : '🔗 Скопировать ссылку'}
            </button>
          </div>
        </div>
      </div>

      {/* Bonus attempt */}
      <div className="rounded-2xl p-4" style={card}>
        <div className="flex items-start gap-3">
          <div className="text-xl flex-shrink-0 mt-0.5">🎲</div>
          <div>
            <div className="font-semibold text-sm" style={{ color: '#ffffff' }}>Бонусная попытка</div>
            <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Каждая игра даёт шанс 1% получить +1 дополнительную попытку. Просто играй!</div>
          </div>
        </div>
      </div>
    </div>
  )
}
