'use client'

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const REWARDS = ['+1', '+1', '+2', '+1', '+2', '+3', '+5']

export default function BoostView() {
  const dayIdx = (() => {
    const d = new Date().getDay()
    return d === 0 ? 6 : d - 1
  })()

  return (
    <div className="h-full overflow-y-auto px-4 py-4 space-y-3">
      <div>
        <h2 className="text-lg font-black gradient-text">🚀 Буст-центр</h2>
        <p className="text-xs mt-0.5" style={{ color: '#565B7E' }}>Зарабатывай попытки для игры</p>
      </div>

      {/* Unlimited card */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(187,154,247,0.08)', border: '1px solid rgba(187,154,247,0.2)' }}>
        <div className="flex items-center gap-3">
          <div className="text-3xl">♾️</div>
          <div>
            <div className="font-bold text-sm" style={{ color: '#BB9AF7' }}>Безлимитный режим активен</div>
            <div className="text-xs mt-0.5" style={{ color: '#565B7E' }}>У тебя неограниченное количество попыток. Играй сколько хочешь!</div>
          </div>
        </div>
      </div>

      {/* Daily calendar */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(26,27,38,0.8)', border: '1px solid rgba(230,184,255,0.1)' }}>
        <div className="mb-3">
          <div className="font-bold text-sm" style={{ color: '#C0CAF5' }}>📅 Ежедневный календарь</div>
          <div className="text-xs mt-0.5" style={{ color: '#565B7E' }}>Заходи каждый день за бонусами</div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map((day, i) => {
            const isPast = i < dayIdx
            const isToday = i === dayIdx
            return (
              <div key={day} className="flex flex-col items-center gap-0.5 p-1.5 rounded-xl text-center" style={{
                background: isToday ? 'rgba(255,215,0,0.12)' : isPast ? 'rgba(187,154,247,0.08)' : 'rgba(255,255,255,0.03)',
                border: isToday ? '1px solid rgba(255,215,0,0.35)' : '1px solid transparent',
              }}>
                <span className="text-[9px]" style={{ color: '#565B7E' }}>{day}</span>
                <span className="text-sm">{isPast ? '✓' : isToday ? '🎁' : '·'}</span>
                <span className="text-[9px] font-bold" style={{ color: isToday ? '#FFD700' : isPast ? '#BB9AF7' : '#565B7E' }}>{REWARDS[i]}</span>
              </div>
            )
          })}
        </div>
        <button className="w-full mt-3 py-2.5 rounded-xl text-sm font-bold" style={{
          background: 'linear-gradient(135deg, #FFD700 0%, #FF9E64 100%)',
          color: '#1A1B26',
        }}>
          ✓ Получено сегодня
        </button>
      </div>

      {/* Invite friends */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(26,27,38,0.8)', border: '1px solid rgba(230,184,255,0.1)' }}>
        <div className="flex items-start gap-3">
          <div className="text-2xl">👫</div>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm" style={{ color: '#C0CAF5' }}>Пригласи друга</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(187,154,247,0.15)', color: '#BB9AF7' }}>+1 попытка</span>
            </div>
            <div className="text-xs mt-1" style={{ color: '#565B7E' }}>Получи +1 попытку за каждого друга, который сыграет хотя бы 1 игру</div>
            <button className="mt-2 w-full py-2 rounded-xl text-xs font-bold" style={{ border: '1px solid rgba(187,154,247,0.3)', color: '#BB9AF7', background: 'transparent' }}>
              🔗 Скопировать ссылку
            </button>
          </div>
        </div>
      </div>

      {/* Bonus attempt */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(26,27,38,0.8)', border: '1px solid rgba(230,184,255,0.1)' }}>
        <div className="flex items-start gap-3">
          <div className="text-2xl">🎲</div>
          <div>
            <div className="font-bold text-sm" style={{ color: '#C0CAF5' }}>Бонусная попытка</div>
            <div className="text-xs mt-1" style={{ color: '#565B7E' }}>Каждая игра даёт шанс 1% получить +1 дополнительную попытку (максимум раз в день). Просто играй!</div>
          </div>
        </div>
      </div>
    </div>
  )
}
