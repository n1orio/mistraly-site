// app/layout.tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { auth } from '@/lib/auth'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Breeze.monster",
  description: "Minecraft сервер",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await auth()
  
  return (
    <html lang="ru">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}