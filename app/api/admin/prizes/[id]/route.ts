import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params
  const id = parseInt(idStr)
  const data = await request.json()
  const prize = await prisma.prize.update({
    where: { id },
    data: {
      name: data.name,
      winProbability: data.winProbability,
      isActive: data.isActive,
    },
  })
  return NextResponse.json(prize)
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params
  const id = parseInt(idStr)
  // Soft delete
  await prisma.prize.update({ where: { id }, data: { isActive: false } })
  return NextResponse.json({ ok: true })
}
