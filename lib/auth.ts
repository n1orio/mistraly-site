// lib/auth.ts
import NextAuth from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "./prisma"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      image?: string | null
      discordId?: string | null
      discordName?: string | null
      minecraftNick?: string | undefined
      hasPass?: boolean
      banner?: string | null
    }
  }

  interface JWT {
    banner?: string | null
    discordId?: string | null
    discordName?: string | null
    minecraftNick?: string | undefined
    hasPass?: boolean
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
    async session({ session, token }: any) {
      if (session.user && token) {
        session.user.discordId = token.discordId
        session.user.banner = token.banner
        session.user.image = token.picture || token.image
        session.user.discordName = token.discordName
        session.user.minecraftNick = token.minecraftNick
        session.user.hasPass = token.hasPass
      }
      return session
    },
    
    async jwt({ token, account, profile, user }: any) {
      if (account?.provider === "discord" && profile) {
        token.discordId = (profile as any).id
        token.name = (profile as any).username
        token.discordName = (profile as any).global_name || (profile as any).username
        
        if ((profile as any).image) {
          const avatarFormat = (profile as any).image.startsWith('a_') ? 'gif' : 'png'
          // 🔴 УБРАЛИ ПРОБЕЛЫ!
          token.picture = `https://cdn.discordapp.com/avatars/${(profile as any).id}/${(profile as any).image}.${avatarFormat}?size=256`
        }
        
        // Обновляем пользователя в БД
        try {
          await prisma.user.upsert({
            where: { discordId: (profile as any).id },
            update: {
              discordId: (profile as any).id,
              name: (profile as any).username,
              image: token.picture,
              discordName: token.discordName,
            },
            create: {
              id: user?.id || (profile as any).id,
              discordId: (profile as any).id,
              name: (profile as any).username,
              email: (profile as any).email || null,
              image: token.picture,
              discordName: token.discordName,
            },
          })
        } catch (error) {
          console.error('Error updating user:', error)
        }
        
        // 🔴 УДАЛИЛИ ЗАПРОС БАННЕРА ЧЕРЕЗ /users/@me — он не работает с access_token
        // Баннер будем получать через Bot API в profile page
      }
      
      // Загружаем данные из БД
      if (user && !token.discordId) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
        })
        
        if (dbUser) {
          token.discordId = dbUser.discordId
          token.banner = dbUser.banner
          token.discordName = dbUser.discordName
          token.minecraftNick = dbUser.minecraftNick
          token.hasPass = dbUser.hasPass
          token.picture = dbUser.image
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
})