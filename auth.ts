// auth.ts
import NextAuth from "next-auth"
import Discord from "next-auth/providers/discord"

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    // Эта функция вызывается при каждой проверке сессии
    async session({ session, token }) {
      // Имитируем получение данных из базы данных
      // В будущем тут будет запрос к твоей БД (например через Prisma или Bun:sqlite)
      if (session.user) {
        // Добавляем кастомные поля в объект пользователя
        // @ts-ignore (пока не настроены типы в d.ts)
        session.user.hasPass = true; // Куплена ли проходка
        // @ts-ignore
        session.user.minecraftNick = "Evor"; // Ник игрока
      }
      return session
    },
  },
})