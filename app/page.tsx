'use client'

import { useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import BottomNav from '@/components/BottomNav'
import HistoryView from '@/components/HistoryView'
import BoostView from '@/components/BoostView'
import ProfileView from '@/components/ProfileView'
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
    setTimeout(() => setShowResult(false), 3000)
  }, [])

  const startMove = useCallback((dir: 'left' | 'right') => {
    if (!isGrabbing) setMoveDir(dir)
  }, [isGrabbing])

  const stopMove = useCallback(() => setMoveDir(null), [])

  return (
    <div className="flex flex-col h-dvh max-w-md mx-auto" style={{ background: '#1A1B26' }}>
      {/* Header */}
      <header className="flex-shrink-0 px-4 pt-3 pb-2 flex items-center justify-between">
        <h1 className="text-base font-black gradient-text">🎰 Grab-a-Prize</h1>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
          style={{ background: 'rgba(187,154,247,0.12)', color: '#BB9AF7' }}>
          <span>♾️</span>
          <span>попыток</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 relative overflow-hidden flex flex-col min-h-0">
        {view === 'game' ? (
          <>
            <div className="flex-1 relative min-h-0">
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
            <div className="flex-shrink-0 px-4 py-3 flex items-center gap-3">
              <button
                data-testid="button-move-left"
                onPointerDown={() => startMove('left')}
                onPointerUp={stopMove}
                onPointerLeave={stopMove}
                onPointerCancel={stopMove}
                disabled={isGrabbing}
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 select-none active:scale-95 transition-transform"
                style={{
                  background: 'rgba(187,154,247,0.1)',
                  color: isGrabbing ? 'rgba(192,202,245,0.25)' : '#BB9AF7',
                  border: '1px solid rgba(187,154,247,0.2)',
                }}
              >◀</button>

              <button
                data-testid="button-grab"
                onClick={handleGrab}
                disabled={isGrabbing}
                className="flex-1 h-14 rounded-2xl font-black text-sm tracking-widest uppercase select-none transition-all duration-150 active:scale-95"
                style={{
                  background: isGrabbing
                    ? 'rgba(187,154,247,0.08)'
                    : 'linear-gradient(135deg, #BB9AF7 0%, #7AA2F7 50%, #FF6B9D 100%)',
                  color: isGrabbing ? 'rgba(192,202,245,0.3)' : '#fff',
                  boxShadow: isGrabbing ? 'none' : '0 0 28px rgba(187,154,247,0.4), 0 4px 16px rgba(0,0,0,0.4)',
                  cursor: isGrabbing ? 'not-allowed' : 'pointer',
                }}
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
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0 select-none active:scale-95 transition-transform"
                style={{
                  background: 'rgba(187,154,247,0.1)',
                  color: isGrabbing ? 'rgba(192,202,245,0.25)' : '#BB9AF7',
                  border: '1px solid rgba(187,154,247,0.2)',
                }}
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
