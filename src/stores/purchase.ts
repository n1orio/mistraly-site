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
  /** Цена в рублях. null, если цена в копейках не задана — товар бесплатный. */
  amount: number | null
  currency: string
  /** Цена в копейках — источник истины для оплаты. */
  price_kopecks: number | null
  /** Принимает ли сервер оплату прямо сейчас. */
  payments_enabled: boolean
}

/** Товар бесплатен: за него не выставляется счёт. */
export function isFree(item: Pick<ShopItem, 'price_kopecks' | 'payments_enabled'>): boolean {
  return !item.payments_enabled || !item.price_kopecks || item.price_kopecks <= 0
}

interface PurchaseResult {
  message?: string
  item: string
  item_type?: string
  purchase_id?: string
  delivery_id: string | null
  delivery?: boolean
  /** Бэкенд работает в режиме без приёма оплаты (FREE_PURCHASES). */
  free?: boolean
  /** Нужен переход на платёжную страницу Lava. */
  requires_payment?: boolean
  order_id?: string
  invoice_id?: string
  pay_url?: string
  amount?: number
  status?: string
}

/** Статус заказа: бэкенд отдаёт его после оплаты. */
interface OrderStatus {
  order_id: string
  status: 'created' | 'success' | 'fail' | 'expired' | 'refund' | string
  item: string
  invoice_id: string | null
}

/**
 * Модалка покупки. Шаги: 1 — вход через Discord, 2 — никнейм,
 * 3 — подтверждение. Дальше покупка уходит в /api/shop/purchase,
 * а игровые предметы попадают в очередь выдачи для мода.
 */
export const usePurchaseStore = defineStore('purchase', () => {
  const auth = useAuthStore()

  const open = ref(false)
  /** 1 — вход, 2 — ник, 3 — подтверждение, 4 — готово, 5 — оплата Lava. */
  const step = ref<1 | 2 | 3 | 4 | 5>(1)
  const nickname = ref('')
  const checking = ref(false)
  const submitting = ref(false)
  const error = ref('')
  const orderDone = ref(false)
  const result = ref<PurchaseResult | null>(null)
  /** Заказ Lava и ссылка на оплату — нужны для шага оплаты. */
  const orderId = ref('')
  const payUrl = ref('')

  /** Товар, если покупка инициирована из /shop, иначе null (проходка). */
  const item = ref<ShopItem | null>(null)
  const quantity = ref(1)

  const isNicknameValid = computed(() => /^[A-Za-z0-9_]{3,16}$/.test(nickname.value))

  /**
   * Ник нужен не для всего подряд. Бэкенд (routes/shop.rs) требует привязанный
   * ник только там, где товар физически доставляется на сервер, — это item и
   * unban: без ника некуда выдать предмет. Проходка меняет записи в
   * users (has_pass / pass_expires_at) и ни о ком не зависит, поэтому
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
    // Витрина нужна для цены проходки, даже если открыт обычный товар:
    // пользователь может вернуться к покупке проходки из этого окна.
    void loadShopItems()
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
    // Цена проходки живёт на витрине — без неё чек показал бы «0 ₽».
    void loadShopItems()
    void resolveNickname()
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

  /**
 * Товары витрины. Нужны модалке для двух вещей: найти проходку, чтобы
 * показать её цену, и проверить, что цена вообще задана.
 */
const shopItems = ref<ShopItem[]>([])

/** Единственный товар с item_type = 'pass' — так выдаётся проходка. */
const passItem = computed(
  () => shopItems.value.find((i) => i.item_type === 'pass') ?? null
)

/**
 * Загрузить витрину в кэш стора. Товар, купленный с витрины, приходит
 * готовым объектом, а проходка — нет: её id и цену знает только бэкенд,
 * поэтому без этой загрузки модалка показала бы проходку как «0 ₽».
 */
async function loadShopItems(force = false): Promise<void> {
  if (!force && shopItems.value.length > 0) return
  try {
    shopItems.value = await unwrap<ShopItem[]>(api.get('/shop/items'))
  } catch {
    // Не смогли узнать витрину — покупку не блокируем: цену всё равно
    // считает бэкенд, и он же её вернёт в ответе.
    shopItems.value = []
  }
}

/** Собственно покупка. Для item/unban backend создаёт запись выдачи. */
  async function confirmOrder(): Promise<boolean> {
    submitting.value = true
    error.value = ''
    try {
      const target = item.value
      // Витрина нужна в обоих случаях: для проходки — чтобы найти её id
      // и цену, для товара — чтобы знать, задана ли цена вообще.
      await loadShopItems()

      // Проходка и товары идут одним запросом; item_type определяется на бэке.
      if (target) {
        result.value = await unwrap<PurchaseResult>(
          api.post('/shop/purchase', {
            item_id: target.id,
            quantity: quantity.value
          })
        )
      } else {
        // Проходка покупается по первому item_type = 'pass' из бэкенда.
        const pass = passItem.value
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
      }

      // Бэкенд выставил счёт в Lava: денег ещё нет, товар не выдан.
      // Показываем шаг оплаты и ждём вебхук, а не радостно сообщаем об успехе.
      if (result.value.requires_payment) {
        orderId.value = result.value.order_id ?? ''
        payUrl.value = result.value.pay_url ?? ''
        step.value = 5
        return true
      }

      orderDone.value = true
      step.value = 4
      await auth.refreshProfile()
      return true
    } catch (e) {
      error.value = errorMessage(e, 'Покупка не удалась')
      return false
    } finally {
      submitting.value = false
    }
  }

  /** Открыть платёжную страницу Lava в новой вкладке. */
  function redirectToPayment(): void {
    if (payUrl.value) {
      window.open(payUrl.value, '_blank', 'noopener,noreferrer')
    }
  }

  /**
   * Спросить у бэкенда статус заказа. Один раз — для кнопки «Я оплатил».
   * Бэкенд отвечает по своей БД, а не ходит в Lava: товар выдаёт только
   * подписанный вебхук, поэтому мгновенного «success» здесь быть не может.
   */
  async function checkPayment(): Promise<boolean> {
    if (!orderId.value) return false
    submitting.value = true
    error.value = ''
    try {
      const status = await unwrap<OrderStatus>(
        api.get(`/shop/orders/${encodeURIComponent(orderId.value)}`)
      )
      if (status.status === 'success') {
        orderDone.value = true
        step.value = 4
        await auth.refreshProfile()
        return true
      }
      if (status.status === 'expired' || status.status === 'fail') {
        error.value =
          status.status === 'expired'
            ? 'Срок оплаты истёк. Создайте новый заказ.'
            : 'Платёж не прошёл. Попробуйте ещё раз.'
        step.value = 3
        return false
      }
      // created — деньги ещё в пути: это нормальное состояние, не ошибка.
      error.value = 'Оплата ещё не получена. Если вы уже заплатили, подождите минуту и попробуйте снова.'
      return false
    } catch (e) {
      error.value = errorMessage(e, 'Не удалось проверить статус платежа')
      return false
    } finally {
      submitting.value = false
    }
  }

  function close() {
    open.value = false
  }

  function reset() {
    // После закрытия модалки ник не забываем: он уже привязан к аккаунту,
    // и следующая покупка должна сразу открываться на подтверждении.
    void resolveNickname()
    error.value = ''
    orderDone.value = false
    result.value = null
    orderId.value = ''
    payUrl.value = ''
  }

  return {
    open,
    step,
    nickname,
    checking,
    submitting,
    error,
    orderDone,
    result,
    orderId,
    payUrl,
    passItem,
    item,
    quantity,
    isNicknameValid,
    needsNickname,
    hasLinkedNickname,
    hasActivePass,
    showItem,
    showPass,
    close,
    setDiscord,
    checkNickname,
    confirmOrder,
    redirectToPayment,
    checkPayment,
    reset
  }
})