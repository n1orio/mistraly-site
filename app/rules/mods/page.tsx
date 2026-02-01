"use client"

import { DocsLayout } from "@/components/docs/DocsLayout"
import { docsSidebarConfig } from "@/components/docs/sidebarConfig"
import { 
  XCircle, 
  CheckCircle, 
  Shield,
  EyeOff,
  Zap,
  Lock,
  AlertTriangle,
  Copy,
  Check,
  Hammer,
  Package,
  Scan
} from "lucide-react"
import { useState, useEffect } from "react"

const modsHeadings = [
  { id: '0', text: 'Введение', level: 2 },
  { id: '0.1', text: 'Что строго запрещено', level: 2 },
  { id: '1', text: 'Запрещённые категории модов', level: 3 },
  { id: '1.1', text: 'Читы и нечестное преимущество', level: 4 },
  { id: '1.2', text: 'Скрытые и вредоносные моды', level: 4 },
  { id: '2', text: 'Разрешённые моды', level: 3 },
  { id: '3', text: 'Последствия нарушений', level: 3 }
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

export default function ForbiddenModsPage() {
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
      headings={modsHeadings}
      title="Правила: Запрещённые моды"
    >
      <div className="prose prose-invert max-w-none">
        
        {/* Введение */}
        <section id="0" className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            <RuleNumber number="0" id="0" />
            Введение
          </h2>
          <p className="text-zinc-300 mb-2">
            Использование несанкционированных модификаций клиента может нарушать честную игру, создавать угрозу безопасности аккаунтов и сервера. 
            Данное правило регулирует допустимые и запрещённые модификации для игры на нашем сервере.
          </p>
          <p className="text-zinc-400 italic mt-2">
            Администрация оставляет за собой право определять статус любого мода, не указанного явно в правилах.
          </p>
        </section>

        <hr className="border-zinc-800 my-8" />

        {/* Что строго запрещено */}
        <section id="0.1" className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <XCircle className="w-6 h-6 text-red-500" />
            <RuleNumber number="0.1" id="0.1" />
            Что строго запрещено
          </h2>

          {/* Запрещённые категории модов */}
          <div id="1" className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <RuleNumber number="1" id="1" />
              Запрещённые категории модов
            </h3>
            
            <div id="1.1" className="mb-4 pl-4 border-l-2 border-red-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="1.1" id="1.1" />
                Читы и нечестное преимущество
              </h4>
              <p className="text-zinc-300 mb-2">
                Любые моды, дающие нечестное преимущество над другими игроками:
              </p>
              <ul className="space-y-1 text-zinc-300 pl-4 mt-2">
                <li className="flex items-start gap-1.5">
                  <span className="text-red-400">•</span>
                  <span>X-Ray, CaveFinder и другие моды для поиска руд</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-400">•</span>
                  <span>Reach, KillAura, AimBot и другие моды для боя</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-400">•</span>
                  <span>Speed, Fly, NoFall, Jesus и другие моды для передвижения</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-400">•</span>
                  <span>ESP, Tracers, Entity Radar для отслеживания игроков</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-400">•</span>
                  <span>AutoClicker с частотой выше 5 кликов/сек</span>
                </li>
              </ul>
            </div>


            <div id="1.2" className="mb-4 pl-4 border-l-2 border-red-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="1.2" id="1.2" />
                Скрытые и вредоносные моды
              </h4>
              <p className="text-zinc-300 mb-2">
                Моды, представляющие угрозу безопасности:
              </p>
              <ul className="space-y-1 text-zinc-300 pl-4 mt-2">
                <li className="flex items-start gap-1.5">
                  <span className="text-red-400">•</span>
                  <span>Кейлоггеры и шпионские моды</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-400">•</span>
                  <span>Моды с майнерами криптовалют</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-400">•</span>
                  <span>Моды, изменяющие сетевые пакеты для обмана сервера</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-red-400">•</span>
                  <span>Моды, содержащие трояны или бэкдоры</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Разрешённые моды */}
          <div id="2" className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <RuleNumber number="2" id="2" />
              Разрешённые моды
            </h3>
            <p className="text-zinc-300 mb-3">
              Следующие категории модов разрешены при условии, что они не дают нечестного преимущества:
            </p>
            <ul className="space-y-2 text-zinc-300 pl-4">
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>OptiFine, Sodium, Iris — оптимизация производительности и графики</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Мини-карты без функции отслеживания игроков (например, обычный Xaero's Minimap)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Шейдеры и ресурс-паки</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Моды для улучшения интерфейса (инвентарь, чат)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Макросы для автоматизации рутинных действий (без спама)</span>
              </li>
            </ul>
            <p className="text-zinc-400 italic mt-3">
              Важно: Даже разрешённые моды могут быть запрещены, если используются для получения преимущества (например, мини-карта с функцией поиска игроков).
            </p>
          </div>

        </section>

      </div>
      <style jsx global>{`
        @keyframes highlightRule {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
          50% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3);
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