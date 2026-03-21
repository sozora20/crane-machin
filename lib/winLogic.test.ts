import { resolveOutcome, type PrizeOption } from './winLogic'

const prizes: PrizeOption[] = [
  { id: 1, name: 'Приз А', winProbability: 0.5 },
  { id: 2, name: 'Приз Б', winProbability: 0.3 },
]

describe('resolveOutcome', () => {
  it('returns miss when no active prizes', () => {
    const result = resolveOutcome([], Math.random)
    expect(result.outcome).toBe('miss')
  })

  it('returns win when random is low enough', () => {
    // total win chance = 0.8, drop zone = 0–0.12 (15% of 0.8)
    // win zone = 0.12–0.8
    const result = resolveOutcome(prizes, () => 0.5)
    expect(result.outcome).toBe('win')
    expect(result.prize).toBeDefined()
  })

  it('returns drop when random falls in drop zone', () => {
    // drop zone = 0 to totalWin*0.15 = 0.12
    const result = resolveOutcome(prizes, () => 0.05)
    expect(result.outcome).toBe('drop')
  })

  it('returns miss when random exceeds totalWinChance', () => {
    const result = resolveOutcome(prizes, () => 0.95)
    expect(result.outcome).toBe('miss')
  })

  it('selects prize by weighted random', () => {
    // With random=0.2 (above drop zone 0.12), falls in prize А range
    const result = resolveOutcome(prizes, () => 0.2)
    expect(result.outcome).toBe('win')
  })
})
