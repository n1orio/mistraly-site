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
  Star
} from "lucide-react"

const rulesHeadings = [
  { id: 'intro', text: 'Введение', level: 2 },
  { id: 'general-rules', text: 'Общие правила', level: 2 },
  { id: 'respect', text: 'Уважение к игрокам', level: 3 },
  { id: 'cheating', text: 'Запрет читов', level: 3 },
  { id: 'chat-rules', text: 'Правила чата', level: 2 },
  { id: 'spam', text: 'Спам и флуд', level: 3 },
  { id: 'advertising', text: 'Реклама', level: 3 },
  { id: 'punishment-system', text: 'Система наказаний', level: 2 },
  { id: 'warnings', text: 'Предупреждения', level: 3 },
  { id: 'bans', text: 'Баны', level: 3 }
]

export default function RulesPage() {
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
            Введение
          </h2>
          <p className="text-zinc-300 leading-relaxed">
            Добро пожаловать на сервер Breeze.monster! Чтобы обеспечить комфортную игру для всех участников, просим ознакомиться с правилами. Незнание правил не освобождает от ответственности.
          </p>
        </div>

      </section>

      <hr className="border-white/10 my-8" />

{/* ИСПРАВЛЕННЫЙ РАЗДЕЛ "ОБЩИЕ ПРАВИЛА" */}
<section id="general-rules" className="mb-8">
  <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
    <span className="w-8 h-8 rounded-lg bg-[#0099ff]/20 flex items-center justify-center">
      <Shield className="w-5 h-5 text-[#0099ff]" />
    </span>
    Общие правила
  </h2>

  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">

    <div className="group bg-[#12181F] border border-[#0099ff]/30 rounded-xl p-4 hover:border-[#0099ff]/60 transition-all duration-300 hover:shadow-lg hover:shadow-[#0099ff]/10">
      <div className="flex items-center gap-4"> {/* items-start → items-center */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0099ff]/20 to-[#0055FF]/10 flex items-center justify-center flex-shrink-0 border border-[#0099ff]/30">
          <Users className="w-6 h-6 text-[#0099ff]" />
        </div>
        <div className="flex-1 min-w-0"> {/* Добавлен min-w-0 для предотвращения переполнения */}
          <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2 truncate">
            <span className="truncate">Общение и поведение</span>
          </h3>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Запрещены оскорбления, расизм, сексизм, гомофобия и любые формы дискриминации. Соблюдайте уважительный тон в общении с другими игроками и администрацией.
          </p>
        </div>
      </div>
    </div>


    <div className="group bg-[#12181F] border border-[#FF4444]/30 rounded-xl p-4 hover:border-[#FF4444]/60 transition-all duration-300 hover:shadow-lg hover:shadow-[#FF4444]/10">
      <div className="flex items-center gap-4"> {/* items-start → items-center */}
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
      <div className="flex items-center gap-4"> {/* items-start → items-center */}
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
      <div className="flex items-center gap-4"> {/* items-start → items-center */}
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#39FF14]/20 to-[#00FF00]/10 flex items-center justify-center flex-shrink-0 border border-[#39FF14]/30">
          <Zap className="w-6 h-6 text-[#39FF14]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2 truncate">
            <span className="truncate">Запрещеные модификации</span>
          </h3>
          <p className="text-zinc-300 text-sm leading-relaxed">
            Использование читов, взломанных клиентов и запрещённых модов строго запрещено. Соблюдайте правила использования модификаций, одобренных администрацией сервера.
          </p>
        </div>
      </div>
    </div>

  
    <div className="group bg-[#12181F] border border-[#9370DB]/30 rounded-xl p-4 hover:border-[#9370DB]/60 transition-all duration-300 hover:shadow-lg hover:shadow-[#9370DB]/10">
      <div className="flex items-center gap-4"> {/* items-start → items-center */}
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
      <div className="flex items-center gap-4"> {/* items-start → items-center */}
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
    </DocsLayout>
  )
}