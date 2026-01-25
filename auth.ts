// lib/auth.ts
import { PrismaAdapter } from "@auth/prisma-adapter"
import { NextAuthOptions } from "next-auth"
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
      // Передаём ID и доп. поля в сессию
      session.user.id = user.id
      session.user.discordId = user.discordId
      session.user.minecraftNick = user.minecraftNick
      session.user.hasPass = user.hasPass
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.discordId = user.discordId
      }
      return token
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "database",
  },
}

import NextAuth from "next-auth"

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }