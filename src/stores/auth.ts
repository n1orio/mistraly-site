import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api, setAccessToken, unwrap, errorMessage } from '../api/client'

export interface AuthUser {
  id: string
  username: string
  role: 'user' | 'admin' | string
  email?: string | null
  has_pass?: boolean
  pass_expires_at?: string | null
  skin_variant?: string
}

export interface DiscordInfo {
  discord_id: string
  discord_username: string
  discord_avatar?: string | null
}

interface AuthPayload {
  token: string
  user: AuthUser
  discord?: DiscordInfo
}

const USER_KEY = 'mistraly_user'
const DISCORD_KEY = 'mistraly_discord'

/**
 * Хранилище авторизации сайта.
 *
 * Токен живёт в памяти (axios interceptor) и в httpOnly cookie, поэтому
 * в localStorage мы кладём только публичные поля профиля — их удобно
 * показать до первого запроса, не дожидаясь round-trip.
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(readJson<AuthUser>(USER_KEY))
  const discord = ref<DiscordInfo | null>(readJson<DiscordInfo>(DISCORD_KEY))
  const ready = ref(false)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  function readJson<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : null
    } catch {
      return null
    }
  }

  function persist(payload: AuthPayload) {
    setAccessToken(payload.token)
    user.value = payload.user
    if (payload.discord) {
      discord.value = payload.discord
      localStorage.setItem(DISCORD_KEY, JSON.stringify(payload.discord))
    }
    localStorage.setItem(USER_KEY, JSON.stringify(payload.user))
    // Старые ключи от прошлой версии сайта могли остаться — убираем.
    localStorage.removeItem('breeze_user')
    localStorage.removeItem('breeze_discord')
    localStorage.removeItem('mistraly_token')
    localStorage.removeItem('breeze_token')
  }

  function clear() {
    setAccessToken(null)
    user.value = null
    discord.value = null
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(DISCORD_KEY)
    localStorage.removeItem('mistraly_token')
    localStorage.removeItem('breeze_token')
  }

  /** Обмен Discord-кода на сессию. Вызывается из DiscordAuthView. */
  async function loginWithDiscord(code: string, nonce?: string): Promise<AuthUser> {
    loading.value = true
    try {
      const data = await unwrap<AuthPayload>(
        api.post('/auth/discord', {
          code,
          nonce: nonce || undefined,
          // origin обязателен: бэкенд обязан обменять код с тем же
          // redirect_uri, что был в authorize-запросе, а authorize-запрос
          // собирается из location.origin. На admin.mistraly.net это
          // отдельный домен, и без origin обмен падал с
          // «Failed to get Discord token».
          origin: location.origin
        })
      )
      persist(data)
      ready.value = true
      return data.user
    } finally {
      loading.value = false
    }
  }

  /**
   * Восстанавливает сессию при загрузке страницы: access-cookie могла
   * ещё быть жива, поэтому пробуем /auth/refresh, а не читаем localStorage.
   */
  async function restore(): Promise<boolean> {
    if (ready.value) return isAuthenticated.value
    loading.value = true
    try {
      const data = await unwrap<{ token: string; user: AuthUser }>(
        api.post('/auth/refresh')
      )
      setAccessToken(data.token)
      user.value = data.user
      localStorage.setItem(USER_KEY, JSON.stringify(data.user))
      return true
    } catch {
      clear()
      return false
    } finally {
      loading.value = false
      ready.value = true
    }
  }

  /** Синхронизация профиля (проходка) после покупок. */
  async function refreshProfile(): Promise<void> {
    try {
      const profile = await unwrap<AuthUser>(api.get('/user/profile'))
      user.value = profile
      localStorage.setItem(USER_KEY, JSON.stringify(profile))
    } catch (e) {
      // 401 уже обработан интерцептором; молча оставляем прошлые данные.
      void errorMessage(e)
    }
  }

  async function logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } finally {
      clear()
      ready.value = true
    }
  }

  return {
    user,
    discord,
    ready,
    loading,
    isAuthenticated,
    isAdmin,
    loginWithDiscord,
    restore,
    refreshProfile,
    logout,
    clear
  }
})