// app/players/page.tsx
import { auth } from '@/lib/auth'
import { getAllPlayers } from '@/lib/users'
import Link from 'next/link'
import Image from 'next/image'

interface Player {
  id: string
  name: string | null
  minecraftNick: string | null
  discordName: string | null
  hasPass: boolean | null
  image: string | null
  discordId: string | null
}

export default async function PlayersPage() {
  const session = await auth()
  const players = await getAllPlayers()
  
  if (!session?.user) {
    return <div>Не авторизован</div>
  }

  return (
    <div className="min-h-screen bg-[#0D1117] text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Список игроков</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => {
            const cleanImage = player.image?.trim()
            const hasImage = cleanImage && !cleanImage.includes('undefined')
            
            return (
              <Link 
                key={player.id}
                href={`/profile/${encodeURIComponent(player.minecraftNick || player.id)}`}
                className="bg-[#161B22] rounded-xl p-6 shadow-lg hover:bg-[#21262D] transition-colors border border-[#21262D] hover:border-[#0099ff]/30"
              >
                <div className="flex items-center gap-4">
                  {/* Аватарка */}
                  <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-[#080B0E]">
                    {hasImage ? (
                      <Image
                        src={cleanImage!}
                        alt={player.name || "User Avatar"}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-[#21262D] flex items-center justify-center">
                        <span className="text-2xl">👤</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    {/* Minecraft Nick */}
                    <h2 className="text-xl font-bold text-green-400">
                      {player.minecraftNick || 'Не указан'}
                    </h2>
                    
                    {/* Discord Name */}
                    {player.discordName && (
                      <p className="text-blue-400 text-sm mt-1">
                        {player.discordName}
                      </p>
                    )}
                    
                    {/* Has Pass */}
                    <div className="mt-2 flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        player.hasPass 
                          ? 'bg-green-600/30 text-green-400' 
                          : 'bg-yellow-600/30 text-yellow-400'
                      }`}>
                        {player.hasPass ? 'Игрок ✅' : 'Гость'}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
        
        {players.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-xl">Пока нет зарегистрированных игроков</p>
          </div>
        )}
      </div>
    </div>
  )
}