import { api, unwrap } from './client'

/**
 * Клиент админ-раздела.
 *
 * Все эндпоинты закрыты на бэкенде middleware, который требует
 * role == admin, поэтому 403 здесь означает «войти через другой Discord».
 * Проверку роли на клиенте (isAdmin) держим только чтобы не показывать
 * пустые таблицы — сама защита остаётся на сервере.
 */

export interface AdminUser {
  id: string
  username: string
  role: string
  has_pass: boolean
  pass_expires_at: string | null
  created_at?: string
  discord_id?: string | null
  discord_username?: string | null
  nickname?: string | null
  minecraft_uuid?: string | null
}

export interface ShopItem {
  id: string
  name: string
  description?: string | null
  item_type: string
  mc_item?: string | null
  mc_amount?: number | null
  price?: number | null
  /** Цена в копейках — то, что реально списывается. */
  price_kopecks?: number | null
}

/** Сводка по оплатам за окно. Суммы — в рублях, если не сказано иное. */
export interface PaymentSummary {
  revenue: number
  revenue_kopecks: number
  total_orders: number
  paid_orders: number
  pending_orders: number
  failed_orders: number
  expired_orders: number
  refund_orders: number
  /** Выручка / число оплаченных заказов, в рублях. */
  avg_check: number
  /** success / все заказы окна, доля от 0 до 1. */
  conversion: number
  /** Выставлено счетов, но не оплачено: created + fail + expired. */
  lost: number
  lost_kopecks: number
}

export interface DailyRow {
  day: string
  orders: number
  paid_orders: number
  revenue_kopecks: number
}

export interface GroupRow {
  /** by_status; для by_item в этом поле лежит item_name. */
  status: string
  count: number
  amount_kopecks: number
}

export interface PaymentStats {
  payments_enabled: boolean
  free_purchases_mode: boolean
  summary: PaymentSummary
  daily: DailyRow[]
  by_status: GroupRow[]
  by_item: GroupRow[]
}

export interface LavaOrder {
  id: string
  user: string
  item_name: string
  amount_kopecks: number
  status: string
  invoice_id: string | null
  error_message: string | null
  created_at: string
}

export interface LavaHook {
  id: number
  invoice_id: string | null
  order_id: string | null
  status: string | null
  signature_valid: boolean
  error: string | null
  created_at: string
}

export interface OrdersFeed {
  orders: LavaOrder[]
  webhooks: LavaHook[]
}

export interface AuditEntry {
  id: string
  actor: string
  action: string
  target_user_id: string | null
  details: Record<string, unknown> | null
  created_at: string
}

export interface AdminPurchase {
  id: string
  item_id: string
  item_name: string
  created_at: string
  status: string | null
}

export function listUsers(): Promise<AdminUser[]> {
  return unwrap<AdminUser[]>(api.get('/admin/users'))
}

export function listShopItems(): Promise<ShopItem[]> {
  return unwrap<ShopItem[]>(api.get('/admin/shop/items'))
}

export function listAudit(limit = 100): Promise<AuditEntry[]> {
  return unwrap<AuditEntry[]>(api.get('/admin/audit', { params: { limit } }))
}

export function userPurchases(userId: string): Promise<AdminPurchase[]> {
  return unwrap<AdminPurchase[]>(api.get(`/admin/users/${userId}/purchases`))
}

/**
 * Выдать или снять проходку.
 *
 * Срок не передаётся: проходка бессрочная, бэкенд игнорирует days.
 */
export function setPass(
  userId: string,
  hasPass: boolean,
  reason?: string
): Promise<AdminUser> {
  return unwrap<AdminUser>(
    api.put(`/admin/pass/${userId}`, { has_pass: hasPass, reason: reason || null })
  )
}

export function grantItem(
  userId: string,
  itemId: string,
  reason?: string
): Promise<{ delivery_id: string; item: string; nickname: string }> {
  return unwrap(api.post('/admin/items/grant', {
    user_id: userId,
    item_id: itemId,
    reason: reason || null
  }))
}

export function revokeItem(
  userId: string,
  deliveryId: string,
  reason?: string
): Promise<{ revoked: boolean }> {
  return unwrap(api.post('/admin/items/revoke', {
    user_id: userId,
    delivery_id: deliveryId,
    reason: reason || null
  }))
}

/**
 * Статистика оплат за окно в днях. Без days бэкенд считает по умолчанию,
 * но «всё время» на бэкенде — это 3650 дней, поэтому для постоянного
 * показа на странице передаём большой срок явно.
 */
export function paymentStats(days = 30): Promise<PaymentStats> {
  return unwrap<PaymentStats>(api.get('/admin/stats/payments', { params: { days } }))
}

/** Последние заказы и сырые вебхуки Lava — для разбора инцидентов. */
export function ordersFeed(days = 30, limit = 50): Promise<OrdersFeed> {
  return unwrap<OrdersFeed>(
    api.get('/admin/stats/orders', { params: { days, limit } })
  )
}

/**
 * Задать цену товара в рублях.
 *
 * Отправляем рубли, а не копейки: в форме человек вводит «350», и если бы
 * он вводил копейки, цена 350 копеек (= 3,50 ₽) выглядела бы как
 * «350 ₽» в ожидании и «3,50 ₽» по факту. Бэкенд сам умножает на 100.
 */
export function setItemPrice(itemId: string, rub: number): Promise<ShopItem> {
  return unwrap<ShopItem>(
    api.put(`/admin/shop/items/${encodeURIComponent(itemId)}/price`, { price_rub: rub })
  )
}
