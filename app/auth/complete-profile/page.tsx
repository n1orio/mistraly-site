// app/page.tsx
import { auth } from '@/lib/auth'
import Link from 'next/link'

export default async function HomePage() {
  const session = await auth()
  
  return (
    <div className="min-h-screen bg-[#0D1117] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="text-white">Breeze</span>
            <span className="text-[#0099ff]">.monster</span>
          </h1>
          <p className="text-2xl text-gray-400 mb-12 max-w-2xl mx-auto">
            Добро пожаловать на наш сервер Minecraft. Присоединяйся к сообществу!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {session?.user ? (
              <>
                <Link
                  href="/profile"
                  className="bg-[#0099ff] hover:bg-[#0088ee] text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors"
                >
                  Мой профиль
                </Link>
                <Link
                  href="/players"
                  className="bg-[#21262D] hover:bg-[#30363D] text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors border border-[#30363D]"
                >
                  Список игроков
                </Link>
              </>
            ) : (
              <Link
                href="/api/auth/signin/discord"
                className="bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8756 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0571c2.0528 1.5076 4.0413 2.4228 5.9929 3.0244a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1093c-.6528-.2476-1.2743-.5495-1.8722-.8924a.077.077 0 01-.0076-.1281c.1258-.0943.2485-.1917.3712-.286.0333-.0251.0703-.0464.1034-.0714.9526-.6923 1.9821-1.2594 3.1938-1.5573a.0766.0766 0 01.0953.0444c.0258.0964.0477.1898.0707.2853.0536.2428.1071.4845.1672.7252a.076.076 0 01-.0453.0934c-.7657.43-1.4723.943-2.1152 1.5238a.0766.0766 0 00-.0167.1057c.1596.3409.3278.6787.5014 1.0135a.076.076 0 00.0842.0396c3.9278-1.7933 6.7832-4.8568 8.095-8.5147a.0764.0764 0 00-.0431-.0995c-.6608-.3439-1.348-1.0743-1.617-1.8501a.0769.0769 0 01.039-.0995c.2247-.1437.4448-.294.6614-.4482a.0756.0756 0 01.0872-.0127c4.8403 2.218 8.2272 6.3738 9.313 10.9668a.076.076 0 00.0421.0538c.42.1659.8272.3533 1.216 0.5683a.0768.0768 0 00.041-.0145c.4986-.3623.9732-.7636 1.4233-1.2018a.0765.0765 0 00.0208-.0826c-.092-.9173-.6213-3.1013-1.9126-5.3864a.076.076 0 01-.0085-.0762c.0702-.3678.129-.7208.1823-1.0793a.0766.0766 0 01.0761-.065c3.9016-.7533 7.229-3.0534 9.2898-6.4002a.0723.0723 0 00.0085-.0762 19.603 19.603 0 00-1.3657-4.7668.0739.0739 0 00-.0794-.0321z" />
                </svg>
                Войти через Discord
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}