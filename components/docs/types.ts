// components/docs/types.ts
export interface DocSection {
  id: string
  title: string
  slug: string
  icon?: React.ReactNode
  children?: DocSection[]
  badge?: string
}

// ✅ Убрали basePath
export interface DocsSidebarConfig {
  sections: DocSection[]
}