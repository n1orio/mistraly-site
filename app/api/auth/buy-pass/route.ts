// app/api/buy-pass/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await auth()
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Not authorized' }, 
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { minecraftNick } = body
    
    if (!minecraftNick) {
      return NextResponse.json(
        { error: 'Minecraft nickname is required' }, 
        { status: 400 }
      )
    }
    
    // Проверка на занятость ника
    const existingUser = await prisma.user.findFirst({
      where: { minecraftNick }
    })
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'This nickname is already taken' }, 
        { status: 400 }
      )
    }
    
    // Обновление профиля
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        minecraftNick,
        hasPass: true,
      },
    })
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Pass successfully purchased' 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error purchasing pass:', error)
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    )
  }
}