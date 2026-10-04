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
