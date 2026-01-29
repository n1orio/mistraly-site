// app/profile/page.tsx
import { auth } from '@/lib/auth'
import Image from 'next/image'

interface ExtendedUser {
  id: string
  name?: string | null
  email?: string | null
  image?: string | null
  discordId?: string | null
  discordName?: string | null
  banner?: string | null
  roles?: string[]
  minecraftNick?: string | null
  hasPass?: boolean
}

// Функция для получения правильного формата баннера
function getBannerUrl(bannerHash: string | null, userId: string | null): string | null {
  if (!bannerHash || !userId) {
    console.log('No banner hash or userId');
    return null;
  }
  
  console.log('Banner hash:', bannerHash);
  console.log('User ID:', userId);
  
  // Убираем лишние префиксы, если они есть
  let cleanHash = bannerHash;
  
  // Если хеш начинается с "https://", значит это уже полный URL
  if (bannerHash.startsWith('https://')) {
    return bannerHash;
  }
  
  // Если хеш начинается с "a_", это анимированный баннер
  const isAnimated = bannerHash.startsWith('a_');
  const format = isAnimated ? 'gif' : 'png';
  const size = 1024;
  
  // Формируем правильный URL
  const url = `https://cdn.discordapp.com/banners/${userId}/${bannerHash}.${format}?size=${size}`;
  
  console.log('Generated banner URL:', url);
  
  return url;
}

export default async function ProfilePage() {
  const session = await auth()
  
  if (!session?.user) {
    return <div>Не авторизован</div>
  }
  
  const userData = session.user as ExtendedUser
  const cleanImage = userData.image?.trim()
  const hasImage = cleanImage && !cleanImage.includes('undefined')
  
  // Получаем правильный URL баннера
  const bannerUrl = userData.banner && userData.discordId 
    ? getBannerUrl(userData.banner, userData.discordId) 
    : null
  
  return (
    <div className="min-h-screen bg-[#0D1117] text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Баннер - добавлена отладочная информация */}
        <div>
          {bannerUrl ? (
            <div className="w-full h-64 rounded-xl overflow-hidden mb-8 relative">
              <Image
                src={bannerUrl}
                alt="Discord Banner"
                width={1200}
                height={320}
                className="w-full h-full object-cover"
                unoptimized
                onError={(e) => {
                  console.error('Banner failed to load:', bannerUrl);
                  console.error('Error:', e);
                }}
              />
              {/* Отладочная информация (можно удалить после тестирования) */}
              <div className="absolute top-2 right-2 bg-black/50 text-xs px-2 py-1 rounded">
                URL: {bannerUrl.length > 50 ? bannerUrl.substring(0, 50) + '...' : bannerUrl}
              </div>
            </div>
          ) : (
            <div className="w-full h-64 rounded-xl bg-[#21262D] flex items-center justify-center mb-8">
              <div className="text-center">
                <span className="text-xl block mb-2">Баннер не загружен</span>
                {/* Отладочная информация */}
                <div className="text-sm text-gray-500 mt-4">
                  <p>Banner field: {userData.banner || 'null'}</p>
                  <p>Discord ID: {userData.discordId || 'null'}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
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
              
              {/* Discord Nick */}
              {userData.discordName && (
                <p className="text-blue-400 font-semibold">
                  Discord: {userData.discordName}
                </p>
              )}
              
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
                Приобрести пропуск
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}