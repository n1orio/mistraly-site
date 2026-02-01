"use client"

import { DocsLayout } from "@/components/docs/DocsLayout"
import { docsSidebarConfig } from "@/components/docs/sidebarConfig"
import { 
  XCircle, 
  CheckCircle, 
  Gem,
  DollarSign,
  Users,
  Copy,
  Check,
  Shield
} from "lucide-react"
import { useState, useEffect } from "react"

const currencyHeadings = [
  { id: '0', text: 'Введение', level: 2 },
  { id: '0.1', text: 'Что строго запрещено', level: 2 },
  { id: '1', text: 'Валюта сервера', level: 3 },
  { id: '1.1', text: 'АРы для междусерверной торговли', level: 4 },
  { id: '1.2', text: 'Внутренняя торговля', level: 4 },
  { id: '2', text: 'Торговля за реальные деньги', level: 3 },
  { id: '2.1', text: 'Запрещённые обмены', level: 4 },
  { id: '2.2', text: 'Разрешённые обмены', level: 4 }
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

export default function CurrencyRulesPage() {
  useEffect(() => {
    // Скролл к якорю при загрузке страницы
    if (window.location.hash) {
      const hash = window.location.hash.substring(1)
      const element = document.getElementById(hash)
      
      if (element) {
        // Добавляем задержку для плавного скролла после загрузки
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
      headings={currencyHeadings}
      title="Правила: Валюта и торговля"
    >
      <div className="prose prose-invert max-w-none">
        
        {/* Введение */}
        <section id="0" className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            <RuleNumber number="0" id="0" />
            Введение
          </h2>
          <p className="text-zinc-300 mb-2">
            Правила регулируют использование валюты на сервере и ограничивают торговлю за реальные деньги.
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

          {/* Валюта сервера */}
          <div id="1" className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Gem className="w-5 h-5 text-cyan-400" />
              <RuleNumber number="1" id="1" />
              Валюта сервера
            </h3>
            
            <div id="1.1" className="mb-4 pl-4 border-l-2 border-cyan-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="1.1" id="1.1" />
                АР для междусерверной торговли
              </h4>
              <p className="text-zinc-300">
                АРы являются официальной валютой сервера и должны использоваться для торговли между игроками.
              </p>
              <p className="text-zinc-500">
                АР - Алмазная руда (добывается шелковым касанием)
              </p>
            </div>

            <div id="1.2" className="mb-4 pl-4 border-l-2 border-cyan-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="1.2" id="1.2" />
                Внутренняя торговля
              </h4>
              <p className="text-zinc-300">
                Для внутренней торговли внутри города/гильдии, можно использовать любую валюту по соглашению сторон.
              </p>
            </div>
          </div>

          {/* Торговля за реальные деньги */}
          <div id="2" className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              <RuleNumber number="2" id="2" />
              Торговля за реальные деньги
            </h3>
            
            <div id="2.1" className="mb-4 pl-4 border-l-2 border-red-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="2.1" id="2.1" />
                Запрещённые обмены
              </h4>
              <p className="text-zinc-300 mb-2">
                Нельзя торговать игровыми предметами и услугами за реальные деньги или обменивать их на что-либо, стоимость чего выражается в реальных деньгах.
              </p>
              <ul className="space-y-1 text-zinc-300 pl-4 mt-2">
                <li>• Продажа АР за рубли, доллары или другую фиатную валюту</li>
                <li>• Обмен игровых предметов на аккаунты, лицензии Майнкрафт или сервисы вроде Fusion</li>
                <li>• Продажа доступа к территории или привилегий за реальные деньги</li>
              </ul>
            </div>

            <div id="2.2" className="mb-4 pl-4 border-l-2 border-green-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="2.2" id="2.2" />
                Разрешённые обмены
              </h4>
              <ul className="text-zinc-300 mb-2">
                <li>Можно обменивать игровую валюту на творческие услуги в реальной жизни.</li>
                <li>Некоторые приверы ниже:</li>
              </ul>
              <ul className="space-y-1 text-zinc-300 pl-4 mt-2">
                <li className="text-green-400">✓ Заказ скина за АРы</li>
                <li className="text-green-400">✓ Заказ текстурпака или ресурс-пака за АРы</li>
                <li className="text-green-400">✓ Заказ 3D-модели или арта за АРы</li>
              </ul>
            </div>
          </div>

          <hr className="border-zinc-800 my-8" />


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