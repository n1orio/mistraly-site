"use client"

import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"

export default function Profile() {
  // ✅ ПРАВИЛЬНО: включаем data в деструктуризацию
  const { data, status } = useSession()

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080B0E] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#0099ff]" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080B0E] text-white">
        <p>Не авторизован</p>
      </div>
    )
  }

  const user = data.user
  const userName = user?.name || 'Пользователь'
  const userEmail = user?.email || 'email@example.com'

  return (
    <div className="min-h-screen bg-[#080B0E] text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Личный кабинет</h1>
        <div className="bg-[#12181F]/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8 text-center">
          <h2 className="text-2xl font-bold">Привет, {userName}!</h2>
          <p className="text-zinc-400 mt-2">Email: {userEmail}</p>
        </div>
      </div>
    </div>
  )
}