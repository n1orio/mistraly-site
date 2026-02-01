"use client"

import { DocsLayout } from "@/components/docs/DocsLayout"
import { docsSidebarConfig } from "@/components/docs/sidebarConfig"
import { 
  Shield, 
  AlertTriangle, 
  XCircle, 
  CheckCircle, 
  Users, 
  Zap, 
  Hammer,
  BookOpen,
  Gamepad2,
  Star,
  MessageSquare,
  VolumeX,
  Megaphone,
  Mail,
  Timer,
  Ban,
  Copy,
  Check
} from "lucide-react"
import { useState, useEffect } from "react"

const rulesHeadings = [
  { id: 'intro', text: 'Введение', level: 2 }
]

interface RuleNumberProps {
  number: string
  id: string
}

function RuleNumber({ number, id }: RuleNumberProps) {
  const [copied, setCopied] = useState(false)
  const [hovered, setHovered] = useState(false)

  const handleClick = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${id}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`inline-flex items-center gap-1.5 px-0.5 py-0.5 rounded text-xl font-bold transition-all duration-200 ${
        copied 
          ? 'bg-green-500/30 text-green-400 border border-green-500/40' 
          : 'bg-transparent text-zinc-300 hover:bg-zinc-700/50 hover:text-white border border-transparent'
      }`}
      title={copied ? 'Ссылка скопирована!' : 'Кликните для копирования ссылки'}
    >
      {number}
      <span className={`transition-all duration-200 ${
        copied 
          ? 'opacity-100 scale-110' 
          : hovered 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-95'
      }`}>
        {copied ? (
          <Check className="w-4 h-4 text-green-400" strokeWidth={2.5} />
        ) : (
          <Copy className="w-4 h-4 text-zinc-300" strokeWidth={2} />
        )}
      </span>
    </button>
  )
}

export default function RulesPage() {
  useEffect(() => {
    // Скролл к якорю при загрузке страницы
    if (window.location.hash) {
      const hash = window.location.hash.substring(1)
      const element = document.getElementById(hash)
      
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' })
          
          // Временно подсвечиваем элемент
          element.classList.add('highlight-rule')
          
          setTimeout(() => {
            element.classList.remove('highlight-rule')
          }, 3000)
        }, 100)
      }
    }
  }, [])

  return (
    <DocsLayout
      sidebarConfig={docsSidebarConfig}
      headings={rulesHeadings}
      title="Правила сервера"
      description="Обязательные правила для всех игроков Breeze.monster"
    >
      <section id="intro" className="mb-8">
        <div className="bg-gradient-to-r from-[#0099ff]/10 to-[#0055FF]/10 border border-[#0099ff]/30 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-3 text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#0099ff]/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#0099ff]" />
            </span>
            <RuleNumber number="0" id="intro" />
            Введение
          </h2>
          <p className="text-zinc-300 leading-relaxed">
            Добро пожаловать на сервер Breeze.monster! Чтобы обеспечить комфортную игру для всех участников, просим ознакомиться с правилами. Незнание правил не освобождает от ответственности.
          </p>
        </div>
      </section>

      <hr className="border-white/10 my-8" />

      {/* ОБЩИЕ ПРАВИЛА */}
      <section id="general-rules" className="mb-8">
        <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-[#0099ff]/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#0099ff]" />
          </span>
          <RuleNumber number="1" id="general-rules" />
          Общие правила
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">

          <div id="respect" className="group bg-[#12181F] border border-[#0099ff]/30 rounded-xl p-4 hover:border-[#0099ff]/60 transition-all duration-300 hover:shadow-lg hover:shadow-[#0099ff]/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0099ff]/20 to-[#0055FF]/10 flex items-center justify-center flex-shrink-0 border border-[#0099ff]/30">
                <Users className="w-6 h-6 text-[#0099ff]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2 truncate">
                  <span className="truncate">Общение и поведение</span>
                </h3>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Запрещены оскорбления, расизм, сексизм, гомофобия и любые формы дискриминации. Соблюдайте уважительный тон в общении с другими игроками и администрацией.
                </p>
              </div>
            </div>
          </div>

          <div id="cheating" className="group bg-[#12181F] border border-[#FF4444]/30 rounded-xl p-4 hover:border-[#FF4444]/60 transition-all duration-300 hover:shadow-lg hover:shadow-[#FF4444]/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF4444]/20 to-[#FF1111]/10 flex items-center justify-center flex-shrink-0 border border-[#FF4444]/30">
                <AlertTriangle className="w-6 h-6 text-[#FF4444]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2 truncate">
                  <span className="truncate">Гриферство</span>
                </h3>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Запрещены кража, разрушение построек и нападения на других игроков без их согласия. Соблюдайте правила PvP и уважайте чужую собственность.
                </p>
              </div>
            </div>
          </div>

          <div className="group bg-[#12181F] border border-[#FFD700]/30 rounded-xl p-4 hover:border-[#FFD700]/60 transition-all duration-300 hover:shadow-lg hover:shadow-[#FFD700]/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FFD700]/20 to-[#FFA500]/10 flex items-center justify-center flex-shrink-0 border border-[#FFD700]/30">
                <Gamepad2 className="w-6 h-6 text-[#FFD700]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2 truncate">
                  <span className="truncate">Экономика</span>
                </h3>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Соблюдайте правила торговли и использования валюты на сервере. Запрещены мошенничество, обман, накрутка валюты и другие нарушения экономической системы сервера.
                </p>
              </div>
            </div>
          </div>

          <div className="group bg-[#12181F] border border-[#39FF14]/30 rounded-xl p-4 hover:border-[#39FF14]/60 transition-all duration-300 hover:shadow-lg hover:shadow-[#39FF14]/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#39FF14]/20 to-[#00FF00]/10 flex items-center justify-center flex-shrink-0 border border-[#39FF14]/30">
                <Zap className="w-6 h-6 text-[#39FF14]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2 truncate">
                  <span className="truncate">Запрещённые модификации</span>
                </h3>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Использование читов, взломанных клиентов и запрещённых модов строго запрещено. Соблюдайте правила использования модификаций, одобренных администрацией сервера.
                </p>
              </div>
            </div>
          </div>

          <div className="group bg-[#12181F] border border-[#9370DB]/30 rounded-xl p-4 hover:border-[#9370DB]/60 transition-all duration-300 hover:shadow-lg hover:shadow-[#9370DB]/10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#9370DB]/20 to-[#8A2BE2]/10 flex items-center justify-center flex-shrink-0 border border-[#9370DB]/30">
                <Hammer className="w-6 h-6 text-[#9370DB]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2 truncate">
                  <span className="truncate">Строительство</span>
                </h3>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Соблюдайте правила строительства и оформления территорий на сервере. Запрещены взрывы, загрязнение окружающей среды и другие действия, нарушающие порядок на сервере.
                </p>
              </div>
            </div>
          </div>

          <div className="group bg-[#12181F] border border-white/20 rounded-xl p-4 hover:border-white/40 transition-all duration-300 hover:shadow-lg hover:shadow-white/5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-white/10 to-zinc-500/10 flex items-center justify-center flex-shrink-0 border border-white/20">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2 truncate">
                  <span className="truncate">Система наказаний</span>
                </h3>
                <p className="text-zinc-300 text-sm leading-relaxed">
                  Нарушение правил влечет за собой предупреждения, временные или постоянные баны в зависимости от тяжести нарушения. Соблюдайте правила, чтобы избежать наказаний.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>



      <style jsx global>{`
        @keyframes highlightRule {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(0, 153, 255, 0);
          }
          50% {
            box-shadow: 0 0 0 4px rgba(0, 153, 255, 0.3);
          }
        }
        .highlight-rule {
          animation: highlightRule 0.5s ease-in-out 6;
          position: relative;
        }
      `}</style>
    </DocsLayout>
  )
}