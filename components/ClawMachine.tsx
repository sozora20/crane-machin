'use client'

import { useRef, useEffect, useCallback } from 'react'
import { SPHERE_COLORS, type SphereColor } from '@/data/colors'

const SPHERE_COUNT = 22
const BASE_RADIUS = 22
const GRAVITY = 0.21
const DAMPING = 0.986
const BOUNCE = 0.44
const DESCEND_SPEED_FAST = 5.5
const DESCEND_SPEED_SLOW = 1.2   // slows near bottom for tension
const ASCEND_SPEED = 6.5
const CLAW_BUTTON_SPEED = 0.009
const TRACK_MOVE_SPEED = 0.028
const CLOSING_FRAMES = 16
const AWAITING_TIMEOUT = 210
const CLAW_ARM_LENGTH = 36

interface Sphere {
  x: number; y: number; radius: number
  colorIdx: number; vx: number; vy: number
  shine: number; shimmer: number
}

type Phase = 'idle' | 'descending' | 'closing' | 'ascending' | 'awaiting_result' | 'prize_fly' | 'done'

interface Particle {
  x: number; y: number; vx: number; vy: number
  life: number; colorIdx: number; size?: number
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

function drawSphere(ctx: CanvasRenderingContext2D, s: Sphere, c: SphereColor, t: number, glow = 1) {
  const { x, y, radius: r } = s
  ctx.save()
  ctx.shadowColor = c.glow
  ctx.shadowBlur = r * 1.1 * glow
  const grad = ctx.createRadialGradient(x - r * .25, y - r * .3, r * .02, x + r * .08, y + r * .08, r * 1.08)
  grad.addColorStop(0, c.light); grad.addColorStop(.3, c.base); grad.addColorStop(.7, c.dark); grad.addColorStop(1, '#06060E')
  ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
  ctx.shadowBlur = 0
  const shine = ctx.createRadialGradient(x - r * .28, y - r * .32, 0, x - r * .28, y - r * .32, r * .58)
  shine.addColorStop(0, 'rgba(255,255,255,.88)'); shine.addColorStop(.45, 'rgba(255,255,255,.38)'); shine.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = shine; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,.82)'; ctx.beginPath(); ctx.arc(x - r * .26, y - r * .3, r * .11, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.beginPath(); ctx.arc(x - r * .12, y - r * .42, r * .055, 0, Math.PI * 2); ctx.fill()
  const rim = ctx.createRadialGradient(x + r * .48, y + r * .52, r * .38, x + r * .48, y + r * .52, r * .82)
  rim.addColorStop(0, 'rgba(255,255,255,0)'); rim.addColorStop(.55, c.rim + '55'); rim.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = rim; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
  const shimmerAngle = s.shimmer + t * .022
  const sx = x + Math.cos(shimmerAngle) * r * .36, sy = y + Math.sin(shimmerAngle) * r * .36
  const alpha = .2 + .22 * Math.sin(t * .05 + s.shine)
  ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(2)})`; ctx.beginPath(); ctx.arc(sx, sy, r * .065, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

function drawText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, size: number, alpha = 1) {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `900 ${size}px -apple-system, sans-serif`
  ctx.shadowColor = color
  ctx.shadowBlur = 20
  ctx.fillStyle = color
  ctx.fillText(text, x, y)
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
  const prevGrabTrigger = useRef(grabTrigger)  // init to current so remount doesn't auto-trigger
  const completeFired = useRef(false)
  const moveDirRef = useRef<'left' | 'right' | null>(null)
  const onResolveGrabRef = useRef(onResolveGrab)
  const onAnimationCompleteRef = useRef(onAnimationComplete)
  const tensionPulse = useRef(0)

  useEffect(() => { moveDirRef.current = moveDirection }, [moveDirection])
  useEffect(() => { onResolveGrabRef.current = onResolveGrab }, [onResolveGrab])
  useEffect(() => { onAnimationCompleteRef.current = onAnimationComplete }, [onAnimationComplete])
  useEffect(() => { if (result) outcomeRef.current = result }, [result])

  const getMaxDescent = useCallback((w: number, h: number) => {
    const floorY = h * 0.77
    const baseR = Math.min(w, h) * 0.042
    return Math.max(0, floorY - (baseR + 30 + CLAW_ARM_LENGTH + 6))
  }, [])

  const initSpheres = useCallback((w: number, h: number) => {
    const floorY = h * 0.77
    const r = Math.min(w, h) * 0.042
    spheres.current = Array.from({ length: SPHERE_COUNT }, (_, i) => ({
      x: w * 0.12 + Math.random() * w * 0.76,
      y: floorY - r * 0.8 - Math.random() * r * 5.2,
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

  const findCaughtSphere = useCallback((cx: number, clawY: number): number => {
    const tipY = clawY + CLAW_ARM_LENGTH
    let best = -1, bestScore = Infinity
    for (let i = 0; i < spheres.current.length; i++) {
      const s = spheres.current[i]
      const dx = Math.abs(s.x - cx)
      if (dx > s.radius * 0.85) continue  // must aim within sphere radius — precision required
      const dy = Math.abs(s.y - tipY)
      if (dy > s.radius * 2.2) continue
      const score = dx * 0.5 + dy
      if (score < bestScore) { bestScore = score; best = i }
    }
    return best
  }, [])

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
      tensionPulse.current = 0
    }
  }, [grabTrigger])


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

      const bg = ctx.createLinearGradient(0, 0, 0, h)
      bg.addColorStop(0, '#18181e'); bg.addColorStop(1, '#141418')
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h)

      const left = w * 0.04, right = w * 0.96
      const top = h * 0.03, bottom = h * 0.90
      const floorY = h * 0.77

      ctx.save()
      ctx.shadowColor = 'rgba(255,44,61,0.25)'; ctx.shadowBlur = 22
      ctx.strokeStyle = 'rgba(255,44,61,0.18)'; ctx.lineWidth = 1.5
      ctx.beginPath(); (ctx as any).roundRect(left, top, right - left, bottom - top, 18); ctx.stroke()
      ctx.restore()

      const strip = ctx.createLinearGradient(left, 0, right, 0)
      strip.addColorStop(0, 'rgba(255,44,61,0.8)'); strip.addColorStop(0.5, 'rgba(22,127,255,0.8)')
      strip.addColorStop(1, 'rgba(255,44,61,0.8)')
      ctx.fillStyle = strip
      ctx.beginPath(); (ctx as any).roundRect(left, top, right - left, 5, [18, 18, 0, 0]); ctx.fill()

      ctx.fillStyle = 'rgba(255,44,61,0.04)'
      for (let gx = left + 24; gx < right; gx += 28)
        for (let gy = top + 24; gy < floorY; gy += 28) {
          ctx.beginPath(); ctx.arc(gx, gy, 1.1, 0, Math.PI * 2); ctx.fill()
        }

      ctx.fillStyle = 'rgba(8,8,12,0.97)'; ctx.fillRect(left, floorY, right - left, bottom - floorY)
      ctx.strokeStyle = 'rgba(255,44,61,0.2)'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(left, floorY); ctx.lineTo(right, floorY); ctx.stroke()

      const chuteW = (right - left) * 0.44
      const chuteX = left + (right - left - chuteW) / 2
      ctx.save()
      ctx.shadowColor = 'rgba(255,215,0,0.4)'; ctx.shadowBlur = 14
      ctx.strokeStyle = 'rgba(255,215,0,0.35)'; ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(chuteX, bottom - 2); ctx.lineTo(chuteX + 12, bottom + 18)
      ctx.lineTo(chuteX + chuteW - 12, bottom + 18); ctx.lineTo(chuteX + chuteW, bottom - 2)
      ctx.stroke(); ctx.restore()

      // ── Claw movement ────────────────────────────────────────
      const ph = phase.current
      if (ph === 'idle') {
        const dir = moveDirRef.current
        if (dir === 'left') targetX.current = Math.max(0.05, targetX.current - CLAW_BUTTON_SPEED)
        if (dir === 'right') targetX.current = Math.min(0.95, targetX.current + CLAW_BUTTON_SPEED)
      }
      const dx2 = targetX.current - clawX.current
      if (Math.abs(dx2) > 0.001) clawX.current += Math.sign(dx2) * Math.min(TRACK_MOVE_SPEED, Math.abs(dx2))

      const cx = left + (right - left) * clawX.current
      const trackY = top + 18
      const armW = BASE_RADIUS * clawScale.current

      // ── Phase logic ──────────────────────────────────────────
      if (ph === 'descending') {
        const progress = clawDescent.current / maxDescent.current
        // Slow down in the last 25% for tension
        const speed = progress > 0.75
          ? DESCEND_SPEED_SLOW + (DESCEND_SPEED_FAST - DESCEND_SPEED_SLOW) * (1 - (progress - 0.75) / 0.25)
          : DESCEND_SPEED_FAST
        clawDescent.current = Math.min(clawDescent.current + speed, maxDescent.current)
        tensionPulse.current = (tensionPulse.current + 0.12) % (Math.PI * 2)
        const cy = trackY + 30 + clawDescent.current
        for (const s of spheres.current) {
          const sdx = s.x - cx, sdy = s.y - (cy + 16)
          if (Math.abs(sdx) < armW && sdy > -s.radius && sdy < 32 + s.radius) {
            s.vx += sdx >= 0 ? 0.35 : -0.35; s.vy -= 0.08
          }
        }
        if (clawDescent.current >= maxDescent.current) { phase.current = 'closing'; closingFrame.current = 0 }
      }

      if (ph === 'closing') {
        closingFrame.current++
        const targetScale = caughtIdx.current >= 0
          ? Math.max(0.1, (caughtRadius.current * 0.85) / BASE_RADIUS) : 0.1
        clawScale.current = Math.max(clawScale.current - 0.05, targetScale)

        if (closingFrame.current === 1) {
          const cy = trackY + 30 + clawDescent.current
          const found = findCaughtSphere(cx, cy)
          if (found >= 0) {
            caughtIdx.current = found
            caughtRadius.current = spheres.current[found].radius
            spheres.current[found].vx = 0; spheres.current[found].vy = 0
          }
          if (!resolvedRef.current) {
            onResolveGrabRef.current(Math.round(clawX.current * 100), found >= 0)
            resolvedRef.current = true
          }
        }
        if (caughtIdx.current < 0 && closingFrame.current <= 6) {
          for (const s of spheres.current) {
            const sdx = s.x - cx
            if (Math.abs(sdx) < 42) { s.vx += sdx > 0 ? 3 : -3; s.vy -= 1.8 + Math.random() }
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

      // ── prize_fly: sphere flies UP with fireworks ─────────────
      if (ph === 'prize_fly') {
        closingFrame.current++
        const ci = caughtIdx.current
        if (ci >= 0 && spheres.current[ci]) {
          const s = spheres.current[ci]
          // Fly straight UP
          s.y -= 8 + closingFrame.current * 0.3
          s.x += (cx - s.x) * 0.08
          // Particle trail while rising
          if (t % 2 === 0) {
            particles.current.push({
              x: s.x + (Math.random() - 0.5) * s.radius,
              y: s.y + s.radius * 0.5,
              vx: (Math.random() - 0.5) * 3, vy: 1 + Math.random() * 2,
              life: 0.7, colorIdx: s.colorIdx, size: 3,
            })
          }
          // Big explosion when sphere exits top
          if (s.y < top - s.radius || closingFrame.current >= 38) {
            // 60-particle fireworks
            for (let i = 0; i < 60; i++) {
              const angle = (i / 60) * Math.PI * 2
              const speed = 4 + Math.random() * 8
              particles.current.push({
                x: s.x, y: Math.max(s.y, top + 20),
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 3,
                life: 1, colorIdx: Math.floor(Math.random() * SPHERE_COLORS.length), size: 5,
              })
            }
            spheres.current.splice(ci, 1)
            caughtIdx.current = -1
            phase.current = 'done'; closingFrame.current = 0
          }
        } else { phase.current = 'done'; closingFrame.current = 0 }
      }

      if (ph === 'done') {
        closingFrame.current++
        if (closingFrame.current === 1 && !completeFired.current) {
          completeFired.current = true
          setTimeout(() => {
            // Reset phase BEFORE calling onAnimationComplete so the button
            // re-enables at the same time phase returns to idle — no race condition
            phase.current = 'idle'
            clawDescent.current = 0
            clawScale.current = 1
            caughtIdx.current = -1
            droppedRef.current = false
            resolvedRef.current = false
            outcomeRef.current = null
            completeFired.current = false
            onAnimationCompleteRef.current()
          }, 1500)
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

      // ── Glow on spheres near claw (tension effect) ────────────
      const clawTipY = trackY + 30 + clawDescent.current + CLAW_ARM_LENGTH
      for (let i = spheres.current.length - 1; i >= 0; i--) {
        const s = spheres.current[i]
        const distToClaw = Math.sqrt((s.x - cx) ** 2 + (s.y - clawTipY) ** 2)
        const glowFactor = ph === 'descending' ? Math.max(1, 2.5 - distToClaw / 40) : 1
        if (i !== ci) drawSphere(ctx, s, SPHERE_COLORS[s.colorIdx], t, glowFactor)
      }
      if (ci >= 0 && spheres.current[ci]) drawSphere(ctx, spheres.current[ci], SPHERE_COLORS[spheres.current[ci].colorIdx], t, 2.5)

      // ── Particles ─────────────────────────────────────────────
      for (let i = particles.current.length - 1; i >= 0; i--) {
        const p = particles.current[i]
        p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.vx *= 0.97; p.life -= 0.025
        if (p.life <= 0) { particles.current.splice(i, 1); continue }
        const c = SPHERE_COLORS[p.colorIdx]
        ctx.save(); ctx.globalAlpha = p.life; ctx.fillStyle = c.base
        ctx.shadowColor = c.glow; ctx.shadowBlur = 8
        const sz = (p.size || 4) * p.life
        ctx.beginPath(); ctx.arc(p.x, p.y, sz, 0, Math.PI * 2); ctx.fill(); ctx.restore()
      }
      if (particles.current.length > 300) particles.current = particles.current.slice(-300)

      // ── Aim indicator (idle phase only) ───────────────────────
      if (ph === 'idle') {
        let aimIdx = -1, bestAim = Infinity
        for (let i = 0; i < spheres.current.length; i++) {
          const s = spheres.current[i]
          const adx = Math.abs(s.x - cx)
          if (adx < s.radius * 0.85 && adx < bestAim) { bestAim = adx; aimIdx = i }
        }
        const inRange = aimIdx >= 0
        // Shadow ellipse on floor
        ctx.save()
        ctx.shadowColor = inRange ? 'rgba(0,255,120,0.7)' : 'rgba(180,180,220,0.35)'
        ctx.shadowBlur = inRange ? 18 : 8
        ctx.strokeStyle = inRange ? 'rgba(0,255,120,0.85)' : 'rgba(160,160,200,0.4)'
        ctx.lineWidth = inRange ? 2 : 1.5
        ctx.beginPath(); ctx.ellipse(cx, floorY - 4, inRange ? 20 : 13, 5, 0, 0, Math.PI * 2); ctx.stroke()
        ctx.restore()
        // Dashed vertical aim line
        ctx.save()
        ctx.setLineDash([3, 7])
        ctx.strokeStyle = inRange ? 'rgba(0,255,120,0.25)' : 'rgba(160,160,200,0.12)'
        ctx.lineWidth = 1
        ctx.beginPath(); ctx.moveTo(cx, trackY + 12); ctx.lineTo(cx, floorY - 10); ctx.stroke()
        ctx.setLineDash([]); ctx.restore()
        // Highlight targeted sphere
        if (aimIdx >= 0 && spheres.current[aimIdx]) {
          const ts = spheres.current[aimIdx]
          const pulse = 0.75 + 0.25 * Math.sin(t * 0.12)
          ctx.save()
          ctx.globalAlpha = pulse
          ctx.shadowColor = 'rgba(0,255,120,0.9)'; ctx.shadowBlur = 22
          ctx.strokeStyle = 'rgba(0,255,120,0.9)'; ctx.lineWidth = 2.5
          ctx.beginPath(); ctx.arc(ts.x, ts.y, ts.radius + 6, 0, Math.PI * 2); ctx.stroke()
          ctx.restore()
        }
      }

      // ── Track ─────────────────────────────────────────────────
      ctx.save()
      ctx.strokeStyle = 'rgba(255,44,61,0.15)'; ctx.lineWidth = 7; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(left + 16, trackY); ctx.lineTo(right - 16, trackY); ctx.stroke()
      ctx.shadowColor = '#ff2c3d'; ctx.shadowBlur = 14
      const dotGrad = ctx.createRadialGradient(cx - 2, trackY - 2, 1, cx, trackY, 8)
      dotGrad.addColorStop(0, '#ffffff'); dotGrad.addColorStop(1, '#ff2c3d')
      ctx.fillStyle = dotGrad; ctx.beginPath(); ctx.arc(cx, trackY, 8, 0, Math.PI * 2); ctx.fill()
      ctx.restore()

      const ropeY = trackY + 30 + clawDescent.current
      ctx.save(); ctx.setLineDash([5, 5])
      ctx.strokeStyle = 'rgba(255,44,61,0.25)'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(cx, trackY + 8); ctx.lineTo(cx, ropeY); ctx.stroke()
      ctx.setLineDash([]); ctx.restore()

      // Claw arms
      const clawGrad = ctx.createLinearGradient(cx - armW, ropeY, cx + armW, ropeY + 36)
      clawGrad.addColorStop(0, '#ff2c3d'); clawGrad.addColorStop(1, '#167fff')
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'
      ctx.shadowColor = '#ff2c3d'; ctx.shadowBlur = 18; ctx.strokeStyle = clawGrad; ctx.lineWidth = 3.5
      ctx.beginPath(); ctx.moveTo(cx - 3, ropeY); ctx.lineTo(cx - armW, ropeY + 25); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx - armW, ropeY + 25); ctx.lineTo(cx - armW + 5, ropeY + CLAW_ARM_LENGTH); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx + 3, ropeY); ctx.lineTo(cx + armW, ropeY + 25); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx + armW, ropeY + 25); ctx.lineTo(cx + armW - 5, ropeY + CLAW_ARM_LENGTH); ctx.stroke()
      ctx.restore()

      // ── Tension status text ──────────────────────────────────
      if (ph === 'descending') {
        const progress = clawDescent.current / maxDescent.current
        if (progress > 0.65) {
          const alpha = Math.min(1, (progress - 0.65) / 0.15) * (0.7 + 0.3 * Math.sin(tensionPulse.current * 3))
          drawText(ctx, 'ЦЕЛЬ В ПРИЦЕЛЕ...', w / 2, top + 28, '#FFD700', 13, alpha)
        }
      }
      if (ph === 'closing') {
        const pulse = 0.8 + 0.2 * Math.sin(t * 0.3)
        drawText(ctx, '⚡ ХВАТАЮ! ⚡', w / 2, top + 28, '#FF6B9D', 14, pulse)
      }
      if (ph === 'ascending' && ci >= 0) {
        const pulse = 0.8 + 0.2 * Math.sin(t * 0.2)
        drawText(ctx, '🎯 ПОДНИМАЮ...', w / 2, top + 28, '#9ECE6A', 13, pulse)
      }
      if (ph === 'prize_fly') {
        const pulse = 0.9 + 0.1 * Math.sin(t * 0.4)
        drawText(ctx, '🏆 ПОБЕДА! 🏆', w / 2, h / 2, '#FFD700', 22, pulse)
      }
      if (ph === 'awaiting_result') {
        const dots = '.'.repeat(1 + (Math.floor(t / 15) % 3))
        drawText(ctx, `Определяю результат${dots}`, w / 2, top + 28, '#BB9AF7', 12, 0.8)
      }

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
