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
  const [grabCount, setGrabCount] = useState(0)

  const handleGrab = useCallback(() => {
    if (isGrabbing) return
    setIsGrabbing(true)
    setResult(null)
    setShowResult(false)
    setGrabCount(c => c + 1)
  }, [isGrabbing])

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
      <header className="flex-shrink-0 px-4 pt-3 pb-2">
        <h1 className="text-xl font-black gradient-text text-center tracking-tight">🎰 Grab-a-Prize</h1>
      </header>

      {/* Content */}
      <main className="flex-1 relative overflow-hidden flex flex-col min-h-0">
        {view === 'game' ? (
          <>
            {/* Canvas area */}
            <div className="flex-1 relative min-h-0">
              <ClawMachine
                grabTrigger={grabCount}
                onResolveGrab={handleResolveGrab}
                isGrabbing={isGrabbing}
                result={result}
                onAnimationComplete={handleAnimationComplete}
              />
              <GameResultOverlay result={result} visible={showResult} />
            </div>

            {/* Grab button */}
            <div className="flex-shrink-0 px-6 py-3">
              <button
                onClick={handleGrab}
                disabled={isGrabbing}
                className="w-full py-4 rounded-2xl font-black text-lg tracking-widest uppercase transition-all duration-150 select-none"
                style={{
                  background: isGrabbing
                    ? 'rgba(187,154,247,0.15)'
                    : 'linear-gradient(135deg, #BB9AF7 0%, #7AA2F7 50%, #FF6B9D 100%)',
                  color: isGrabbing ? 'rgba(192,202,245,0.4)' : '#fff',
                  boxShadow: isGrabbing ? 'none' : '0 0 32px rgba(187,154,247,0.5), 0 4px 16px rgba(0,0,0,0.4)',
                  cursor: isGrabbing ? 'not-allowed' : 'pointer',
                }}
              >
                {isGrabbing ? '⏳ Хватаю...' : '🦾 ХВАТАЙ!'}
              </button>
            </div>
          </>
        ) : (
          <HistoryView />
        )}
      </main>

      {/* Bottom nav */}
      <BottomNav current={view} onChange={setView} />
    </div>
  )
}
