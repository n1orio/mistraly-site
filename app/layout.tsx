import type { Metadata } from "next";
import Header from "@/components/Header"
import localFont from "next/font/local";
import "./globals.css";
// 1. Импортируем обертку для сессий (которую мы создали на предыдущем шаге)
import SessionWrapper from "@/components/SessionWrapper";

// Настраиваем шрифт
const sfPro = localFont({
  src: "./fonts/SF-Pro-Display-Bold.otf",
  variable: "--font-sf-pro", // Эта переменная теперь будет доступна в Tailwind
});

// Можно добавить метаданные для сайта
export const metadata: Metadata = {
  title: "Breeze.monster — Minecraft Server",
  description: "Уникальный ванильный сервер",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      {/* 
        2. В className body добавляем sfPro.variable. 
        Это позволит использовать шрифт через класс font-sf (если ты настроил tailwind)
      */}
      <body className={`${sfPro.variable} bg-[#12181F] antialiased`}>
        {/* 
          3. Оборачиваем всё в SessionWrapper. 
          Без него Header выдаст ошибку при попытке вызвать useSession()
        */}
        <SessionWrapper>
          <Header />
          {children} 
        </SessionWrapper>
      </body>
    </html>
  )
}