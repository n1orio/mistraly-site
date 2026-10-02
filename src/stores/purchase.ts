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

interface NicknameLink {
  nickname: string
  minecraft_uuid: string | null
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

  /**
   * Ник нужен не для всего подряд. Бэкенд (routes/shop.rs) требует привязанный
   * ник только там, где товар физически доставляется на сервер, — это item и
   * unban: без ника некуда выдать предмет. Проходка и валюта меняют записи в
   * users (has_pass / pass_expires_at / balance) и ни о ком не зависят, поэтому
   * спрашивать ник там — лишний шаг с вводом данных, которые нигде не нужны.
   */
  const needsNickname = computed(() => {
    if (!item.value) return false
    return item.value.item_type === 'item' || item.value.item_type === 'unban'
  })

  /** Ник уже привязан к аккаунту и бэкенд его знает. */
  const hasLinkedNickname = computed(() => !!nickname.value)

  /**
   * Проходка уже действует. pass_expires_at = null означает бессрочную —
   * именно её выдаёт покупка, поэтому «нет даты» здесь не «неизвестно».
   */
  const hasActivePass = computed(() => {
    if (!auth.user?.has_pass) return false
    const expires = auth.user.pass_expires_at
    if (!expires) return true
    return new Date(expires).getTime() > Date.now()
  })

  const PRICE_LABEL = '350 ₽'

  /**
   * Подставить привязанный ник и выбрать стартовый шаг.
   *
   * Раньше авторизованного пользователя всегда отправляли на шаг ввода ника,
   * хотя ник уже лежит в базе — приходилось вводить его заново при каждой
   * покупке. Теперь спрашиваем у бэкенда /user/nickname: если он есть,
   * подставляем и идём сразу к подтверждению. Шаг ввода показывается только
   * там, где ник действительно нужен (needsNickname) и ещё не привязан.
   */
  async function resolveNickname(): Promise<void> {
    if (!auth.isAuthenticated) {
      nickname.value = ''
      step.value = 1
      return
    }
    try {
      const link = await unwrap<NicknameLink | null>(api.get('/user/nickname'))
      nickname.value = link?.nickname ?? ''
    } catch {
      // Не смогли узнать ник — не блокируем покупку: для проходки он не нужен,
      // а для товара шаг ввода всё равно покажется и ник спросят.
      nickname.value = ''
    }
    step.value = needsNickname.value && !nickname.value ? 2 : 3
  }

  /** Открыть модалку для конкретного товара из витрины. */
  function showItem(shopItem: ShopItem, qty = 1) {
    open.value = true
    item.value = shopItem
    quantity.value = qty
    error.value = ''
    result.value = null
    orderDone.value = false
    void resolveNickname()
  }

  /** Открыть модалку без товара — покупка проходки. Ник не нужен.
   *
   * Если проходка уже есть, модалка не открывается: показывать «перейти к
   * оплате» человеку с действующим доступом бессмысленно.
   */
  function showPass() {
    if (hasActivePass.value) {
      open.value = false
      error.value = ''
      return
    }
    open.value = true
    item.value = null
    quantity.value = 1
    error.value = ''
    result.value = null
    orderDone.value = false
    void resolveNickname()
  }

  function close() {
    open.value = false
  }

  /** После входа через Discord: подтягиваем ник и выбираем следующий шаг. */
  function setDiscord(name: string) {
    error.value = ''
    void name
    void resolveNickname()
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
        // Проходка бессрочная и одноразовая: если она уже есть, повторная
        // покупка — лишняя оплата. Бэкенд всё равно отобьёт, но лучше не
        // доводить до запроса и не показывать чужое сообщение об ошибке.
        if (hasActivePass.value) {
          error.value = 'У вас уже есть бессрочная проходка'
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
    // После закрытия модалки ник не забываем: он уже привязан к аккаунту,
    // и следующая покупка должна сразу открываться на подтверждении.
    void resolveNickname()
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
    needsNickname,
    hasLinkedNickname,
    hasActivePass,
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