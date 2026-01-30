// app/profile/page.tsx
import { auth } from '@/lib/auth'
import Image from 'next/image'
import { getDiscordBanner } from '@/lib/discord'

interface ExtendedUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  discordId?: string | null
  banner?: string | null
  roles?: string[] | null
  minecraftNick?: string | null
  hasPass?: boolean | null
  discordName?: string | null
}

export default async function ProfilePage() {
  const session = await auth()
  
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-[#0D1117] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Необходима авторизация</h1>
          <a 
            href="/api/auth/signin/discord" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Войти через Discord
          </a>
        </div>
      </div>
    )
  }
  
  const userData = session.user as ExtendedUser
  const cleanImage = userData.image?.trim()
  const hasImage = cleanImage && !cleanImage.includes('undefined')
  
  // Получаем баннер через Discord Bot API
  const bannerUrl = userData.discordId ? await getDiscordBanner(userData.discordId) : null

  return (
    <div className="min-h-screen bg-[#0D1117] text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Баннер */}
        {bannerUrl ? (
          <div className="w-full h-64 rounded-xl overflow-hidden mb-8">
            <Image
              src={bannerUrl}
              alt="Discord Banner"
              width={1200}
              height={320}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-full h-64 rounded-xl bg-[#21262D] flex items-center justify-center mb-8">
            <div className="text-center">
              <span className="text-xl block mb-2">Баннер не загружен</span>
              {userData.discordId && (
                <p className="text-sm text-gray-500 mt-2">
                  Discord ID: {userData.discordId}
                </p>
              )}
            </div>
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
              
              {/* Minecraft Nick — ВЫШЕ */}
              {userData.minecraftNick && (
                <div className="mt-3">
                  <p className="text-sm text-gray-500">Minecraft ник:</p>
                  <p className="text-green-400 font-bold text-2xl">
                    {userData.minecraftNick}
                  </p>
                </div>
              )}
              
              {/* Discord Nick — ПОСЕРЕДИНЕ */}
              {userData.discordName && (
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Discord:</p>
                  <p className="text-blue-400 font-semibold text-lg">
                    {userData.discordName}
                  </p>
                </div>
              )}
              
              {userData.email && (
                <p className="text-gray-400 mt-2">{userData.email}</p>
              )}
              
              {/* Discord ID — САМЫЙ НИЗ */}
              <div className="mt-6 pt-5 border-t border-[#21262D]">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Discord ID:</p>
                <p className="font-mono text-sm text-gray-300 break-all mt-1.5">
                  {userData.discordId || 'Не загружен'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Дополнительная информация */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-[#21262D] p-5 rounded-lg">
              <p className="text-sm text-gray-500">Пропуск:</p>
              <p className="font-bold text-xl mt-1">
                {userData.hasPass ? (
                  <span className="text-green-400 flex items-center gap-2">
                    <span>✅</span> Активен
                  </span>
                ) : (
                  <span className="text-yellow-400 flex items-center gap-2">
                    <span>❌</span> Отсутствует
                  </span>
                )}
              </p>
            </div>
            
            {userData.roles && userData.roles.length > 0 && (
              <div className="bg-[#21262D] p-5 rounded-lg">
                <p className="text-sm text-gray-500">Роли:</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {userData.roles.map((role, index) => (
                    <span 
                      key={index} 
                      className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium"
                    >
                      {role}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Кнопка покупки пропуска */}
          {!userData.hasPass && (
            <div className="mt-10 p-6 bg-gradient-to-r from-[#1a232a] to-[#161b22] rounded-xl border border-[#0099ff]/20">
              <h2 className="text-2xl font-bold mb-3 text-[#0099ff]">Получить пропуск</h2>
              <p className="text-gray-300 mb-5">
                Пропуск даёт доступ к эксклюзивным возможностям сервера: приватные территории, кастомные предметы и приоритетная поддержка.
              </p>
              <a 
                href="/buy-pass" 
                className="inline-flex items-center gap-2 bg-[#0099ff] hover:bg-[#0088ee] text-white font-bold py-3 px-7 rounded-lg transition-all hover:scale-[1.02] shadow-lg shadow-[#0099ff]/20"
              >
                Приобрести пропуск
                <span className="text-lg">→</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}