"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  Headphones, User, LogOut, Settings, 
  Loader2, ChevronDown, Menu, X 
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { SiTelegram, SiDiscord } from "react-icons/si"
import { signIn, signOut, useSession } from "next-auth/react"
import { useState, useEffect } from "react"

export default function Header() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  
  // Состояния для меню
  const [isMenuOpen, setIsMenuOpen] = useState(false) // Выпадающее меню профиля
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false) // Мобильная шторка навигации

  // Закрываем мобильное меню при смене страницы
  useEffect(() => {
    setIsMobileNavOpen(false)
  }, [pathname])

  const hasPass = session?.user?.hasPass
  const mcNick = session?.user?.minecraftNick

  const avatarUrl = (hasPass && mcNick) 
    ? `https://minotar.net/helm/${mcNick}/64` 
    : `https://minotar.net/helm/MHF_Steve/64`

  const navLinks = [
    { name: "Главная", path: "/" },
    { name: "О сервере", path: "/about" },
    { name: "Правила", path: "/rules" },
    { name: "Вики", path: "/wiki" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#12181F]/80 backdrop-blur-md px-4 md:px-6 h-[72px] flex items-center">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        
        {/* ЛОГОТИП */}
        <Link href="/" className="flex items-center font-sf font-bold text-xl tracking-wide select-none z-[60] group">
          <span className="text-white">Breeze</span>
          <span className="relative inline-block ml-1">
             <span className="absolute inset-x-0 bottom-[12%] h-[82%] bg-[#0099ff] -z-10 rounded-sm"></span>
             <span className="relative z-10 px-1 text-white text-xl font-bold">.monster</span>
          </span>
        </Link>

        {/* ЦЕНТРАЛЬНЫЙ БЛОК (Desktop) */}
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
                  />
                )}
              </Link>
            ))}
          </div>
          
          <div className="flex items-center gap-4 border-l border-white/10 pl-8 ml-2">
            <a href="#" className="text-white hover:text-[#24a1de] transition-all"><SiTelegram className="w-4 h-4" /></a>
            <a href="#" className="text-white hover:text-[#5865f2] transition-all"><SiDiscord className="w-5 h-5" /></a>
            <a href="#" className="text-white hover:text-white transition-all"><Headphones className="w-5 h-5 stroke-[2.5px]" /></a>
          </div>
        </nav>

        {/* ПРАВЫЙ БЛОК */}
        <div className="flex items-center gap-2 md:gap-4 z-[60]">
          
          {status === "loading" ? (
            <div className="flex items-center justify-center w-10 h-10">
              <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
            </div>
          ) : session ? (
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 md:gap-3 bg-white/5 hover:bg-white/10 border border-white/5 p-1 md:p-1.5 md:pr-4 rounded-xl md:rounded-2xl transition-all group"
              >
                <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-[#090D10] shadow-inner">
                  <img 
                    src={avatarUrl} 
                    alt="Head" 
                    className="w-full h-full object-cover"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
                
                <div className="text-left hidden md:block">
                  <p className="text-[13px] font-bold text-white leading-none">
                    {mcNick || session.user?.name}
                  </p>
                  <p className="text-[10px] font-bold uppercase text-[#0099ff] mt-1">
                    {hasPass ? "Игрок" : "Гость"}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-500 hidden md:block transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-[-1]" onClick={() => setIsMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-3 w-56 bg-[#12181F] border border-white/10 rounded-2xl shadow-2xl p-1.5 backdrop-blur-xl"
                    >
                      <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors">
                        <User className="w-4 h-4" /> Профиль
                      </Link>
                      <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors">
                        <LogOut className="w-4 h-4" /> Выйти
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Button 
              onClick={() => signIn('discord')}
              className="bg-[#0099ff]/10 hover:bg-[#0099ff] text-[#0099ff] hover:text-white border border-[#0099ff]/20 font-bold text-[13px] md:text-[14px] rounded-xl px-4 md:px-5 h-9 md:h-10 transition-all"
            >
              <SiDiscord className="w-4 h-4 mr-2 hidden sm:block" />
              <span>Войти</span>
            </Button>
          )}

          {/* КНОПКА БУРГЕРА (Mobile) */}
          <button 
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
            className="lg:hidden p-2 text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            {isMobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* МОБИЛЬНОЕ МЕНЮ (Шторка) */}
        <AnimatePresence>
          {isMobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, x: "100%" }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 top-0 left-0 w-full h-screen bg-[#090D10] z-50 lg:hidden flex flex-col p-6 pt-24"
            >
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link 
                    key={link.path}
                    href={link.path}
                    className={`text-2xl font-bold tracking-tight ${
                      pathname === link.path ? "text-[#0099ff]" : "text-white"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </div>

              <div className="mt-auto flex flex-col gap-8 pb-10">
                <div className="flex items-center gap-6">
                  <a href="#" className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl text-white"><SiTelegram className="w-6 h-6" /></a>
                  <a href="#" className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl text-white"><SiDiscord className="w-7 h-7" /></a>
                  <a href="#" className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-2xl text-white"><Headphones className="w-6 h-6" /></a>
                </div>
                <p className="text-zinc-500 text-sm font-medium">
                  © 2024 Breeze Project. Все права защищены.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </header>
  )
}