"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { motion, useMotionValue, useSpring } from "framer-motion"
import { MoveLeft, Headphones } from "lucide-react"

export default function NotFound() {
  // Исправление гидратации для частиц
  const [particles, setParticles] = useState<any[]>([])

  // Интерактивный свет
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springConfig = { damping: 30, stiffness: 120 }
  const lightX = useSpring(mouseX, springConfig)
  const lightY = useSpring(mouseY, springConfig)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX)
      mouseY.set(e.clientY)
    }
    window.addEventListener("mousemove", handleMouseMove)

    // Генерируем частицы только в браузере
    const generated = [...Array(6)].map((_, i) => ({
      id: i,
      size: Math.random() * 3 + 1,
      xOffset: Math.random() * 50 - 25,
      duration: 10 + Math.random() * 10,
      delay: Math.random() * 5,
      left: Math.random() * 100,
      top: Math.random() * 100,
    }))
    setParticles(generated)

    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div className="relative w-full min-h-[calc(100vh-72px)] bg-[#080B0E] text-white flex flex-col font-sans overflow-hidden">
      
      {/* --- ВИЗУАЛЬНЫЙ ФОН (КАК НА ГЛАВНОЙ) --- */}
      <div className="absolute inset-0 z-0">
        {/* Прожектор */}
        <motion.div 
          style={{ x: lightX, y: lightY }}
          className="absolute w-[1000px] h-[1000px] -translate-x-1/2 -translate-y-1/2 bg-[#0099ff]/10 rounded-full blur-[140px] pointer-events-none z-10"
        />

        {/* Частицы */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            animate={{
              y: [0, -100, 0],
              x: [0, p.xOffset, 0],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{ duration: p.duration, repeat: Infinity, ease: "linear", delay: p.delay }}
            className="absolute bg-white rounded-full pointer-events-none"
            style={{
              width: `${p.size}px`,
              height: `${p.size}px`,
              left: `${p.left}%`,
              top: `${p.top}%`,
              filter: "blur(1px)",
            }}
          />
        ))}

        {/* Сетка */}
        <div 
          className="absolute inset-0 opacity-[0.2]" 
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, rgba(0, 153, 255, 0.3) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
            maskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)',
            WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 90%)'
          }}
        />

        {/* Виньетка */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(8,11,14,0.8)_100%)]" />
      </div>

      {/* --- КОНТЕНТ --- */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <p className="font-sf text-[#0099ff] text-xl font-bold tracking-[0.3em] uppercase mb-4 opacity-80 antialiased">
            Ошибка 404
          </p>
          
          <h1 className="font-sf text-6xl md:text-[90px] font-bold tracking-[-0.05em] leading-[0.9] text-white">
            Страница не <br /> 
            <span className="relative inline-block whitespace-nowrap px-6">
                {/* Синий фон (Highlighter) идентичный главной */}
                <span className="absolute inset-x-0 bottom-[12%] h-[72%] bg-[#0099ff] -z-10 rounded-lg shadow-[0_0_60px_rgba(0,153,255,0.4)]"></span>
                <span className="relative z-10 tracking-tighter">найдена</span>
            </span>
          </h1>

          <p className="mt-8 text-zinc-400 text-lg md:text-[18px] max-w-xl mx-auto leading-relaxed font-medium opacity-80">
            Упс! Похоже, вы забрели в неизведанные уголки Breeze <br />
            Этой страницы не существует или она была перемещена.
          </p>

          {/* КНОПКИ (Стиль h-14 w-64) */}
          <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-4">
            <Button asChild className="h-14 w-64 bg-[#0099ff] hover:bg-white hover:text-black text-lg text-white font-bold rounded-xl transition-all duration-300 active:scale-95 shadow-[0_15px_30px_rgba(0,153,255,0.2)]">
              <Link href="/" className="flex items-center justify-center gap-2">
                <MoveLeft className="w-5 h-5" />
                На главную
              </Link>
            </Button>
            
            <div className="group flex items-center justify-between w-64 bg-white/[0.03] backdrop-blur-xl border border-white/10 p-1 pl-6 rounded-xl hover:bg-white/[0.08] hover:border-[#0099ff]/50 transition-all cursor-pointer active:scale-95 select-none h-14">
                <Link href="/support" className="flex items-center justify-between w-full pr-3">
                    <div className="flex flex-col items-start leading-tight pl-2">
                        <span className="text-[9px] text-zinc-500 uppercase tracking-[0.2em] font-black">Нужна помощь?</span>
                        <span className="text-white font-bold text-[15px] group-hover:text-[#0099ff] transition-colors">Поддержка</span>
                    </div>
                    <Headphones className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                </Link>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}