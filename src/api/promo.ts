import { api, unwrap } from './client'

/**
 * Промокоды и партнёрка авторов.
 *
 * Деньги везде в копейках — как их хранит бэкенд. Рубли появляются только
 * при выводе (formatRub) и при вводе выплаты (amount_rub).
 */

export type PromoKind = 'promo' | 'author'

export interface PromoCode {
  id: string
  code: string
  kind: PromoKind
  discount_percent: number
  reward_percent: number
  author_user_id: string | null
  author: string | null
  item_id: string | null
  max_uses: number | null
  expires_at: string | null
  active: boolean
  note: string | null
  created_at: string
  uses: number
  /** Использования в режиме без оплаты — к выплате не идут. */
  test_uses: number
  revenue_kopecks: number
  discount_kopecks: number
  reward_kopecks: number
}

export interface AuthorSummaryRow {
  id: string
  username: string
  codes: number
  uses: number
  revenue_kopecks: number
  earned_kopecks: number
  paid_out_kopecks: number
  owed_kopecks: number
}

export interface AuthorsOverview {
  authors: AuthorSummaryRow[]
  total: { earned_kopecks: number; paid_out_kopecks: number; owed_kopecks: number }
}

export interface AuthorStats {
  author: { id: string; username: string }
  summary: {
    uses: number
    test_uses: number
    passes: number
    revenue_kopecks: number
    discount_kopecks: number
    earned_kopecks: number
    paid_out_kopecks: number
    owed_kopecks: number
  }
  codes: {
    id: string
    code: string
    discount_percent: number
    reward_percent: number
    active: boolean
    max_uses: number | null
    expires_at: string | null
    uses: number
    earned_kopecks: number
  }[]
  recent: {
    created_at: string
    code: string
    item_name: string
    buyer: string
    paid_kopecks: number
    discount_kopecks: number
    reward_kopecks: number
    is_test: boolean
  }[]
  daily: { day: string; uses: number; reward_kopecks: number }[]
  payouts: { created_at: string; amount_kopecks: number; note: string | null }[]
}

export interface Redemption {
  created_at: string
  code: string
  order_id: string
  item_name: string
  buyer: string
  original_kopecks: number
  discount_kopecks: number
  paid_kopecks: number
  reward_kopecks: number
  author: string | null
  is_test: boolean
}

export interface NewPromo {
  code: string
  kind: PromoKind
  discount_percent?: number
  reward_percent?: number
  author_user_id?: string
  item_id?: string
  max_uses?: number
  expires_at?: string
  note?: string
}

export function formatRub(kopecks: number): string {
  // Копейки показываем всегда парой цифр: «10,5 ₽» читается как ошибка.
  const digits = kopecks % 100 === 0 ? 0 : 2
  return `${(kopecks / 100).toLocaleString('ru-RU', { minimumFractionDigits: digits, maximumFractionDigits: 2 })} ₽`
}

export function myAuthorStats(): Promise<AuthorStats> {
  return unwrap<AuthorStats>(api.get('/author/stats'))
}

export function listPromos(): Promise<PromoCode[]> {
  return unwrap<PromoCode[]>(api.get('/admin/promo'))
}

export function createPromo(p: NewPromo): Promise<{ id: string; code: string }> {
  return unwrap(api.post('/admin/promo', p))
}

export function updatePromo(
  id: string,
  patch: Partial<Pick<PromoCode, 'active' | 'discount_percent' | 'reward_percent' | 'max_uses'>> & {
    expires_at?: string
  }
): Promise<{ id: string }> {
  return unwrap(api.put(`/admin/promo/${encodeURIComponent(id)}`, patch))
}

export function authorsOverview(): Promise<AuthorsOverview> {
  return unwrap<AuthorsOverview>(api.get('/admin/promo/authors'))
}

export function authorStats(userId: string): Promise<AuthorStats> {
  return unwrap<AuthorStats>(api.get(`/admin/promo/authors/${encodeURIComponent(userId)}`))
}

export function listRedemptions(promoId?: string, limit = 100): Promise<Redemption[]> {
  return unwrap<Redemption[]>(
    api.get('/admin/promo/redemptions', { params: { promo_id: promoId, limit } })
  )
}

export function payAuthor(authorUserId: string, amountRub: number, note?: string): Promise<{ id: string }> {
  return unwrap(api.post('/admin/promo/payouts', { author_user_id: authorUserId, amount_rub: amountRub, note }))
}
