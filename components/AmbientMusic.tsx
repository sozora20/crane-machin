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

// Dramatic noir theme: Am → F → C → E (minor loop)
// Bass + melody in dark minor key
function buildTheme(ctx: AudioContext, master: AudioNode, loopDur: number, stopped: () => boolean) {
  const BPM = 58
  const BEAT = 60 / BPM
  const MEAS = BEAT * 4

  // Bass line pattern (Am minor feel)
  const bassNotes = [
    // Am        F           C           E
    [110.0, 4], [87.31, 2], [87.31, 2],
    [130.81, 2], [130.81, 2],
    [164.81, 2], [155.56, 2],
    [110.0, 4],
  ]

  // Melody in Am (dark, brooding)
  const melodyLine = [
    // pitch, beats, delay
    [440.0, 1.5], [392.0, 0.5], [349.23, 2],
    [392.0, 1], [440.0, 1], [523.25, 2],
    [493.88, 1.5], [440.0, 0.5], [392.0, 2],
    [349.23, 1], [329.63, 1], [293.66, 2],
  ]

  const schedule = (startTime: number) => {
    if (stopped()) return
    let bt = startTime

    // Bass
    bassNotes.forEach(([freq, beats]) => {
      addOsc(ctx, master, freq as number, 'sawtooth', bt, (beats as number) * BEAT * 0.85, 0.18, 0.05, 0.2)
      addOsc(ctx, master, (freq as number) * 2, 'sine', bt, (beats as number) * BEAT * 0.7, 0.06, 0.02, 0.15)
      bt += (beats as number) * BEAT
    })

    // Melody (starts 2 beats after bass)
    let mt = startTime + BEAT * 2
    melodyLine.forEach(([freq, beats]) => {
      addOsc(ctx, master, freq as number, 'triangle', mt, (beats as number) * BEAT * 0.8, 0.12, 0.05, 0.3)
      mt += (beats as number) * BEAT
    })

    // Pad chords underneath
    const pads = [
      [110.0, 138.59, 164.81], // Am
      [87.31, 110.0, 130.81],  // F
      [130.81, 164.81, 196.0], // C
      [164.81, 196.0, 246.94], // Em
    ]
    pads.forEach((chord, i) => {
      chord.forEach(freq => {
        addOsc(ctx, master, freq, 'sine', startTime + i * MEAS, MEAS * 0.95, 0.05, 0.4, 0.6)
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
      const LOOP_DUR = 32 // seconds per full loop

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
        background: playing ? 'rgba(187,154,247,0.2)' : 'rgba(255,255,255,0.06)',
        color: playing ? '#BB9AF7' : 'rgba(192,202,245,0.4)',
        border: playing ? '1px solid rgba(187,154,247,0.4)' : '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {playing ? '🎵' : '🔇'}
    </button>
  )
}
