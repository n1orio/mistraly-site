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
      title="Вики"
      description="Вики"
    >
      <section id="intro" className="mb-8">
        <div className="bg-gradient-to-r from-[#0099ff]/10 to-[#0055FF]/10 border border-[#0099ff]/30 rounded-lg p-6 mb-6">
          <h2 className="text-2xl font-bold mb-3 text-white flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#0099ff]/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-[#0099ff]" />
            </span>
            Вики
          </h2>
          <p className="text-zinc-300 leading-relaxed">
            В разработке...
          </p>
        </div>

      </section>
    </DocsLayout>
  )
}