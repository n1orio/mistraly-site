// app/auth/complete-profile/page.tsx
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function CompleteProfilePage() {
  const session = await auth()
  
  // Если пользователь не авторизован - редирект на главную
  if (!session?.user) {
    redirect('/')
  }
  
  // Если профиль уже заполнен - редирект на профиль
  if (session.user.minecraftNick) {
    redirect('/profile')
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

        <form action="/api/update-profile" method="POST" className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">
              Minecraft никнейм
            </label>
            <input
              type="text"
              name="minecraftNick"
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

          <button
            type="submit"
            className="w-full bg-[#0099ff] hover:bg-[#0088ee] text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            Продолжить →
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