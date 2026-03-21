import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const sessions = await prisma.gameSession.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      outcome: true,
      fortune: true,
      createdAt: true,
      prize: { select: { name: true } },
    },
  })
  return NextResponse.json(sessions)
}
