// app/api/check-nick/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const nick = searchParams.get('nick')
    
    if (!nick) {
      return NextResponse.json(
        { error: 'Nickname is required' },
        { status: 400 }
      )
    }
    
    const existingUser = await prisma.user.findFirst({
      where: { minecraftNick: nick }
    })
    
    return NextResponse.json(
      { 
        available: !existingUser,
        message: existingUser ? 'Nickname is taken' : 'Nickname is available' 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error checking nickname:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}