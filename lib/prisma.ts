// lib/prisma.ts

import { PrismaClient } from '@prisma/client'
// Оставляем импорт createClient, но используем его по-другому
import { createClient } from '@libsql/client' 
import { PrismaLibSql } from '@prisma/adapter-libsql' 

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined in the environment variables.")
}

// 1. Создаем адаптер, передавая ему функцию инициализации и URL-адрес
const adapter = new PrismaLibSql(createClient, {
  url: databaseUrl,
  // Если у вас есть другие параметры, такие как authToken, добавьте их сюда
})

// 2. Передаем адаптер в конструктор PrismaClient
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ 
    adapter,
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma