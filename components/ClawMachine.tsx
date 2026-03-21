'use client'

import { useRef, useEffect, useCallback } from 'react'
import { SPHERE_COLORS, type SphereColor } from '@/data/colors'

const SPHERE_COUNT = 22
const BASE_RADIUS = 22
const GRAVITY = 0.21
const DAMPING = 0.986
const BOUNCE = 0.44
const DESCEND_SPEED = 3.2
const ASCEND_SPEED = 3.8
const TRACK_MOVE_SPEED = 0.025
const CLAW_BUTTON_SPEED = 0.009
const CLOSING_FRAMES = 22
const AWAITING_TIMEOUT = 210
const CLAW_ARM_LENGTH = 36
const CLAW_TIP = 6

interface Sphere {
  x: number; y: number; radius: number
  colorIdx: number; vx: number; vy: number
  shine: number; shimmer: number
}

type Phase = 'idle' | 'descending' | 'closing' | 'ascending' | 'awaiting_result' | 'prize_fly' | 'done'

interface Particle {
  x: number; y: number; vx: number; vy: number
  life: number; colorIdx: number
}

export interface GameResult {
  outcome: 'win' | 'miss' | 'drop'
  prize?: { id: number; name: string } | null
  fortune?: string | null
}

interface Props {
  grabTrigger: number
  moveDirection: 'left' | 'right' | null
  onResolveGrab: (position: number, caught: boolean) => void
  isGrabbing: boolean
  result: GameResult | null
  onAnimationComplete: () => void
}

function drawSphere(ctx: CanvasRenderingContext2D, sphere: Sphere, colors: SphereColor, tick: number) {
  const { x, y, radius: r } = sphere
  ctx.save()
  ctx.shadowColor = colors.glow
  ctx.shadowBlur = r * 1.1
  const grad = ctx.createRadialGradient(x - r * 0.25, y - r * 0.3, r * 0.02, x + r * 0.08, y + r * 0.08, r * 1.08)
  grad.addColorStop(0, colors.light)
  grad.addColorStop(0.3, colors.base)
  grad.addColorStop(0.7, colors.dark)
  grad.addColorStop(1, '#06060E')
  ctx.fillStyle = grad
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
  ctx.shadowBlur = 0
  const shine = ctx.createRadialGradient(x - r * 0.28, y - r * 0.32, 0, x - r * 0.28, y - r * 0.32, r * 0.58)
  shine.addColorStop(0, 'rgba(255,255,255,0.88)')
  shine.addColorStop(0.45, 'rgba(255,255,255,0.38)')
  shine.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = shine
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.82)'
  ctx.beginPath(); ctx.arc(x - r * 0.26, y - r * 0.3, r * 0.11, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.5)'
  ctx.beginPath(); ctx.arc(x - r * 0.12, y - r * 0.42, r * 0.055, 0, Math.PI * 2); ctx.fill()
  const rim = ctx.createRadialGradient(x + r * 0.48, y + r * 0.52, r * 0.38, x + r * 0.48, y + r * 0.52, r * 0.82)
  rim.addColorStop(0, 'rgba(255,255,255,0)')
  rim.addColorStop(0.55, colors.rim + '55')
  rim.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = rim
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
  const shimmerAngle = sphere.shimmer + tick * 0.022
  const sx = x + Math.cos(shimmerAngle) * r * 0.36
  const sy = y + Math.sin(shimmerAngle) * r * 0.36
  const alpha = 0.2 + 0.22 * Math.sin(tick * 0.05 + sphere.shine)
  ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`
  ctx.beginPath(); ctx.arc(sx, sy, r * 0.065, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

export default function ClawMachine({ grabTrigger, moveDirection, onResolveGrab, isGrabbing, result, onAnimationComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tick = useRef(0)
  const targetX = useRef(0.5)
  const clawX = useRef(0.5)
  const clawDescent = useRef(0)
  const clawScale = useRef(1)
  const maxDescent = useRef(0)
  const phase = useRef<Phase>('idle')
  const closingFrame = useRef(0)
  const caughtIdx = useRef(-1)
  const caughtRadius = useRef(0)
  const resolvedRef = useRef(false)
  const droppedRef = useRef(false)
  const outcomeRef = useRef<GameResult | null>(null)
  const awaitingTick = useRef(0)
  const spheres = useRef<Sphere[]>([])
  const particles = useRef<Particle[]>([])
  const dims = useRef({ w: 390, h: 480 })
  const prevGrabTrigger = useRef(0)
  const completeFired = useRef(false)
  const moveDirRef = useRef<'left' | 'right' | null>(null)
  const onResolveGrabRef = useRef(onResolveGrab)
  const onAnimationCompleteRef = useRef(onAnimationComplete)

  useEffect(() => { moveDirRef.current = moveDirection }, [moveDirection])
  useEffect(() => { onResolveGrabRef.current = onResolveGrab }, [onResolveGrab])
  useEffect(() => { onAnimationCompleteRef.current = onAnimationComplete }, [onAnimationComplete])
  useEffect(() => { if (result) outcomeRef.current = result }, [result])

  const getMaxDescent = useCallback((w: number, h: number) => {
    const floorY = h * 0.77
    const baseR = Math.min(w, h) * 0.042
    return Math.max(0, floorY - (baseR + 30 + CLAW_ARM_LENGTH + CLAW_TIP))
  }, [])

  const initSpheres = useCallback((w: number, h: number) => {
    const floorY = h * 0.77
    const r = Math.min(w, h) * 0.042
    spheres.current = Array.from({ length: SPHERE_COUNT }, (_, i) => ({
      x: w * 0.12 + Math.random() * w * 0.76,
      y: floorY - r * 0.8 - Math.random() * r * 5.5,
      radius: r * (0.78 + Math.random() * 0.44),
      colorIdx: i % SPHERE_COLORS.length,
      vx: (Math.random() - 0.5) * 0.3,
      vy: Math.random() * 0.3,
      shine: Math.random() * Math.PI * 2,
      shimmer: Math.random() * Math.PI * 2,
    }))
    clawScale.current = 1
    maxDescent.current = getMaxDescent(w, h)
  }, [getMaxDescent])

  // Find nearest sphere under claw tip — called at closing frame 1 with FULL arm width
  const findCaughtSphere = useCallback((cx: number, clawY: number): number => {
    const tipY = clawY + CLAW_ARM_LENGTH
    let best = -1
    let bestScore = Infinity
    for (let i = 0; i < spheres.current.length; i++) {
      const s = spheres.current[i]
      const dx = Math.abs(s.x - cx)
      // Sphere must be within the open claw width
      if (dx > BASE_RADIUS + s.radius * 0.3) continue
      // Sphere center must be near the claw tip vertically
      const dy = Math.abs(s.y - tipY)
      if (dy > s.radius * 2.2) continue
      const score = dx * 0.5 + dy
      if (score < bestScore) { bestScore = score; best = i }
    }
    return best
  }, [])

  // Trigger on grab button press
  useEffect(() => {
    if (grabTrigger > prevGrabTrigger.current && phase.current === 'idle') {
      prevGrabTrigger.current = grabTrigger
      phase.current = 'descending'
      resolvedRef.current = false
      droppedRef.current = false
      outcomeRef.current = null
      caughtIdx.current = -1
      caughtRadius.current = 0
      clawDescent.current = 0
      clawScale.current = 1
      completeFired.current = false
    }
  }, [grabTrigger])

  // Reset idle after grab completes
  useEffect(() => {
    if (!isGrabbing && phase.current === 'done') {
      const t = setTimeout(() => {
        phase.current = 'idle'
        clawDescent.current = 0
        clawScale.current = 1
        caughtIdx.current = -1
        droppedRef.current = false
        resolvedRef.current = false
        outcomeRef.current = null
        completeFired.current = false
      }, 2700)
      return () => clearTimeout(t)
    }
  }, [isGrabbing])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      const rect = parent.getBoundingClientRect()
      const dpr = Math.max(1, window.devicePixelRatio || 1)
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      dims.current = { w: rect.width, h: rect.height }
      if (spheres.current.length === 0) initSpheres(rect.width, rect.height)
      else maxDescent.current = getMaxDescent(rect.width, rect.height)
    }
    resize()
    window.addEventListener('resize', resize)

    let raf: number
    const loop = () => {
      if (document.hidden) { raf = requestAnimationFrame(loop); return }
      tick.current++
      const t = tick.current
      const { w, h } = dims.current
      ctx.clearRect(0, 0, w, h)

      // Background
      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#111220'); bg.addColorStop(1, '#0B0C16')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h)

      const left = w * 0.04, right = w * 0.96
      const top = h * 0.03, bottom = h * 0.90
      const floorY = h * 0.77

      // Container border glow
      ctx.save()
      ctx.shadowColor = 'rgba(187,154,247,0.3)'; ctx.shadowBlur = 22
      ctx.strokeStyle = 'rgba(187,154,247,0.18)'; ctx.lineWidth = 1.5
      ctx.beginPath(); (ctx as any).roundRect(left, top, right - left, bottom - top, 18); ctx.stroke()
      ctx.restore()

      // Rainbow top strip
      const strip = ctx.createLinearGradient(left, 0, right, 0)
      strip.addColorStop(0, 'rgba(230,184,255,0.65)')
      strip.addColorStop(0.33, 'rgba(122,162,247,0.65)')
      strip.addColorStop(0.66, 'rgba(255,107,157,0.65)')
      strip.addColorStop(1, 'rgba(255,215,0,0.65)')
      ctx.fillStyle = strip
      ctx.beginPath(); (ctx as any).roundRect(left, top, right - left, 5, [18, 18, 0, 0]); ctx.fill()

      // Dot grid
      ctx.fillStyle = 'rgba(187,154,247,0.05)'
      for (let gx = left + 24; gx < right; gx += 28)
        for (let gy = top + 24; gy < floorY; gy += 28) {
          ctx.beginPath(); ctx.arc(gx, gy, 1.1, 0, Math.PI * 2); ctx.fill()
        }

      // Floor
      ctx.fillStyle = 'rgba(6,6,16,0.97)'; ctx.fillRect(left, floorY, right - left, bottom - floorY)
      ctx.strokeStyle = 'rgba(187,154,247,0.22)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(left, floorY); ctx.lineTo(right, floorY); ctx.stroke()

      // Chute slot
      const chuteW = (right - left) * 0.44
      const chuteX = left + (right - left - chuteW) / 2
      ctx.save()
      ctx.shadowColor = 'rgba(255,215,0,0.4)'; ctx.shadowBlur = 14
      ctx.strokeStyle = 'rgba(255,215,0,0.35)'; ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(chuteX, bottom - 2); ctx.lineTo(chuteX + 12, bottom + 18)
      ctx.lineTo(chuteX + chuteW - 12, bottom + 18); ctx.lineTo(chuteX + chuteW, bottom - 2)
      ctx.stroke()
      ctx.restore()

      // ── Claw X movement ──────────────────────────────────────
      const ph = phase.current
      if (ph === 'idle') {
        const dir = moveDirRef.current
        if (dir === 'left') targetX.current = Math.max(0.05, targetX.current - CLAW_BUTTON_SPEED)
        if (dir === 'right') targetX.current = Math.min(0.95, targetX.current + CLAW_BUTTON_SPEED)
      }
      const dx = targetX.current - clawX.current
      if (Math.abs(dx) > 0.001) clawX.current += Math.sign(dx) * Math.min(TRACK_MOVE_SPEED, Math.abs(dx))

      const cx = left + (right - left) * clawX.current
      const trackY = top + 18
      const descent = clawDescent.current
      const armW = BASE_RADIUS * clawScale.current

      // ── Phase logic ───────────────────────────────────────────
      if (ph === 'descending') {
        clawDescent.current = Math.min(clawDescent.current + DESCEND_SPEED, maxDescent.current)
        const cy = trackY + 30 + clawDescent.current
        // Push spheres gently out of way
        for (const s of spheres.current) {
          const sdx = s.x - cx, sdy = s.y - (cy + 16)
          if (Math.abs(sdx) < armW && sdy > -s.radius && sdy < 32 + s.radius) {
            s.vx += sdx >= 0 ? 0.4 : -0.4; s.vy -= 0.1
          }
        }
        if (clawDescent.current >= maxDescent.current) { phase.current = 'closing'; closingFrame.current = 0 }
      }

      if (ph === 'closing') {
        closingFrame.current++
        const targetScale = caughtIdx.current >= 0
          ? Math.max(0.1, (caughtRadius.current * 0.85) / BASE_RADIUS)
          : 0.1
        clawScale.current = Math.max(clawScale.current - 0.05, targetScale)

        // ── CATCHING: check at frame 1, before claw closes ───
        if (closingFrame.current === 1) {
          const cy = trackY + 30 + clawDescent.current
          const found = findCaughtSphere(cx, cy)
          if (found >= 0) {
            caughtIdx.current = found
            caughtRadius.current = spheres.current[found].radius
            spheres.current[found].vx = 0
            spheres.current[found].vy = 0
          }
          if (!resolvedRef.current) {
            onResolveGrabRef.current(Math.round(clawX.current * 100), found >= 0)
            resolvedRef.current = true
          }
        }

        // Push uncaught spheres away
        if (caughtIdx.current < 0 && closingFrame.current <= 8) {
          for (const s of spheres.current) {
            const sdx = s.x - cx
            if (Math.abs(sdx) < 40) {
              s.vx += (sdx > 0 ? 3.5 : -3.5) + (Math.random() - 0.5)
              s.vy -= 2 + Math.random() * 1.5
            }
          }
        }

        if (closingFrame.current >= CLOSING_FRAMES) phase.current = 'ascending'
      }

      if (ph === 'ascending') {
        clawDescent.current = Math.max(clawDescent.current - ASCEND_SPEED, 0)
        const ci = caughtIdx.current
        const cy = trackY + 30 + clawDescent.current
        if (ci >= 0 && spheres.current[ci] && !droppedRef.current) {
          spheres.current[ci].x = cx
          spheres.current[ci].y = cy + CLAW_ARM_LENGTH - caughtRadius.current * 0.5
          spheres.current[ci].vx = 0; spheres.current[ci].vy = 0
        }
        // Drop mid-ascent if not win
        if (ci >= 0 && !droppedRef.current && outcomeRef.current && outcomeRef.current.outcome !== 'win' && clawDescent.current <= maxDescent.current * 0.45) {
          if (spheres.current[ci]) { spheres.current[ci].vx = (Math.random() - 0.5) * 4; spheres.current[ci].vy = -2 }
          caughtIdx.current = -1; droppedRef.current = true
        }
        if (clawDescent.current <= 0) {
          if (!outcomeRef.current) { phase.current = 'awaiting_result'; awaitingTick.current = 0 }
          else if (outcomeRef.current.outcome === 'win' && caughtIdx.current >= 0) phase.current = 'prize_fly'
          else { phase.current = 'done'; closingFrame.current = 0 }
        }
      }

      if (ph === 'awaiting_result') {
        awaitingTick.current++
        const ci = caughtIdx.current
        if (outcomeRef.current) {
          if (outcomeRef.current.outcome === 'win' && ci >= 0) phase.current = 'prize_fly'
          else {
            if (ci >= 0 && spheres.current[ci]) { spheres.current[ci].vx = (Math.random() - 0.5) * 4; spheres.current[ci].vy = -2; caughtIdx.current = -1; droppedRef.current = true }
            phase.current = 'done'; closingFrame.current = 0
          }
        } else if (awaitingTick.current > AWAITING_TIMEOUT) {
          if (ci >= 0 && spheres.current[ci]) { spheres.current[ci].vx = (Math.random() - 0.5) * 4; spheres.current[ci].vy = -2; caughtIdx.current = -1; droppedRef.current = true }
          phase.current = 'done'; closingFrame.current = 0
        }
      }

      if (ph === 'prize_fly') {
        closingFrame.current++
        const ci = caughtIdx.current
        const midX = left + (right - left) / 2
        const exitY = bottom + 10
        if (ci >= 0 && spheres.current[ci]) {
          const s = spheres.current[ci]
          s.x += (midX - s.x) * 0.14; s.y += (exitY - s.y) * 0.14
          if (closingFrame.current >= 28) {
            for (let i = 0; i < 24; i++) particles.current.push({
              x: s.x, y: s.y,
              vx: (Math.random() - 0.5) * 8, vy: Math.random() * -7 - 1,
              life: 1, colorIdx: s.colorIdx,
            })
            if (particles.current.length > 200) particles.current = particles.current.slice(-200)
            spheres.current.splice(ci, 1); caughtIdx.current = -1
            phase.current = 'done'; closingFrame.current = 0
          }
        } else { phase.current = 'done'; closingFrame.current = 0 }
      }

      if (ph === 'done') {
        closingFrame.current++
        if (closingFrame.current === 1 && !completeFired.current) {
          completeFired.current = true
          setTimeout(() => onAnimationCompleteRef.current(), 2500)
        }
      }

      // ── Physics ───────────────────────────────────────────────
      const ci = caughtIdx.current
      for (let i = 0; i < spheres.current.length; i++) {
        const s = spheres.current[i]
        s.shine += 0.017
        if (i === ci) continue
        s.vy += GRAVITY; s.x += s.vx; s.y += s.vy; s.vx *= DAMPING
        if (s.y + s.radius > floorY) { s.y = floorY - s.radius; s.vy = -s.vy * BOUNCE; s.vx *= 0.91; if (Math.abs(s.vy) < 0.45) s.vy = 0 }
        if (s.x - s.radius < left + 5) { s.x = left + 5 + s.radius; s.vx = Math.abs(s.vx) * BOUNCE }
        if (s.x + s.radius > right - 5) { s.x = right - 5 - s.radius; s.vx = -Math.abs(s.vx) * BOUNCE }
        for (let j = i + 1; j < spheres.current.length; j++) {
          if (j === ci) continue
          const b = spheres.current[j]
          const ddx = b.x - s.x, ddy = b.y - s.y
          const dist = Math.sqrt(ddx * ddx + ddy * ddy)
          const minD = s.radius + b.radius
          if (dist < minD && dist > 0.01) {
            const nx = ddx / dist, ny = ddy / dist
            const ov = (minD - dist) * 0.5
            s.x -= nx * ov; s.y -= ny * ov; b.x += nx * ov; b.y += ny * ov
            const rv = (s.vx - b.vx) * nx + (s.vy - b.vy) * ny
            if (rv > 0) { s.vx -= rv * nx * 0.52; s.vy -= rv * ny * 0.52; b.vx += rv * nx * 0.52; b.vy += rv * ny * 0.52 }
          }
        }
      }

      // Draw spheres (caught on top)
      for (let i = spheres.current.length - 1; i >= 0; i--) {
        if (i !== ci) drawSphere(ctx, spheres.current[i], SPHERE_COLORS[spheres.current[i].colorIdx], t)
      }
      if (ci >= 0 && spheres.current[ci]) drawSphere(ctx, spheres.current[ci], SPHERE_COLORS[spheres.current[ci].colorIdx], t)

      // Particles
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i]
        p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life -= 0.03
        if (p.life <= 0) { particles.current.splice(i, 1); continue }
        const c = SPHERE_COLORS[p.colorIdx]
        ctx.save(); ctx.globalAlpha = p.life; ctx.fillStyle = c.base
        ctx.beginPath(); ctx.arc(p.x, p.y, 4 * p.life, 0, Math.PI * 2); ctx.fill(); ctx.restore()
      }

      // ── Track ─────────────────────────────────────────────────
      ctx.save()
      ctx.strokeStyle = 'rgba(187,154,247,0.16)'; ctx.lineWidth = 7; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(left + 16, trackY); ctx.lineTo(right - 16, trackY); ctx.stroke()
      ctx.shadowColor = '#BB9AF7'; ctx.shadowBlur = 14
      const dotGrad = ctx.createRadialGradient(cx - 2, trackY - 2, 1, cx, trackY, 8)
      dotGrad.addColorStop(0, '#F5EEFF'); dotGrad.addColorStop(1, '#BB9AF7')
      ctx.fillStyle = dotGrad; ctx.beginPath(); ctx.arc(cx, trackY, 8, 0, Math.PI * 2); ctx.fill()
      ctx.restore()

      // Rope
      const ropeY = trackY + 30 + descent
      ctx.save(); ctx.setLineDash([5, 5])
      ctx.strokeStyle = 'rgba(187,154,247,0.3)'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(cx, trackY + 8); ctx.lineTo(cx, ropeY); ctx.stroke()
      ctx.setLineDash([]); ctx.restore()

      // Claw arms
      const clawGrad = ctx.createLinearGradient(cx - armW, ropeY, cx + armW, ropeY + 36)
      clawGrad.addColorStop(0, '#D8ACFF'); clawGrad.addColorStop(1, '#FF8EC0')
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      ctx.shadowColor = '#E6B8FF'; ctx.shadowBlur = 18; ctx.strokeStyle = clawGrad; ctx.lineWidth = 3.5
      ctx.beginPath(); ctx.moveTo(cx - 3, ropeY); ctx.lineTo(cx - armW, ropeY + 25); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - armW, ropeY + 25); ctx.lineTo(cx - armW + 5, ropeY + CLAW_ARM_LENGTH); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx + 3, ropeY); ctx.lineTo(cx + armW, ropeY + 25); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx + armW, ropeY + 25); ctx.lineTo(cx + armW - 5, ropeY + CLAW_ARM_LENGTH); ctx.stroke()
      ctx.restore()

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [initSpheres, getMaxDescent, findCaughtSphere])

  return (
    <div className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
