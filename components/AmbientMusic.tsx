'use client'

import { useEffect, useRef, useState } from 'react'

function createReverbBuffer(ctx: AudioContext, seconds: number, decay: number): AudioBuffer {
  const length = ctx.sampleRate * seconds
  const buf = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch)
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay)
    }
  }
  return buf
}

// Calm chord progression: Cmaj7 → Am7 → Fmaj7 → G7
const CHORDS = [
  [130.81, 164.81, 196.00, 246.94],
  [110.00, 130.81, 164.81, 196.00],
  [87.31,  110.00, 130.81, 164.81],
  [98.00,  123.47, 146.83, 174.61],
]
// Gentle arpeggio melody
const MELODY = [261.63, 329.63, 392.00, 440.00, 392.00, 329.63, 261.63, 293.66]

export default function AmbientMusic() {
  const [playing, setPlaying] = useState(false)
  const stopRef = useRef<(() => void) | null>(null)
  const ctxRef = useRef<AudioContext | null>(null)

  const start = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      ctxRef.current = ctx

      const master = ctx.createGain()
      master.gain.value = 0.12
      master.connect(ctx.destination)

      // Reverb send
      const convolver = ctx.createConvolver()
      convolver.buffer = createReverbBuffer(ctx, 3, 2)
      const reverbGain = ctx.createGain()
      reverbGain.gain.value = 0.35
      master.connect(reverbGain)
      reverbGain.connect(convolver)
      convolver.connect(ctx.destination)

      let stopped = false
      let chordIdx = 0
      const CHORD_DUR = 6 // seconds per chord

      const scheduleChords = (startTime: number) => {
        for (let i = 0; i < 5 && !stopped; i++) {
          const chord = CHORDS[(chordIdx + i) % CHORDS.length]
          const t = startTime + i * CHORD_DUR
          chord.forEach((freq, j) => {
            const osc = ctx.createOscillator()
            const g = ctx.createGain()
            osc.type = j === 0 ? 'triangle' : 'sine'
            osc.frequency.value = freq
            g.gain.setValueAtTime(0, t)
            g.gain.linearRampToValueAtTime(0.22 / chord.length, t + 1.2)
            g.gain.setValueAtTime(0.22 / chord.length, t + CHORD_DUR - 1.2)
            g.gain.linearRampToValueAtTime(0, t + CHORD_DUR)
            osc.connect(g)
            g.connect(master)
            osc.start(t)
            osc.stop(t + CHORD_DUR)
          })
        }
        chordIdx = (chordIdx + 5) % CHORDS.length
        if (!stopped) {
          setTimeout(() => scheduleChords(startTime + 5 * CHORD_DUR), (5 * CHORD_DUR - 2) * 1000)
        }
      }

      // Gentle arpeggio
      const scheduleArpeggio = (startTime: number) => {
        const STEP = 0.75
        MELODY.forEach((freq, i) => {
          const osc = ctx.createOscillator()
          const g = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.value = freq
          const t = startTime + i * STEP
          g.gain.setValueAtTime(0, t)
          g.gain.linearRampToValueAtTime(0.08, t + 0.05)
          g.gain.exponentialRampToValueAtTime(0.001, t + STEP * 0.9)
          osc.connect(g)
          g.connect(master)
          osc.start(t)
          osc.stop(t + STEP)
        })
        const loopDur = MELODY.length * STEP
        if (!stopped) {
          setTimeout(() => scheduleArpeggio(startTime + loopDur), (loopDur - 1) * 1000)
        }
      }

      scheduleChords(ctx.currentTime + 0.1)
      scheduleArpeggio(ctx.currentTime + 2)

      stopRef.current = () => {
        stopped = true
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5)
        setTimeout(() => { try { ctx.close() } catch {} }, 2000)
      }
    } catch {}
  }

  const toggle = () => {
    if (playing) {
      stopRef.current?.()
      stopRef.current = null
      setPlaying(false)
    } else {
      start()
      setPlaying(true)
    }
  }

  useEffect(() => () => { stopRef.current?.() }, [])

  return (
    <button
      onClick={toggle}
      title={playing ? 'Выключить музыку' : 'Включить музыку'}
      className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all"
      style={{
        background: playing ? 'rgba(187,154,247,0.2)' : 'rgba(255,255,255,0.06)',
        color: playing ? '#BB9AF7' : 'rgba(192,202,245,0.5)',
        border: playing ? '1px solid rgba(187,154,247,0.4)' : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {playing ? '🎵' : '🔇'}
    </button>
  )
}
