'use client'

import { useEffect, useState } from 'react'
import type { GameResult } from './ClawMachine'
import DollarRain from './DollarRain'
import { playWinSound } from '@/lib/winSound'
import { playLoseSound } from '@/lib/loseSound'

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
    } else if (visible && (result?.outcome === 'miss' || result?.outcome === 'drop')) {
      setTimeout(() => setAnimate(true), 50)
      playLoseSound()
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
          className={`absolute inset-0 flex items-center justify-center z-20 transition-all duration-250 ${animate ? 'opacity-100' : 'opacity-0'}`}
          style={{ background: 'rgba(20,20,24,0.92)', backdropFilter: 'blur(20px)' }}
        >
          <div className={`text-center px-8 transition-transform duration-250 ${animate ? 'scale-100' : 'scale-90'}`}>
            {isWin ? (
              <>
                <div className="text-5xl mb-3" style={{ animation: 'winPulse 0.5s ease infinite alternate' }}>🏆</div>
                <div
                  className="text-3xl font-bold mb-3 tracking-widest uppercase"
                  style={{ color: '#FFD700' }}
                  data-testid="text-win"
                >
                  Победа
                </div>
                <div
                  className="text-base font-semibold mb-3 px-5 py-2.5 rounded-2xl"
                  style={{ color: '#FFD700', background: 'rgba(255,215,0,0.1)', border: '1px solid rgba(255,215,0,0.25)' }}
                  data-testid="text-prize"
                >
                  {result.prize?.name}
                </div>
                <div className="text-xl mt-1">💵💵💵</div>
                <div className="mt-3 text-xs tracking-wide uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  Приз зафиксирован
                </div>
              </>
            ) : (
              <>
                <div className="text-4xl mb-3">{isDrop ? '😬' : '💨'}</div>
                <div
                  className="text-2xl font-bold mb-3 tracking-widest uppercase"
                  style={{ color: isDrop ? '#ff7a45' : '#ff2c3d' }}
                  data-testid="text-miss"
                >
                  {isDrop ? 'Уронил!' : 'Промах!'}
                </div>
                {result.fortune && (
                  <div
                    className="text-sm italic leading-relaxed px-4 py-3 rounded-xl"
                    style={{ color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
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
              to   { transform: scale(1.12) rotate(5deg); }
            }
          `}</style>
        </div>
      )}
    </>
  )
}
