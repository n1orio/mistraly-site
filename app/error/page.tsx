// app/auth/error/page.tsx
import Link from 'next/link'
import { auth } from '@/lib/auth'

interface ErrorPageProps {
  searchParams: { error?: string }
}

export default async function ErrorPage({ searchParams }: ErrorPageProps) {
  const session = await auth()
  const error = searchParams.error || 'UnknownError'

  const errors: Record<string, { title: string; description: string; solution: string }> = {
    AccessDenied: {
      title: "Доступ запрещён",
      description: "Вы не предоставили необходимые разрешения при авторизации через Discord.",
      solution: "При входе через Discord нажмите «Разрешить» и не закрывайте окно подтверждения. Убедитесь, что вы не отклоняете доступ к вашему профилю и электронной почте."
    },
    OAuthAccountNotLinked: {
      title: "Аккаунт уже привязан",
      description: "Этот Discord аккаунт уже используется другим пользователем на нашем сайте.",
      solution: "Если это ваш аккаунт, войдите через другой метод или обратитесь в поддержку."
    },
    default: {
      title: "Ошибка авторизации",
      description: "Произошла неизвестная ошибка при входе через Discord.",
      solution: "Попробуйте снова через несколько минут или обратитесь в поддержку."
    }
  }

  const { title, description, solution } = errors[error] || errors.default

  return (
    <div className="min-h-screen bg-[#0D1117] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#161B22] rounded-xl p-8 shadow-2xl text-center border border-red-500/20">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-red-400 text-3xl">⚠️</span>
        </div>
        <h1 className="text-2xl font-bold mb-3 text-red-400">{title}</h1>
        <p className="text-gray-300 mb-4">{description}</p>
        <div className="bg-[#21262D] p-4 rounded-lg mb-6 text-left">
          <p className="font-medium text-yellow-400">Как исправить:</p>
          <p className="mt-2 text-gray-400">{solution}</p>
        </div>
        <div className="space-y-3">
          <Link
            href="/"
            className="inline-block w-full bg-[#0099ff] hover:bg-[#0088ee] text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            Вернуться на главную
          </Link>
          {!session && (
            <Link
              href="/api/auth/signin/discord"
              className="inline-block w-full bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold py-3 px-6 rounded-lg transition-colors border border-[#5865F2]"
            >
              Попробовать снова
            </Link>
          )}
        </div>
        <div className="mt-6 pt-4 border-t border-[#21262D] text-xs text-gray-500">
          <p>Тип ошибки: <span className="font-mono bg-[#080B0E] px-2 py-1 rounded">{error}</span></p>
          {error === 'AccessDenied' && (
            <p className="mt-2 text-yellow-500">
              💡 Совет: Если проблема повторяется, очистите кэш Discord в браузере или попробуйте другой браузер.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}