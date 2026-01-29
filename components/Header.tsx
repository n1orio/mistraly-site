"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Loader2, ChevronDown, User, Settings, LogOut, X, Menu } from "lucide-react"
import { SiTelegram, SiDiscord } from "react-icons/si"
import { useSession, signIn, signOut } from "next-auth/react"
import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { RiHeadphoneLine } from "react-icons/ri"

export default function Header() {
  const pathname = usePathname()
  const { data, status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)

  // Отслеживаем скролл
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Закрываем меню при изменении пути
  useEffect(() => {
    setIsMobileNavOpen(false)
    setIsMenuOpen(false)
  }, [pathname])

  // Закрываем мобильное меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileNavOpen(false)
      }
    }

    if (isMobileNavOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    } else {
      document.removeEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMobileNavOpen])

  // ✅ ИСПРАВЛЕНО: убраны пробелы в формировании аватарки и добавлена очистка никнейма
  const hasPass = data?.user?.hasPass
  const rawMcNick = data?.user?.minecraftNick || 'MHF_Steve'
  
  // Очищаем ник от лишних пробелов
  const mcNick = rawMcNick.trim()
  
  // ✅ ИСПРАВЛЕНО: убраны пробелы в строке формирования аватарки
  const avatarUrl = hasPass && mcNick && mcNick !== 'MHF_Steve'
    ? `https://minotar.net/helm/${encodeURIComponent(mcNick)}/64.png`
    : 'https://minotar.net/helm/MHF_Steve/64.png'

  const navLinks = [
    { name: "Главная", path: "/" },
    { name: "О сервере", path: "/about" },
    { name: "Правила", path: "/rules" },
    { name: "Вики", path: "/wiki" },
  ]

  return (
    <header className={`sticky top-0 z-50 w-full px-4 sm:px-6 h-[64px] sm:h-[72px] flex items-center transition-all duration-300 ${
      scrolled 
        ? 'border-b border-white/10 bg-[#080B0E]/80 backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.4)]' 
        : 'bg-[#080B0E] border-b border-white/5 shadow-none'
    }`}>
      {/* Полоска сверху для темы в Firefox */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-[#080B0E]" />
      
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">

        {/* ЛОГОТИП (адаптирован для мобильных) */}
        <Link 
          href="/" 
          className="flex items-center font-sf font-bold text-base sm:text-xl tracking-wide select-none z-20 group"
          onClick={() => setIsMobileNavOpen(false)}
        >
          <span className="text-white">Breeze</span>
          <span className="relative inline-block ml-1">
            <span className="absolute inset-x-0 bottom-[12%] h-[82%] bg-[#0099ff] -z-10 rounded-sm transition-all"></span>
            <span className="relative z-10 px-1 text-white text-base sm:text-xl font-bold">.monster</span>
          </span>
        </Link>

        {/* ЦЕНТРАЛЬНЫЙ БЛОК — ТОЛЬКО НА ДЕСКТОПЕ */}
        <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-6">
            {navLinks.map((link) => (
              <Link 
                key={link.path}
                href={link.path}
                className={`relative py-1 text-[14px] font-semibold tracking-wide transition-colors duration-300 ${
                  pathname === link.path ? "text-[#0099ff]" : "text-white hover:text-[#0099ff]"
                }`}
              >
                {link.name}
                {pathname === link.path && (
                  <motion.div 
                    layoutId="nav-underline"
                    className="absolute bottom-[-20px] left-0 right-0 h-[2px] bg-[#0099ff] shadow-[0_0_10px_#0099ff]"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>
          
          {/* 🔗 СОЦСЕТИ */}
          <div className="flex items-center gap-4 border-l border-white/10 pl-8 ml-2">
            <a href="https://t.me/breeze_monster" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#24a1de] transition-all">
              <SiTelegram className="w-[18px] h-[18px]" />
            </a>
            <a href="https://discord.gg/nPbWMhDeus" target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#5865f2] transition-all">
              <SiDiscord className="w-5 h-5" />
            </a>
            <a href="https://t.me/NioR1o" target="_blank" rel="noopener noreferrer" className="text-white hover:text-white transition-all">
              <RiHeadphoneLine className="w-5 h-5 stroke-[2.5px]" />
            </a>
          </div>
        </nav>

        {/* ПРАВЫЙ БЛОК */}
        <div className="flex items-center gap-2 sm:gap-3 z-20">
          {status === "loading" ? (
            <div className="flex items-center justify-center w-10 h-10">
              <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
            </div>
          ) : data ? (
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="profile-menu-trigger flex items-center gap-2 sm:gap-3 bg-white/5 hover:bg-white/10 border border-white/5 p-1.5 pr-3 sm:pr-4 rounded-xl sm:rounded-2xl transition-all group"
                aria-label="Меню профиля"
              >
                <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-lg overflow-hidden bg-[#090D10] ring-2 ring-transparent group-hover:ring-[#0099ff]/30 transition-all shadow-inner">
                  <img 
                    src={avatarUrl} 
                    alt="Skin Head" 
                    className="w-full h-full object-cover"
                    style={{ imageRendering: 'pixelated' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://minotar.net/helm/MHF_Steve/64.png'
                    }}
                  />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="text-[12px] sm:text-[13px] font-bold text-white leading-none truncate max-w-[100px]">
                    {mcNick}
                  </p>
                  <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#0099ff] mt-0.5">
                    {hasPass ? "Игрок" : "Гость"}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="profile-menu absolute top-full right-0 mt-3 w-56 bg-[#12181F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl p-1.5 z-50"
                    >
                      <Link 
                        href="/profile" 
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Личный кабинет
                      </Link>
                      <Link 
                        href="/settings" 
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className="w-4 h-4" />
                        Настройки
                      </Link>
                      <div className="h-[1px] bg-white/5 my-1.5" />
                      <button 
                        onClick={() => {
                          signOut()
                          setIsMenuOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Выйти
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
              className="hover:bg-[#0099ff] bg-[#ffffff]/0 text-[#0099ff] hover:text-white font-bold text-[13px] sm:text-[14px] rounded-xl px-3 sm:px-4 h-9 sm:h-10 transition-all duration-300 flex items-center gap-2 border border-[#0099ff]/20 hover:border-[#0099ff]"
              aria-label="Войти через Discord"
            >
              <SiDiscord className="w-4 h-4" />
              <span className="hidden xs:inline">Войти</span>
            </Button>
          )}

          {/* БУРГЕР-МЕНЮ (улучшенная видимость на мобильных) */}
          <button
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="lg:hidden text-white p-2 -mr-2 hover:bg-white/10 rounded-lg transition-colors"
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
            {/* Фон-затемнение (теперь не закрывает меню при скролле) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={(e) => {
                // Закрываем только при клике на фон, а не на меню
                if (e.target === e.currentTarget) {
                  setIsMobileNavOpen(false)
                }
              }}
            />
            
            {/* Меню (выезжающее слева) */}
            <motion.div
              ref={mobileMenuRef}
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 h-full w-[85%] max-w-xs bg-[#090D10]/80 backdrop-blur-xl shadow-xl rounded-r-2xl z-50 overflow-y-auto"
              style={{ touchAction: 'pan-y' }} // Разрешаем скролл внутри меню
            >
              {/* Логотип в меню */}
              <div className="p-4 border-b border-white/10">
                <Link 
                  href="/" 
                  className="flex items-center font-sf font-bold text-xl tracking-wide text-white"
                  onClick={() => setIsMobileNavOpen(false)}
                >
                  <span>Breeze</span>
                  <span className="relative inline-block ml-1">
                    <span className="absolute inset-x-0 bottom-[12%] h-[82%] bg-[#0099ff] -z-10 rounded-sm"></span>
                    <span className="relative z-10 px-1 text-white font-bold">.monster</span>
                  </span>
                </Link>
              </div>
              
              {/* Основные ссылки */}
              <div className="p-4">
                <div className="space-y-3">
                  {navLinks.map((link) => (
                    <Link
                      key={link.path}
                      href={link.path}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        pathname === link.path 
                          ? "bg-[#0099ff]/10 text-[#0099ff] font-bold" 
                          : "text-white hover:bg-[#0099ff]/20"
                      }`}
                      onClick={() => setIsMobileNavOpen(false)}
                    >
                      <span className="text-lg">
                        {link.name === "Главная" && "🏠"}
                        {link.name === "О сервере" && "🪨"}
                        {link.name === "Правила" && "🏛️"}
                        {link.name === "Вики" && "📖"}
                      </span>
                      <span className="text-base flex-1">{link.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
              
              {/* Социальные сети */}
              <div className="p-4 border-t border-white/10">
                <div className="space-y-3">
                  <a 
                    href="https://t.me/breeze_monster" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-between p-3 rounded-lg text-white hover:bg-[#0099ff]/20"
                    onClick={() => setIsMobileNavOpen(false)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">✉️</span>
                      <span>Telegram канал</span>
                    </div>
                    <span className="text-white">→</span>
                  </a>
                  
                  <a 
                    href="https://discord.gg/nPbWMhDeus" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-between p-3 rounded-lg text-white hover:bg-[#0099ff]/20"
                    onClick={() => setIsMobileNavOpen(false)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">👾</span>
                      <span>Discord сервер</span>
                    </div>
                    <span className="text-white">→</span>
                  </a>
                  
                  <a 
                    href="https://t.me/NioR1o" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center justify-between p-3 rounded-lg text-white hover:bg-[#0099ff]/20"
                    onClick={() => setIsMobileNavOpen(false)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🎧</span>
                      <span>Поддержка</span>
                    </div>
                    <span className="text-white">→</span>
                  </a>
                </div>
              </div>
              
              {/* Статус пользователя */}
              <div className="p-4 border-t border-white/10">
                {status === "loading" ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
                  </div>
                ) : data ? (
                  <div className="flex items-center gap-3 p-3 bg-[#12181F] border border-white/10 rounded-lg">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#090D10] ring-2 ring-[#0099ff]/30">
                      <img 
                        src={avatarUrl} 
                        alt="Skin Head" 
                        className="w-full h-full object-cover"
                        style={{ imageRendering: 'pixelated' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://minotar.net/helm/MHF_Steve/64.png'
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-bold text-sm truncate">
                        {mcNick}
                      </p>
                      <p className={`text-xs font-bold uppercase tracking-wider ${
                        hasPass ? 'text-[#0099ff]' : 'text-yellow-500'
                      }`}>
                        {hasPass ? "Игрок" : "Гость"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <Button 
                    onClick={() => {
                      signIn('discord')
                      setIsMobileNavOpen(false)
                    }}
                    className="w-full bg-[#5865f2] hover:bg-[#4752c4] text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                  >
                    <SiDiscord className="w-5 h-5" />
                    Войти через Discord
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