import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { resolveOutcome } from '@/lib/winLogic'
import { randomFortune } from '@/lib/fortunes'

export async function POST(request: Request) {
  const { clawPosition } = await request.json()

  const activePrizes = await prisma.prize.findMany({
    where: { isActive: true },
    select: { id: true, name: true, winProbability: true },
  })

  const { outcome, prize } = resolveOutcome(activePrizes)
  const fortune = outcome !== 'win' ? randomFortune() : null

  const session = await prisma.gameSession.create({
    data: {
      outcome,
      prizeId: prize?.id ?? null,
      clawPosition: typeof clawPosition === 'number' ? clawPosition : 0.5,
      fortune,
    },
  })

  if (prize) {
    await prisma.prize.update({
      where: { id: prize.id },
      data: { totalGiven: { increment: 1 } },
    })
  }

  return NextResponse.json({
    outcome,
    prize: prize ? { id: prize.id, name: prize.name } : null,
    fortune,
    sessionId: session.id,
  })
}
