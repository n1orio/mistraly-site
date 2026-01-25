// lib/auth.ts
import { PrismaAdapter } from "@auth/prisma-adapter"
import { type NextAuthOptions } from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Добавляем кастомные поля из БД в сессию
      if (session.user) {
        session.user.id = user.id
        session.user.discordId = user.discordId
        session.user.minecraftNick = user.minecraftNick || null
        session.user.hasPass = user.hasPass
      }
      return session
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "database",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

import NextAuth from "next-auth/next"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }