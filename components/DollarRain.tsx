'use client'

import { useMemo } from 'react'

interface Bill {
  id: number
  left: number
  delay: number
  duration: number
  size: number
  rotate: number
  symbol: string
}

const SYMBOLS = ['💵', '💵', '💵', '💰', '💵', '💵', '$', '💵']

export default function DollarRain({ visible }: { visible: boolean }) {
  const bills = useMemo<Bill[]>(() =>
    Array.from({ length: 55 }, (_, i) => ({
      id: i,
      left: (i * 37 + 13) % 100,
      delay: (i * 0.13) % 2.5,
      duration: 1.8 + (i * 0.07) % 1.8,
      size: 18 + (i * 7) % 24,
      rotate: (i * 47) % 40 - 20,
      symbol: SYMBOLS[i % SYMBOLS.length],
    })),
  [])

  if (!visible) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
      <style>{`
        @keyframes dollar-fall {
          0%   { transform: translateY(-80px) rotate(var(--r)); opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateY(110vh) rotate(calc(var(--r) + 180deg)); opacity: 0; }
        }
        .dollar-bill {
          position: absolute;
          top: 0;
          animation: dollar-fall linear forwards;
          will-change: transform;
          filter: drop-shadow(0 2px 4px rgba(0,200,0,0.4));
        }
      `}</style>
      {bills.map(b => (
        <div
          key={b.id}
          className="dollar-bill"
          style={{
            left: `${b.left}%`,
            fontSize: `${b.size}px`,
            animationDelay: `${b.delay}s`,
            animationDuration: `${b.duration}s`,
            '--r': `${b.rotate}deg`,
          } as React.CSSProperties}
        >
          {b.symbol}
        </div>
      ))}
    </div>
  )
}
