export interface PrizeOption {
  id: number
  name: string
  winProbability: number
}

export interface GameOutcome {
  outcome: 'win' | 'miss' | 'drop'
  prize?: PrizeOption
}

export function resolveOutcome(
  prizes: PrizeOption[],
  random: () => number = Math.random
): GameOutcome {
  if (prizes.length === 0) return { outcome: 'miss' }

  const totalWinChance = prizes.reduce((sum, p) => sum + p.winProbability, 0)
  const roll = random()

  if (roll > totalWinChance) return { outcome: 'miss' }

  // 15% of win events become drops
  const dropThreshold = totalWinChance * 0.15
  if (roll < dropThreshold) return { outcome: 'drop' }

  // Weighted prize selection from the remaining range
  const winRoll = (roll - dropThreshold) / (totalWinChance - dropThreshold)
  let cumulative = 0
  const total = prizes.reduce((s, p) => s + p.winProbability, 0)
  for (const prize of prizes) {
    cumulative += prize.winProbability / total
    if (winRoll <= cumulative) return { outcome: 'win', prize }
  }

  return { outcome: 'win', prize: prizes[prizes.length - 1] }
}
