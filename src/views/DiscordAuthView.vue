<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MessageCircle } from 'lucide-vue-next'
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

// nonce из лаунчера (или state, который Discord вернул на редиректе)
const launcherNonce = computed(() => (route.query.nonce as string) || (route.query.state as string) || '')
const isPurchase = computed(() => route.query.purchase === '1')
const redirectAfter = computed(() => (route.query.redirect as string) || '')

/** Куда возвращаться после успешного входа. */
const destination = computed(() => {
  if (launcherNonce.value) return ''
  if (redirectAfter.value) return redirectAfter.value
  if (isPurchase.value) return '/?purchase=1'
  return auth.isAdmin ? '/profile' : '/profile'
})

function startDiscordAuth() {
  if (!clientId) {
    errorMessage_.value = 'Discord авторизация не настроена на сервере.'
    return
  }
  const redirect = encodeURIComponent(`${location.origin}/auth/discord`)
  // state возвращается от Discord как query-параметр state — по нему лаунчер
  // сопоставляет сессию, а сайт использует его для возврата на нужную страницу.
  const state = launcherNonce.value || undefined
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

    // Окно лаунчера: он заберёт токен через /auth/poll по nonce.
    if (launcherNonce.value) {
      setTimeout(() => window.close(), 1000)
      return
    }

    // Покупка началась до входа — сразу вернёмся к ней.
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
  <div class="w-full flex-1 flex items-center justify-center px-4 py-12">
    <div class="w-full max-w-md">
      <section class="bg-[var(--bg-card)] border-[var(--border-color)] rounded-2xl p-6 sm:p-7 text-center">
        <div class="w-12 h-12 rounded-xl bg-[#5865F2]/10 text-[#5865F2] flex items-center justify-center mx-auto mb-5">
          <MessageCircle :size="24" />
        </div>
        <h2 class="font-heading text-xl font-bold text-[var(--text-main)] mb-2">
          {{ success ? 'Успешно!' : 'Авторизация в экосистеме Mistraly' }}
        </h2>
        <p class="text-sm text-[var(--text-muted)] mb-6">
          {{ success
            ? 'Можете закрыть это окно.'
            : 'Мы используем Discord для мгновенного входа без паролей и защиты сервера.' }}
        </p>
        <button
          v-if="!success"
          :disabled="auth.loading"
          @click="startDiscordAuth"
          class="w-full px-7 py-3 rounded-xl font-bold text-sm text-white bg-[#5865F2] hover:bg-[#4752C4] transition shadow-lg shadow-[#5865F2]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
        >
          <MessageCircle :size="16" /> Войти через Discord
        </button>
        <p v-if="errorMessage_" class="text-xs mt-4 text-[#FB7185]">{{ errorMessage_ }}</p>
      </section>
    </div>
  </div>
</template>