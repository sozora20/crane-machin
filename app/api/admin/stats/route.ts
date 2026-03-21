import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const [total, wins, prizesGiven] = await Promise.all([
    prisma.gameSession.count(),
    prisma.gameSession.count({ where: { outcome: 'win' } }),
    prisma.prize.aggregate({ _sum: { totalGiven: true } }),
  ])
  return NextResponse.json({
    total,
    wins,
    prizesGiven: prizesGiven._sum.totalGiven ?? 0,
  })
}
