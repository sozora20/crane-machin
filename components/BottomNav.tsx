'use client'

type View = 'game' | 'boost' | 'history' | 'profile'

const TABS: { view: View; label: string; icon: string }[] = [
  { view: 'game', label: 'Игра', icon: '🎮' },
  { view: 'boost', label: 'Буст', icon: '🚀' },
  { view: 'history', label: 'История', icon: '📋' },
  { view: 'profile', label: 'Профиль', icon: '👤' },
]

export default function BottomNav({ current, onChange }: { current: View; onChange: (v: View) => void }) {
  return (
    <nav
      className="flex-shrink-0 border-t"
      style={{ borderColor: 'rgba(255,44,61,0.1)', background: 'rgba(20,20,24,0.98)', backdropFilter: 'blur(20px)' }}
    >
      <div className="flex items-center">
        {TABS.map(tab => {
          const active = current === tab.view
          return (
            <button
              key={tab.view}
              onClick={() => onChange(tab.view)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2.5 relative transition-all duration-200"
              style={{ color: active ? '#ff2c3d' : 'rgba(225,225,225,0.35)' }}
            >
              {active && (
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #ff2c3d, #167fff)' }}
                />
              )}
              <span className="text-xl">{tab.icon}</span>
              <span className="text-[10px] font-semibold tracking-wide uppercase">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
