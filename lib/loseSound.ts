export function playLoseSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const master = ctx.createGain()
    master.gain.value = 0.45
    master.connect(ctx.destination)

    const filt = ctx.createBiquadFilter()
    filt.type = 'lowpass'
    filt.frequency.value = 1200
    filt.connect(master)

    // Classic "wah-wah-wah-waaah" sad trombone
    // Descending chromatic: Bb4 → A4 → Ab4 → G4 → slides to C4
    const notes = [
      { start: 0.0,  freq: 466.16, endFreq: 466.16, dur: 0.22 },
      { start: 0.21, freq: 440.00, endFreq: 440.00, dur: 0.22 },
      { start: 0.42, freq: 415.30, endFreq: 415.30, dur: 0.22 },
      { start: 0.63, freq: 392.00, endFreq: 220.00, dur: 0.90 },  // slides down to sadness
    ]

    notes.forEach(({ start, freq, endFreq, dur }) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sawtooth'

      const t = ctx.currentTime + start
      osc.frequency.setValueAtTime(freq, t)
      osc.frequency.linearRampToValueAtTime(endFreq, t + dur)

      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.55, t + 0.03)
      g.gain.setValueAtTime(0.55, t + dur - 0.06)
      g.gain.linearRampToValueAtTime(0, t + dur)

      osc.connect(g); g.connect(filt)
      osc.start(t); osc.stop(t + dur)

      // Harmony a 5th below for trombone fatness
      const osc2 = ctx.createOscillator()
      const g2 = ctx.createGain()
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(freq * 0.5, t)
      osc2.frequency.linearRampToValueAtTime(endFreq * 0.5, t + dur)
      g2.gain.setValueAtTime(0, t)
      g2.gain.linearRampToValueAtTime(0.18, t + 0.03)
      g2.gain.linearRampToValueAtTime(0, t + dur)
      osc2.connect(g2); g2.connect(filt)
      osc2.start(t); osc2.stop(t + dur)
    })

    // Final "bwonk" — low thud
    const bwonk = ctx.createOscillator()
    const bg = ctx.createGain()
    bwonk.type = 'sine'
    const bt = ctx.currentTime + 1.55
    bwonk.frequency.setValueAtTime(180, bt)
    bwonk.frequency.exponentialRampToValueAtTime(60, bt + 0.35)
    bg.gain.setValueAtTime(0.5, bt)
    bg.gain.exponentialRampToValueAtTime(0.001, bt + 0.35)
    bwonk.connect(bg); bg.connect(master)
    bwonk.start(bt); bwonk.stop(bt + 0.4)

    setTimeout(() => { try { ctx.close() } catch {} }, 2500)
  } catch {}
}
