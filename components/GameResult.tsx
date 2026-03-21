'use client'

import { useEffect, useState } from 'react'
import type { GameResult } from './ClawMachine'

interface Props {
  result: GameResult | null
  visible: boolean
}

export default function GameResultOverlay({ result, visible }: Props) {
  const [animate, setAnimate] = useState(false)

  useEffect(() => {
    if (visible) setTimeout(() => setAnimate(true), 50)
    else setAnimate(false)
  }, [visible])

  if (!visible || !result) return null

  const isWin = result.outcome === 'win'
  const isDrop = result.outcome === 'drop'

  return (
    <div className={`absolute inset-0 flex items-center justify-center z-20 transition-all duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: 'rgba(11,12,22,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className={`text-center px-6 transition-transform duration-300 ${animate ? 'scale-100' : 'scale-90'}`}>
        {isWin ? (
          <>
            <div className="text-4xl mb-2" style={{ animation: 'bounce 0.6s ease 2' }}>🎉</div>
            <div className="text-3xl font-black gradient-text mb-2" data-testid="text-win">ПОБЕДА!</div>
            <div className="text-[#FFD700] text-lg font-bold leading-snug" data-testid="text-prize">
              {result.prize?.name}
            </div>
            <div className="mt-3 text-xs text-muted-foreground px-2 leading-relaxed">
              Ваш приз зафиксирован в системе
            </div>
          </>
        ) : (
          <>
            <div className="text-4xl mb-2">{isDrop ? '😬' : '💨'}</div>
            <div className="text-xl font-bold mb-2" style={{ color: isDrop ? '#FF9E64' : '#FF6B9D' }}
              data-testid="text-miss">
              {isDrop ? 'Уронил!' : 'Промах!'}
            </div>
            {result.fortune && (
              <div className="text-sm text-[#C0CAF5] italic leading-relaxed" data-testid="text-fortune">
                «{result.fortune}»
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
