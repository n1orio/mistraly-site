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
    async signIn({ user, account, profile }) {
      if (profile?.id && user.id) {
        await prisma.user.update({
          where: { id: user.id },
          data: {  // ← ПРАВИЛЬНО: "data:" (без опечаток!)
            discordId: (profile as any).id,
            name: (profile as any).username,
            image: (profile as any).image 
              ? `https://cdn.discordapp.com/avatars/${(profile as any).id}/${(profile as any).image}.png`
              : undefined
          },
        })
      }
      return true
    },
    async session({ session, token }) {
      if (session.user && token) {
        if (token.banner && !token.banner.includes('undefined')) {
          ;(session.user as any).banner = token.banner
        }
        
        ;(session.user as any).roles = token.roles ?? []
        ;(session.user as any).discordId = token.discordId ?? null
        ;(session.user as any).image = token.picture ?? null
        ;(session.user as any).discordName = token.discordName ?? null
      }
      return session
    },
    async jwt({ token, account, profile, user }) {
      if (account?.provider === "discord" && profile) {
        token.discordId = (profile as any).id ?? undefined
        token.name = (profile as any).username
        token.discordName = (profile as any).global_name || (profile as any).username
        
        // Аватарка
        if ((profile as any).image) {
          token.picture = `https://cdn.discordapp.com/avatars/${(profile as any).id}/${(profile as any).image}.png`
        }
        
        // Баннер - ЗАПРОС К DISCORD API
        try {
          const response = await fetch('https://discord.com/api/users/@me', {
            headers: {
              Authorization: `Bearer ${account.access_token}`,
            },
          })
          
          if (response.ok) {
            const userData = await response.json()
            
            if (userData.banner) {
              // ОПРЕДЕЛЯЕМ ФОРМАТ БАННЕРА (анимированный = GIF, обычный = PNG)
              const extension = userData.banner.startsWith('a_') ? 'gif' : 'png'
              const bannerId = userData.banner.replace('a_', '')
              token.banner = `https://cdn.discordapp.com/banners/${userData.id}/${bannerId}.${extension}?size=1024`
            }
          }
        } catch (error) {
          console.error('Error fetching banner:', error)
        }
      }
      
      if (user && !(token as any).discordId) {
        ;(token as any).discordId = (user as any).discordId
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