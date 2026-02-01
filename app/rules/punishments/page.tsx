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
  Hammer,
  Timer,
  VolumeX,
  Ban,
  History,
  Mail,
  Repeat,
  Users,
  Zap,
  ScrollText
} from "lucide-react"
import { useState, useEffect } from "react"

const punishmentHeadings = [
  { id: '0', text: 'Введение', level: 2 },
  { id: '1', text: 'Типы наказаний', level: 3 },
  { id: '1.1', text: 'Предупреждение', level: 4 },
  { id: '1.2', text: 'Мут', level: 4 },
  { id: '1.3', text: 'Бан', level: 4 },
  { id: '2', text: 'Серьёзность нарушений', level: 3 },
  { id: '2.1', text: 'Лёгкие нарушения', level: 4 },
  { id: '2.2', text: 'Средние нарушения', level: 4 },
  { id: '2.3', text: 'Тяжёлые нарушения', level: 4 },
  { id: '3', text: 'Апелляции', level: 3 },
  { id: '4', text: 'Повторные нарушения', level: 3 },
  { id: '5', text: 'Особые случаи', level: 3 }
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

export default function PunishmentSystemPage() {
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
      headings={punishmentHeadings}
      title="Система наказаний"
    >
      <div className="prose prose-invert max-w-none">
        
        {/* Введение */}
        <section id="0" className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">
            <RuleNumber number="0" id="0" />
            Введение
          </h2>
          <p className="text-zinc-300 mb-2">
            Данная система наказаний предназначена для поддержания порядка на сервере и обеспечения комфортной игры для всех участников. 
            Наказания применяются в зависимости от тяжести нарушения и наличия предыдущих проступков.
          </p>
          <p className="text-zinc-400 italic mt-2">
            Администрация оставляет за собой право изменять наказание в зависимости от обстоятельств каждого конкретного случая.
          </p>
        </section>

        <hr className="border-zinc-800 my-8" />

        {/* Типы наказаний */}
        <section id="1" className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Hammer className="w-5 h-5 text-amber-400" />
            <RuleNumber number="1" id="1" />
            Типы наказаний
          </h3>

          <div id="1.1" className="mb-4 pl-4 border-l-2 border-yellow-500/30">
            <h4 className="text-lg font-semibold text-white mb-2">
              <RuleNumber number="1.1" id="1.1" />
              Предупреждение
            </h4>
            <p className="text-zinc-300 mb-2">
              Выдаётся за незначительные нарушения или первый проступок. Предупреждения накапливаются и учитываются при последующих нарушениях.
            </p>
            <ul className="space-y-1 text-zinc-300 pl-4 mt-2">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                <span>Срок действия: 7 дней</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                <span>3 предупреждения = автоматический мут на 1 час</span>
              </li>
            </ul>
          </div>

          <div id="1.2" className="mb-4 pl-4 border-l-2 border-orange-500/30">
            <h4 className="text-lg font-semibold text-white mb-2">
              <RuleNumber number="1.2" id="1.2" />
              Мут
            </h4>
            <p className="text-zinc-300 mb-2">
              Временное ограничение возможности писать в чат. Применяется за нарушения правил общения и спам.
            </p>
          </div>

          <div id="1.3" className="mb-4 pl-4 border-l-2 border-red-500/30">
            <h4 className="text-lg font-semibold text-white mb-2">
              <RuleNumber number="1.3" id="1.3" />
              Бан
            </h4>
            <p className="text-zinc-300 mb-2">
              Полное исключение с сервера на определённый срок или навсегда. Применяется за серьёзные нарушения.
            </p>
          </div>
        </section>

        <hr className="border-zinc-800 my-8" />

        {/* Серьёзность нарушений */}
        <section id="2" className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <RuleNumber number="2" id="2" />
            Серьёзность нарушений
          </h3>

          <div id="2.1" className="mb-4 pl-4 border-l-2 border-green-500/30">
            <h4 className="text-lg font-semibold text-white mb-2">
              <RuleNumber number="2.1" id="2.1" />
              Лёгкие нарушения
            </h4>
            <ul className="space-y-1 text-zinc-300 pl-4 mt-2">
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <span>Незначительный спам в чате</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <span>Использование неприемлемых ников</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <span>Нарушение правил чата (капс, цветные символы)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400">•</span>
                <span>Мелкие нарушения правил торговли</span>
              </li>
            </ul>
          </div>

          <div id="2.2" className="mb-4 pl-4 border-l-2 border-yellow-500/30">
            <h4 className="text-lg font-semibold text-white mb-2">
              <RuleNumber number="2.2" id="2.2" />
              Средние нарушения
            </h4>
            <ul className="space-y-1 text-zinc-300 pl-4 mt-2">
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                <span>Оскорбления других игроков</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                <span>Лёгкое гриферство</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                <span>Использование багов в своих интересах</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                <span>Нарушение правил территорий</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-400">•</span>
                <span>Попытка обхода наказаний</span>
              </li>
            </ul>
          </div>

          <div id="2.3" className="mb-4 pl-4 border-l-2 border-red-500/30">
            <h4 className="text-lg font-semibold text-white mb-2">
              <RuleNumber number="2.3" id="2.3" />
              Тяжёлые нарушения
            </h4>
            <ul className="space-y-1 text-zinc-300 pl-4 mt-2">
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>Использование читов и хаков</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>Торговля за реальные деньги</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>Массовое гриферство</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>Угрозы, шантаж, вымогательство</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>Расизм, дискриминация, ненависть</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">•</span>
                <span>Вредоносные действия против сервера</span>
              </li>
            </ul>
          </div>
        </section>

        <hr className="border-zinc-800 my-8" />

        {/* Апелляции */}
        <section id="3" className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-400" />
            <RuleNumber number="3" id="3" />
            Апелляции
          </h3>
          
          <p className="text-zinc-300 mb-4">
            Если вы считаете, что наказание было несправедливым, вы можете подать апелляцию.
          </p>

          <div className="bg-zinc-900/40 border-l-4 border-blue-500/50 p-4 rounded-r-lg mb-4">
            <h4 className="text-lg font-semibold text-white mb-2">Как подать апелляцию:</h4>
            <ol className="text-zinc-300 pl-6 space-y-1 list-decimal">
              <li>Перейдите в канал #апелляции в нашем Discord</li>
              <li>Напишите сообщение с указанием вашего никнейма</li>
              <li>Опишите ситуацию и почему вы считаете наказание несправедливым</li>
              <li>Дождитесь ответа от администрации</li>
            </ol>
          </div>

          <div className="bg-zinc-900/40 border-l-4 border-amber-500/50 p-4 rounded-r-lg">
            <p className="text-zinc-300 mb-2">
              <span className="font-semibold text-amber-400">Важно:</span> Апелляции рассматриваются в течение 24-48 часов. 
              Повторная подача апелляции до ответа на первую приведёт к отклонению.
            </p>
            <p className="text-zinc-400 italic">
              Апелляции на бессрочные баны рассматриваются только через 14 дней после блокировки.
            </p>
          </div>
        </section>

        <hr className="border-zinc-800 my-8" />

        {/* Повторные нарушения */}
        <section id="4" className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Repeat className="w-5 h-5 text-purple-400" />
            <RuleNumber number="4" id="4" />
            Повторные нарушения
          </h3>
          
          <p className="text-zinc-300 mb-4">
            При повторных нарушениях наказания ужесточаются. Система прогрессивного наказания:
          </p>

          <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                <span className="text-red-400 font-bold">1</span>
              </div>
              <span className="text-zinc-300">Первое нарушение — стандартное наказание</span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-red-500/30 flex items-center justify-center">
                <span className="text-red-400 font-bold">2</span>
              </div>
              <span className="text-zinc-300">Второе нарушение — наказание × 1.5</span>
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-red-500/40 flex items-center justify-center">
                <span className="text-red-400 font-bold">3</span>
              </div>
              <span className="text-zinc-300">Третье нарушение — наказание × 2</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                <span className="text-white font-bold">4+</span>
              </div>
              <span className="text-zinc-300">Четвёртое и последующие — бессрочный бан</span>
            </div>
          </div>

          <div className="bg-zinc-900/40 border-l-4 border-purple-500/50 p-3 rounded-r-lg">
            <p className="text-zinc-300">
              <span className="font-semibold text-purple-400">Примечание:</span> Для тяжёлых нарушений система прогрессивного наказания не применяется — сразу следует максимальное наказание.
            </p>
          </div>
        </section>

        <hr className="border-zinc-800 my-8" />

        {/* Особые случаи */}
        <section id="5" className="mb-8">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-cyan-400" />
            <RuleNumber number="5" id="5" />
            Особые случаи
          </h3>

          <div className="space-y-4">

            <div className="bg-zinc-900/40 border-l-4 border-cyan-500/50 p-4 rounded-r-lg">
              <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Массовые нарушения
              </h4>
              <p className="text-zinc-300">
                В случае массовых нарушений (рейды, атаки) администрация может применять коллективные наказания и временно ограничивать доступ к серверу.
              </p>
            </div>


            <div className="bg-zinc-900/40 border-l-4 border-cyan-500/50 p-4 rounded-r-lg">
              <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <ScrollText className="w-4 h-4" />
                Согласие с правилами
              </h4>
              <p className="text-zinc-300">
                Входя на сервер, вы автоматически соглашаетесь с данной системой наказаний. Незнание правил не освобождает от ответственности.
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
        table {
          border-collapse: collapse;
          width: 100%;
        }
        th, td {
          padding: 8px;
          text-align: left;
        }
        tr:hover {
          background-color: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </DocsLayout>
  )
}