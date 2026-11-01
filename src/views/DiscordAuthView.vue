<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Discord, ShieldCheck, Check, AlertTriangle } from '../lib/icons'
import { useAuthStore } from '../stores/auth'
import { usePurchaseStore } from '../stores/purchase'
import { errorMessage } from '../api/client'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const purchase = usePurchaseStore()

const errorMessage_ = ref('')
const success = ref(false)
/** Проверяем живую сессию, чтобы не гонять уже залогиненного через OAuth. */
const checkingSession = ref(false)
const alreadyIn = ref(false)
const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID || ''

// Discord возвращает state байт-в-байт. Лаунчер кладёт туда свой nonce,
// а модалка покупки — маркер 'purchase'. Раньше state читался как nonce
// без разбора, поэтому 'purchase' ушёл бы в бэкенд как nonce и окно
// закрылось вместо возврата на сайт.
const PURCHASE_STATE = 'purchase'

const rawState = computed(() => (route.query.state as string) || '')
/** Nonce лаунчера: всё, что не наш служебный маркер. */
const launcherNonce = computed(() => {
  const fromQuery = (route.query.nonce as string) || ''
  const value = fromQuery || rawState.value
  return value === PURCHASE_STATE ? '' : value
})
/** Намерение вернуться к покупке. */
const isPurchase = computed(() => rawState.value === PURCHASE_STATE || route.query.purchase === '1')
const redirectAfter = computed(() => (route.query.redirect as string) || '')

const destination = computed(() => {
  if (launcherNonce.value) return ''
  if (redirectAfter.value) return redirectAfter.value
  // На admin.mistraly.net после входа нужен корень — там админка.
  // Без этого DiscordAuthView всегда возвращал бы в /profile.
  if (location.hostname === 'admin.mistraly.net') return '/'
  if (isPurchase.value) return '/?purchase=1'
  return '/profile'
})

/** Подтверждение передачи сессии лаунчеру — без перехода в Discord. */
async function confirmHandoff() {
  if (!launcherNonce.value) return
  try {
    await auth.launcherHandoff(launcherNonce.value)
    success.value = true
    alreadyIn.value = true
    setTimeout(() => window.close(), 900)
  } catch (e) {
    errorMessage_.value = errorMessage(e, 'Не удалось передать сессию лаунчеру')
  }
}

function startDiscordAuth() {
  if (!clientId) {
    errorMessage_.value = 'Discord авторизация временно не настроена.'
    return
  }
  // Ровно зарегистрированный в Discord путь, без query-строки.
  const redirect = encodeURIComponent(`${location.origin}/auth/discord`)
  const state = launcherNonce.value || (isPurchase.value ? PURCHASE_STATE : undefined)
  location.href =
    `https://discord.com/api/oauth2/authorize?client_id=${clientId}` +
    `&redirect_uri=${redirect}&response_type=code&scope=identify` +
    (state ? `&state=${encodeURIComponent(state)}` : '')
}

/** Сессия сайта есть — токен можно отдать лаунчеру без Discord. */
async function tryHandoffWithoutOAuth(): Promise<boolean> {
  if (!launcherNonce.value) return false
  if (!auth.isAuthenticated) return false
  try {
    await auth.launcherHandoff(launcherNonce.value)
    return true
  } catch (e) {
    // Сессия могла протухнуть между гардом и здесь — тогда показываем
    // кнопку Discord как раньше, а не молча уходим в ошибку.
    errorMessage_.value = errorMessage(e, 'Не удалось передать сессию лаунчеру')
    return false
  }
}

onMounted(async () => {
  const code = route.query.code as string | undefined
  if (!code) {
    // Лаунчер прислал nonce, но Discord ещё не поучаствовал. Если игрок
    // уже залогинен на сайте — отдаём токен сразу, без второго входа.
    checkingSession.value = true
    await auth.restore()
    const handedOff = await tryHandoffWithoutOAuth()
    checkingSession.value = false
    if (handedOff) {
      alreadyIn.value = true
      success.value = true
      setTimeout(() => window.close(), 900)
    }
    return
  }

  try {
    await auth.loginWithDiscord(code, launcherNonce.value || undefined)
    success.value = true

    if (launcherNonce.value) {
      setTimeout(() => window.close(), 1000)
      return
    }

    if (isPurchase.value) purchase.showPass()
    if (destination.value) {
      setTimeout(() => router.replace(destination.value), 800)
    }
  } catch (e) {
    errorMessage_.value = errorMessage(e, 'Не удалось связать Discord с аккаунтом')
  }
})
</script>

<template>
  <main class="w-full flex-1 flex flex-col items-center justify-center text-[var(--text-main)] px-4 pt-16 pb-16">
    <div class="w-full max-w-md mc-panel p-7 sm:p-9 text-center">
      <!-- Проверяем живую сессию, чтобы не спрашивать Discord заново -->
      <div v-if="checkingSession" class="py-6">
        <span class="mc-spinner" />
        <span class="text-[15px] text-[var(--text-muted)] mt-2 block">Проверяем сессию</span>
      </div>

      <!-- Ожидание авторизации -->
      <div v-else-if="!success">
        <span class="mc-slot mx-auto mb-5"><Discord :size="36" /></span>
        <h1 class="section-title">Пропуск в <span class="word-hl">Mistraly</span></h1>
        <span class="mc-tag mb-4">{{ launcherNonce ? 'Передача в лаунчер' : 'Единый вход' }}</span>

        <p class="text-[var(--text-muted)] leading-relaxed mb-6">
          <template v-if="launcherNonce">
            Лаунчеру нужен доступ к вашему аккаунту. Если вы уже вошли на сайте — просто подтвердите передачу.
          </template>
          <template v-else>
            Авторизация через Discord создает безопасный профиль без паролей и синхронизирует ваши дирижабли и скины.
          </template>
        </p>

        <!-- Сессия сайта уже есть: Discord не нужен, лаунчер получит тот же аккаунт -->
        <button
          v-if="launcherNonce && auth.isAuthenticated"
          :disabled="auth.loading"
          class="mc-btn mc-btn--block"
          @click="confirmHandoff"
        >
          <ShieldCheck :size="24" />
          {{ auth.loading ? 'Передаём...' : `Продолжить как ${auth.user?.username || 'игрок'}` }}
        </button>
        <button v-else :disabled="auth.loading" class="mc-btn mc-btn--discord mc-btn--block" @click="startDiscordAuth">
          <Discord :size="24" />
          {{ auth.loading ? 'Проверка связи...' : 'Войти через Discord' }}
        </button>

        <div v-if="errorMessage_" class="mc-well m-[3px] mt-5 p-3 text-[15px] text-[var(--bad)] flex items-center gap-2 text-left">
          <AlertTriangle :size="24" class="shrink-0" />
          <span>{{ errorMessage_ }}</span>
        </div>
      </div>

      <!-- Успешный вход -->
      <div v-else class="py-4">
        <span class="mc-slot mx-auto mb-5" style="color: var(--ok)"><Check :size="36" /></span>
        <span class="mc-tag mc-tag--ok mb-3">Доступ подтверждён</span>
        <h1 class="section-title">Добро пожаловать</h1>
        <p class="text-[var(--text-muted)] leading-relaxed m-0">
          <template v-if="alreadyIn">Сессия сайта передана в лаунчер — в Discord не пришлось заходить.</template>
          <template v-else-if="launcherNonce">Токен передан в лаунчер. Это окно закроется автоматически.</template>
          <template v-else>Перенаправляем в ваш профиль...</template>
        </p>
      </div>
    </div>
  </main>
</template>
