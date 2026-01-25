// lib/prisma.ts

import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client' 
// Используем вашу форму импорта (PrismaLibSql)
import { PrismaLibSql } from '@prisma/adapter-libsql' 

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  // Добавьте это, чтобы поймать ошибку отсутствия .env
  throw new Error("DATABASE_URL is not defined in the environment variables.")
}

// 1. Инициализируем клиент libSQL
const libsql = createClient({
  url: databaseUrl, 
})

// 2. Создаем адаптер
const adapter = new PrismaLibSql(libsql)

// 3. Передаем адаптер в конструктор PrismaClient
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ 
    adapter, // Обязательное поле для новой конфигурации
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma