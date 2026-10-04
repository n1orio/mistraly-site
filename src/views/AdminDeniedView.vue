<script setup lang="ts">
import { ShieldAlert } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'

/**
 * Отказ в доступе к админке.
 *
 * Отдельная страница, а не редирект на корень: на admin.mistraly.net
 * корень — это сама админка, поэтому редирект не-админа обратно на '/'
 * зацикливал бы гард requiresAdmin.
 */
const auth = useAuthStore()
</script>

<template>
  <div class="denied">
    <ShieldAlert :size="40" />
    <h1>Доступ закрыт</h1>
    <p>
      Этот раздел доступен только администратору. Вы вошли как
      <strong v-if="auth.user">{{ auth.user.username }}</strong>
      <template v-else>гость</template>, а роль администратора не назначена.
    </p>
    <a href="https://mistraly.net">На главную</a>
  </div>
</template>

<style scoped>
.denied {
  min-height: 70vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 40px 20px;
  text-align: center;
}
h1 {
  margin: 0;
  font-size: 24px;
}
p {
  margin: 0;
  max-width: 460px;
  opacity: 0.75;
  font-size: 14px;
  line-height: 1.5;
}
a {
  margin-top: 8px;
  padding: 10px 18px;
  border-radius: 8px;
  border: 1px solid rgba(128, 128, 128, 0.35);
  background: rgba(128, 128, 128, 0.12);
  color: inherit;
  text-decoration: none;
  font-size: 14px;
}
a:hover {
  background: rgba(128, 128, 128, 0.22);
}
</style>
