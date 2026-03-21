'use client'

import { useEffect, useState } from 'react'
import type { GameResult } from './ClawMachine'

interface Props {
  result: GameResult | null
  visible: boolean
}

export default function GameResultOverlay({ result, visible }: Props) {
  const [animate, setAnimate] = useState(false)
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string; angle: number }[]>([])

  useEffect(() => {
    if (visible && result?.outcome === 'win') {
      setTimeout(() => setAnimate(true), 50)
      // Generate confetti
      const colors = ['#BB9AF7', '#7AA2F7', '#FF6B9D', '#FFD700', '#9ECE6A', '#2AC3DE', '#FF9E64']
      setParticles(Array.from({ length: 30 }, (_, i) => ({
        id: i,
        x: 20 + Math.random() * 60,
        y: 10 + Math.random() * 40,
        color: colors[i % colors.length],
        angle: Math.random() * 360,
      })))
    } else if (visible) {
      setTimeout(() => setAnimate(true), 50)
    } else {
      setAnimate(false)
      setParticles([])
    }
  }, [visible, result?.outcome])

  if (!visible || !result) return null

  const isWin = result.outcome === 'win'
  const isDrop = result.outcome === 'drop'

  return (
    <div
      className={`absolute inset-0 flex items-center justify-center z-20 transition-all duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`}
      style={{ background: 'rgba(11,12,22,0.88)', backdropFilter: 'blur(10px)' }}
    >
      {/* Confetti for win */}
      {isWin && particles.map(p => (
        <div
          key={p.id}
          className="absolute w-2 h-2 rounded-sm"
          style={{
            left: `${p.x}%`, top: `${p.y}%`,
            background: p.color,
            transform: `rotate(${p.angle}deg)`,
            animation: `fall 2s ease-in forwards`,
            opacity: 0.9,
          }}
        />
      ))}

      <div className={`text-center px-8 transition-transform duration-400 ${animate ? 'scale-100' : 'scale-75'}`}>
        {isWin ? (
          <>
            <div className="text-6xl mb-3" style={{ animation: 'pulse 0.5s ease infinite alternate' }}>🎉</div>
            <div
              className="text-4xl font-black gradient-text mb-3"
              style={{ textShadow: '0 0 40px rgba(187,154,247,0.8)' }}
              data-testid="text-win"
            >
              ПОБЕДА!
            </div>
            <div
              className="text-xl font-black mb-2 px-4 py-2 rounded-2xl"
              style={{ color: '#FFD700', background: 'rgba(255,215,0,0.12)', border: '1px solid rgba(255,215,0,0.3)' }}
              data-testid="text-prize"
            >
              {result.prize?.name}
            </div>
            <div className="mt-3 text-xs px-2" style={{ color: '#565B7E' }}>
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
        @keyframes fall {
          0% { transform: rotate(var(--r, 0deg)) translateY(0); opacity: 1; }
          100% { transform: rotate(calc(var(--r, 0deg) + 720deg)) translateY(120px); opacity: 0; }
        }
      `}</style>
    </div>
  )
}
