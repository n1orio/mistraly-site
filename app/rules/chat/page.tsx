"use client"

import { DocsLayout } from "@/components/docs/DocsLayout"
import { docsSidebarConfig } from "@/components/docs/sidebarConfig"
import { 
  XCircle, 
  CheckCircle, 
  MessageSquare,
  AlertTriangle,
  Image,
  Copy,
  Check,
  Users,
  Shield,
  Sword
} from "lucide-react"
import { useState, useEffect } from "react"

const chatHeadings = [
  { id: '0', text: 'Введение', level: 2 },
  { id: '0.1', text: 'Что строго запрещено', level: 2 },
  { id: '1', text: 'Спам', level: 3 },
  { id: '1.1', text: 'Бессмысленные сообщения', level: 4 },
  { id: '1.2', text: 'Большие сообщения капсом', level: 4 },
  { id: '1.3', text: 'Частая отправка объявлений', level: 4 },
  { id: '2', text: 'Флуд', level: 3 },
  { id: '3', text: 'Слова запрещенные на Twitch', level: 3 },
  { id: '4', text: 'NSFW контент', level: 3 },
  { id: '4.1', text: 'Ограничения на размещение', level: 4 },
  { id: '5', text: 'Провокация конфликтов', level: 3 },
  { id: '5.1', text: 'Провокация конфликта', level: 4 },
  { id: '5.2', text: 'Разжигание конфликта', level: 4 },
  { id: '5.3', text: 'Вывод конфликтов за рамки игры', level: 4 },
  { id: '6', text: 'Прочее', level: 3 },
  { id: '6.1', text: 'Пропаганда наркотиков', level: 4 },
  { id: '7', text: 'Наказание', level: 3 }
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

export default function ChatRulesPage() {
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
      headings={chatHeadings}
      title="Правила: Спам, флуд и запрещенный контент"
    >
      <div className="prose prose-invert max-w-none">
        
        {/* Введение */}
        <section id="0" className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            <RuleNumber number="0" id="0" />
            Введение
          </h2>
          <p className="text-zinc-300 mb-2">
            Правила регулируют поведение игроков в чатах сервера и ограничивают распространение нежелательного контента.
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

          {/* Спам */}
          <div id="1" className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              <RuleNumber number="1" id="1" />
              Спам
            </h3>
            
            <div id="1.1" className="mb-4 pl-4 border-l-2 border-purple-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="1.1" id="1.1" />
                Бессмысленные сообщения
              </h4>
              <p className="text-zinc-300 mb-2">
                Бессмысленные сообщения, стены из символов.
              </p>
            </div>

            <div id="1.2" className="mb-4 pl-4 border-l-2 border-purple-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="1.2" id="1.2" />
                Большие сообщения капсом
              </h4>
              <p className="text-zinc-300 mb-2">
                Большие сообщения капсом, или частое использование капса в сообщениях.
              </p>
            </div>

            <div id="1.3" className="mb-4 pl-4 border-l-2 border-purple-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="1.3" id="1.3" />
                Частая отправка объявлений
              </h4>
              <p className="text-zinc-300 mb-2">
                Частая отправка одинаковых объявлений в игровые чаты. Про торговлю, ивенты, наборы в города.
              </p>
              <p className="text-green-400 mt-2">
                ✓ Отправлять одинаковые рекламные сообщения в чат можно, но с интервалом не менее часа
              </p>
            </div>
          </div>

          {/* Флуд */}
          <div id="2" className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <RuleNumber number="2" id="2" />
              Флуд
            </h3>
            <p className="text-zinc-300">
              Повторение одинаковых сообщений много раз, даже 2 раза считается в некоторых случаях.
            </p>
          </div>

          {/* Слова запрещенные на Twitch */}
          <div id="3" className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <RuleNumber number="3" id="3" />
              Слова запрещенные на Twitch
            </h3>
            <p className="text-zinc-300 mb-3">
              Поскольку на нашем сервере играют стримеры — нельзя использовать слова и фразы запрещенные на Twitch.
            </p>
          </div>

          {/* NSFW контент */}
          <div id="4" className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Image className="w-5 h-5 text-pink-400" />
              <RuleNumber number="4" id="4" />
              NSFW контент
            </h3>
            <p className="text-zinc-300 mb-3">
              Не распространяйте NSFW, эротический и шок контент.
            </p>
            
            <div id="4.1" className="mb-4 pl-4 border-l-2 border-pink-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="4.1" id="4.1" />
                Ограничения на размещение
              </h4>
              <p className="text-zinc-300 mb-2">
                Делать эротические арты на картах можно, но нельзя размещать их в публичных местах, где их могут увидеть стримеры или случайные прохожие.
              </p>
              <p className="text-zinc-300">
                При входе на территорию с эротическими артами должно быть предупреждение.
              </p>
            </div>
          </div>

          <hr className="border-zinc-800 my-8" />

          {/* Провокация конфликтов */}
          <div id="5" className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Sword className="w-5 h-5 text-amber-400" />
              <RuleNumber number="5" id="5" />
              Провокация конфликтов
            </h3>
            
            <div id="5.1" className="mb-4 pl-4 border-l-2 border-amber-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="5.1" id="5.1" />
                Провокация конфликта
              </h4>
              <p className="text-zinc-300 mb-2">
                У конфликта должны быть явные и серьёзные причины. Например, вы имеете полное право оскорбить игрока, который убил вас или своровал у вас что-то.
              </p>
              <p className="text-zinc-300">
                Но если игрок не совершил ничего плохого по отношению к вам, или вашим знакомым, то оскорбления этого игрока будут провокацией конфликта.
              </p>
            </div>

            <div id="5.2" className="mb-4 pl-4 border-l-2 border-amber-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="5.2" id="5.2" />
                Разжигание конфликта
              </h4>
              <p className="text-zinc-300 mb-2">
                Когда из-за какой-то мелочи, или одного проступка игрока, вы начинаете регулярно и постоянно его оскорблять или провоцировать.
              </p>
              <p className="text-zinc-300">
                Когда вы вспоминаете о том, что было раньше, и регулярно оскорбляете игрока за это.
              </p>
            </div>

            <div id="5.3" className="mb-4 pl-4 border-l-2 border-amber-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="5.3" id="5.3" />
                Вывод конфликтов за рамки игры
              </h4>
              <p className="text-zinc-300">
                Не выводите конфликты за рамки игры. Не переходите на личности, не занимайтесь доксом и откровенной травлей людей, переходя границу игры и реальной жизни.
              </p>
            </div>
          </div>

          {/* Прочее */}
          <div id="6" className="mb-6">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <RuleNumber number="6" id="6" />
              Прочее
            </h3>
            
            <div id="6.1" className="mb-4 pl-4 border-l-2 border-blue-500/30">
              <h4 className="text-lg font-semibold text-white mb-2">
                <RuleNumber number="6.1" id="6.1" />
                Пропаганда наркотиков
              </h4>
              <p className="text-zinc-300 mb-2">
                Пропаганда наркотиков запрещена.
              </p>
              <p className="text-zinc-300 mb-2">
                Можно отыгрывать РП с наркотиками, если наркотики будут не настоящими, а выдуманными.
              </p>
              <p className="text-zinc-300">
                Название и внешний вид не должны отсылать к настоящим наркотикам.
              </p>
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