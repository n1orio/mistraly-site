// app/profile/[minecraftNick]/page.tsx
import { auth } from '@/lib/auth'
import Image from 'next/image'
import { getDiscordBanner } from '@/lib/discord'
import { getUserByMinecraftNick } from '@/lib/users'

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

interface ProfileUser {
  id: string
  name: string | null
  email: string | null
  image: string | null
  discordId: string | null
  minecraftNick: string | null
  hasPass: boolean | null
  discordName: string | null
  isCurrentUser: boolean
}

export default async function ProfileByMinecraftNickPage({
  params
}: {
  params: { minecraftNick: string }
}) {
  const session = await auth()
  const currentUserId = session?.user?.id
  
  // Получаем информацию о пользователе по нику Майнкрафт
  const profileUser = await getUserByMinecraftNick(params.minecraftNick)
  
  if (!profileUser) {
    return (
      <div className="min-h-screen bg-[#0D1117] text-white p-8 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Игрок не найден</h1>
          <p className="text-gray-400 mb-6">
            Игрок с ником "{decodeURIComponent(params.minecraftNick)}" не найден в базе данных
          </p>
          <a 
            href="/profile" 
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Вернуться в мой профиль
          </a>
        </div>
      </div>
    )
  }
  
  const userData: ProfileUser = {
    ...profileUser,
    isCurrentUser: currentUserId === profileUser.id
  }
  
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
              
              {/* Minecraft Nick */}
              {userData.minecraftNick && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Minecraft:</p>
                  <p className="text-green-400 font-bold text-xl">
                    {userData.minecraftNick}
                  </p>
                </div>
              )}
              
              {/* Discord Nick */}
              {userData.discordName && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500">Discord:</p>
                  <p className="text-blue-400 font-semibold text-lg">
                    {userData.discordName}
                  </p>
                </div>
              )}
              
              {userData.email && (
                <p className="text-gray-400 mt-2">{userData.email}</p>
              )}
              
              {/* Discord ID */}
              <div className="mt-6 pt-4 border-t border-[#21262D]">
                <p className="text-xs text-gray-500 uppercase tracking-wider">Discord ID:</p>
                <p className="font-mono text-sm text-gray-300 break-all mt-1">
                  {userData.discordId || 'Не загружен'}
                </p>
              </div>
            </div>
          </div>
          
          {/* Дополнительная информация */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-[#21262D] p-4 rounded-lg">
              <p className="text-sm text-gray-500">Has Pass:</p>
              <p className="font-semibold">{userData.hasPass ? 'Да ✅' : 'Нет ❌'}</p>
            </div>
            
          </div>
          
          {/* Кнопка возврата */}
          <div className="mt-8 flex gap-4">
            <a 
              href="/profile" 
              className="inline-block bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Мой профиль
            </a>
            
            {!userData.isCurrentUser && (
              <a 
                href="/players" 
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Список игроков
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}