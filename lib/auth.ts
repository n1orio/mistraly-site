// lib/auth.ts
declare module "next-auth" {
  interface User {
    image?: string
    banner?: string
    roles?: string[]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    discordId?: string
    banner?: string
    roles?: string[]
    minecraftNick?: string
    hasPass?: boolean
    picture?: string
  }
}

import NextAuth from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

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
    async session({ session, token }) {
      if (session.user && token) {
        // Используем (as any) для присвоения
        ;(session.user as any).banner = token.banner ?? null
        ;(session.user as any).roles = token.roles ?? []
        ;(session.user as any).discordId = token.discordId ?? null
        ;(session.user as any).image = token.picture ?? null
      }
      return session
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === "discord" && profile) {
        token.discordId = profile.id ?? undefined
        
        // Аватарка
        if (profile.image) {
          token.picture = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.image}.png`
        }
        
        // Баннер
        if (profile.banner) {
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