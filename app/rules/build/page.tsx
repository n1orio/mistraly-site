"use client"

import { DocsLayout } from "@/components/docs/DocsLayout"
import { docsSidebarConfig } from "@/components/docs/sidebarConfig"
import { 
  XCircle, 
  CheckCircle, 
  Shield,
  AlertTriangle,
  Copy,
  Check,
  Map,
  Ruler,
  TreePine,
  Landmark,
  Handshake,
  Hammer,
  Bomb,
  Flame,
  Scale,
  Package,
  Scan
} from "lucide-react"
import { useState, useEffect } from "react"

const territoryHeadings = [
  { id: '0', text: 'Введение', level: 2 },
  { id: '1', text: 'Запретные зоны', level: 3 },
  { id: '2', text: 'Занятие территории', level: 3 },
  { id: '2.1', text: 'Обоснованное использование', level: 4 },
  { id: '2.2', text: 'Территория на будущее', level: 4 },
  { id: '2.3', text: 'Соседние территории', level: 4 },
  { id: '3', text: 'Правила уборки и порядка', level: 3 },
  { id: '3.1', text: 'Работа с деревьями', level: 4 },
  { id: '3.2', text: 'Запрещённые действия', level: 4 },
  { id: '3.3', text: 'Взрывы и лава', level: 4 }
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

export default function TerritoryRulesPage() {
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
      headings={territoryHeadings}
      title="Правила: Занятие территории"
    >
      <div className="prose prose-invert max-w-none">
        
        {/* Введение */}
        <section id="0" className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            <RuleNumber number="0" id="0" />
            Введение
          </h2>
          <p className="text-zinc-300 mb-2">
            Правила занятия территории направлены на обеспечение справедливого распределения пространства между игроками, 
            предотвращение конфликтов и поддержание чистоты и порядка в мире сервера.
          </p>
          <p className="text-zinc-400 italic mt-2">
            Соблюдение этих правил помогает создать комфортную среду для всех участников сервера.
          </p>
        </section>

        <hr className="border-zinc-800 my-8" />

        {/* Запретные зоны */}
        <section id="1" className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Ruler className="w-5 h-5 text-red-400" />
            <RuleNumber number="1" id="1" />
            Запретные зоны
          </h3>
          
          <div className="bg-zinc-900/50 border-l-4 border-red-500/50 p-4 rounded-r-lg mb-4">
            <p className="text-zinc-300 mb-3">
              Запрещено занимать территорию в следующих радиусах от нулевых координат (0, 0):
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-zinc-300">
                <span className="inline-block w-3 h-3 bg-red-500 rounded-full"></span>
                <span className="font-semibold">Обычный мир:</span>
                <span className="text-red-400 font-bold">600 блоков</span>
              </div>
              <div className="flex items-center gap-2 text-zinc-300">
                <span className="inline-block w-3 h-3 bg-orange-500 rounded-full"></span>
                <span className="font-semibold">Ад (Незер):</span>
                <span className="text-orange-400 font-bold">350 блоков</span>
              </div>
            </div>
          </div>

          <div className="bg-zinc-900/40 border-l-4 border-amber-500/50 p-3 rounded-r-lg">
            <p className="text-zinc-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 text-amber-400 flex-shrink-0" />
              <span>
                Территории, занятые в запретных зонах, могут быть конфискованы без предупреждения.
              </span>
            </p>
          </div>
        </section>

        <hr className="border-zinc-800 my-8" />

        {/* Занятие территории */}
        <section id="2" className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Map className="w-5 h-5 text-blue-400" />
            <RuleNumber number="2" id="2" />
            Занятие территории
          </h3>

          <div id="2.1" className="mb-4 pl-4 border-l-2 border-green-500/30">
            <h4 className="text-lg font-semibold text-white mb-2">
              <RuleNumber number="2.1" id="2.1" />
              Обоснованное использование
            </h4>
            <p className="text-zinc-300 mb-2">
              Каждый игрок или город может занять любое количество территории, если:
            </p>
            <ul className="space-y-1 text-zinc-300 pl-4 mt-2">
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Территория активно используется</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Использование территории оправдано</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Есть реальные постройки и инфраструктура</span>
              </li>
            </ul>
            <p className="text-zinc-400 italic mt-3">
              Администрация оставляет за собой право оценивать обоснованность использования территории.
            </p>
          </div>

          <div id="2.2" className="mb-4 pl-4 border-l-2 border-blue-500/30">
            <h4 className="text-lg font-semibold text-white mb-2">
              <RuleNumber number="2.2" id="2.2" />
              Территория на будущее
            </h4>
            <p className="text-zinc-300 mb-2">
              Вы можете зарезервировать территорию на будущее, пометив её:
            </p>
            <ul className="space-y-1 text-zinc-300 pl-4 mt-2">
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>Табличками с указанием владельца</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400">•</span>
                <span>Визуальными метками (флаги, ограждения)</span>
              </li>
            </ul>
            <div className="bg-zinc-900/40 border-l-4 border-amber-500/50 p-3 rounded-r-lg mt-3">
              <p className="text-zinc-300">
                <span className="font-semibold text-amber-400">Важно:</span> Если на территории нет реальных построек, 
                её может занять другой игрок. Резервирование без развития не защищает территорию.
              </p>
            </div>
          </div>

          <div id="2.3" className="mb-4 pl-4 border-l-2 border-purple-500/30">
            <h4 className="text-lg font-semibold text-white mb-2">
              <RuleNumber number="2.3" id="2.3" />
              Соседние территории
            </h4>
            <p className="text-zinc-300 mb-3">
              Если вы хотите занять территорию, и в радиусе 300 блоков где уже есть занятая территория:
            </p>
            <div className="bg-zinc-900/40 border-l-4 border-purple-500/50 p-4 rounded-r-lg mb-3">
              <ol className="text-zinc-300 pl-6 space-y-2 list-decimal">
                <li>Вы должны договориться с владельцем соседней территории</li>
                <li>Заключить письменный контракт</li>
                <li>В контракте владелец должен подтвердить своё согласие</li>
              </ol>
            </div>
            <div className="bg-zinc-900/50 border-l-4 border-red-500/50 p-3 rounded-r-lg">
              <p className="text-zinc-300 flex items-start gap-2">
                <XCircle className="w-4 h-4 mt-0.5 text-red-400 flex-shrink-0" />
                <span>
                  Без контракта владелец соседней территории может подать на вас в суд.
                </span>
              </p>
            </div>
          </div>
        </section>

        <hr className="border-zinc-800 my-8" />

        {/* Правила уборки и порядка */}
        <section id="3" className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Hammer className="w-5 h-5 text-amber-400" />
            <RuleNumber number="3" id="3" />
            Правила уборки и порядка
          </h3>

          <div id="3.1" className="mb-4 pl-4 border-l-2 border-green-500/30">
            <h4 className="text-lg font-semibold text-white mb-2">
              <RuleNumber number="3.1" id="3.1" />
              Работа с деревьями
            </h4>
            <p className="text-zinc-300 mb-2">
              При заготовке древесины соблюдайте следующие правила:
            </p>
            <ul className="space-y-2 text-zinc-300 pl-4 mt-2">
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Рубите деревья до конца — убирайте все блоки ствола</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">✓</span>
                <span>Сажайте новые деревья для восстановления леса</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">✗</span>
                <span>Не оставляйте висячие стволы без листвы</span>
              </li>
            </ul>
            <div className="mt-3 p-3 bg-zinc-900/30 rounded-lg">
              <p className="text-zinc-400 text-sm italic">
                Совет: Используйте моды для автоматической рубки деревьев (TreeCapitator, 
                или аналоги) для более эффективной заготовки.
              </p>
            </div>
          </div>

          <div id="3.2" className="mb-4 pl-4 border-l-2 border-yellow-500/30">
            <h4 className="text-lg font-semibold text-white mb-2">
              <RuleNumber number="3.2" id="3.2" />
              Запрещённые действия
            </h4>
            <p className="text-zinc-300 mb-3">
              Для поддержания чистоты мира запрещены следующие действия:
            </p>
            <ul className="space-y-2 text-zinc-300 pl-4">
              <li className="flex items-start gap-2">
                <span className="text-red-400">✗</span>
                <span>Не засоряйте мир блоками и мусором</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">✗</span>
                <span>Не используйте блоки для перемещения или забирания на горы</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">✗</span>
                <span>Закрывайте дырки от криперов и других взрывов</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">✗</span>
                <span>Не стройте столбы в один блок — убирайте их за собой</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">✗</span>
                <span>Не оставляйте незавершённые постройки без дела</span>
              </li>
            </ul>
          </div>

          <div id="3.3" className="mb-4 pl-4 border-l-2 border-red-500/30">
            <h4 className="text-lg font-semibold text-white mb-2">
              <RuleNumber number="3.3" id="3.3" />
              Взрывы и лава
            </h4>
            <div className="bg-zinc-900/50 border-l-4 border-red-500/50 p-4 rounded-r-lg mb-3">
              <p className="text-zinc-300 mb-2">
                <span className="font-semibold text-red-400">Строго запрещено:</span>
              </p>
              <ul className="space-y-1 text-zinc-300 pl-4">
                <li className="flex items-start gap-2">
                  <Bomb className="w-4 h-4 text-red-400 mt-0.5" />
                  <span>Взрывать территорию любыми способами</span>
                </li>
                <li className="flex items-start gap-2">
                  <Flame className="w-4 h-4 text-orange-400 mt-0.5" />
                  <span>Делать лавакасты (заливать лавой большие территории)</span>
                </li>
              </ul>
            </div>
            <p className="text-zinc-300">
              Даже если территория принадлежит вам или никому не принадлежит — взрывы и лавакасты запрещены.
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