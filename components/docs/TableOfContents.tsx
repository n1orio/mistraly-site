"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"

interface TableOfContentsProps {
  headings: { id: string; text: string; level: number }[]
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeHeading, setActiveHeading] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY + 100
      
      let current = ''
      
      headings.forEach(heading => {
        const element = document.getElementById(heading.id)
        if (element) {
          const elementTop = element.offsetTop - 100
          if (scrollY >= elementTop) {
            current = heading.id
          }
        }
      })
      
      setActiveHeading(current)
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [headings])

  if (headings.length === 0) return null

  return (
    <div className="fixed right-8 top-24 w-64 max-w-xs hidden xl:block z-20">
      <div className="bg-[#12181F]/95 border border-white/5 rounded-xl p-4 max-h-[calc(100vh-6rem)] overflow-y-auto backdrop-blur-xl">
        <h3 className="text-sm font-bold text-zinc-400 mb-3 uppercase tracking-wider">
          Оглавление
        </h3>
        
        <div className="space-y-2 pr-2 custom-scrollbar">
          {headings.map((heading) => {
            const isActive = activeHeading === heading.id
            
            return (
              <a
                key={heading.id}
                href={`#${heading.id}`}
                className={`block text-sm transition-all ${
                  heading.level === 2
                    ? 'pl-0 font-medium'
                    : 'pl-4 text-zinc-400'
                } ${isActive ? 'text-[#0099ff] font-bold' : 'text-zinc-300 hover:text-white'}`}
              >
                {heading.text}
              </a>
            )
          })}
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #0099ff;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #0088e6;
        }
      `}</style>
    </div>
  )
}