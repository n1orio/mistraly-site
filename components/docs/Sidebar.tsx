"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ChevronRight, 
  BookOpen,
  Shield,
  Users,
  Gamepad2,
  Hammer,
  Lightbulb,
  AlertTriangle,
  Zap,
  Trophy,
  FileText
} from "lucide-react"

interface SidebarProps {
  sections: any[]
}

export function Sidebar({ sections }: SidebarProps) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  useEffect(() => {
    const expandActiveSection = (section: any): boolean => {
      if (section.slug === pathname) {
        if (section.children) {
          setExpandedSections(prev => new Set(prev).add(section.id))
        }
        return true
      }
      
      if (section.children) {
        for (const child of section.children) {
          if (expandActiveSection(child)) {
            setExpandedSections(prev => new Set(prev).add(section.id))
            return true
          }
        }
      }
      return false
    }

    sections.forEach(expandActiveSection)
  }, [pathname, sections])

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      newSet.has(id) ? newSet.delete(id) : newSet.add(id)
      return newSet
    })
  }

  const getIcon = (section: any) => {
    const icons: any = {
      'wiki': BookOpen,
      'rules': Shield,
      'community': Users,
      'gameplay': Gamepad2,
      'mechanics': Hammer,
      'tips': Lightbulb,
      'punishments': AlertTriangle,
      'economy': Zap,
      'achievements': Trophy,
      'general': FileText,
      'chat': Users,
      'build': Hammer,
      'mods': FileText
    }
    
    const Icon = icons[section.id] || FileText
    return <Icon className="w-4 h-4 flex-shrink-0" />
  }

  const renderSection = (section: any, depth = 0) => {
    const isActive = pathname === section.slug
    const isExpanded = expandedSections.has(section.id)
    const hasChildren = section.children?.length > 0

    return (
      <div key={section.id} className="w-full">
        {hasChildren ? (
          <button
            onClick={() => toggleSection(section.id)}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
              isActive 
                ? 'bg-[#0099ff]/15 text-[#0099ff] font-bold'
                : 'text-zinc-300 hover:bg-white/5 hover:text-white'
            }`}
            style={{ paddingLeft: `${1.5 + depth * 1.5}rem` }}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="text-zinc-400 flex-shrink-0"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.div>
            
            {getIcon(section)}
            
            <span className="text-sm font-medium truncate flex-1 text-left">{section.title}</span>
            
            {section.badge && (
              <span className="ml-2 px-2 py-0.5 bg-[#0099ff]/20 text-[#0099ff] text-[10px] font-bold rounded-full whitespace-nowrap">
                {section.badge}
              </span>
            )}
          </button>
        ) : (
          <Link
            href={section.slug}
            onClick={() => setIsMobileOpen(false)}
            className={`w-full block px-4 py-2.5 rounded-lg transition-all ${
              isActive 
                ? 'bg-[#0099ff]/15 text-[#0099ff] font-bold'
                : 'text-zinc-300 hover:bg-white/5 hover:text-white'
            }`}
            style={{ paddingLeft: `${2 + depth * 1.5}rem` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-4 text-zinc-400 flex-shrink-0">{getIcon(section)}</div>
              <span className="text-sm font-medium truncate flex-1 text-left">{section.title}</span>
              
              {section.badge && (
                <span className="ml-2 px-2 py-0.5 bg-[#0099ff]/20 text-[#0099ff] text-[10px] font-bold rounded-full whitespace-nowrap">
                  {section.badge}
                </span>
              )}
            </div>
          </Link>
        )}

        {hasChildren && (
          <AnimatePresence mode="wait">
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="mt-1 pl-3 border-l border-white/5">
                  {section.children.map((child: any) => renderSection(child, depth + 1))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Мобильное меню - кнопка */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-[#0099ff] text-white shadow-lg flex items-center justify-center hover:bg-[#0088e6] transition-colors"
        aria-label="Открыть меню"
      >
        <BookOpen className="w-6 h-6" />
      </button>

      {/* Мобильное меню - оверлей */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            />
            
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 h-screen w-80 bg-[#090D10] border-r border-white/10 z-50 overflow-y-auto pt-6 pb-20 lg:hidden"
            >
              <div className="px-6 pb-6 border-b border-white/10">
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen className="w-6 h-6 text-[#0099ff]" />
                  <span className="text-xl font-bold text-white">Документация</span>
                </div>
                <p className="text-zinc-500 text-sm">Breeze.monster Wiki</p>
              </div>
              
              <div className="px-4 py-4 space-y-1">
                {sections.map(section => renderSection(section))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Десктопное меню - УШИРЕННОЕ И С МЕНЬШИМ ОТСТУПОМ */}
      <div className="hidden lg:block w-80 shrink-0 border-r border-white/10 bg-[#090D10]/95 backdrop-blur-xl py-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="px-6 pb-6 border-b border-white/10 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-6 h-6 text-[#0099ff]" />
            <span className="text-xl font-bold text-white">Документация</span>
          </div>
          <p className="text-zinc-500 text-sm">Breeze.monster Wiki</p>
        </div>
        
        <div className="px-4 space-y-1">
          {sections.map(section => renderSection(section))}
        </div>
      </div>
    </>
  )
}