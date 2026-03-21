'use client'

import { useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import BottomNav from '@/components/BottomNav'
import HistoryView from '@/components/HistoryView'
import BoostView from '@/components/BoostView'
import ProfileView from '@/components/ProfileView'
import AmbientMusic from '@/components/AmbientMusic'
import type { GameResult } from '@/components/ClawMachine'
import GameResultOverlay from '@/components/GameResult'

const ClawMachine = dynamic(() => import('@/components/ClawMachine'), { ssr: false })

type View = 'game' | 'boost' | 'history' | 'profile'

function updateLocalStats(outcome: 'win' | 'miss' | 'drop') {
  try {
    const saved = localStorage.getItem('crane_stats')
    const stats = saved ? JSON.parse(saved) : { games: 0, wins: 0, streak: 0, lastDate: '' }
    const today = new Date().toDateString()
    stats.games = (stats.games || 0) + 1
    if (outcome === 'win') stats.wins = (stats.wins || 0) + 1
    if (stats.lastDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toDateString()
      stats.streak = stats.lastDate === yesterday ? (stats.streak || 0) + 1 : 1
      stats.lastDate = today
    }
    localStorage.setItem('crane_stats', JSON.stringify(stats))
  } catch {}
}

export default function Home() {
  const [view, setView] = useState<View>('game')
  const [isGrabbing, setIsGrabbing] = useState(false)
  const [result, setResult] = useState<GameResult | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [grabCount, setGrabCount] = useState(0)
  const [moveDir, setMoveDir] = useState<'left' | 'right' | null>(null)
  const resultRef = useRef<GameResult | null>(null)

  const handleGrab = useCallback(() => {
    if (isGrabbing) return
    setIsGrabbing(true)
    setResult(null)
    setShowResult(false)
    resultRef.current = null
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
      resultRef.current = data
    } catch {
      const fallback: GameResult = { outcome: 'miss', fortune: 'Что-то пошло не так...' }
      setResult(fallback)
      resultRef.current = fallback
    }
  }, [])

  const handleAnimationComplete = useCallback(() => {
    setIsGrabbing(false)
    setShowResult(true)
    if (resultRef.current) updateLocalStats(resultRef.current.outcome)
    setTimeout(() => setShowResult(false), 2500)
  }, [])

  const startMove = useCallback((dir: 'left' | 'right') => {
    if (!isGrabbing) setMoveDir(dir)
  }, [isGrabbing])

  const stopMove = useCallback(() => setMoveDir(null), [])

  return (
    <div className="game-root">
      {/* Header */}
      <header className="game-header">
        <h1 className="gradient-text font-black text-base sm:text-lg tracking-tight">🎰 Grab-a-Prize</h1>
        <div className="flex items-center gap-2">
          <AmbientMusic />
          <div className="attempts-badge">
            <span>♾️</span>
            <span className="hidden xs:inline">попыток</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="game-main">
        {view === 'game' ? (
          <>
            {/* Canvas */}
            <div className="game-canvas-area">
              <ClawMachine
                grabTrigger={grabCount}
                moveDirection={moveDir}
                onResolveGrab={handleResolveGrab}
                isGrabbing={isGrabbing}
                result={result}
                onAnimationComplete={handleAnimationComplete}
              />
              <GameResultOverlay result={result} visible={showResult} />
            </div>

            {/* Controls */}
            <div className="game-controls">
              <button
                data-testid="button-move-left"
                onPointerDown={() => startMove('left')}
                onPointerUp={stopMove}
                onPointerLeave={stopMove}
                onPointerCancel={stopMove}
                disabled={isGrabbing}
                className="ctrl-btn"
                style={{ touchAction: 'none' }}
              >◀</button>

              <button
                data-testid="button-grab"
                onClick={handleGrab}
                disabled={isGrabbing}
                className="grab-btn"
              >
                {isGrabbing ? '⏳ Хватаю...' : '🦾 ХВАТАЙ!'}
              </button>

              <button
                data-testid="button-move-right"
                onPointerDown={() => startMove('right')}
                onPointerUp={stopMove}
                onPointerLeave={stopMove}
                onPointerCancel={stopMove}
                disabled={isGrabbing}
                className="ctrl-btn"
                style={{ touchAction: 'none' }}
              >▶</button>
            </div>
          </>
        ) : view === 'boost' ? (
          <BoostView />
        ) : view === 'history' ? (
          <HistoryView />
        ) : (
          <ProfileView />
        )}
      </main>

      <BottomNav current={view} onChange={setView} />
    </div>
  )
}
