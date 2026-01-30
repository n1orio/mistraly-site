// app/api/update-profile/route.ts
import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma' // или ваша база данных

export async function POST(request: Request) {
  const session = await auth()
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
  }
  
  try {
    const discordId = (session.user as any).discordId
    
    if (!discordId) {
      return NextResponse.json({ error: 'Discord ID не найден' }, { status: 400 })
    }
    
    // Получаем токен доступа пользователя
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'discord'
      }
    })
    
    if (!account?.access_token) {
      return NextResponse.json({ error: 'Токен доступа не найден' }, { status: 400 })
    }
    
    // Запрашиваем данные пользователя из Discord API
    const response = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${account.access_token}`
      }
    })
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Ошибка получения данных из Discord' }, { status: 500 })
    }
    
    const discordUserData = await response.json()
    
    // Обновляем профиль в базе данных
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: discordUserData.username,
        banner: discordUserData.banner, // Сохраняем хеш баннера
        image: discordUserData.avatar 
          ? `https://cdn.discordapp.com/avatars/${discordId}/${discordUserData.avatar}.${discordUserData.avatar.startsWith('a_') ? 'gif' : 'png'}?size=256`
          : undefined
      }
    })
    
    return NextResponse.redirect(new URL('/profile', request.url))
    
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Ошибка обновления профиля' }, { status: 500 })
  }
}