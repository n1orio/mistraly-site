"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, ChevronDown, User, Settings, LogOut, X, Menu } from "lucide-react"
import { SiTelegram, SiDiscord } from "react-icons/si"
import { useSession, signIn, signOut } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RiHeadphoneFill, RiTelegram2Fill } from "react-icons/ri"

export default function Header() {
  const pathname = usePathname()
  const { data, status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Отслеживаем скролл для эффектов хедера
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Закрываем меню при изменении пути
  useEffect(() => {
    setIsMobileNavOpen(false)
    setIsMenuOpen(false)
  }, [pathname])

  // ✅ ИСПРАВЛЕНО: используем 'as any' для обхода проверки типов
  const user = data?.user as any
  const hasPass = user?.hasPass
  const mcNick = (user?.minecraftNick || '').trim()
  const discordAvatar = user?.image
  const discordName = user?.name || 'User'
  
  // 🔴 Убраны пробелы в ссылках!
  const avatarUrl = mcNick && mcNick !== 'MHF_Steve' && mcNick !== 'SteveMHF_'
    ? `https://minotar.net/helm/${encodeURIComponent(mcNick)}/64.png`
    : discordAvatar || 'https://minotar.net/helm/MHF_Steve/64.png'
  
  // Статус: "Есть проходка" / "Нет проходки"
  const statusText = hasPass ? "Есть проходка" : "Нет проходки"
  const statusColor = hasPass ? "[#0099ff]" : "[#e32636]"

  const navLinks = [
    { name: "Главная", path: "/" },
    { name: "О сервере", path: "/about" },
    { name: "Правила", path: "/rules" },
    { name: "Вики", path: "/wiki" },
  ]

  return (
    <header className={`sticky top-0 z-50 w-full px-4 sm:px-8 h-[64px] sm:h-[72px] flex items-center transition-all duration-300 ${
      scrolled 
        ? 'border-b border-white/10 bg-[#080B0E]/95 backdrop-blur-lg shadow-[0_4px_30px_rgba(0,0,0,0.5)]' 
        : 'bg-[#080B0E] border-b border-white/5 shadow-none'
    }`}>
      {/* Полоска сверху для темы в Firefox */}
      <div className="absolute top-0 left-0 w-full h-[3px] bg-[#080B0E]" />
      
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">

        {/* ЛЕВЫЙ БЛОК - ИКОНКА СЕРВЕРА + ЛОГОТИП */}
        <div className="flex items-center gap-4">
          {/* Иконка сервера PNG */}
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-gradient-to-br from-[#0099ff]/20 to-[#0077cc]/10 flex items-center justify-center border border-white/5">
            <img 
              src="/icons/server.png" 
              alt="Server" 
              className="w-8 h-8 object-contain"
              onError={(e) => {
                // Fallback если картинка не загрузилась
                (e.target as HTMLImageElement).style.display = 'none'
                const parent = (e.target as HTMLImageElement).parentElement
                if (parent) {
                  parent.innerHTML = '<div class="w-7 h-7 bg-gradient-to-br from-[#0099ff]/30 to-[#0077cc]/20 rounded-lg flex items-center justify-center"><div class="w-4 h-4 bg-[#0099ff] rounded-full"></div></div>'
                }
              }}
            />
          </div>
          
          {/* ЛОГОТИП */}
          <Link 
            href="/" 
            className="flex items-center font-sf font-bold text-base sm:text-xl tracking-wide select-none z-20 group"
            onClick={() => setIsMobileNavOpen(false)}
          >
            <span className="text-white bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">Breeze</span>
            <span className="relative inline-block ml-1.5">
              <span className="absolute inset-x-0 bottom-[10%] h-[85%] bg-gradient-to-r from-[#0099ff] to-[#0077cc] -z-10 rounded-sm transition-all"></span>
              <span className="relative z-10 px-1.5 text-white font-bold">.monster</span>
            </span>
          </Link>
        </div>

        {/* ЦЕНТРАЛЬНЫЙ БЛОК — ТОЛЬКО НА ДЕСКТОПЕ */}
        <nav className="hidden lg:flex items-center gap-10">
          <div className="flex items-center gap-8">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                href={link.path}
                className={`relative py-2 px-2 text-[14px] font-semibold tracking-wide transition-all duration-300 ${
                  pathname === link.path 
                    ? "text-[#0099ff] scale-105" 
                    : "text-zinc-300 hover:text-[#0099ff] hover:scale-105"
                }`}
              >
                {link.name}
                {pathname === link.path && (
                  <motion.div 
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#0099ff] to-[#0077cc] shadow-[0_0_15px_rgba(0,153,255,0.6)]"
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  />
                )}
              </Link>
            ))}
          </div>
          
          {/* 🔗 СОЦСЕТИ — убраны пробелы! */}
          <div className="flex items-center gap-5 border-l border-white/10 pl-8">
            <a href="https://t.me/breeze_monster" target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:text-[#24a1de] transition-all hover:scale-110">
              <RiTelegram2Fill className="w-6 h-6" />
            </a>
            <a href="https://discord.gg/nPbWMhDeus" target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:text-[#5865f2] transition-all hover:scale-110">
              <SiDiscord className="w-6 h-6" />
            </a>
            <a href="https://t.me/NioR1o" target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:text-white transition-all hover:scale-110">
              <RiHeadphoneFill className="w-6 h-6 stroke-[2.5px]" />
            </a>
          </div>
        </nav>

        {/* ПРАВЫЙ БЛОК */}
        <div className="flex items-center gap-3 sm:gap-4 z-20">
          {status === "loading" ? (
            <div className="flex items-center justify-center w-12 h-12">
              <Loader2 className="w-6 h-6 text-[#0099ff] animate-spin" />
            </div>
          ) : data ? (
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="profile-menu-trigger flex items-center gap-3 sm:gap-4 bg-gradient-to-br from-[#090D10] to-[#080B0E] hover:from-[#0a0e12] hover:to-[#090c0f] border border-white/10 p-2 pr-4 sm:pr-5 rounded-xl sm:rounded-2xl transition-all group shadow-lg shadow-[#0099ff]/10"
                aria-label="Меню профиля"
              >
                <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden bg-[#090D10] ring-2 ring-transparent group-hover:ring-[#0099ff]/40 transition-all shadow-inner">
                  <img 
                    src={avatarUrl} 
                    alt="Avatar" 
                    className="w-full h-full object-cover"
                    style={{ imageRendering: mcNick ? 'pixelated' : 'auto' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = discordAvatar || 'https://minotar.net/helm/MHF_Steve/64.png'
                    }}
                  />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-[13px] sm:text-[14px] font-bold text-white leading-none truncate max-w-[120px]">
                    {mcNick || discordName}
                  </p>
                  <p className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-${statusColor} mt-1`}>
                    {statusText}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.92 }}
                      className="profile-menu absolute top-full right-0 mt-4 w-60 bg-gradient-to-br from-[#12181F] to-[#0f151b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-lg p-2 z-50"
                    >
                      <Link 
                        href="/profile" 
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-gradient-to-r from-[#0099ff]/10 to-transparent transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="w-4 h-4 text-[#0099ff]" />
                        <span className="flex-1">Личный кабинет</span>
                      </Link>
                      <Link 
                        href="/settings" 
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-gradient-to-r from-[#0099ff]/10 to-transparent transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4 text-[#0099ff]" />
                        <span className="flex-1">Настройки</span>
                      </Link>
                      <div className="h-[2px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-2" />
                      <button 
                        onClick={() => {
                          signOut()
                          setIsMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="flex-1">Выйти</span>
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Button 
              onClick={() => {
                signIn('discord')
                setIsMobileNavOpen(false)
              }}
              className="hover:bg-gradient-to-r from-[#5865f2] to-[#4752c4] bg-gradient-to-r from-[#5865f2]/90 to-[#4752c4]/90 text-white hover:text-white font-bold text-[13px] sm:text-[14px] rounded-xl px-5 sm:px-7 h-10 sm:h-11 transition-all duration-300 flex items-center gap-2.5 shadow-lg shadow-[#5865f2]/20 hover:shadow-[#5865f2]/40"
              aria-label="Авторизоваться через Discord"
            >
              <SiDiscord className="w-5 h-5" />
              <span className="hidden sm:block">Авторизоваться</span>
            </Button>
          )}

          {/* БУРГЕР-МЕНЮ */}
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="lg:hidden text-zinc-300 p-2.5 hover:bg-white/10 rounded-lg transition-colors hover:scale-110"
            aria-label={isMobileNavOpen ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={isMobileNavOpen}
          >
            {isMobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* МОБИЛЬНОЕ МЕНЮ */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <>
            {/* Фон-затемнение */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-40 backdrop-blur-sm"
            />
            
            {/* Меню */}
            <motion.div
              ref={mobileMenuRef}
              initial={{ x: "-110%" }}
              animate={{ x: 0 }}
              exit={{ x: "-110%" }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="fixed top-0 left-0 min-h-screen h-screen w-[88%] max-w-xs bg-gradient-to-br from-[#090D10] to-[#080B0E] backdrop-blur-xl shadow-2xl rounded-r-2xl z-50 overflow-y-auto"
              style={{ 
                touchAction: 'pan-y',
                WebkitOverflowScrolling: 'touch',
                maxHeight: '100vh',
                height: '100vh',
                overflowY: 'auto'
              }}
            >
              {/* Кнопка закрытия */}
              <div className="absolute top-5 right-5 z-10">
                <button
                  onClick={() => setIsMobileNavOpen(false)}
                  className="text-zinc-300 p-2.5 hover:bg-white/10 rounded-lg transition-colors hover:scale-110"
                  aria-label="Закрыть меню"
                >
                  <X className="w-7 h-7" />
                </button>
              </div>
              
              {/* Логотип в меню */}
              <div className="p-6 pt-16 border-b border-white/10">
                <Link 
                  href="/" 
                  className="flex items-center font-sf font-bold text-xl tracking-wide text-white"
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  <span className="bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">Breeze</span>
                  <span className="relative inline-block ml-2">
                    <span className="absolute inset-x-0 bottom-[10%] h-[85%] bg-gradient-to-r from-[#0099ff] to-[#0077cc] -z-10 rounded-sm"></span>
                    <span className="relative z-10 px-2 text-white font-bold">.monster</span>
                  </span>
                </Link>
              </div>
              
              {/* Основные ссылки */}
              <div className="p-6 pb-4">
                <div className="space-y-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      href={link.path}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                        pathname === link.path 
                          ? "bg-gradient-to-r from-[#0099ff]/15 to-[#0077cc]/15 text-[#0099ff] font-bold shadow-lg shadow-[#0099ff]/20" 
                          : "text-zinc-300 hover:bg-gradient-to-r from-[#0099ff]/10 to-transparent hover:text-white"
                      }`}
                      onClick={() => setIsMobileNavOpen(false)}
                    >
                      <span className="text-xl">
                        {link.name === "Главная" && "🏠"}
                        {link.name === "О сервере" && "🪨"}
                        {link.name === "Правила" && "🏛️"}
                        {link.name === "Вики" && "📖"}
                      </span>
                      <span className="text-lg flex-1 font-medium">{link.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Социальные сети — убраны пробелы! */}
              <div className="p-6 pt-4 border-t border-white/10">
                <div className="space-y-2">
                  <a 
                    href="https://t.me/breeze_monster" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-between p-4 rounded-xl text-zinc-300 hover:bg-gradient-to-r from-[#24a1de]/10 to-transparent hover:text-white transition-all"
                    onClick={() => setIsMobileNavOpen(false)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xl">✉️</span>
                      <span className="text-lg font-medium">Telegram канал</span>
                    </div>
                    <span className="text-lg text-[#24a1de]">→</span>
                  </a>
                  
                  <a 
                    href="https://discord.gg/nPbWMhDeus" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-between p-4 rounded-xl text-zinc-300 hover:bg-gradient-to-r from-[#5865f2]/10 to-transparent hover:text-white transition-all"
                    onClick={() => setIsMobileNavOpen(false)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xl">👾</span>
                      <span className="text-lg font-medium">Discord сервер</span>
                    </div>
                    <span className="text-lg text-[#5865f2]">→</span>
                  </a>
                  
                  <a 
                    href="https://t.me/NioR1o" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-between p-4 rounded-xl text-zinc-300 hover:bg-gradient-to-r from-white/10 to-transparent hover:text-white transition-all"
                    onClick={() => setIsMobileNavOpen(false)}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-xl">🎧</span>
                      <span className="text-lg font-medium">Поддержка</span>
                    </div>
                    <span className="text-lg text-white">→</span>
                  </a>
                </div>
              </div>
              
              {/* Статус пользователя */}
              <div className="p-6 pt-4 border-t border-white/10">
                {status === "loading" ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 text-[#0099ff] animate-spin" />
                  </div>
                ) : data ? (
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-[#12181F] to-[#0f151b] border border-white/10 rounded-xl">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-[#090D10] ring-2 ring-[#0099ff]/40">
                      <img 
                        src={avatarUrl} 
                        alt="Avatar" 
                        className="w-full h-full object-cover"
                        style={{ imageRendering: mcNick ? 'pixelated' : 'auto' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = discordAvatar || 'https://minotar.net/helm/MHF_Steve/64.png'
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-base truncate">
                        {mcNick || discordName}
                      </p>
                      <p className={`text-xs font-bold uppercase tracking-wider text-${statusColor} mt-1`}>
                        {statusText}
                      </p>
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={() => {
                      signIn('discord')
                      setIsMobileNavOpen(false)
                    }}
                    className="w-full bg-gradient-to-r from-[#5865f2] to-[#4752c4] hover:from-[#4752c4] hover:to-[#3a43a0] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 shadow-lg shadow-[#5865f2]/30"
                  >
                    <SiDiscord className="w-6 h-6" />
                    <span className="text-lg">Авторизоваться через Discord</span>
                  </Button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}