import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'

/**
 * Базовый URL бэкенда.
 *
 * По умолчанию — относительный /api: на проде Caddy отдаёт сайт и проксирует
 * /api/* на backend, поэтому cookie остаются first-party. Абсолютный
 * http://localhost:3001 в браузере игрока указывал бы на его собственную
 * машину — покупки просто не работали бы. Для dev переопределяем через
 * VITE_API_URL.
 */
export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) || '/api'

interface RetriableConfig extends InternalAxiosRequestConfig {
  /** Флаг, чтобы не пустить запрос в бесконечный цикл refresh → 401 → refresh. */
  _retried?: boolean
}

/**
 * Access-токен хранится только в памяти: cookie httpOnly его переживает
 * перезагрузку, а localStorage больше не нужен (и нечитаем из JS).
 */
let accessToken: string | null = null

export function setAccessToken(token: string | null) {
  accessToken = token
}

export function getAccessToken(): string | null {
  return accessToken
}

let onUnauthorized: (() => void) | null = null
export function setUnauthorizedHandler(fn: () => void) {
  onUnauthorized = fn
}

export const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  // Access-cookie и refresh-cookie должны ездить с каждым запросом.
  withCredentials: true,
  timeout: 15000
})

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return config
})

let refreshInFlight: Promise<string | null> | null = null

/**
 * Обновляет access-токен по refresh-cookie. Несколько параллельных 401
 * должны ждать один и тот же запрос, иначе refresh-токен ротируется
 * несколько раз и предыдущие становятся невалидными.
 */
async function refreshAccessToken(): Promise<string | null> {
  if (!refreshInFlight) {
    refreshInFlight = axios
      .post<{ success: boolean; data?: { token: string } }>(`${API_URL}/auth/refresh`, null, {
        withCredentials: true
      })
      .then((res) => {
        const token = res.data?.success ? res.data.data?.token ?? null : null
        accessToken = token
        return token
      })
      .catch(() => {
        accessToken = null
        return null
      })
      .finally(() => {
        refreshInFlight = null
      })
  }
  return refreshInFlight
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined
    const status = error.response?.status

    // На /auth/refresh сам refresh-запрос повторять нельзя — иначе цикл.
    const isAuthEndpoint = config?.url?.includes('/auth/')

    if (status === 401 && config && !config._retried && !isAuthEndpoint) {
      config._retried = true
      const token = await refreshAccessToken()
      if (token) return api.request(config)
    }

    if (status === 401 && onUnauthorized) onUnauthorized()

    return Promise.reject(error)
  }
)

/** Достаёт человекочитаемое сообщение об ошибке из ответа бэкенда. */
export function errorMessage(err: unknown, fallback = 'Что-то пошло не так'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; message?: string } | undefined
    return data?.error || data?.message || err.message || fallback
  }
  if (err instanceof Error) return err.message
  return fallback
}

export interface ApiEnvelope<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Раскрывает конверт `{ success, data, error }`: возвращает data либо
 * бросает Error с текстом error — чтобы вызывающий код не проверял
 * success вручную в каждом месте.
 */
export async function unwrap<T>(p: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const res = await p
  const body = res.data
  if (!body?.success) throw new Error(body?.error || 'Ошибка запроса')
  return body.data as T
}