import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma" // твой файл с PrismaClient

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma), // Теперь юзеры будут в БД!
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    // В Auth.js v5 при использовании адаптера в сессию прокидывается объект user из БД
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // @ts-ignore
        session.user.minecraftNick = user.minecraftNick;
        // @ts-ignore
        session.user.hasPass = user.hasPass;
      }
      return session
    },
  },
})