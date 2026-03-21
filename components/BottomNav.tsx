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
    <nav className="glass-panel border-t border-[rgba(230,184,255,0.1)] flex-shrink-0">
      <div className="flex items-center justify-around px-4 py-2">
        {TABS.map(tab => (
          <button
            key={tab.view}
            onClick={() => onChange(tab.view)}
            className={`flex flex-col items-center gap-0.5 px-6 py-1.5 rounded-xl transition-all ${
              current === tab.view
                ? 'text-[#BB9AF7]'
                : 'text-muted-foreground hover:text-[#C0CAF5]'
            }`}
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="text-[10px] font-semibold">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
