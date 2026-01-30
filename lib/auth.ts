// lib/auth.ts
import NextAuth from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

declare module "next-auth/jwt" {
  interface JWT {
    banner?: string | null
    discordId?: string | null
    discordName?: string | null
    minecraftNick?: string | undefined
    hasPass?: boolean
    roles?: string[]
    picture?: string | null
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
    async signIn({ user, account, profile }) {
      if (profile?.id && user.id) {
        const avatarUrl = (profile as any).image
          ? `https://cdn.discordapp.com/avatars/${(profile as any).id}/${(profile as any).image}.${(profile as any).image.startsWith('a_') ? 'gif' : 'png'}?size=256`
          : null
        
await prisma.user.upsert({
  where: { id: user.id },
  update: {
    discordId: (profile as any).id,
    name: (profile as any).username,
    image: avatarUrl
  },
  create: {
    id: user.id,
    discordId: (profile as any).id,
    name: (profile as any).username,
    email: user.email || null,
    image: avatarUrl
  },
})
      }
      return true
    },
    async session({ session, token }) {
      if (session.user && token) {
        ;(session.user as any).discordId = token.discordId
        ;(session.user as any).banner = token.banner
        ;(session.user as any).roles = token.roles || []
        ;(session.user as any).image = token.picture || token.image
        ;(session.user as any).discordName = token.discordName
        ;(session.user as any).minecraftNick = token.minecraftNick
        ;(session.user as any).hasPass = token.hasPass
      }
      return session
    },
    async jwt({ token, account, profile, user }) {
      if (account?.provider === "discord" && profile) {
        token.discordId = (profile as any).id
        token.name = (profile as any).username
        token.discordName = (profile as any).global_name || (profile as any).username
        
        if ((profile as any).image) {
          const avatarFormat = (profile as any).image.startsWith('a_') ? 'gif' : 'png'
          token.picture = `https://cdn.discordapp.com/avatars/${(profile as any).id}/${(profile as any).image}.${avatarFormat}?size=256`
        }
        
        try {
          const response = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${account.access_token}` },
          })
          
          if (response.ok) {
            const userData = await response.json()
            if (userData.banner) {
              const isAnimated = userData.banner.startsWith('a_')
              const extension = isAnimated ? 'gif' : 'png'
              token.banner = `https://cdn.discordapp.com/banners/${userData.id}/${userData.banner}.${extension}?size=1024`
            }
          }
        } catch (error) {
          console.error('Error fetching banner:', error)
        }
      }
      
      if (user && !token.discordId) {
        token.discordId = (user as any).discordId
        token.banner = (user as any).banner
        token.discordName = (user as any).discordName
        token.minecraftNick = (user as any).minecraftNick
        token.hasPass = (user as any).hasPass
        token.roles = (user as any).roles
      }
      
      return token
    },
  },
  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },
})