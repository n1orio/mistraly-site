"use client"

import { useSession } from "next-auth/react"
import { Loader2, Shield, Crown, BadgeCheck, Ban, Bot, Users, ShieldCheck, PoliceBadge } from "lucide-react"
import Image from "next/image"

// Маппинг ролей для отображения
const roleConfig = {
  admin: { 
    label: "Администратор", 
    color: "bg-red-500/20 text-red-400 border-red-500/30",
    icon: <Crown className="w-4 h-4" />
  },
  moderator: { 
    label: "Модератор", 
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    icon: <ShieldCheck className="w-4 h-4" />
  },
  police: { 
    label: "Интерпол", 
    color: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    icon: <PoliceBadge className="w-4 h-4" />
  },
  builder: { 
    label: "Строитель", 
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    icon: <Users className="w-4 h-4" />
  },
  helper: { 
    label: "Помощник", 
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    icon: <BadgeCheck className="w-4 h-4" />
  },
  bot: { 
    label: "Бот", 
    color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    icon: <Bot className="w-4 h-4" />
  },
  banned: { 
    label: "Забанен", 
    color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    icon: <Ban className="w-4 h-4" />
  }
} as const

// Типы для ролей
type RoleType = keyof typeof roleConfig

export default function Profile() {
  const { data, status } = useSession()

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080B0E] text-white">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#0099ff] mx-auto mb-4" />
          <p className="text-zinc-400">Загрузка профиля...</p>
        </div>
      </div>
    )
  }

  if (!data?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080B0E] text-white">
        <div className="text-center max-w-md mx-auto p-8 bg-[#12181F] border border-white/10 rounded-2xl">
          <Shield className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Необходима авторизация</h2>
          <p className="text-zinc-400 mb-6">
            Пожалуйста, войдите в аккаунт, чтобы просмотреть свой профиль
          </p>
          <a 
            href="/api/auth/signin" 
            className="inline-block bg-[#0099ff] hover:bg-[#0088ee] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-[#0099ff]/20"
          >
            Войти через Discord
          </a>
        </div>
      </div>
    )
  }

  // Получаем данные пользователя из сессии
  const user = data.user
  const discordId = (user as any).discordId || 'Не указан'
  const bannerUrl = (user as any).banner || 'https://cdn.discordapp.com/banners/0/0.png?size=1024'
  const roles = ((user as any).roles as RoleType[]) || []
  const minecraftNick = (user as any).minecraftNick || 'Не указан'
  const hasPass = (user as any).hasPass || false

  // Форматируем Discord ID для отображения
  const formattedDiscordId = `${discordId.slice(0, 5)}...${discordId.slice(-5)}`

  return (
    <div className="min-h-screen bg-[#080B0E] text-white py-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Заголовок */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#0099ff] to-[#39FF14] mb-3">
            Личный кабинет
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            Управляйте своим профилем и настройками на сервере Breeze
          </p>
        </div>

        {/* Карточка профиля */}
        <div className="bg-[#12181F]/50 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
          {/* Баннер профиля */}
          <div className="relative h-48 bg-gradient-to-r from-[#0099ff] to-[#39FF14]">
            {bannerUrl && bannerUrl !== 'https://cdn.discordapp.com/banners/0/0.png?size=1024' ? (
              <Image
                src={bannerUrl}
                alt="Discord Banner"
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-[#0099ff]/20 to-[#39FF14]/20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#080B0E]/90 to-transparent" />
          </div>

          {/* Содержимое профиля */}
          <div className="p-6 md:p-8">
            {/* Аватар и основная информация */}
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-8">
              {/* Аватар */}
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-[#0099ff] to-[#39FF14] rounded-full blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt" />
                <div className="relative">
                  <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-[#080B0E] shadow-2xl">
                    <Image
                      src={user.image || `https://cdn.discordapp.com/embed/avatars/${parseInt(discordId) % 5}.png`}
                      alt={user.name || "User Avatar"}
                      width={128}
                      height={128}
                      className="object-cover"
                      priority
                    />
                  </div>
                  {/* Индикатор статуса */}
                  <div className="absolute bottom-1 right-1 w-4 h-4 bg-[#39FF14] rounded-full border-2 border-[#080B0E]" />
                </div>
              </div>

              {/* Информация */}
              <div className="text-center md:text-left flex-1">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <h2 className="text-2xl md:text-3xl font-bold text-white">
                    {user.name || 'Пользователь'}
                  </h2>
                  {hasPass && (
                    <div className="flex items-center gap-1 bg-[#0099ff]/15 text-[#0099ff] px-3 py-1 rounded-full text-sm">
                      <Shield className="w-3 h-3" />
                      <span>Игрок</span>
                    </div>
                  )}
                </div>
                
                <p className="text-zinc-300 mb-1">{user.email || 'Email не указан'}</p>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-4">
                  <div className="bg-[#12181F] border border-white/10 rounded-xl px-4 py-2">
                    <p className="text-xs text-zinc-400 mb-1">Discord ID</p>
                    <p className="font-mono font-bold text-sm">{formattedDiscordId}</p>
                  </div>
                  <div className="bg-[#12181F] border border-white/10 rounded-xl px-4 py-2">
                    <p className="text-xs text-zinc-400 mb-1">Ник в игре</p>
                    <p className="font-mono font-bold text-sm">{minecraftNick}</p>
                  </div>
                  <div className="bg-[#12181F] border border-white/10 rounded-xl px-4 py-2">
                    <p className="text-xs text-zinc-400 mb-1">Статус</p>
                    <p className={`font-bold text-sm ${hasPass ? 'text-[#39FF14]' : 'text-yellow-400'}`}>
                      {hasPass ? 'Активен' : 'Гость'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Роли пользователя */}
            <div className="mb-8">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#0099ff]" />
                Роли на сервере
              </h3>
              
              {roles.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {roles.map((role, index) => {
                    const config = roleConfig[role] || roleConfig.helper
                    return (
                      <div 
                        key={index} 
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${config.color}`}
                      >
                        {config.icon}
                        <span className="font-bold">{config.label}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="bg-[#12181F] border border-dashed border-white/20 rounded-xl p-6 text-center">
                  <Shield className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-400">
                    У вас пока нет специальных ролей на сервере
                  </p>
                </div>
              )}
            </div>

            {/* Информация о профиле */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#12181F] border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <BadgeCheck className="w-5 h-5 text-[#0099ff]" />
                  Общая информация
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">Полное имя</p>
                    <p className="font-medium">{user.name || 'Не указано'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">Email</p>
                    <p className="font-medium break-all">{user.email || 'Не указан'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">Дата регистрации</p>
                    <p className="font-medium">Скоро будет доступно</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#12181F] border border-white/10 rounded-2xl p-6">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Bot className="w-5 h-5 text-[#0099ff]" />
                  Статистика
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">Последний вход</p>
                    <p className="font-medium">Скоро будет доступно</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">Часов на сервере</p>
                    <p className="font-medium">Скоро будет доступно</p>
                  </div>
                  <div>
                    <p className="text-xs text-zinc-400 mb-1">Нарушений</p>
                    <p className="font-medium">Скоро будет доступно</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Действия */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <h3 className="text-lg font-bold mb-4">Действия</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button className="bg-[#12181F] hover:bg-[#1a222a] border border-white/10 rounded-xl p-4 text-left transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <Shield className="w-5 h-5 text-[#0099ff]" />
                    <span className="font-bold">Настройки безопасности</span>
                  </div>
                  <p className="text-zinc-400 text-sm">Управление двухфакторной аутентификацией</p>
                </button>
                
                <button className="bg-[#12181F] hover:bg-[#1a222a] border border-white/10 rounded-xl p-4 text-left transition-all">
                  <div className="flex items-center gap-3 mb-2">
                    <BadgeCheck className="w-5 h-5 text-[#0099ff]" />
                    <span className="font-bold">Редактировать профиль</span>
                  </div>
                  <p className="text-zinc-400 text-sm">Изменить информацию о себе</p>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Подсказка */}
        <div className="mt-8 text-center text-zinc-500 text-sm">
          <p>
            Если информация отображается некорректно, попробуйте обновить страницу или обратитесь в поддержку
          </p>
        </div>
      </div>
    </div>
  )
}