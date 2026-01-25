import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

export default async function ProfilePage() {
  const session = await auth()

  // Если не вошел — отправляем на главную
  if (!session?.user) redirect("/")

  // Функция сохранения ника (выполнится на сервере)
  async function updateMinecraftNick(formData: FormData) {
    "use server"
    const nick = formData.get("nick") as string
    
    if (!session?.user?.id) return

    await prisma.user.update({
      where: { id: session.user.id },
      data: { minecraftNick: nick },
    })

    // Обновляем страницу, чтобы данные подтянулись
    revalidatePath("/profile")
  }

  return (
    <main className="min-h-screen pt-32 px-6 flex justify-center">
      <div className="max-w-xl w-full bg-[#12181F] border border-white/5 rounded-[32px] p-8 h-fit shadow-2xl">
        <div className="flex items-center gap-5 mb-8">
          <img 
            src={session.user.image || ""} 
            className="w-16 h-16 rounded-2xl border-2 border-[#0099ff]/50" 
            alt="Avatar" 
          />
          <div>
            <h1 className="text-2xl font-bold text-white">{session.user.name}</h1>
            <p className="text-[#0099ff] text-sm font-bold uppercase tracking-widest">
              {/* @ts-ignore */}
              {session.user.hasPass ? "Статус: Игрок" : "Статус: Гость"}
            </p>
          </div>
        </div>

        <form action={updateMinecraftNick} className="space-y-4">
          <div className="space-y-2">
            <label className="text-zinc-400 text-sm font-bold uppercase ml-1">Ник в Minecraft</label>
            <input 
              name="nick"
              type="text"
              placeholder="Введите ник..."
              /* @ts-ignore */
              defaultValue={session.user.minecraftNick || ""}
              className="w-full bg-black/20 border border-white/5 rounded-2xl px-5 py-4 text-white outline-none focus:border-[#0099ff] transition-all"
            />
          </div>
          
          <button 
            type="submit"
            className="w-full bg-[#0099ff] hover:bg-[#0088ee] text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-[#0099ff]/10"
          >
            Сохранить изменения
          </button>
        </form>

        <p className="text-zinc-500 text-[12px] mt-6 text-center leading-relaxed">
          После сохранения ника голова в шапке сайта обновится автоматически в течение нескольких секунд.
        </p>
      </div>
    </main>
  )
}