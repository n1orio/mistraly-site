import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { api, errorMessage, unwrap } from '../api/client'
import { useAuthStore } from './auth'

interface NicknameCheck {
  valid: boolean
  taken: boolean
  reason: string | null
  own: boolean
}

export interface ShopItem {
  id: string
  name: string
  description: string | null
  item_type: 'pass' | 'currency' | 'skin' | 'item' | 'unban' | string
  price: number
  duration_days: number | null
  currency_amount: number | null
  mc_item: string | null
  mc_amount: number
  created_at: string
}

interface PurchaseResult {
  message: string
  item: string
  item_type: string
  purchase_id: string
  delivery_id: string | null
  delivery: boolean
  /** Бэкенд работает в режиме без приёма оплаты (FREE_PURCHASES). */
  free: boolean
}

/**
 * Модалка покупки. Шаги: 1 — вход через Discord, 2 — никнейм,
 * 3 — подтверждение. Дальше покупка уходит в /api/shop/purchase,
 * а игровые предметы попадают в очередь выдачи для мода.
 */
export const usePurchaseStore = defineStore('purchase', () => {
  const auth = useAuthStore()

  const open = ref(false)
  const step = ref<1 | 2 | 3 | 4>(1)
  const nickname = ref('')
  const checking = ref(false)
  const submitting = ref(false)
  const error = ref('')
  const orderDone = ref(false)
  const result = ref<PurchaseResult | null>(null)
  /**
   * Режим без приёма оплаты. Пока платёжный провайдер не подключён,
   * бэкенд отдаёт free: true — тогда интерфейс не обещает оплату,
   * а пишет «получено».
   */
  const isFreeMode = ref(false)

  /** Товар, если покупка инициирована из /shop, иначе null (проходка). */
  const item = ref<ShopItem | null>(null)
  const quantity = ref(1)

  const isNicknameValid = computed(() => /^[A-Za-z0-9_]{3,16}$/.test(nickname.value))
  const total = computed(() => (item.value?.price ?? 0) * quantity.value)

  const PRICE_LABEL = '350 ₽'

  /** Открыть модалку для конкретного товара из витрины. */
  function showItem(shopItem: ShopItem, qty = 1) {
    open.value = true
    item.value = shopItem
    quantity.value = qty
    error.value = ''
    result.value = null
    orderDone.value = false
    // Пользователь без сессии начинает с шага входа; с сессией — с ника,
    // но если ник уже привязан, сразу к подтверждению.
    step.value = auth.isAuthenticated ? 2 : 1
  }

  /** Открыть модалку без товара — покупка проходки. */
  function showPass() {
    showItem(null as unknown as ShopItem, 1)
    item.value = null
  }

  function close() {
    open.value = false
  }

  function setDiscord(name: string) {
    step.value = 2
    error.value = ''
    void name
  }

  /**
   * Проверка ника: занят ли он и валиден ли. Плюс бэкаунд сразу привязывает
   * ник к аккаунту, иначе покупку некуда будет выдать на сервере.
   */
  async function checkNickname(): Promise<boolean> {
    checking.value = true
    error.value = ''
    try {
      if (!isNicknameValid.value) {
        error.value = 'Используйте 3–16 латинских букв, цифр или _.'
        return false
      }
      const check = await unwrap<NicknameCheck>(
        api.get('/user/check-nickname', { params: { nickname: nickname.value } })
      )
      if (!check.valid) {
        error.value = check.reason || 'Некорректный никнейм.'
        return false
      }
      if (check.taken) {
        error.value = 'Этот никнейм уже занят.'
        return false
      }
      if (!check.own) {
        await unwrap(api.post('/user/link-nickname', { nickname: nickname.value }))
      }
      step.value = 3
      return true
    } catch (e) {
      error.value = errorMessage(e, 'Не удалось проверить никнейм')
      return false
    } finally {
      checking.value = false
    }
  }

  /** Собственно покупка. Для item/unban backend создаёт запись выдачи. */
  async function confirmOrder(): Promise<boolean> {
    submitting.value = true
    error.value = ''
    try {
      const target = item.value
      if (!target) {
        // Проходка покупается по первому item_type = 'pass' из бэкенда.
        const items = await unwrap<ShopItem[]>(api.get('/shop/items'))
        const pass = items.find((i) => i.item_type === 'pass')
        if (!pass) {
          error.value = 'Проходка сейчас недоступна'
          return false
        }
        result.value = await unwrap<PurchaseResult>(
          api.post('/shop/purchase', { item_id: pass.id })
        )
      } else {
        for (let i = 0; i < quantity.value; i++) {
          result.value = await unwrap<PurchaseResult>(
            api.post('/shop/purchase', { item_id: target.id })
          )
        }
      }
      orderDone.value = true
      step.value = 4
      isFreeMode.value = !!result.value?.free
      await auth.refreshProfile()
      return true
    } catch (e) {
      error.value = errorMessage(e, 'Покупка не удалась')
      return false
    } finally {
      submitting.value = false
    }
  }

  function reset() {
    step.value = auth.isAuthenticated ? 2 : 1
    nickname.value = ''
    error.value = ''
    orderDone.value = false
    result.value = null
    isFreeMode.value = false
  }

  return {
    open,
    step,
    nickname,
    checking,
    submitting,
    isFreeMode,
    error,
    orderDone,
    result,
    item,
    quantity,
    total,
    isNicknameValid,
    priceLabel: PRICE_LABEL,
    showItem,
    showPass,
    close,
    setDiscord,
    checkNickname,
    confirmOrder,
    reset
  }
})