// lib/users.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function getUserByMinecraftNick(minecraftNick: string) {
  try {
    const user = await prisma.user.findFirst({
      where: {
        minecraftNick: {
          equals: minecraftNick,
          mode: 'insensitive' // Регистронезависимый поиск
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        discordId: true,
        minecraftNick: true,
        hasPass: true,
        discordName: true,
      }
    })
    
    return user
  } catch (error) {
    console.error('Error fetching user by minecraft nick:', error)
    return null
  }
}

export async function getAllPlayers() {
  try {
    const users = await prisma.user.findMany({
      where: {
        minecraftNick: {
          not: null
        }
      },
      select: {
        id: true,
        name: true,
        minecraftNick: true,
        discordName: true,
        hasPass: true,
        image: true,
        discordId: true
      },
      orderBy: {
        minecraftNick: 'asc'
      }
    })
    
    return users
  } catch (error) {
    console.error('Error fetching all players:', error)
    return []
  }
}