// app/api/update-profile/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const minecraftNick = (formData.get('minecraftNick') as string)?.trim()
    
    if (!minecraftNick || minecraftNick.length < 3) {
      return NextResponse.json({ error: 'Invalid Minecraft nickname' }, { status: 400 })
    }

    // Обновляем профиль в базе данных
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: { minecraftNick },
    })

    return NextResponse.redirect(new URL('/profile', request.url))
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}