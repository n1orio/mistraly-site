<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axios from 'axios'
import { MessageCircle } from 'lucide-vue-next'
const route = useRoute()
const router = useRouter()
const errorMessage = ref('')
const success = ref(false)
const clientId = import.meta.env.VITE_DISCORD_CLIENT_ID || ''

// nonce из лаунчера (или state от Discord после редиректа)
const launcherNonce = (route.query.nonce as string) || (route.query.state as string) || ''

const isPurchase = route.query.purchase === '1'

function startDiscordAuth() {
  if (!clientId) { errorMessage.value = 'Discord авторизация не настроена на сервере.'; return }
  const redirect = encodeURIComponent(`${location.origin}/auth/discord${isPurchase ? '?purchase=1' : ''}`)
  const state = launcherNonce
  location.href = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirect}&response_type=code&scope=identify${state ? `&state=${state}` : ''}`
}

onMounted(async () => {
  const code = route.query.code as string | undefined
  if (!code) {
    // Если есть nonce и нет code — показываем кнопку для начала OAuth
    return
  }
  // state, который вернул Discord = исходный nonce (от лаунчера)
  const nonce = (route.query.state as string) || launcherNonce
  try {
    const res = await axios.post('http://localhost:3001/api/auth/discord', { code, nonce: nonce || undefined })
    if (res.data.success) {
      const d = res.data.data
      localStorage.setItem('mistraly_token', d.token)
      localStorage.setItem('mistraly_user', JSON.stringify(d.user))
      localStorage.setItem('mistraly_discord', JSON.stringify(d.discord))
      // Убираем прежние ключи, сохраняя уже выданную сессию
      localStorage.removeItem('breeze_token')
      localStorage.removeItem('breeze_user')
      localStorage.removeItem('breeze_discord')
      success.value = true
      // Закрываем окно если авторизация шла из лаунчера (через polling)
      if (nonce) { setTimeout(() => window.close(), 1000) } else if (isPurchase) { setTimeout(() => router.push('/?purchase=1'), 1000) } else { setTimeout(() => router.push('/profile'), 1500) }
    } else {
      errorMessage.value = res.data.error || 'Ошибка авторизации'
    }
  } catch {
    errorMessage.value = 'Не удалось связать Discord с аккаунтом'
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
        <h2 class="font-heading text-xl font-bold text-[var(--text-main)] mb-2">{{ success ? 'Успешно!' : 'Авторизация в экосистеме Mistraly' }}</h2>
        <p class="text-sm text-[var(--text-muted)] mb-6">{{ success ? 'Можете закрыть это окно.' : 'Мы используем Discord для мгновенного входа без паролей и защиты сервера.' }}</p>
        <button v-if="!success" @click="startDiscordAuth" class="w-full px-7 py-3 rounded-xl font-bold text-sm text-white bg-[#5865F2] hover:bg-[#4752C4] transition shadow-lg shadow-[#5865F2]/25 flex items-center justify-center gap-2 cursor-pointer">
          <MessageCircle :size="16" /> Войти через Discord
        </button>
        <p v-if="errorMessage" class="text-xs mt-4 text-[#FB7185]">{{ errorMessage }}</p>
      </section>
    </div>
  </div>
</template>