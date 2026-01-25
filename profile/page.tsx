"use client"

import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ProfilePage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080B0E] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#0099ff]" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#080B0E] text-white px-4">
        <h1 className="text-2xl font-bold mb-4">Доступ запрещён</h1>
        <p className="text-zinc-400 mb-6">Войдите, чтобы увидеть свой профиль.</p>
        <Button asChild>
          <Link href="/">На главную</Link>
        </Button>
      </div>
    )
  }

  const { user } = session
  const hasPass = user.hasPass || false
  const mcNick = user.minecraftNick || null

  // URL аватарки
  const avatarUrl = mcNick
    ? `https://minotar.net/helm/${mcNick}/128`
    : `https://minotar.net/helm/MHF_Steve/128`

  return (
    <div className="min-h-screen bg-[#080B0E] text-white py-12 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center font-sf">Личный кабинет</h1>

        <div className="bg-[#12181F]/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 md:p-8">
          {/* Аватар + Инфо */}
          <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
            <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-[#090D10] border-2 border-white/10">
              <img
                src={avatarUrl}
                alt="Minecraft Head"
                className="w-full h-full object-cover"
                style={{ imageRendering: 'pixelated' }}
              />
            </div>

            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold text-white">{user.name}</h2>
              {mcNick ? (
                <p className="text-lg text-[#0099ff] font-mono mt-1">@{mcNick}</p>
              ) : (
                <p className="text-zinc-400 mt-1">Minecraft ник не задан</p>
              )}

              <div className="mt-3 inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                {hasPass 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'}
              >
                {hasPass ? '✅ Есть проходка' : '❌ Нет проходки'}
              </div>
            </div>
          </div>

          {/* Действия */}
          {!hasPass && (
            <div className="bg-[#12181F]/70 border border-[#0099ff]/20 rounded-xl p-5 mb-6">
              <h3 className="text-xl font-bold mb-2 text-[#0099ff]">Получите доступ к серверу</h3>
              <p className="text-zinc-300 mb-4">
                Купите проходку, выберите свой Minecraft ник и начните играть на Breeze.monster!
              </p>
              <Button asChild className="bg-[#0099ff] hover:bg-white hover:text-black text-white font-bold">
                <Link href="/shop">Купить проходку</Link>
              </Button>
            </div>
          )}

          {hasPass && !mcNick && (
            <div className="bg-[#12181F]/70 border border-yellow-500/20 rounded-xl p-5 mb-6">
              <h3 className="text-xl font-bold mb-2 text-yellow-400">Выберите никнейм</h3>
              <p className="text-zinc-300 mb-4">
                Вы купили проходку, но не указали Minecraft ник. Перейдите в настройки, чтобы завершить регистрацию.
              </p>
              <Button asChild variant="outline" className="border-[#0099ff] text-[#0099ff] hover:bg-[#0099ff]/10">
                <Link href="/settings">Настройки</Link>
              </Button>
            </div>
          )}

          {/* Доп. инфо */}
          <div className="text-sm text-zinc-500 mt-8 pt-6 border-t border-white/5">
            <p>Email: <span className="text-zinc-300">{user.email}</span></p>
            <p>ID: <span className="text-zinc-300 font-mono">{user.id}</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}