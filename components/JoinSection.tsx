"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { User, CreditCard, Gamepad2, Copy, Check, ExternalLink } from "lucide-react"

export default function JoinSection() {
  const [copied, setCopied] = useState(false)

  const copyIP = () => {
    navigator.clipboard.writeText("play.breeze.monster")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="w-full bg-[#090D10] py-20 px-6 font-sans border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        
        {/* Заголовок */}
        <div className="text-center mb-12">
          <h2 className="font-sf text-4xl font-bold mb-3 tracking-tight text-white">
            Как попасть на сервер?
          </h2>
          <p className="text-zinc-500 text-base font-medium">
            Три простых шага, чтобы начать игру
          </p>
        </div>

        {/* Сетка карточек */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* ШАГ 1 */}
          <div className="bg-[#12181F] p-6 rounded-xl flex flex-col items-start border border-white/[0.02]">
            <div className="bg-[#99c03e] w-10 h-10 rounded-lg flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(0,153,255,0.3)]">
              <User className="w-5 h-5 text-white" />
            </div>

            <h3 className="text-[19px] font-bold text-white mb-2 tracking-tight">
              Регистрация
            </h3>
            <p className="text-zinc-400 text-[14.5px] leading-snug mb-8 antialiased">
              Создайте личный аккаунт на нашем сайте для управления персонажем.
            </p>

            <Button 
              variant="secondary" 
              className="w-full bg-[#2B3A4A] hover:bg-[#3d4e61] text-white border-none h-12 rounded-lg flex items-center justify-center gap-2 text-sm font-semibold transition-colors mt-auto"
            >
              Войти в аккаунт
              <ExternalLink className="w-4 h-4 text-zinc-400" />
            </Button>
          </div>

          {/* ШАГ 2 */}
          <div className="bg-[#12181F] p-6 rounded-xl flex flex-col items-start border border-white/[0.02] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#0099ff]/5 blur-3xl pointer-events-none" />
            
            <div className="bg-[#0099ff] w-10 h-10 rounded-lg flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(0,201,167,0.3)]">
              <CreditCard className="w-5 h-5 text-white" />
            </div>

            <h3 className="text-[19px] font-bold text-white mb-2 tracking-tight">
              Купите доступ
            </h3>
            <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-black text-white">500 ₽</span>
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">/ сезон</span>
            </div>
            <p className="text-zinc-400 text-[14.5px] leading-snug mb-8 antialiased">
              Приобретите проходку, чтобы поддержать проект и зайти в мир.
            </p>

            <Button 
              variant="secondary" 
              className="w-full bg-[#0099ff] hover:bg-white duration-500 text-white hover:text-black border-none h-12 rounded-lg flex items-center justify-center gap-2 text-sm font-bold transition-colors mt-auto shadow-[0_0_20px_rgba(0,201,167,0.15)]"
            >
              Купить проходку
            </Button>
          </div>

          {/* ШАГ 3 */}
          <div className="bg-[#12181F] p-6 rounded-xl flex flex-col items-start border border-white/[0.02]">
            <div className="bg-[#5865f2] w-10 h-10 rounded-lg flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(88,101,242,0.3)]">
              <Gamepad2 className="w-5 h-5 text-white" />
            </div>

            <h3 className="text-[19px] font-bold text-white mb-2 tracking-tight">
              Начни игру
            </h3>
            <p className="text-zinc-400 text-[14.5px] leading-snug mb-4 antialiased">
              Используйте IP для подключения в Minecraft (Java 1.21.11).
            </p>

            <div 
              onClick={copyIP}
              className="w-full bg-[#090D10] border border-white/5 rounded-lg p-3 flex items-center justify-between cursor-pointer hover:border-[#0099ff]/30 transition-all group/ip mb-2"
            >
              <span className={`font-mono font-bold text-sm tracking-wide transition-colors ${copied ? 'text-green-500' : 'text-zinc-300 group-hover/ip:text-white'}`}>
                {copied ? 'IP скопирован!' : 'play.breeze.monster'}
              </span>
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-zinc-500" />}
            </div>
            
            <p className="text-[11px] text-zinc-600 font-bold uppercase tracking-widest text-center w-full">
                Лицензия обязательна
            </p>
          </div>

        </div>
      </div>
    </section>
  )
}