"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Copy, ShoppingCart, Check } from "lucide-react"
import { motion, useMotionValue, useSpring } from "framer-motion"
import router from "next/router"

export default function SleekHero() {
  const [copied, setCopied] = useState(false)
  const [particles, setParticles] = useState<any[]>([])
  const [isMobile, setIsMobile] = useState(false)

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { damping: 30, stiffness: 120 }
  const lightX = useSpring(mouseX, springConfig)
  const lightY = useSpring(mouseY, springConfig)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }

    if (!isMobile) {
      window.addEventListener("mousemove", handleMouseMove)
    }

    const particleCount = isMobile ? 2 : 6
    const generatedParticles = [...Array(particleCount)].map((_, i) => ({
      id: i,
      size: Math.random() * 2 + 1,
      xOffset: Math.random() * 30 - 15,
      duration: 12 + Math.random() * 8,
      delay: Math.random() * 3,
      left: Math.random() * 100,
      top: Math.random() * 100,
    }))
    setParticles(generatedParticles)

    return () => {
      window.removeEventListener("resize", checkMobile)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [isMobile])

  const handleCopy = () => {
    navigator.clipboard.writeText("play.breeze.monster")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative w-full min-h-[calc(100vh-72px)] bg-[#080B0E] text-white selection:bg-[#0099ff] selection:text-white flex flex-col font-sans overflow-hidden">
      
      {/* --- ФОН --- */}
      <div className="absolute inset-0 z-0">
        {!isMobile && (
          <motion.div 
            style={{ x: lightX, y: lightY }}
            className="absolute w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 bg-[#0099ff]/10 rounded-full blur-[100px] pointer-events-none z-10"
          />
        )}

        {particles.map((p) => (
          <motion.div
            key={p.id}
            animate={{
              y: [0, -80, 0],
              x: [0, p.xOffset, 0],
              opacity: [0.1, 0.25, 0.1],
            }}
            transition={{ duration: p.duration, repeat: Infinity, ease: "linear", delay: p.delay }}
            className="absolute bg-white rounded-full pointer-events-none"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: `${p.left}%`,
              top: `${p.top}%`,
              filter: "blur(0.5px)",
            }}
          />
        ))}

        <div 
          className="absolute inset-0 opacity-[0.15]" 
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(0, 153, 255, 0.2) 1px, transparent 0)`,
            backgroundSize: '50px 50px',
            maskImage: 'radial-gradient(circle at center, black 50%, transparent 95%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 50%, transparent 95%)'
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(8,11,14,0.9)_100%)]" />
      </div>

      {/* --- КОНТЕНТ --- */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-start px-4 sm:px-6 pt-20 sm:pt-28 md:pt-32 lg:pt-40 text-center">
        <div className="max-w-4xl w-full"> 
          {/* ЗАГОЛОВОК с исправленными отступами */}
          <h1 className="font-sf text-4xl sm:text-5xl md:text-6xl lg:text-[90px] font-bold tracking-[-0.03em] leading-[1.1] sm:leading-[1.0] md:leading-[0.95] mb-2 sm:mb-3">
            Творим контент
          </h1>
          
          <h1 className="font-sf text-4xl sm:text-5xl md:text-6xl lg:text-[90px] font-black tracking-[-0.03em] leading-[1.1] sm:leading-[1.0] md:leading-[0.95] mb-2 sm:mb-3">
            <span className="relative inline-block whitespace-nowrap px-2 sm:px-4">
              <span className="absolute inset-x-0 bottom-[12%] h-[72%] bg-[#0099ff] -z-10 rounded-lg shadow-[0_0_40px_rgba(0,153,255,0.3)]"></span>
              <span className="relative z-10 text-white tracking-tighter">По настоящему</span>
            </span>
          </h1>
          
          <h1 className="font-sf text-4xl sm:text-5xl md:text-6xl lg:text-[90px] font-bold tracking-[-0.03em] leading-[1.1] sm:leading-[1.0] md:leading-[0.95]">
            уникально
          </h1>

          <p className="mt-6 sm:mt-8 md:mt-10 text-zinc-400 text-sm sm:text-base md:text-[18px] max-w-2xl mx-auto leading-relaxed font-medium opacity-80 px-1">
            Выживайте, создавайте уникальное и играйте в удовольствие. <br className="hidden sm:inline" />
            Без приватов, привилегий и лишних плагинов.
          </p>
        </div>

        {/* КНОПКИ: адаптивное расположение */}
        <div className="mt-8 sm:mt-10 md:mt-12 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full max-w-3xl mx-auto">
          <Button 
            onClick={() => router.push('/buy-pass')}
            className="h-12 sm:h-14 w-full sm:w-64 text-base sm:text-lg bg-[#0099ff] hover:bg-white hover:text-black font-bold rounded-xl transition-all duration-300 shadow-[0_10px_25px_rgba(0,153,255,0.2)] active:scale-95"
          >
            <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Купить доступ
          </Button>

          <div 
            onClick={handleCopy}
            className="group flex items-center justify-between w-full sm:w-64 bg-white/[0.03] backdrop-blur-xl border border-white/10 p-1 pl-4 sm:pl-6 rounded-xl hover:bg-white/[0.08] hover:border-[#0099ff]/50 transition-all cursor-pointer active:scale-95 select-none h-12 sm:h-14"
          >
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[8px] sm:text-[9px] text-zinc-500 uppercase tracking-[0.2em] font-black">
                {copied ? "Скопировано!" : "IP Адрес сервера"}
              </span>
              <span className={`font-mono font-bold text-[13px] sm:text-[15px] tracking-wide transition-colors ${copied ? "text-green-500" : "text-white group-hover:text-[#0099ff]"}`}>
                play.breeze.monster
              </span>
            </div>
            <div className="flex items-center justify-center w-10 sm:w-12 h-10 sm:h-12 text-zinc-400 group-hover:text-white transition-colors">
              {copied ? <Check className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" /> : <Copy className="h-4 w-4 sm:h-5 sm:w-5" />}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}