// components/docs/DocsLayout.tsx
import { Sidebar } from "./Sidebar"
import { TableOfContents } from "./TableOfContents"

interface DocsLayoutProps {
  children: React.ReactNode
  sidebarConfig: { sections: any[] }
  headings?: { id: string; text: string; level: number }[]
  title?: string
  description?: string
}

export function DocsLayout({
  children,
  sidebarConfig,
  headings = [],
  title,
  description
}: DocsLayoutProps) {
  return (
    <div className="min-h-screen bg-[#090D10] text-white">
      <div className="flex">
        {/* Боковое меню */}
        <Sidebar sections={sidebarConfig.sections} />

        {/* Основной контент - УМЕНЬШЕННЫЙ ОТСТУП */}
        <div className="flex-1 min-h-screen pt-24 pl-4"> {/* Добавлен pl-4 */}
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {title && (
              <div className="mb-8">
                <h1 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">
                  {title}
                </h1>
                {description && (
                  <p className="text-zinc-400 text-lg max-w-2xl">
                    {description}
                  </p>
                )}
              </div>
            )}

            <article className="prose prose-invert max-w-none">
              {children}
            </article>
          </div>
        </div>

        {/* Оглавление справа */}
        {headings.length > 0 && (
          <div className="hidden xl:block w-64 shrink-0 pt-24">
            <div className="max-w-xs mx-auto px-4">
              <TableOfContents headings={headings} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}