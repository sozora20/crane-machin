import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const prizes = await prisma.prize.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(prizes)
}

export async function POST(request: Request) {
  const { name, winProbability } = await request.json()
  if (!name || typeof winProbability !== 'number') {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 })
  }
  const prize = await prisma.prize.create({
    data: { name, winProbability: Math.min(1, Math.max(0, winProbability)) },
  })
  return NextResponse.json(prize, { status: 201 })
}
