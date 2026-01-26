import NextAuth from "next-auth"
import DiscordProvider from "next-auth/providers/discord"

const auth = NextAuth({
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    }),
  ],
})

export const { auth: authFunction, signIn, signOut } = auth

// Явно экспортируем функции для маршрута с правильной сигнатурой
export const GET = auth.handlers.GET
export const POST = auth.handlers.POST