"use client"

import { DocsLayout } from "@/components/docs/DocsLayout"
import { docsSidebarConfig } from "@/components/docs/sidebarConfig"
import { 
  XCircle, 
  CheckCircle, 
  Users, 
  Hammer, 
  Package, 
  Zap, 
  FileText,
  DollarSign,
  Copy,
  Check
} from "lucide-react"
import { useState, useEffect } from "react"

const griefingHeadings = [
  { id: '0', text: 'Введение', level: 2 },
  { id: '0.1', text: 'Что строго запрещено', level: 2 },
  { id: '1', text: 'Гриферство', level: 3 },
  { id: '1.1', text: 'Поломка блоков', level: 4 },
  { id: '1.2', text: 'Убийство мобов в загонах', level: 4 },
  { id: '1.3', text: 'Открытие декоративных люков и дверей', level: 4 },
  { id: '2', text: 'Воровство', level: 3 },
  { id: '2.1', text: 'Взятие вещей из сундуков', level: 4 },
  { id: '2.2', text: 'Присвоение вещей умерших игроков', level: 4 },
  { id: '3', text: 'Убийства игроков', level: 3 },
  { id: '3.1', text: 'Убийство без согласия', level: 4 },
  { id: '3.2', text: 'Нанесение урона', level: 4 },
  { id: '3.3', text: 'Действия, мешающие геймплею', level: 4 },
  { id: '4', text: 'Мошенничество', level: 3 },
  { id: '4.1', text: 'Финансовые пирамиды', level: 4 },
  { id: '4.2', text: 'Обман при обменах', level: 4 },
  { id: '5', text: 'Создание лагов', level: 3 },
  { id: '5.1', text: 'Механизмы, вызывающие лаги', level: 4 },
  { id: '5.2', text: 'Заполнение лимита мобов', level: 4 },
  { id: '5.3', text: 'Отключение спавнрейта', level: 4 },
  { id: '6', text: 'Когда можно нарушать правила', level: 2 },
  { id: '6.1', text: 'Требования к согласию', level: 3 },
  { id: '6.1.1', text: 'Сообщения в чате сервера', level: 4 },
  { id: '6.1.2', text: 'Сообщения в Discord', level: 4 },
  { id: '6.1.3', text: 'Подписанная книга в игре', level: 4 }
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

export default function GriefingPage() {
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
      headings={griefingHeadings}
      title="Правила: Гриферство, воровство и убийства"
    >
      <div className="prose prose-invert max-w-none">
        
        {/* Введение */}
        <section id="0" className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            <RuleNumber number="0" id="0" />
            Введение
          </h2>
          <p className="text-zinc-300 mb-2">
            Правила регулируют взаимодействие игроков с чужой собственностью и другими игроками.
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

          {/* Гриферство */}
          <div id="1" className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Hammer className="w-5 h-5 text-purple-400" />
              <RuleNumber number="1" id="1" />
              Гриферство
            </h3>
            
            <div id="1.1" className="mb-4 pl-4 border-l-2 border-purple-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="1.1" id="1.1" />
                Поломка блоков
              </h4>
              <p className="text-zinc-300">
                Поломка блоков на территории другого игрока.
              </p>
            </div>

            <div id="1.2" className="mb-4 pl-4 border-l-2 border-purple-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="1.2" id="1.2" />
                Убийство мобов в загонах
              </h4>
              <p className="text-zinc-300">
                Убийство мобов, которые находятся в загонах на территории другого игрока.
              </p>
            </div>

            <div id="1.3" className="mb-4 pl-4 border-l-2 border-purple-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="1.3" id="1.3" />
                Открытие декоративных люков и дверей
              </h4>
              <p className="text-zinc-300">
                Открытие декоративных люков и дверей, которые не предназначены для того, чтобы их открывали.
              </p>
            </div>
          </div>

          {/* Воровство */}
          <div id="2" className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-yellow-400" />
              <RuleNumber number="2" id="2" />
              Воровство
            </h3>
            <p className="text-zinc-300 mb-4 italic">
              Не твоё — не бери. Если в сундуке лежат вещи, и рядом нет таблички о том, что из него можно брать вещи — то брать их нельзя.
            </p>
            
            <div id="2.1" className="mb-4 pl-4 border-l-2 border-yellow-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="2.1" id="2.1" />
                Взятие вещей из сундуков
              </h4>
              <p className="text-zinc-300">
                Взятие вещей из чужих сундуков без разрешения.
              </p>
            </div>

            <div id="2.2" className="mb-4 pl-4 border-l-2 border-yellow-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="2.2" id="2.2" />
                Присвоение вещей умерших игроков
              </h4>
              <p className="text-zinc-300">
                Присвоение вещей умерших игроков.
              </p>
            </div>
          </div>

          {/* Убийства игроков */}
          <div id="3" className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-red-400" />
              <RuleNumber number="3" id="3" />
              Убийства игроков
            </h3>
            <p className="text-zinc-300 mb-4 italic">
              Убийство или просто удары, которые сносят прочность у брони, здоровье игрока, или мешают ему.
            </p>
            
            <div id="3.1" className="mb-4 pl-4 border-l-2 border-red-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="3.1" id="3.1" />
                Убийство без согласия
              </h4>
              <p className="text-zinc-300">
                Убийство без взаимного согласия.
              </p>
            </div>

            <div id="3.2" className="mb-4 pl-4 border-l-2 border-red-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="3.2" id="3.2" />
                Нанесение урона
              </h4>
              <p className="text-zinc-300">
                Нанесение урона, снижающего здоровье или прочность брони.
              </p>
            </div>

            <div id="3.3" className="mb-4 pl-4 border-l-2 border-red-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="3.3" id="3.3" />
                Действия, мешающие геймплею
              </h4>
              <p className="text-zinc-300">
                Действия, мешающие нормальному геймплею другого игрока.
              </p>
            </div>
          </div>

          {/* Мошенничество */}
          <div id="4" className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <RuleNumber number="4" id="4" />
              Мошенничество и обман
            </h3>
            
            <div id="4.1" className="mb-4 pl-4 border-l-2 border-green-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="4.1" id="4.1" />
                Финансовые пирамиды
              </h4>
              <p className="text-zinc-300">
                Организация финансовых пирамид.
              </p>
            </div>

            <div id="4.2" className="mb-4 pl-4 border-l-2 border-green-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="4.2" id="4.2" />
                Обман при обменах
              </h4>
              <p className="text-zinc-300">
                Обман при обменах и сделках.
              </p>
            </div>
          </div>

          {/* Создание лагов */}
          <div id="5" className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-400" />
              <RuleNumber number="5" id="5" />
              Создание лагов
            </h3>
            <p className="text-zinc-300 mb-4 italic">
              Механизмы или скопления энтити, которые специально создают лаги на сервере.
            </p>
            
            <div id="5.1" className="mb-4 pl-4 border-l-2 border-orange-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="5.1" id="5.1" />
                Механизмы, вызывающие лаги
              </h4>
              <p className="text-zinc-300">
                Создание механизмов, вызывающих лаги.
              </p>
            </div>

            <div id="5.2" className="mb-4 pl-4 border-l-2 border-orange-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="5.2" id="5.2" />
                Заполнение лимита мобов
              </h4>
              <p className="text-zinc-300">
                Заполнение лимита мобов.
              </p>
            </div>

            <div id="5.3" className="mb-4 pl-4 border-l-2 border-orange-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="5.3" id="5.3" />
                Отключение спавнрейта
              </h4>
              <p className="text-zinc-300">
                Отключение спавнрейта.
              </p>
            </div>
          </div>
        </section>

        <hr className="border-zinc-800 my-8" />

        {/* Когда можно нарушать правила */}
        <section id="6" className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-blue-400" />
            <RuleNumber number="6" id="6" />
            Когда можно нарушать правила
          </h2>
          
          <p className="text-zinc-300 mb-6">
            Если у пострадавшей стороны нет к вам претензий, то нарушать эти правила можно. 
            Например, можно устраивать PVP поединки, если обе стороны согласны.
          </p>

          <div id="6.1" className="bg-zinc-900/50 border border-blue-500/20 rounded-lg p-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              <RuleNumber number="6.1" id="6.1" />
              Требования к согласию
            </h3>
            <p className="text-zinc-300 mb-4">
              Согласие должно быть задокументировано сообщениями в чате, в Discord, или в виде подписанной книги. 
              Если доказательств согласия нет, тогда игрок может предъявить претензии, и ситуация будет рассматриваться как гриферство.
            </p>
            
            <div id="6.1.1" className="mb-3 pl-4 border-l-2 border-blue-500/30">
              <h4 className="text-lg font-semibold text-white mb-1">
                <RuleNumber number="6.1.1" id="6.1.1" />
                Сообщения в чате сервера
              </h4>
            </div>

            <div id="6.1.2" className="mb-3 pl-4 border-l-2 border-blue-500/30">
              <h4 className="text-lg font-semibold text-white mb-1">
                <RuleNumber number="6.1.2" id="6.1.2" />
                Сообщения в Discord
              </h4>
            </div>

            <div id="6.1.3" className="mb-3 pl-4 border-l-2 border-blue-500/30">
              <h4 className="text-lg font-semibold text-white mb-1">
                <RuleNumber number="6.1.3" id="6.1.3" />
                Подписанная книга в игре
              </h4>
            </div>

            <div className="mt-4 bg-red-900/30 border-l-4 border-red-500 p-3">
              <p className="text-zinc-400 text-sm italic">
                Без доказательств согласия действия будут рассматриваться как нарушение правил
              </p>
            </div>
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