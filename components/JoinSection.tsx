"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { User, CreditCard, Gamepad2, Copy, Check, ExternalLink, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { useSession, signIn } from "next-auth/react"
import Link from "next/link"

export default function JoinSection() {
  const [copied, setCopied] = useState(false)
  const { data: session, status } = useSession()
  const [isHovered, setIsHovered] = useState<number | null>(null)

  const copyIP = () => {
    navigator.clipboard.writeText("play.breeze.monster")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Анимация цен
  const [displayPrice, setDisplayPrice] = useState(0)
  useEffect(() => {
    let animationFrame: number
    const animatePrice = () => {
      setDisplayPrice(prev => {
        if (prev >= 350) return 350
        return Math.min(prev + 10, 350)
      })
      if (displayPrice < 350) {
        animationFrame = requestAnimationFrame(animatePrice)
      }
    }
    animatePrice()
    return () => cancelAnimationFrame(animationFrame)
  }, [displayPrice])

  return (
    <section 
      className="join-section w-full bg-[#090D10] py-20 px-6 font-sans border-t border-white/5 relative overflow-hidden"
    >
      {/* Градиентный фон */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#090D10] via-[#0a0e11] to-[#090D10] pointer-events-none" />
      
      {/* Декоративные градиентные круги */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Верхний левый градиент */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-[#99c03e]/10 to-transparent rounded-full blur-3xl animate-pulse opacity-30" />
          <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-gradient-to-br from-[#99c03e]/5 to-transparent rounded-full blur-2xl animate-pulse opacity-20" />
        </div>
        
        {/* Центральный градиент */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
          <div className="absolute top-0 left-0 w-128 h-128 bg-gradient-to-br from-[#0099ff]/10 to-transparent rounded-full blur-3xl animate-pulse opacity-30" />
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-[#0099ff]/5 to-transparent rounded-full blur-2xl animate-pulse opacity-20" />
        </div>
        
        {/* Нижний правый градиент */}
        <div className="absolute bottom-0 right-0 w-full h-full">
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tl from-[#5865f2]/10 to-transparent rounded-full blur-3xl animate-pulse opacity-30" />
          <div className="absolute bottom-1/3 right-1/3 w-64 h-64 bg-gradient-to-tl from-[#5865f2]/5 to-transparent rounded-full blur-2xl animate-pulse opacity-20" />
        </div>
        
        {/* Дополнительные пульсирующие элементы */}
        <div className="absolute top-1/2 right-1/4 w-48 h-48 bg-gradient-to-br from-[#0099ff]/5 to-transparent rounded-full blur-3xl animate-pulse opacity-20" />
        <div className="absolute bottom-1/3 left-1/4 w-40 h-40 bg-gradient-to-tl from-[#99c03e]/5 to-transparent rounded-full blur-3xl animate-pulse opacity-20" />
      </div>

      {/* Сетка градиентных точек */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,#090D10_100%)]" />
      </div>

      <div className="max-w-5xl mx-auto relative z-10">
        
        {/* Заголовок с анимацией */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="font-sf text-4xl sm:text-5xl font-bold mb-3 tracking-tight text-white">
            Как попасть на сервер?
          </h2>
          <p className="text-zinc-500 text-base font-medium">
            Три простых шага, чтобы начать игру
          </p>
        </motion.div>

        {/* Сетка карточек */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* ШАГ 1 - Регистрация */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ y: -10, scale: 1.02 }}
            onHoverStart={() => setIsHovered(1)}
            onHoverEnd={() => setIsHovered(null)}
            className="relative"
          >
            <div className={`bg-[#12181F] p-6 rounded-xl flex flex-col items-start border ${isHovered === 1 ? 'border-[#99c03e]/30' : 'border-white/[0.02]'} transition-all duration-300 overflow-hidden h-full min-h-[300px] relative`}>
              
              {/* Градиентный фон при наведении */}
              <div className={`absolute inset-0 bg-gradient-to-br from-[#99c03e]/5 to-transparent opacity-0 ${isHovered === 1 ? 'opacity-100' : ''} transition-opacity duration-300`} />
              
              <div className="bg-[#99c03e] w-10 h-10 rounded-lg flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(153,192,62,0.3)] relative z-10">
                <User className="w-5 h-5 text-white" />
              </div>

              <h3 className="text-[19px] font-bold text-white mb-2 tracking-tight relative z-10">
                Регистрация
              </h3>
              <p className="text-zinc-400 text-[14.5px] leading-snug mb-4 antialiased relative z-10">
                Создайте личный аккаунт на нашем сайте для управления персонажем.
              </p>

              <div className="mt-auto w-full relative z-10">
                <Button 
                  onClick={() => {
                    if (status === 'authenticated') {
                      window.location.href = '/profile'
                    } else {
                      signIn('discord')
                    }
                  }}
                  disabled={status === 'loading'}
                  className="w-full bg-[#2B3A4A] hover:bg-[#3d4e61] text-white border-none h-12 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_4px_15px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.3)]"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Загрузка...
                    </>
                  ) : status === 'authenticated' ? (
                    <>
                      Перейти в профиль
                      <ExternalLink className="w-4 h-4 text-zinc-400" />
                    </>
                  ) : (
                    <>
                      Войти через Discord
                      <ExternalLink className="w-4 h-4 text-zinc-400" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>

          {/* ШАГ 2 - Покупка доступа */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ y: -10, scale: 1.02 }}
            onHoverStart={() => setIsHovered(2)}
            onHoverEnd={() => setIsHovered(null)}
            className="relative"
          >
            <div className={`bg-[#12181F] p-6 rounded-xl flex flex-col items-start border ${isHovered === 2 ? 'border-[#0099ff]/30' : 'border-white/[0.02]'} transition-all duration-300 relative overflow-hidden h-full min-h-[300px]`}>
              {/* Градиентный фон при наведении */}
              <div className={`absolute inset-0 bg-gradient-to-br from-[#0099ff]/5 to-transparent opacity-0 ${isHovered === 2 ? 'opacity-100' : ''} transition-opacity duration-300`} />

              <div className="bg-[#0099ff] w-10 h-10 rounded-lg flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(0,153,255,0.3)] relative z-10">
                <CreditCard className="w-5 h-5 text-white" />
              </div>

              <h3 className="text-[19px] font-bold text-white mb-2 tracking-tight relative z-10">
                Купите доступ
              </h3>
              <div className="flex items-baseline gap-2 mb-1 relative z-10">
                <motion.span 
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="text-2xl font-black text-white"
                >
                  {displayPrice} ₽
                </motion.span>
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">/ сезон</span>
              </div>
              <p className="text-zinc-400 text-[14.5px] leading-snug mb-4 antialiased relative z-10">
                Приобретите проходку, чтобы поддержать проект и зайти в мир.
              </p>

              <div className="mt-auto w-full relative z-10">
                <Link href="/buy" passHref>
                  <Button 
                    className="w-full bg-[#0099ff] hover:bg-white duration-500 text-white hover:text-black border-none h-12 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-all shadow-[0_0_20px_rgba(0,153,255,0.15)] hover:shadow-[0_0_30px_rgba(0,153,255,0.3)]"
                  >
                    Купить проходку
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          {/* ШАГ 3 - Начало игры */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ y: -10, scale: 1.02 }}
            onHoverStart={() => setIsHovered(3)}
            onHoverEnd={() => setIsHovered(null)}
            className="relative"
          >
            <div className={`bg-[#12181F] p-6 rounded-xl flex flex-col items-start border ${isHovered === 3 ? 'border-[#5865f2]/30' : 'border-white/[0.02]'} transition-all duration-300 h-full min-h-[300px] relative`}>
              
              {/* Градиентный фон при наведении */}
              <div className={`absolute inset-0 bg-gradient-to-br from-[#5865f2]/5 to-transparent opacity-0 ${isHovered === 3 ? 'opacity-100' : ''} transition-opacity duration-300`} />
              
              <div className="bg-[#5865f2] w-10 h-10 rounded-lg flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(88,101,242,0.3)] relative z-10">
                <Gamepad2 className="w-5 h-5 text-white" />
              </div>

              <h3 className="text-[19px] font-bold text-white mb-2 tracking-tight relative z-10">
                Начни игру
              </h3>
              <p className="text-zinc-400 text-[14.5px] leading-snug mb-4 antialiased relative z-10">
                Используйте IP для подключения в Minecraft (Java 1.21.11).
              </p>

              <div 
                onClick={copyIP}
                className="w-full bg-[#090D10] border border-white/5 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-[#5865f2]/30 transition-all group/ip mb-4 relative z-10"
              >
                <span className={`font-mono font-bold text-sm tracking-wide transition-all duration-300 ${
                  copied ? 'text-green-500' : 'text-zinc-300'
                }`}>
                  {copied ? 'IP скопирован!' : 'play.breeze.monster'}
                </span>
                
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4 text-zinc-500 transition-colors duration-300" />
                )}
              </div>
              
              <p className="text-[11px] text-zinc-600 font-bold uppercase tracking-widest text-center w-full mt-auto relative z-10">
                Лицензия НЕ обязательна
              </p>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  )
}