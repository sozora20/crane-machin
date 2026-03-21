import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomFortune } from '@/lib/fortunes'

export async function POST(request: Request) {
  const { clawPosition } = await request.json()

  // 50/50 win rate
  const isWin = Math.random() < 0.5

  if (isWin) {
    const activePrizes = await prisma.prize.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
    })

    const prize = activePrizes.length > 0
      ? activePrizes[Math.floor(Math.random() * activePrizes.length)]
      : null

    const session = await prisma.gameSession.create({
      data: {
        outcome: 'win',
        prizeId: prize?.id ?? null,
        clawPosition: typeof clawPosition === 'number' ? clawPosition : 0.5,
        fortune: null,
      },
    })

    if (prize) {
      await prisma.prize.update({
        where: { id: prize.id },
        data: { totalGiven: { increment: 1 } },
      })
    }

    return NextResponse.json({
      outcome: 'win',
      prize: prize ? { id: prize.id, name: prize.name } : { id: 0, name: '🎁 Подарок' },
      fortune: null,
      sessionId: session.id,
    })
  } else {
    const fortune = randomFortune()
    const session = await prisma.gameSession.create({
      data: {
        outcome: 'miss',
        prizeId: null,
        clawPosition: typeof clawPosition === 'number' ? clawPosition : 0.5,
        fortune,
      },
    })

    return NextResponse.json({
      outcome: 'miss',
      prize: null,
      fortune,
      sessionId: session.id,
    })
  }
}
