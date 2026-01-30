// lib/auth.ts
import NextAuth from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./prisma"

export const { auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: "identify email guilds" } },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        // ✅ Используем type assertions для обхода TypeScript ошибок
        (session.user as any).discordId = token.discordId
        (session.user as any).banner = token.banner
        (session.user as any).roles = token.roles || []
        (session.user as any).image = token.picture
        (session.user as any).discordName = token.discordName
        (session.user as any).minecraftNick = token.minecraftNick
        (session.user as any).hasPass = token.hasPass
      }
      return session
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === "discord" && profile) {
        token.discordId = profile.id
        token.discordName = profile.global_name || profile.username
        
        if (profile.image) {
          const fmt = profile.image.startsWith("a_") ? "gif" : "png"
          // ✅ Убрал лишние пробелы
          token.picture = `https://cdn.discordapp.com/avatars/${profile.id}/${profile.image}.${fmt}?size=256`
        }
        
        try {
          // ✅ Убрал лишние пробелы
          const res = await fetch("https://discord.com/api/users/@me", {
            headers: { Authorization: `Bearer ${account.access_token}` },
          })
          if (res.ok) {
            const data = await res.json()
            if (data.banner) {
              const ext = data.banner.startsWith("a_") ? "gif" : "png"
              // ✅ Убрал лишние пробелы
              token.banner = `https://cdn.discordapp.com/banners/${data.id}/${data.banner}.${ext}?size=1024`
            }
          }
        } catch (e) {
          console.error("Banner error:", e)
        }
      }
      return token
    },
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
})