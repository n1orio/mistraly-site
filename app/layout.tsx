import './globals.css'
import type { Metadata } from "next"

// ПРАВИЛЬНЫЙ СИНТАКСИС
export const metadata: Metadata = {
  title: "CSS Test",
  description: "Test CSS with Webpack",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>
        <div style={{ padding: '1rem', backgroundColor: '#0000ff', color: 'white', textAlign: 'center' }}>
          🔵 Это синий блок - INLINE стили ВСЕГДА работают
        </div>
        <main style={{ padding: '2rem', minHeight: '100vh' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
            🔴 Если фон КРАСНЫЙ - CSS работает!
          </h1>
          <button style={{ 
            backgroundColor: '#00ff00', 
            color: 'white', 
            padding: '1rem 2rem', 
            borderRadius: '0.5rem',
            fontWeight: 'bold',
            border: 'none',
            cursor: 'pointer'
          }}>
            ✅ Если эта кнопка ЗЕЛЕНАЯ - CSS работает!
          </button>
          {children}
        </main>
      </body>
    </html>
  )
}