export function playWinSound() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const master = ctx.createGain()
    master.gain.value = 0.4
    master.connect(ctx.destination)

    // Fanfare: C5 E5 G5 C6 — rising triumph
    const fanfare = [
      { freq: 523.25, t: 0.0, dur: 0.25, vol: 0.6 },
      { freq: 659.25, t: 0.2, dur: 0.25, vol: 0.6 },
      { freq: 783.99, t: 0.4, dur: 0.25, vol: 0.6 },
      { freq: 1046.5, t: 0.6, dur: 0.55, vol: 0.8 },
      { freq: 783.99, t: 0.65, dur: 0.4, vol: 0.5 },
      { freq: 1046.5, t: 0.85, dur: 0.7, vol: 0.9 },
    ]

    fanfare.forEach(({ freq, t, dur, vol }) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'square'
      osc.frequency.value = freq
      const start = ctx.currentTime + t
      g.gain.setValueAtTime(0, start)
      g.gain.linearRampToValueAtTime(vol * 0.35, start + 0.02)
      g.gain.exponentialRampToValueAtTime(0.001, start + dur)
      osc.connect(g); g.connect(master)
      osc.start(start); osc.stop(start + dur)

      // Harmonics for richer sound
      const osc2 = ctx.createOscillator()
      const g2 = ctx.createGain()
      osc2.type = 'sawtooth'
      osc2.frequency.value = freq * 0.5
      g2.gain.setValueAtTime(0, start)
      g2.gain.linearRampToValueAtTime(vol * 0.12, start + 0.02)
      g2.gain.exponentialRampToValueAtTime(0.001, start + dur)
      osc2.connect(g2); g2.connect(master)
      osc2.start(start); osc2.stop(start + dur)
    })

    // Coin jingle after fanfare
    const coins = [1318.5, 1567.98, 2093.0, 1567.98, 1318.5]
    coins.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + 1.2 + i * 0.1
      g.gain.setValueAtTime(0.3, t)
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
      osc.connect(g); g.connect(master)
      osc.start(t); osc.stop(t + 0.3)
    })

    setTimeout(() => { try { ctx.close() } catch {} }, 3000)
  } catch {}
}
