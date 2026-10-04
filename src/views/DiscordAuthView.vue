<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MessageCircle, ShieldCheck, Check, AlertTriangle, Terminal } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'
import { usePurchaseStore } from '../stores/purchase'
import { errorMessage } from '../api/client'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const purchase = usePurchaseStore()

const errorMessage_ = ref('')
const success = ref(false)
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

onMounted(async () => {
  const code = route.query.code as string | undefined
  if (!code) return

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
  <main class="w-full flex-1 flex flex-col items-center justify-center page-bg bg-[var(--bg-page)] text-[var(--text-main)] px-4 pt-24 pb-16 select-none">

    <div class="w-full max-w-md relative terminal-outer">

      <!-- Верхний бейдж протокола допуска -->
      <div class="flex items-center justify-between px-2 mb-2 font-mono text-[11px] text-zinc-500">
        <div class="flex items-center gap-1.5">
          <span class="w-2 h-2 rounded-full bg-[#5865F2] animate-pulse"></span>
          <span class="tracking-widest uppercase">TERMINAL // OAUTH2</span>
        </div>
        <span class="text-zinc-600">ID: MISTRALY-AUTH</span>
      </div>

      <!-- Основная карточка терминала -->
      <div
        class="terminal-card bg-[#151619] p-7 sm:p-9 relative overflow-hidden"
        style="clip-path: polygon(0% 1.5%, 100% 0%, 99% 98.5%, 1% 100%);"
      >
        <!-- Тонкий полутоновый растр -->
        <div class="comic-dots-pattern" aria-hidden="true" />

        <div class="relative z-10 text-center">

          <!-- Режим 1: Ожидание авторизации -->
          <div v-if="!success">
            <!-- Крупная иконка Discord с жесткой тенью -->
            <div class="relative inline-block mb-6">
              <div
                class="w-16 h-16 rounded-xl flex items-center justify-center bg-[#5865F2]/15 text-[#5865F2] border border-[#5865F2]/30 shadow-2xl mx-auto"
                style="transform: rotate(-2deg); box-shadow: 6px 6px 0px rgba(0,0,0,0.5);"
              >
                <MessageCircle :size="32" />
              </div>
            </div>

            <!-- Заголовок терминала -->
            <div class="mb-3">
              <h2 class="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight leading-snug uppercase">
                Пропуск в <span class="word-hl">Mistraly</span>
              </h2>
              <span class="font-mono text-[11px] text-[#5865F2] uppercase font-bold tracking-wider mt-1 block">
                СИСТЕМА ЕДИНОГО ВХОДА
              </span>
            </div>

            <p class="text-xs sm:text-sm text-zinc-300/80 leading-relaxed font-normal mb-8 max-w-xs mx-auto">
              Авторизация через Discord создает безопасный профиль без паролей и синхронизирует ваши дирижабли и скины.
            </p>

            <!-- Кнопка входа в едином стиле сайта (белеет при наведении) -->
            <div class="comic-btn-wrap w-full">
              <button
                :disabled="auth.loading"
                @click="startDiscordAuth"
                class="comic-btn w-full py-3.5 px-6 font-heading font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60"
                :style="{ '--btn-bg': '#5865F2', '--btn-color': '#FFFFFF' }"
              >
                <MessageCircle :size="16" />
                {{ auth.loading ? 'Проверка связи...' : 'Войти через Discord' }}
              </button>
            </div>

            <!-- Сообщение об ошибке -->
            <div
              v-if="errorMessage_"
              class="mt-5 p-3 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono flex items-center gap-2 text-left"
              style="clip-path: polygon(0% 4%, 100% 0%, 99% 96%, 1% 100%);"
            >
              <AlertTriangle :size="16" class="shrink-0" />
              <span>{{ errorMessage_ }}</span>
            </div>
          </div>

          <!-- Режим 2: Успешный вход -->
          <div v-else class="py-4">
            <!-- Зеленый штамп допуска -->
            <div
              class="w-16 h-16 rounded-xl bg-emerald-500/15 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mx-auto mb-5"
              style="transform: rotate(3deg); box-shadow: 6px 6px 0px rgba(0,0,0,0.5);"
            >
              <Check :size="34" />
            </div>

            <span class="font-heading font-black text-xs uppercase tracking-wider text-emerald-400 mb-1 block">
              ДОСТУП ПОДТВЕРЖДЕН
            </span>
            <h2 class="font-heading font-black text-2xl sm:text-3xl text-white tracking-tight mb-3 uppercase">
              Добро пожаловать
            </h2>
            <p class="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto mb-6">
              {{ launcherNonce ? 'Токен передан в лаунчер. Это окно закроется автоматически.' : 'Перенаправляем в ваш терминал...' }}
            </p>

            <div class="h-1 w-full bg-white/10 rounded-full overflow-hidden">
              <div class="h-full bg-emerald-500 animate-pulse w-full"></div>
            </div>
          </div>

          <!-- Нижняя системная сноска -->
          <div class="mt-8 pt-4 border-t border-white/10 flex items-center justify-between font-mono text-[10px] text-zinc-500 uppercase">
            <span>ПРОТОКОЛ: DISCORD BOT API</span>
            <span>ШИФРОВАНИЕ TLS 1.3</span>
          </div>

        </div>
      </div>

    </div>

  </main>
</template>

<style scoped>
/* Фирменный стиль плашки в заголовке */
.word-hl {
  display: inline-block;
  color: #181611;
  background: #0099FF;
  font-weight: 400;
  padding: 0 0.28em;
  margin: 0 0.04em;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  transform: rotate(-1.5deg);
  cursor: default;
  user-select: none;
}

/* Обертка карточки терминала с жесткой тенью 12px 12px */
.terminal-outer {
  filter: drop-shadow(12px 12px 0px rgba(0, 0, 0, 0.7));
}

.terminal-card {
  background: linear-gradient(180deg, #18191c 0%, #111214 100%);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

/* Полутоновый растр Deadlock */
.comic-dots-pattern {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0.06;
  background-image: radial-gradient(#5865F2 1.5px, transparent 1.5px);
  background-size: 9px 9px;
  background-position: 0 0;
  z-index: 1;
}

/* =========================================================
   КНОПКА В ЕДИНОМ СТИЛЕ САЙТА:
   Жесткая тень, при ховере растет, БЕЛЕЕТ, текст чернеет
   ========================================================= */
.comic-btn-wrap {
  position: relative;
  display: flex;
  filter: drop-shadow(5px 5px 0px rgba(0, 0, 0, 0.7));
  transition: filter 0.22s ease;
}

.comic-btn-wrap:hover {
  filter: drop-shadow(7px 7px 0px rgba(0, 0, 0, 0.85));
}

.comic-btn {
  background-color: var(--btn-bg);
  color: var(--btn-color);
  clip-path: polygon(0% 12%, 100% 0%, 100% 100%, 0% 88%);
  transform: rotate(-1.2deg);
  border: none;
  user-select: none;
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
              background-color 0.2s ease,
              color 0.2s ease;
}

.comic-btn:hover {
  transform: scale(1.04) rotate(-1.2deg);
  background-color: #FFFFFF !important;
  color: #0d0e10 !important;
}

.comic-btn:active {
  transform: scale(0.96) rotate(-1.2deg);
}
</style>
