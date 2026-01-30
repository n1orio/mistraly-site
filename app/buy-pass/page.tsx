'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BuyPassPage() {
  const router = useRouter()
  const [minecraftNick, setMinecraftNick] = useState('')
  const [checking, setChecking] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const checkNickAvailability = async () => {
    setChecking(true)
    setAvailable(null)
    setValidationErrors([])
    
    try {
      const response = await fetch(`/api/check-nick?nick=${encodeURIComponent(minecraftNick)}`)
      const data = await response.json()
      
      if (data.validation?.valid) {
        // Ник прошёл валидацию
        if (data.available) {
          setAvailable(true)
        } else {
          setAvailable(false)
          setValidationErrors(['Этот ник уже занят другим игроком'])
        }
      } else {
        // Ошибки валидации формата
        setAvailable(false)
        setValidationErrors(data.validation?.errors || ['Неверный формат ника'])
      }
    } catch (err) {
      setValidationErrors(['Ошибка при проверке ника'])
    } finally {
      setChecking(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (available === null) {
      setValidationErrors(['Сначала проверьте доступность ника'])
      return
    }
    
    if (!available) {
      // Уже есть ошибки валидации или ник занят
      return
    }
    
    setSubmitting(true)
    
    try {
      const response = await fetch('/api/buy-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minecraftNick }),
      })
      
      const data = await response.json()
      
      if (response.ok) {
        alert('Пропуск успешно приобретён!')
        router.push('/profile')
      } else {
        setValidationErrors([data.error || 'Ошибка при покупке пропуска'])
      }
    } catch (err) {
      setValidationErrors(['Ошибка при покупке пропуска'])
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D1117] text-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#161B22] rounded-xl p-8 shadow-lg">
          <h1 className="text-3xl font-bold mb-6">Покупка пропуска</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Minecraft ник
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={minecraftNick}
                  onChange={(e) => {
                    setMinecraftNick(e.target.value)
                    setAvailable(null)
                    setValidationErrors([])
                  }}
                  placeholder="Введите ваш ник"
                  className="flex-1 px-4 py-3 bg-[#0D1117] border border-[#30363D] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={checkNickAvailability}
                  disabled={checking || !minecraftNick}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-bold rounded-lg transition-colors"
                >
                  {checking ? 'Проверка...' : 'Проверить'}
                </button>
              </div>
              
              {/* Показываем все ошибки валидации */}
              {validationErrors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {validationErrors.map((error, index) => (
                    <p key={index} className="text-red-500 text-sm">
                      ❌ {error}
                    </p>
                  ))}
                </div>
              )}
              
              {/* Успешное сообщение */}
              {available === true && validationErrors.length === 0 && (
                <p className="mt-2 text-green-500 text-sm">
                  ✅ Ник доступен для использования
                </p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={submitting || available !== true || validationErrors.length > 0}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-bold py-4 px-6 rounded-lg transition-colors text-lg"
            >
              {submitting ? 'Обработка...' : 'Купить пропуск за 500₽'}
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-[#30363D]">
            <p className="text-sm text-gray-500">
              После покупки ваш ник будет привязан к аккаунту и вы получите доступ ко серверу и роли в дискорд сервере.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}