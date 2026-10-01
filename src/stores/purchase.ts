import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import axios from 'axios'

export const usePurchaseStore = defineStore('purchase', () => {
  const open = ref(false)
  const step = ref(1)
  const nickname = ref('')
  const checking = ref(false)
  const error = ref('')
  const discordUsername = ref('')
  const price = ref('350 ₽')
  const isNicknameValid = computed(() => /^[A-Za-z0-9_]{3,16}$/.test(nickname.value))
  const orderDone = ref(false)
  function show() {
    open.value = true;
    error.value = '';
    orderDone.value = false;
    if (localStorage.getItem('mistraly_token') || localStorage.getItem('breeze_token')) {
      step.value = 2
    } else {
      step.value = 1
    }
  }
  function close() { open.value = false }
  function setDiscord(name: string) { discordUsername.value = name; step.value = 2 }
  async function checkNickname() {
    checking.value = true; error.value = ''
    if (!isNicknameValid.value) {
      error.value = 'Используйте 3–16 латинских букв, цифр или _.'
      checking.value = false
      return false
    }
    try {
      const res = await axios.get(`http://localhost:3001/api/user/check-nickname?nickname=${encodeURIComponent(nickname.value)}`)
      if (res.data?.taken) {
        error.value = 'Этот никнейм уже занят.'
        checking.value = false
        return false
      }
    } catch {
      // Если сервер не отвечает — пропускаем проверку
    }
    step.value = 3
    checking.value = false
    return true
  }
  function confirmOrder() { orderDone.value = true }
  function reset() { step.value = 1; nickname.value = ''; error.value = ''; orderDone.value = false }
  return { open, step, nickname, checking, error, discordUsername, price, isNicknameValid, orderDone, show, close, setDiscord, checkNickname, confirmOrder, reset }
})
