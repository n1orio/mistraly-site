"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Headphones,
  User,
  LogOut,
  Settings,
  Loader2,
  ChevronDown,
  Menu as MenuIcon,
  X as CloseIcon,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { SiTelegram, SiDiscord } from "react-icons/si"
import { signIn, signOut, useSession } from "next-auth/react"
import { useState, useEffect } from "react"

export default function Header() {
  const pathname = usePathname()
  const { data: session, status } = useSession()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  // Закрывать мобильное меню при изменении маршрута
  useEffect(() => {
    setIsMobileNavOpen(false)
  }, [pathname])

  // --- ЛОГИКА АВАТАРКИ ---
  const hasPass = session?.user?.hasPass
  const mcNick = session?.user?.minecraftNick

  const avatarUrl = hasPass && mcNick
    ? `https://minotar.net/helm/${mcNick}/64`
    : `https://minotar.net/helm/MHF_Steve/64`

  const navLinks = [
    { name: "Главная", path: "/" },
    { name: "О сервере", path: "/about" },
    { name: "Правила", path: "/rules" },
    { name: "Вики", path: "/wiki" },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#12181F]/50 backdrop-blur-md px-4 sm:px-6 h-[72px] flex items-center">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between">

        {/* ЛОГОТИП */}
        <Link href="/" className="flex items-center font-sf font-bold text-xl tracking-wide select-none z-20 group">
          <span className="text-white">Breeze</span>
          <span className="relative inline-block ml-1">
            <span className="absolute inset-x-0 bottom-[12%] h-[82%] bg-[#0099ff] -z-10 rounded-sm transition-all"></span>
            <span className="relative z-10 px-1 text-white text-xl font-bold">.monster</span>
          </span>
        </Link>

        {/* МОБИЛЬНОЕ МЕНЮ — КНОПКА ГАМБУРГЕРА */}
        <div className="flex items-center gap-4">
          <div className="lg:hidden">
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
            >
              {isMobileNavOpen ? <CloseIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>

          {/* ПРАВЫЙ БЛОК (АВТОРИЗАЦИЯ) */}
          <div className="flex items-center gap-3">
            {status === "loading" ? (
              <div className="w-10 h-10 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
              </div>
            ) : session ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/5 p-1.5 pr-3 rounded-2xl transition-all group"
                >
                  <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-[#090D10] ring-2 ring-transparent group-hover:ring-[#0099ff]/30 transition-all shadow-inner">
                    <img
                      src={avatarUrl}
                      alt="Skin Head"
                      className="w-full h-full object-cover"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  </div>
                  <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isMenuOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-50"
                        onClick={() => setIsMenuOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute top-full right-0 mt-2 w-56 bg-[#12181F] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl p-1.5 z-50"
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
              <Button
                onClick={() => signIn('discord')}
                className="hover:bg-[#0099ff] bg-[#ffffff]/0 text-[#0099ff] hover:text-white font-bold text-[14px] rounded-xl px-4 h-10 transition-all duration-300 flex items-center gap-2 border border-[#0099ff]/20 hover:border-[#0099ff]"
              >
                <SiDiscord className="w-4 h-4" />
                <span className="hidden xs:inline">Войти</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* МОБИЛЬНОЕ НАВИГАЦИОННОЕ МЕНЮ */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden absolute top-full left-0 right-0 bg-[#12181F]/95 backdrop-blur-xl border-b border-white/5 z-40"
          >
            <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-5">
              {/* Навигация */}
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    href={link.path}
                    className={`py-2 text-[15px] font-semibold ${
                      pathname === link.path ? "text-[#0099ff]" : "text-white hover:text-[#0099ff]"
                    }`}
                  >
                    {link.name}
                  </Link>
                ))}
              </nav>

              {/* Соцсети */}
              <div className="flex items-center gap-5 pt-3 border-t border-white/10">
                <a href="https://t.me/..." target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#24a1de] transition-all">
                  <SiTelegram className="w-6 h-6" />
                </a>
                <a href="https://discord.gg/..." target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#5865f2] transition-all">
                  <SiDiscord className="w-6 h-6" />
                </a>
                <a href="#" className="text-white hover:text-white transition-all">
                  <Headphones className="w-6 h-6 stroke-[2.5px]" />
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}