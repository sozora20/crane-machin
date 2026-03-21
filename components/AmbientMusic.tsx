'use client'

import { useEffect, useRef, useState } from 'react'

function createReverb(ctx: AudioContext, sec: number, decay: number): AudioBuffer {
  const len = ctx.sampleRate * sec
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay)
  }
  return buf
}

function addOsc(
  ctx: AudioContext, dest: AudioNode,
  freq: number, type: OscillatorType,
  startT: number, dur: number, vol: number,
  attack = 0.3, release = 0.5
) {
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  const filt = ctx.createBiquadFilter()
  filt.type = 'lowpass'
  filt.frequency.value = 900
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(0, startT)
  g.gain.linearRampToValueAtTime(vol, startT + attack)
  g.gain.setValueAtTime(vol, startT + dur - release)
  g.gain.linearRampToValueAtTime(0, startT + dur)
  osc.connect(filt); filt.connect(g); g.connect(dest)
  osc.start(startT); osc.stop(startT + dur)
}

// Meditative pentatonic theme: C major pentatonic (C D E G A)
// Slow, peaceful, ~50 BPM, sine waves + soft pads
function buildTheme(ctx: AudioContext, master: AudioNode, loopDur: number, stopped: () => boolean) {
  const BPM = 50
  const BEAT = 60 / BPM

  // Melody: slow ascending/descending pentatonic phrases
  const melodyLine = [
    [523.25, 3],  // C5
    [440.00, 1],  // A4
    [523.25, 2],  // C5
    [659.25, 4],  // E5
    [587.33, 2],  // D5
    [523.25, 2],  // C5
    [440.00, 3],  // A4
    [392.00, 1],  // G4
    [440.00, 2],  // A4
    [523.25, 2],  // C5
    [392.00, 3],  // G4
    [329.63, 2],  // E4
    [392.00, 2],  // G4
    [440.00, 3],  // A4
    [523.25, 4],  // C5
  ]

  // Bass: C2 → G2 → A2 pedal tones
  const bassNotes = [
    [65.41, 8],   // C2
    [98.00, 4],   // G2
    [65.41, 4],   // C2
    [110.0, 4],   // A2
    [73.42, 4],   // D2
    [65.41, 8],   // C2
  ]

  const schedule = (startTime: number) => {
    if (stopped()) return

    // Melody — sine, very slow attack/release for meditative feel
    let mt = startTime + BEAT * 0.5
    melodyLine.forEach(([freq, beats]) => {
      addOsc(ctx, master, freq as number, 'sine', mt, (beats as number) * BEAT * 0.88, 0.10, 0.6, 0.8)
      // Faint octave below for warmth
      addOsc(ctx, master, (freq as number) * 0.5, 'sine', mt, (beats as number) * BEAT * 0.7, 0.03, 0.5, 0.7)
      mt += (beats as number) * BEAT
    })

    // Bass — soft sine
    let bt = startTime
    bassNotes.forEach(([freq, beats]) => {
      addOsc(ctx, master, freq as number, 'sine', bt, (beats as number) * BEAT * 0.9, 0.07, 0.3, 0.5)
      bt += (beats as number) * BEAT
    })

    // Sustained pad chords (C major pentatonic harmony)
    const padDur = loopDur * 0.5
    const pads = [
      [130.81, 164.81, 196.00],  // C3 E3 G3
      [196.00, 246.94, 293.66],  // G3 B3 D4
    ]
    pads.forEach((chord, i) => {
      chord.forEach(freq => {
        addOsc(ctx, master, freq, 'sine', startTime + i * padDur, padDur * 0.95, 0.04, 1.2, 1.5)
      })
    })

    if (!stopped()) {
      setTimeout(() => schedule(startTime + loopDur), (loopDur - 2) * 1000)
    }
  }
  return schedule
}

export default function AmbientMusic() {
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false)
  const stopRef = useRef<(() => void) | null>(null)
  const stoppedRef = useRef(false)

  const startMusic = () => {
    if (started) return
    setStarted(true)
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const master = ctx.createGain()
      master.gain.value = 0.18
      master.connect(ctx.destination)

      // Reverb
      const conv = ctx.createConvolver()
      conv.buffer = createReverb(ctx, 2.5, 2.2)
      const revG = ctx.createGain(); revG.gain.value = 0.28
      master.connect(revG); revG.connect(conv); conv.connect(ctx.destination)

      stoppedRef.current = false
      const LOOP_DUR = 44 // seconds per full loop (36 beats × 1.2s at 50 BPM)

      const schedule = buildTheme(ctx, master, LOOP_DUR, () => stoppedRef.current)
      schedule(ctx.currentTime + 0.3)
      setPlaying(true)

      stopRef.current = () => {
        stoppedRef.current = true
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5)
        setTimeout(() => { try { ctx.close() } catch {} }, 2000)
        setStarted(false)
      }
    } catch {}
  }

  // Auto-start on first user interaction
  useEffect(() => {
    const handle = () => {
      startMusic()
      document.removeEventListener('pointerdown', handle)
    }
    document.addEventListener('pointerdown', handle)
    return () => document.removeEventListener('pointerdown', handle)
  }, [])  // eslint-disable-line

  const toggle = () => {
    if (playing) {
      stopRef.current?.()
      stopRef.current = null
      setPlaying(false)
    } else {
      setStarted(false)
      startMusic()
    }
  }

  return (
    <button
      onClick={toggle}
      title={playing ? 'Выключить музыку' : 'Включить музыку'}
      className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all"
      style={{
        background: playing ? 'rgba(255,44,61,0.15)' : 'rgba(255,255,255,0.06)',
        color: playing ? '#ff2c3d' : 'rgba(225,225,225,0.35)',
        border: playing ? '1px solid rgba(255,44,61,0.35)' : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {playing ? '🎵' : '🔇'}
    </button>
  )
}
