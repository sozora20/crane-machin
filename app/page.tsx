'use client'

import { useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import BottomNav from '@/components/BottomNav'
import HistoryView from '@/components/HistoryView'
import type { GameResult } from '@/components/ClawMachine'
import GameResultOverlay from '@/components/GameResult'

const ClawMachine = dynamic(() => import('@/components/ClawMachine'), { ssr: false })

type View = 'game' | 'history'

export default function Home() {
  const [view, setView] = useState<View>('game')
  const [isGrabbing, setIsGrabbing] = useState(false)
  const [result, setResult] = useState<GameResult | null>(null)
  const [showResult, setShowResult] = useState(false)
  const posRef = useRef(0.5)

  const handleGrab = useCallback((clawPosition: number) => {
    posRef.current = clawPosition
    setIsGrabbing(true)
    setResult(null)
    setShowResult(false)
  }, [])

  const handleResolveGrab = useCallback(async (position: number, caught: boolean) => {
    try {
      const res = await fetch('/api/game/play', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clawPosition: position, caught }),
      })
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ outcome: 'miss', fortune: 'Что-то пошло не так...' })
    }
  }, [])

  const handleAnimationComplete = useCallback(() => {
    setIsGrabbing(false)
    setShowResult(true)
    setTimeout(() => setShowResult(false), 3000)
  }, [])

  return (
    <div className="flex flex-col h-dvh max-w-md mx-auto" style={{ background: '#1A1B26' }}>
      {/* Header */}
      <header className="glass-panel border-b border-[rgba(230,184,255,0.1)] px-4 py-3 flex-shrink-0">
        <h1 className="text-lg font-black gradient-text text-center">🎰 Grab-a-Prize</h1>
      </header>

      {/* Content */}
      <main className="flex-1 relative overflow-hidden">
        {view === 'game' ? (
          <div className="absolute inset-0">
            <ClawMachine
              onGrab={handleGrab}
              onResolveGrab={handleResolveGrab}
              isGrabbing={isGrabbing}
              result={result}
              onAnimationComplete={handleAnimationComplete}
              disabled={isGrabbing}
            />
            <GameResultOverlay result={result} visible={showResult} />
          </div>
        ) : (
          <HistoryView />
        )}
      </main>

      {/* Bottom nav */}
      <BottomNav current={view} onChange={setView} />
    </div>
  )
}
