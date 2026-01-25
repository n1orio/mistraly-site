// lib/prisma.ts

import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client' 
import { PrismaLibSql } from '@prisma/adapter-libsql' 

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not defined in the environment variables.")
}

// 1. Создаем объект конфигурации для адаптера
const adapterConfig = {
  createClient: createClient, // Явно передаем функцию создания клиента
  url: databaseUrl,
  // Если вы используете облачный сервис (например, Turso), 
  // может потребоваться authToken
  // authToken: process.env.LIBSQL_AUTH_TOKEN, 
}

// 2. Создаем адаптер, передавая только ОДИН объект конфигурации
const adapter = new PrismaLibSql(adapterConfig)

// 3. Передаем адаптер в конструктор PrismaClient
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({ 
    adapter, 
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma