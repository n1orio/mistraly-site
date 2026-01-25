"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Headphones, User, LogOut, Settings, Loader2, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { SiTelegram, SiDiscord } from "react-icons/si"
import { signIn, signOut, useSession } from "next-auth/react"
import { useState } from "react"

export default function Header() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // --- ЛОГИКА АВАТАРКИ ---
  // Данные из нашей расширенной сессии (из шага с next-auth.d.ts)
  const hasPass = session?.user?.hasPass
  const mcNick = session?.user?.minecraftNick

  // Если есть проходка и ник — берем скин ника, иначе — голову Стива (MHF_Steve)
  const avatarUrl = (hasPass && mcNick) 
    ? `https://minotar.net/helm/${mcNick}/64` 
    : `https://minotar.net/helm/MHF_Steve/64`

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#12181F]/50 backdrop-blur-md px-6 h-[72px] flex items-center">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
        
        {/* ЛОГОТИП (оставлен без изменений) */}
        <Link href="/" className="flex items-center font-sf font-bold text-xl tracking-wide select-none z-20 group">
          <span className="text-white">Breeze</span>
          <span className="relative inline-block ml-1">
             <span className="absolute inset-x-0 bottom-[12%] h-[82%] bg-[#0099ff] -z-10 rounded-sm transition-all"></span>
             <span className="relative z-10 px-1 text-white text-xl font-bold">.monster</span>
          </span>
        </Link>

        {/* ЦЕНТРАЛЬНЫЙ БЛОК (оставлен без изменений) */}
        <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-6">
            {[
              { name: "Главная", path: "/" },
              { name: "О сервере", path: "/about" },
              { name: "Правила", path: "/rules" },
              { name: "Вики", path: "/wiki" },
            ].map((link) => (
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
          
          {/* СОЦИАЛЬНЫЕ ИКОНКИ */}
          <div className="flex items-center gap-4 border-l border-white/10 pl-8 ml-2">
            <a href="https://t.me/..." target="_blank" className="text-white hover:text-[#24a1de] transition-all">
              <SiTelegram className="w-[18px] h-[18px]" />
            </a>
            <a href="https://discord.gg/..." target="_blank" className="text-white hover:text-[#5865f2] transition-all">
              <SiDiscord className="w-5 h-5" />
            </a>
            <a href="#" className="text-white hover:text-white transition-all">
              <Headphones className="w-5 h-5 stroke-[2.5px]" />
            </a>
          </div>
        </nav>

        {/* ПРАВЫЙ БЛОК (АВТОРИЗАЦИЯ) */}
        <div className="flex items-center gap-5 z-20">
          
          {status === "loading" ? (
            // Состояние загрузки
            <div className="flex items-center justify-center w-10 h-10">
              <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
            </div>
          ) : session ? (
            // СОСТОЯНИЕ: АВТОРИЗОВАН
            <div className="relative">
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/5 p-1.5 pr-4 rounded-2xl transition-all group"
              >
                {/* Аватарка головы */}
                <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-[#090D10] ring-2 ring-transparent group-hover:ring-[#0099ff]/30 transition-all shadow-inner">
                  <img 
                    src={avatarUrl} 
                    alt="Skin Head" 
                    className="w-full h-full object-cover"
                    style={{ imageRendering: 'pixelated' }} // Четкие пиксели майна
                  />
                </div>
                
                <div className="text-left hidden md:block">
                  <p className="text-[13px] font-bold text-white leading-none">
                    {mcNick || session.user?.name}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#0099ff] mt-1">
                    {hasPass ? "Игрок" : "Гость"}
                  </p>
                </div>
                <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Выпадающее меню */}
              <AnimatePresence>
                {isMenuOpen && (
                  <>
                    {/* Невидимая подложка для закрытия меню при клике в любое место */}
                    <div className="fixed inset-0 z-[-1]" onClick={() => setIsMenuOpen(false)} />
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-3 w-56 bg-[#12181F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl p-1.5"
                    >
                      <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors">
                        <User className="w-4 h-4" />
                        Личный кабинет
                      </Link>
                      <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-colors">
                        <Settings className="w-4 h-4" />
                        Настройки
                      </Link>
                      <div className="h-[1px] bg-white/5 my-1.5" />
                      <button 
                        onClick={() => signOut()}
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
            // СОСТОЯНИЕ: НЕ АВТОРИЗОВАН
            <Button 
              onClick={() => signIn('discord')}
              className="hover:bg-[#0099ff] bg-[#ffffff]/0 text-[#0099ff] hover:text-white font-bold text-[14px] rounded-xl px-5 h-10 transition-all duration-300 flex items-center gap-2 border border-[#0099ff]/20 hover:border-[#0099ff]"
            >
              <SiDiscord className="w-4 h-4" />
              <span>Войти</span>
            </Button>
          )}
        </div>

      </div>
    </header>
  )
}