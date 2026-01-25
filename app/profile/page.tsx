import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { FaDiscord } from "react-icons/fa"

export default async function ProfilePage() {
  const session = await auth()

  // 1. Проверяем авторизацию
  if (!session?.user?.id) redirect("/")

  // 2. Получаем полные данные пользователя из БД
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      minecraftNick: true,
      hasPass: true,
      // Предполагаем, что эти поля существуют в вашей модели User
      discordName: true, 
      discordId: true,
    }
  })

  // Если пользователя нет в БД, отправляем на главную
  if (!dbUser) redirect("/")

  // 3. Защищенная Server Action
  async function updateMinecraftNick(formData: FormData) {
    "use server"
    const nick = formData.get("nick") as string
    
    if (!session?.user?.id) return
    
    // ПРОВЕРКА: Обновление ника только при наличии проходки
    const userToUpdate = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { hasPass: true }
    });

    if (!userToUpdate?.hasPass) {
        // Если проходки нет, просто выходим без ошибки
        console.warn(`Пользователь ${session.user.id} попытался изменить ник без проходки.`);
        return
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { minecraftNick: nick },
    })

    revalidatePath("/profile")
  }
  
  // Устанавливаем статус и его цвет
  const status = dbUser.hasPass ? "ИГРОК" : "ГОСТЬ"
  const statusColor = dbUser.hasPass ? "text-[#39FF14]" : "text-[#FF4500]"
  const isFormEnabled = dbUser.hasPass

  return (
    <main className="min-h-screen pt-32 px-6 flex justify-center">
      <div className="max-w-xl w-full bg-[#12181F] border border-white/5 rounded-[32px] p-8 h-fit shadow-2xl">
        
        {/* Блок аватара и имени */}
        <div className="flex items-center gap-5 mb-8">
          <img 
            src={session.user.image || "/default-avatar.png"} 
            className="w-16 h-16 rounded-2xl border-2 border-[#0099ff]/50" 
            alt="Аватар" 
          />
          <div>
            <h1 className="text-2xl font-bold text-white">{session.user.name}</h1>
            <p className={`${statusColor} text-sm font-bold uppercase tracking-widest`}>
              Статус: {status}
            </p>
          </div>
        </div>

        {/* Блок информации о Дискорде */}
        <div className="bg-black/10 border border-white/5 rounded-xl p-4 mb-8">
            <h2 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <FaDiscord className="text-[#5865F2]" /> Информация о Discord
            </h2>
            <p className="text-zinc-400 text-sm">
                Никнейм: <span className="text-white font-mono">{dbUser.discordName || "Не указан"}</span>
            </p>
            <p className="text-zinc-400 text-sm">
                ID: <span className="text-white font-mono">{dbUser.discordId || "Не указан"}</span>
            </p>
        </div>


        {/* Форма изменения ника Minecraft */}
        <form action={updateMinecraftNick} className="space-y-4">
          <div className="space-y-2">
            <label className="text-zinc-400 text-sm font-bold uppercase ml-1">Ник в Minecraft</label>
            <input 
              name="nick"
              type="text"
              placeholder={isFormEnabled ? "Введите ник..." : "Купите проходку, чтобы изменить ник"}
              defaultValue={dbUser.minecraftNick || ""}
              disabled={!isFormEnabled} // Отключаем, если нет проходки
              className="w-full bg-black/20 border border-white/5 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#0099ff] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          
          <button 
            type="submit"
            disabled={!isFormEnabled} // Отключаем кнопку, если нет проходки
            className="w-full bg-[#0099ff] hover:bg-[#0088ee] text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-[#0099ff]/10 disabled:bg-zinc-600 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {isFormEnabled ? "Сохранить изменения" : "Необходима проходка"}
          </button>
        </form>

        <p className="text-zinc-500 text-[12px] mt-6 text-center leading-relaxed">
          После сохранения ника голова в шапке сайта обновится автоматически в течение нескольких секунд.
        </p>
      </div>
    </main>
  )
}