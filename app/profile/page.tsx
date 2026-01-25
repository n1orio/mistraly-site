// app/profile/page.tsx
"use client"

import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"
import Image from "next/image"

export default function ProfilePage() {
  // Правильная деструктуризация с переименованием
  const {  : session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080B0E] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#0099ff]" />
      </div>
    )
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080B0E] text-white">
        Не авторизован
      </div>
    )
  }

  const { user } = session

  return (
    <div className="min-h-screen bg-[#080B0E] text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">Личный кабинет</h1>

        <div className="bg-[#12181F]/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {user.image ? (
              <Image
                src={user.image}
                alt="Discord avatar"
                width={96}
                height={96}
                className="rounded-full border-2 border-white/20"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center">
                👤
              </div>
            )}

            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-zinc-400">ID: {user.discordId}</p>
              
              {user.minecraftNick && (
                <p className="text-lg text-[#0099ff] font-mono mt-2">@{user.minecraftNick}</p>
              )}

              <div className={`mt-3 inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${
                user.hasPass 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {user.hasPass ? '✅ Есть проходка' : '❌ Нет проходки'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}