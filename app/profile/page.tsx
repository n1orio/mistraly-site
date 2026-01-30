// app/profile/page.tsx
import { auth } from '@/lib/auth'
import Image from 'next/image'

interface ExtendedUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  discordId?: string | null
  banner?: string | null
  minecraftNick?: string | null
  hasPass?: boolean | null
  discordName?: string | null
}

// Цвет по умолчанию для полоски (синий Discord)
const DEFAULT_ACCENT_COLOR = '#5865F2'

export default async function ProfilePage() {
  const session = await auth()
  
  if (!session?.user) {
    return <div>Не авторизован</div>
  }
  
  const userData = session.user as ExtendedUser
  const cleanImage = userData.image?.trim()
  const hasImage = cleanImage && !cleanImage.includes('undefined')
  const bannerUrl = userData.banner

  return (
    <div className="min-h-screen bg-[#0D1117] text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Баннер - если есть */}
        {bannerUrl ? (
          <div className="w-full h-64 rounded-xl overflow-hidden mb-8 relative">
            <Image
              src={bannerUrl}
              alt="Discord Banner"
              width={1200}
              height={320}
              className="w-full h-full object-cover"
              unoptimized
            />
            {/* Полоска цвета внизу (цвет по умолчанию) */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ backgroundColor: DEFAULT_ACCENT_COLOR }}
            />
          </div>
        ) : (
          // Если баннера нет - показываем цветную полоску
          <div className="w-full h-20 rounded-xl mb-8 overflow-hidden relative">
            <div className="w-full h-full bg-gradient-to-r from-[#161B22] to-[#21262D] flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-2">🎨</div>
                <p className="text-white/70 text-sm">Баннер профиля Discord</p>
              </div>
            </div>
            {/* Цветная полоска внизу */}
            <div 
              className="absolute bottom-0 left-0 right-0 h-1"
              style={{ backgroundColor: DEFAULT_ACCENT_COLOR }}
            />
          </div>
        )}
        
        <div className="bg-[#161B22] rounded-xl p-8 shadow-lg">
          <div className="flex items-center gap-6 mb-6">
            {/* Аватарка */}
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-[#080B0E] shadow-2xl">
                {hasImage ? (
                  <Image
                    src={cleanImage!}
                    alt={userData.name || "User Avatar"}
                    width={128}
                    height={128}
                    className="object-cover"
                  />
                ) : (
                  <div className="w-32 h-32 bg-[#21262D] flex items-center justify-center">
                    <span className="text-4xl">👤</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1">
              <h1 className="text-3xl font-bold">
                {userData.name || 'Не указано имя'}
              </h1>
              
              {/* Отображение ников: Minecraft + Discord или только Discord */}
              <div className="mt-2 space-y-1">
                {userData.hasPass && userData.minecraftNick && (
                  <p className="text-green-400 font-semibold text-lg">
                    🎮 {userData.minecraftNick}
                  </p>
                )}
                {userData.discordName && (
                  <p className="text-blue-400 font-semibold text-lg">
                    💬 {userData.discordName}
                  </p>
                )}
              </div>
              
              <p className="text-gray-400 mt-2">{userData.email}</p>
              
              {/* Discord ID */}
              <div className="mt-4">
                <p className="text-sm text-gray-500">Discord ID:</p>
                <p className="font-mono text-lg break-all">
                  {userData.discordId || 'Не загружен'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Дополнительная информация */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-[#21262D] p-4 rounded-lg">
              <p className="text-sm text-gray-500">Minecraft Nick:</p>
              <p className="font-semibold">{userData.minecraftNick || 'Не указан'}</p>
            </div>
            
            <div className="bg-[#21262D] p-4 rounded-lg">
              <p className="text-sm text-gray-500">Has Pass:</p>
              <p className="font-semibold">{userData.hasPass ? 'Да ✅' : 'Нет ❌'}</p>
            </div>
          </div>
          
          {/* Кнопка покупки пропуска */}
          {!userData.hasPass && (
            <div className="mt-8 p-6 bg-[#21262D] rounded-lg">
              <h2 className="text-2xl font-bold mb-4">Купить пропуск</h2>
              <p className="text-gray-400 mb-4">
                Получите доступ к эксклюзивным возможностям сервера
              </p>
              <a 
                href="/buy-pass" 
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Приобрести пропуск за 350₽
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}