// lib/auth.ts
import NextAuth, { NextAuthOptions } from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "identify email guilds",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ account }) {
      if (account?.provider === "discord") {
        return true
      }
      return false
    },

    async session({ session, token, user }) {
      // Используем приведение типа для обхода ошибки
      (session.user as any).id = token.sub || user.id
      ;(session.user as any).discordId = token.discordId || (user as any).discordId || null
      ;(session.user as any).minecraftNick = token.minecraftNick || (user as any).minecraftNick || null
      ;(session.user as any).hasPass = token.hasPass ?? (user as any).hasPass ?? false
      ;(session.user as any).discordName = token.discordName || (user as any).discordName || null
      ;(session.user as any).roles = token.roles || (user as any).roles || []
      
      return session
    },

    async jwt({ token, account, profile }) {
      if (account?.provider === "discord" && profile) {
        token.discordId = (profile as any).id
        token.discordName = (profile as any).global_name || (profile as any).username || null
      }
      return token
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export const { GET, POST } = NextAuth(authOptions)

export const auth = () => NextAuth(authOptions)