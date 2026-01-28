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
  roles?: string[]
  minecraftNick?: string | null
  hasPass?: boolean
}

export default async function ProfilePage() {
  const session = await auth()
  
  if (!session?.user) {
    return <div>Не авторизован</div>
  }
  
  const userData = session.user as ExtendedUser
  
  // ДОБАВЛЯЕМ ЛОГИРОВАНИЕ
  console.log('Profile Data:', {
    id: userData.id,
    name: userData.name,
    discordId: userData.discordId,
    banner: userData.banner,
    image: userData.image,
    hasPass: userData.hasPass,
    minecraftNick: userData.minecraftNick
  })

  // Проверяем, есть ли баннер
  const hasBanner = userData.banner && !userData.banner.includes('undefined')
  const hasImage = userData.image && !userData.image.includes('undefined')
  
  return (
    <div className="min-h-screen bg-[#0D1117] text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Баннер */}
        {hasBanner ? (
          <div className="w-full h-64 rounded-xl overflow-hidden mb-8">
              <img 
              src={userData.banner!} 
              alt="Discord Banner" 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
                console.error('Error loading banner:', userData.banner)
              }}
            />
          </div>
        ) : (
          <div className="w-full h-64 rounded-xl bg-[#21262D] flex items-center justify-center mb-8">
            <span className="text-xl">Баннер не найден</span>
          </div>
        )}
        
        <div className="bg-[#161B22] rounded-xl p-8 shadow-lg">
          <div className="flex items-center gap-6 mb-6">
            {/* Аватарка */}
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-[#080B0E] shadow-2xl">
                {hasImage ? (
                  <Image
                    src={userData.image!}
                    alt={userData.name || "User Avatar"}
                    width={128}
                    height={128}
                    className="object-cover"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        console.error('Error loading avatar:', userData.image)
                      }}
                  />
                ) : (
                  <div className="w-32 h-32 bg-[#21262D] flex items-center justify-center">
                    <span className="text-4xl">👤</span>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              {/* Имя пользователя */}
              <h1 className="text-3xl font-bold">
                {userData.name || 'Не указано имя'}
              </h1>
              
              <p className="text-gray-400">{userData.email}</p>
              
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
              <p className="font-semibold">{userData.hasPass ? 'Да' : 'Нет'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}