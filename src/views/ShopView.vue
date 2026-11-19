<script setup lang="ts">
import { plusDiscount, shopTotal } from '../lib/shopPricing'
import { ref, computed, onMounted, markRaw } from 'vue'
import { ShoppingBag } from '../lib/icons'
import { useAuthStore } from '../stores/auth'
import { usePurchaseStore, isFree } from '../stores/purchase'
import { api, unwrap, errorMessage } from '../api/client'
import type { ShopItem } from '../stores/purchase'

const purchaseStore = usePurchaseStore()
const auth = useAuthStore()
const ownsGlitch = computed(() => auth.user?.owned_themes?.includes('GLITCH') ?? false)

function ownsTheme(item: ShopItem): boolean {
  return item.id === 'theme_glitch' && ownsGlitch.value
}

const presentation: Record<string, { title: string; badge: string; icon: any; maxQty: number }> = {
  'theme_glitch': {
    title: 'Тема Glitch',
    badge: 'Тема ника',
    icon: markRaw(ShoppingBag),
    maxQty: 1
  },
  'subscription_plus': {
    title: 'Mistraly Plus',
    badge: 'Подписка',
    icon: markRaw(ShoppingBag),
    maxQty: 99
  }
}

const fallback: (typeof presentation)[string] = {
  title: 'Товар',
  badge: 'Предмет',
  icon: markRaw(ShoppingBag),
  maxQty: 1
}

interface Card extends ShopItem {
  title: string
  badge: string
  desc: string
  icon: any
  maxQty: number
}

const cards = ref<Card[]>([])
/** Проходка с той же витрины: в сторе она грузится только при открытии модалки. */
const pass = ref<ShopItem | null>(null)
const loadError = ref('')
const loading = ref(true)

onMounted(async () => {
  try {
    const [items] = await Promise.all([
      unwrap<ShopItem[]>(api.get('/shop/items')),
      auth.isAuthenticated ? auth.refreshProfile() : Promise.resolve()
    ])
    pass.value = items.find((i) => i.item_type === 'pass') ?? null
    cards.value = items
      .filter((i) => i.item_type !== 'pass' && i.item_type !== 'unban')
      .map((i) => {
        const look = presentation[i.id] || { ...fallback, title: i.name }
        return {
          ...i,
          title: look.title,
          badge: look.badge,
          desc: i.description || '',
          icon: look.icon,
          maxQty: look.maxQty
        }
      })
  } catch (e) {
    loadError.value = errorMessage(e, 'Не удалось загрузить товары')
  } finally {
    loading.value = false
  }
})

const qty = ref<Record<string, number>>({})

function setQty(id: string, val: number) {
  const item = cards.value.find((i) => i.id === id)
  if (!item) return
  val = Number.isFinite(val) ? Math.trunc(val) : 1
  if (val < 1) val = 1
  if (val > item.maxQty) val = item.maxQty
  qty.value[id] = val
}

function openOrder(item: Card) {
  if (ownsTheme(item)) return
  purchaseStore.showItem(item, qty.value[item.id] || 1)
}

function formatRub(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} ₽`
}

/**
 * Цена карточки с учётом выбранного количества.
 *
 * price_kopecks — источник истины: price в монетах витрины к деньгам
 * отношения не имеет. Умножаем здесь, чтобы игрок видел итог до открытия
 * модалки, а не после подтверждения.
 */
function totalRub(item: Card): string {
  if (isFree(item)) return '0 ₽'
  const kopecks = shopTotal(item.id, item.price_kopecks ?? 0, qty.value[item.id] || 1)
  return formatRub(kopecks)
}

function handlePassClick() {
  if (typeof (purchaseStore as any).showPass === 'function') {
    ;(purchaseStore as any).showPass()
  } else if (typeof (purchaseStore as any).show === 'function') {
    ;(purchaseStore as any).show()
  }
}
</script>

<template>
  <main class="w-full flex-1 flex flex-col items-center justify-start text-[var(--text-main)] px-4 pt-6 pb-12">
    <div class="w-full max-w-5xl">
      <div class="section-head">
        <h1 class="section-title">Магазин <span class="word-hl">сервера</span></h1>
      </div>

      <div v-if="loading" class="text-center mb-16"><span class="mc-spinner" aria-label="Загружаем товары" /></div>
      <p v-else-if="loadError" class="text-center text-[var(--bad)] mb-16">{{ loadError }}</p>

      <div v-else-if="cards.length" class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <article v-for="item in cards" :key="item.id" class="item mc-panel" :class="{ 'item--plus': item.id === 'subscription_plus' }">
          <div class="item-art" :class="{ 'item-art--plus': item.id === 'subscription_plus' }">
            <img v-if="item.id === 'subscription_plus'" src="/images/shop/plus-v2.webp" alt="Золотая тема Plus в личном кабинете и игровом интерфейсе" />
            <div v-else-if="item.id === 'theme_glitch'" class="glitch-preview" aria-hidden="true">
              <img src="/images/wiki/chat/glitch.png" alt="" />
              <span>Glitch</span>
            </div>
            <component :is="item.icon" v-else :size="88" aria-hidden="true" />
          </div>
          <h2 class="item-title compact-title">{{ item.title }}</h2>

          <!-- Цена: рубли, а не монеты витрины. Количество учитываем сразу,
               иначе кнопка «Купить (5 шт.)» стоила бы цену одной штуки. -->
          <div class="item-price-row">
            <span class="item-price">{{ totalRub(item) }}</span>
            <template v-if="item.id === 'subscription_plus' && plusDiscount(qty[item.id] || 1) && !isFree(item)">
              <del class="text-[var(--text-muted)]">{{ formatRub((item.price_kopecks ?? 0) * (qty[item.id] || 1)) }}</del>
              <span class="item-discount">−{{ plusDiscount(qty[item.id] || 1) }}%</span>
            </template>
            <span v-if="!item.payments_enabled" class="mc-tag mc-tag--ok">Бесплатно</span>
          </div>


          <p v-if="item.id === 'subscription_plus'" class="term-discount-note">Каждый доп. месяц −2,5% · до −25%</p>
          <p v-if="item.id === 'theme_glitch'" class="term-discount-note">{{ item.desc }}</p>
          <button class="mc-btn mc-btn--block" :disabled="ownsTheme(item)" @click="openOrder(item)">
            {{ ownsTheme(item) ? 'Уже есть' : 'Купить' }}
          </button>
        </article>
      </div>

      <p v-else class="text-center text-[var(--text-muted)] mb-16">Товары временно недоступны.</p>

      <!-- Блок покупки проходки -->
      <section class="pass mc-panel">
        <div class="pass-art" aria-hidden="true"><span>M</span><b>PASS</b></div>
        <h2 class="pass-title">Главный доступ на сервер</h2>
        <details class="item-details pass-details">
          <summary>Подробнее</summary>
          <p class="pass-text item-details-body">Пропуск Mistraly Pass открывает доступ к серверу, лаунчеру и закрытому сообществу. Бессрочный, покупается один раз.</p>
        </details>
        <!-- Цена проходки берётся с витрины: price в монетах — не рубли. -->
        <div v-if="!purchaseStore.hasActivePass" class="pass-price">
          <!-- Приём оплаты выключен — проходка бесплатна, как и товары выше. -->
          <template v-if="!pass">{{ loading ? '…' : '' }}</template>
          <template v-else-if="isFree(pass)">Бесплатно</template>
          <template v-else>{{ formatRub(pass.price_kopecks ?? 0) }}</template>
        </div>

        <!-- При действующей проходке повторная оплата не нужна. -->
        <button v-if="!purchaseStore.hasActivePass" class="mc-btn" @click="handlePassClick">
          Оформить проходку →
        </button>
        <p v-else class="text-[var(--ok)] m-0">Проходка уже оформлена — доступ бессрочный.</p>
      </section>
    </div>
  </main>
</template>

<style scoped>
.term-discount-note { margin: 0 0 14px; color: var(--text-muted); font-size: 13px; }
.compact-title { margin: 0 0 12px; }
.item > .item-price-row { margin-bottom: 18px; }
.product-dialog { padding: 0; border: 0; background: transparent; color: var(--text-main); }
.product-dialog[open] { position: fixed; inset: 0; width: 100vw; height: 100dvh; max-width: none; max-height: none; margin: 0; z-index: 40; }
.product-dialog-backdrop { width: 100%; height: 100%; display: grid; place-items: center; padding: 20px; background: #050505d9; }
.product-dialog-panel { position: relative; width: 100%; max-width: 440px; padding: 26px; max-height: 90dvh; overflow: auto; }
.product-dialog-close { position: absolute; top: 8px; right: 12px; border: 0; background: transparent; color: var(--text-muted); font-size: 28px; cursor: pointer; }
.product-description { margin-top: 18px !important; }

.item-art { height: 230px; margin: -18px -18px 22px; display: grid; place-items: center; overflow: hidden; background: radial-gradient(ellipse at center, #334868, #111924); color: #bed9f7; border-bottom: 2px solid #35465e; }
.item-art--plus { height: auto; aspect-ratio: 1 / 1; background: transparent; border: 0; border-radius: 0; }
.item-art img { display: block; width: 100%; height: 100%; object-fit: contain; border-radius: 0; }
.item--plus { border: 0; box-shadow: none; outline: none; }
.plus-symbol { display: grid; place-items: center; flex: 0 0 48px; width: 48px; height: 48px; background: #563600; color: #ffd879; font: 700 38px/1 monospace; border-radius: 0; }
.item-price-row { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; margin-bottom: 10px; }
.item-discount { color: var(--text-main); background: var(--well); padding: 3px 6px; font-size: 13px; line-height: 1; font-weight: 600; }
.item-rate { margin: 0 0 14px; color: var(--text-muted); font-size: 14px; }
.item-details { margin-bottom: 18px; }
.item-details summary { width: fit-content; cursor: pointer; color: var(--text-muted); font-size: 14px; }
.item-details summary:hover { color: var(--text-main); }
.item-details summary:focus-visible { outline: 2px solid var(--sky); outline-offset: 4px; }
.item-details-body { padding-top: 12px; }
.pass-details { max-width: 480px; text-align: left; }
.pass-details summary { margin: 0 auto; }
.item > .qty { margin-top: auto; }
.item > .mc-btn { margin-top: auto; }
.item > .qty + .mc-btn { margin-top: 0; }
.item-note { color: var(--text-muted); font-size: 13px; line-height: 1.5; margin: 0 0 18px; }
.month-input { display: flex; align-items: center; gap: 6px; padding: 0 10px; }
.month-input input { width: 48px; background: transparent; color: inherit; border: none; text-align: center; font: inherit; font-weight: 700; }
.qty button:disabled { opacity: .35; cursor: default; }
.pass-art { display: flex; align-items: center; gap: 16px; margin-bottom: 22px; color: #9ad9ff; transform: rotate(-5deg); padding: 15px 26px; border: 3px solid #609ac4; box-shadow: 6px 6px 0 #101a29; background: #1b3047; }
.pass-art span { font-family: 'Minecraft Ten', sans-serif; font-size: 48px; }
.pass-art b { letter-spacing: .2em; }

.item {
  display: flex;
  flex-direction: column;
  padding: 18px;
}
.item .mc-slot {
}
.item-title {
  font-family: 'Noto Sans', 'Helvetica Neue', Arial, sans-serif;
  font-weight: 700;
  margin: 6px 0 0;
  font-size: 17px;
  line-height: 1.25;
}
.item-price {
  font-family: 'Minecraft Ten', 'Noto Sans', sans-serif;
  font-size: 16px;
  color: var(--sky);
}
.item-text {
  flex: 1;
  margin: 0 0 14px;
  color: var(--text-muted);
  font-size: 16px;
  line-height: 1.45;
}
.qty {
  display: flex;
  align-items: center;
  align-self: flex-end;
  margin: 0 0 14px;
  padding: 3px;
}
.qty button {
  width: 32px;
  height: 32px;
  background: var(--panel-hi);
  color: #fff;
  border: 0;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
}
.qty button:active {
  transform: translateY(2px);
}
.qty button:hover {
  background: var(--blue);
}
.qty span {
  width: 36px;
  text-align: center;
  font-weight: 700;
}
.pass {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 20px;
  text-align: center;
}
.pass-title {
  margin: 0 0 8px;
  font-size: 16px;
  line-height: 1.25;
}
.pass-text {
  max-width: 480px;
  margin: 0 0 16px;
  color: var(--text-muted);
}
.pass-price {
  margin-bottom: 16px;
  font-family: 'Minecraft Ten', 'Noto Sans', sans-serif;
  font-size: 24px;
  color: var(--sky);
}
.glitch-preview {
  display: flex;
  align-items: center;
  gap: 14px;
  color: #ff2a3c;
  text-shadow: 3px 2px #0078c0;
  font-size: 2.5rem;
}

.item-art .glitch-preview img {
  width: 36px;
  height: 36px;
  image-rendering: pixelated;
}
</style>
