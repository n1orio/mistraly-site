"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion, useMotionValue, useSpring } from "framer-motion"
import { MoveLeft, Headphones } from "lucide-react"

export default function NotFound() {
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

    const generated = [...Array(isMobile ? 2 : 6)].map((_, i) => ({
      id: i,
      size: Math.random() * (isMobile ? 2 : 3) + 1,
      xOffset: Math.random() * (isMobile ? 30 : 50) - (isMobile ? 15 : 25),
      duration: 10 + Math.random() * 8,
      delay: Math.random() * 3,
      left: Math.random() * 100,
      top: Math.random() * 100,
    }))
    setParticles(generated)

    return () => {
      window.removeEventListener("resize", checkMobile)
      window.removeEventListener("mousemove", handleMouseMove)
    }
  }, [isMobile])

  return (
    <div className="relative w-full min-h-[calc(100vh-72px)] bg-[#080B0E] text-white flex flex-col font-sans overflow-hidden">
      
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
            backgroundSize: isMobile ? '50px 50px' : '40px 40px',
            maskImage: 'radial-gradient(circle at center, black 50%, transparent 95%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 50%, transparent 95%)'
          }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(8,11,14,0.9)_100%)]" />
      </div>

      {/* --- КОНТЕНТ --- */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl w-full"
        >
          <p className="font-sf text-[#0099ff] text-lg sm:text-xl font-bold tracking-[0.3em] uppercase mb-3 sm:mb-4 opacity-80 antialiased">
            Ошибка 404
          </p>
          
          <h1 className="font-sf text-4xl sm:text-5xl md:text-6xl lg:text-[90px] font-bold tracking-[-0.04em] leading-[1.05] sm:leading-[0.95] text-white">
            Страница не <br /> 
            <span className="relative inline-block whitespace-nowrap px-3 sm:px-6">
              <span className="absolute inset-x-0 bottom-[12%] h-[72%] bg-[#0099ff] -z-10 rounded-lg shadow-[0_0_50px_rgba(0,153,255,0.35)]"></span>
              <span className="relative z-10 tracking-tighter">найдена</span>
            </span>
          </h1>

          <p className="mt-5 sm:mt-6 text-zinc-400 text-sm sm:text-base md:text-[18px] max-w-xl mx-auto leading-relaxed font-medium opacity-80">
            Упс! Похоже, вы забрели в неизведанные уголки Breeze. <br className="hidden sm:inline" />
            Этой страницы не существует или она была перемещена.
          </p>

          {/* --- АДАПТИВНЫЕ КНОПКИ --- */}
          <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full">
            <Button
              asChild
              className="h-12 sm:h-14 w-full sm:w-64 bg-[#0099ff] hover:bg-white hover:text-black text-base sm:text-lg font-bold rounded-xl transition-all duration-300 active:scale-95 shadow-[0_10px_25px_rgba(0,153,255,0.2)]"
            >
              <Link href="/" className="flex items-center justify-center gap-2">
                <MoveLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                На главную
              </Link>
            </Button>

            <div className="group flex items-center justify-between w-full sm:w-64 bg-white/[0.03] backdrop-blur-xl border border-white/10 p-1 pl-4 sm:pl-6 rounded-xl hover:bg-white/[0.08] hover:border-[#0099ff]/50 transition-all cursor-pointer active:scale-95 select-none h-12 sm:h-14">
              <Link href="/support" className="flex items-center justify-between w-full pr-3">
                <div className="flex flex-col items-start leading-tight pl-1 sm:pl-2">
                  <span className="text-[8px] sm:text-[9px] text-zinc-500 uppercase tracking-[0.2em] font-black">
                    Нужна помощь?
                  </span>
                  <span className="text-white font-bold text-[13px] sm:text-[15px] group-hover:text-[#0099ff] transition-colors">
                    Поддержка
                  </span>
                </div>
                <Headphones className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400 group-hover:text-white transition-colors" />
              </Link>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}