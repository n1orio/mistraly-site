// lib/prisma.ts
import { PrismaClient } from '@prisma/client'
// Импортируем адаптер и его клиента
import { createClient } from '@libsql/client' 
import { PrismaLibSql } from '@prisma/adapter-libsql'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// 1. Инициализируем клиент libSQL
const libsql = createClient({
  url: process.env.DATABASE_URL!, // Используем URL из .env
})

// 2. Создаем адаптер
const adapter = new PrismaLibSql(libsql)

// 3. Передаем адаптер в конструктор PrismaClient
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ 
    adapter, // ЭТО ОБЯЗАТЕЛЬНО ДЛЯ ВАШЕЙ ВЕРСИИ PRISMA
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma