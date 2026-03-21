'use client'

import { useEffect, useState } from 'react'
import type { GameResult } from './ClawMachine'
import DollarRain from './DollarRain'
import { playWinSound } from '@/lib/winSound'

interface Props {
  result: GameResult | null
  visible: boolean
}

export default function GameResultOverlay({ result, visible }: Props) {
  const [animate, setAnimate] = useState(false)
  const [showDollars, setShowDollars] = useState(false)

  useEffect(() => {
    if (visible && result?.outcome === 'win') {
      setTimeout(() => setAnimate(true), 50)
      setShowDollars(true)
      playWinSound()
      setTimeout(() => setShowDollars(false), 4000)
    } else if (visible) {
      setTimeout(() => setAnimate(true), 50)
    } else {
      setAnimate(false)
      setShowDollars(false)
    }
  }, [visible, result?.outcome])

  const isWin = result?.outcome === 'win'
  const isDrop = result?.outcome === 'drop'

  return (
    <>
      <DollarRain visible={showDollars} />

      {visible && result && (
        <div
          className={`absolute inset-0 flex items-center justify-center z-20 transition-all duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: 'rgba(11,12,22,0.88)', backdropFilter: 'blur(10px)' }}
        >
          <div className={`text-center px-8 transition-transform duration-300 ${animate ? 'scale-100' : 'scale-75'}`}>
            {isWin ? (
              <>
                <div className="text-6xl mb-2" style={{ animation: 'winPulse 0.4s ease infinite alternate' }}>🏆</div>
                <div
                  className="text-4xl font-black gradient-text mb-3"
                  style={{ textShadow: '0 0 40px rgba(255,215,0,0.6)', letterSpacing: '0.05em' }}
                  data-testid="text-win"
                >
                  ПОБЕДА!
                </div>
                <div
                  className="text-xl font-black mb-2 px-5 py-2.5 rounded-2xl"
                  style={{ color: '#FFD700', background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.35)' }}
                  data-testid="text-prize"
                >
                  {result.prize?.name}
                </div>
                <div className="text-2xl mt-2">💵💵💵</div>
                <div className="mt-3 text-xs" style={{ color: '#565B7E' }}>
                  Приз зафиксирован в системе
                </div>
              </>
            ) : (
              <>
                <div className="text-5xl mb-3">{isDrop ? '😬' : '💨'}</div>
                <div
                  className="text-2xl font-black mb-3"
                  style={{ color: isDrop ? '#FF9E64' : '#FF6B9D' }}
                  data-testid="text-miss"
                >
                  {isDrop ? 'Уронил!' : 'Промах!'}
                </div>
                {result.fortune && (
                  <div
                    className="text-sm italic leading-relaxed px-4 py-3 rounded-xl"
                    style={{ color: '#C0CAF5', background: 'rgba(192,202,245,0.06)', border: '1px solid rgba(192,202,245,0.1)' }}
                    data-testid="text-fortune"
                  >
                    «{result.fortune}»
                  </div>
                )}
              </>
            )}
          </div>

          <style>{`
            @keyframes winPulse {
              from { transform: scale(1) rotate(-5deg); }
              to   { transform: scale(1.15) rotate(5deg); }
            }
          `}</style>
        </div>
      )}
    </>
  )
}
