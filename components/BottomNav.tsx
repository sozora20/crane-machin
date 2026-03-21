'use client'

type View = 'game' | 'history'

interface Props {
  current: View
  onChange: (v: View) => void
}

const TABS: { view: View; label: string; icon: string }[] = [
  { view: 'game', label: 'Игра', icon: '🎮' },
  { view: 'history', label: 'История', icon: '📋' },
]

export default function BottomNav({ current, onChange }: Props) {
  return (
    <nav className="flex-shrink-0 border-t" style={{ borderColor: 'rgba(187,154,247,0.12)', background: 'rgba(17,18,32,0.95)', backdropFilter: 'blur(16px)' }}>
      <div className="flex items-center">
        {TABS.map(tab => {
          const active = current === tab.view
          return (
            <button
              key={tab.view}
              onClick={() => onChange(tab.view)}
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-all duration-200 relative"
              style={{ color: active ? '#BB9AF7' : 'rgba(192,202,245,0.45)' }}
            >
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #BB9AF7, #7AA2F7)' }} />
              )}
              <span className="text-2xl">{tab.icon}</span>
              <span className="text-xs font-semibold">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
