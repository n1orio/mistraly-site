// app/profile/page.tsx
import { auth } from '@/lib/auth'
import Image from 'next/image'

// Явно определяем тип сессии
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
  
  // Явное приведение типов
  const userData = session.user as ExtendedUser
  const discordId = userData.discordId || userData.id
  const banner = userData.banner
  
  return (
    <div className="min-h-screen bg-[#0D1117] text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Баннер */}
        {banner && (
          <div className="w-full h-64 rounded-xl overflow-hidden mb-8">
            <img 
              src={banner} 
              alt="Discord Banner" 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="bg-[#161B22] rounded-xl p-8 shadow-lg">
          <div className="flex items-center gap-6 mb-6">
            {/* Аватарка */}
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-[#080B0E] shadow-2xl">
                {userData.image ? (
                  <Image
                    src={userData.image}
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
            
            <div>
              <h1 className="text-3xl font-bold">{userData.name}</h1>
              <p className="text-gray-400">{userData.email}</p>
              
              {/* Discord ID */}
              <div className="mt-4">
                <p className="text-sm text-gray-500">Discord ID:</p>
                <p className="font-mono text-lg">{discordId}</p>
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