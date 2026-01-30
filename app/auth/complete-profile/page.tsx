// app/auth/complete-profile/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Loader2 } from "lucide-react"

export default function CompleteProfilePage() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [minecraftNick, setMinecraftNick] = useState(session?.user?.minecraftNick || "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Сохраняем ник в базе через API роут
      const res = await fetch("/api/user/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minecraftNick: minecraftNick.trim() }),
      })

      if (!res.ok) throw new Error("Не удалось сохранить профиль")

      // Обновляем сессию
      await update({ ...session, user: { ...session?.user, minecraftNick: minecraftNick.trim() } })
      
      // Перенаправляем на главную или профиль
      router.push("/profile")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при сохранении профиля")
      setLoading(false)
    }
  }

  if (!session) {
    return <div>Загрузка...</div>
  }

  // Если профиль уже заполнен — перенаправляем
  if (session.user?.minecraftNick) {
    router.push("/profile")
    return null
  }

  return (
    <div className="min-h-screen bg-[#0D1117] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#161B22] rounded-xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-blue-400 text-2xl">🎮</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Добро пожаловать на Breeze.monster!</h1>
          <p className="text-gray-400">
            Укажите ваш никнейм в Minecraft, чтобы завершить регистрацию
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Minecraft никнейм
            </label>
            <input
              type="text"
              value={minecraftNick}
              onChange={(e) => setMinecraftNick(e.target.value)}
              className="w-full bg-[#0D1117] border border-[#30363D] rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-[#0099ff] focus:border-transparent"
              placeholder="Steve"
              required
              minLength={3}
              maxLength={16}
            />
            <p className="mt-1 text-xs text-gray-500">
              Используйте ваш реальный никнейм для получения скина и доступа к серверу
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || minecraftNick.trim().length < 3}
            className="w-full bg-[#0099ff] hover:bg-[#0088ee] text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Сохранение...
              </>
            ) : (
              "Продолжить →"
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-[#21262D] text-center text-sm text-gray-500">
          <p>
            Никнейм можно будет изменить позже в настройках профиля
          </p>
        </div>
      </div>
    </div>
  )
}