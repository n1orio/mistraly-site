// lib/auth.ts
import NextAuth from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

declare module "next-auth" {
  interface User {
    banner?: string
    roles?: string[]
  }
  
  interface Session {
    User: {  // МАЛЕНЬКАЯ буква!
      banner?: string | null
      roles?: string[]
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    discordId?: string
    banner?: string
    roles?: string[]
    minecraftNick?: string
    hasPass?: boolean
  }
}

export const { 
  handlers: { GET, POST }, 
  auth,
  signIn, 
  signOut 
} = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
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
    async session({ session, user }) {
      if (session.user && user) {
        // discordId уже есть в базе, не нужно его копировать
        session.user.banner = undefined
        session.user.roles = []
      }
      return session
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === "discord" && profile) {
        token.discordId = profile.id ?? undefined
        
        if (profile.banner) {
          // Убрал лишние пробелы в URL
          token.banner = `https://cdn.discordapp.com/banners/${profile.id}/${profile.banner}?size=1024`
        }
      }
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
  trustHost: true,
})