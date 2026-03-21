import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const prizes = await prisma.prize.findMany({
    where: { isActive: true },
    select: { id: true, name: true, winProbability: true },
  })
  return NextResponse.json(prizes)
}
