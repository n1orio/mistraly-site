<script setup lang="ts">
import { useRouter } from 'vue-router'
import { usePurchaseStore } from '../stores/purchase'
import { useAuthStore } from '../stores/auth'
const purchase = usePurchaseStore()
const auth = useAuthStore()
const router = useRouter()

/**
 * Шаг 1 — вход. Раньше кнопка «Войти через Discord» открывала окно покупки
 * проходки, а уже вошедшему снова предлагала войти.
 */
function login() {
  router.push({ path: '/auth/discord', query: { redirect: '/#stages' } })
}

</script>

<template>
  <section id="stages" class="w-full max-w-5xl px-4 pt-8 pb-24 scroll-mt-20">
    <ol class="steps">
      <li class="step mc-panel">
        <div class="step-top">
          <span class="mc-slot step-num">1</span>
          <div>
            <span class="mc-tag">Этап: вход</span>
            <p class="step-kick">Первым делом</p>
          </div>
        </div>
        <h3 class="step-title">Привязка Discord</h3>
        <p class="step-text">Вход на сервер Mistraly работает только через Discord. Аккаунт создаётся мгновенно.</p>
        <button v-if="!auth.isAuthenticated" class="mc-btn mc-btn--discord mc-btn--sm" @click="login">
          Войти через Discord
        </button>
        <span v-else class="mc-tag mc-tag--ok self-start">
          ✓ Вы вошли{{ auth.user?.username ? ' как ' + auth.user.username : '' }}
        </span>
      </li>

      <li class="step mc-panel">
        <div class="step-top">
          <span class="mc-slot step-num">2</span>
          <div>
            <span class="mc-tag">Этап: доступ</span>
            <p class="step-kick">Билет на борт</p>
          </div>
        </div>
        <h3 class="step-title">Покупка проходки</h3>
        <p class="step-text">Покупка Mistraly Pass навсегда открывает доступ к серверу и защищает от ботов и гриферов.</p>
        <button class="mc-btn mc-btn--sm" @click="purchase.showPass()">Купить проходку →</button>
      </li>

      <li class="step mc-panel">
        <div class="step-top">
          <span class="mc-slot step-num">3</span>
          <div>
            <span class="mc-tag">Этап: в полёт</span>
            <p class="step-kick">Финал подготовки</p>
          </div>
        </div>
        <h3 class="step-title">Mistraly Launcher</h3>
        <p class="step-text">Скачайте лаунчер — он сам поставит Minecraft, NeoForge, Java и сборку и сразу зайдёт на сервер.</p>
        <router-link to="/download" class="mc-btn mc-btn--sm">Скачать лаунчер</router-link>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.steps {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 30px;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
}
.step {
  position: relative;
  display: flex;
  flex-direction: column;
  padding: 20px;
}
/* Пунктир из блоков между этапами, как связи в дереве достижений. */
.step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 56px;
  left: 100%;
  width: 30px;
  height: 6px;
  margin-left: 3px;
  background: repeating-linear-gradient(90deg, var(--sky) 0 6px, transparent 6px 12px);
}
.step-top {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}
.step-num {
  font-family: 'Minecraft Ten', 'Noto Sans', sans-serif;
  font-size:32px;
  color: var(--sky);
}
.step-kick {
  margin: 6px 0 0;
  color: var(--text-muted);
  font-size: 15px;
  line-height: 1.2;
}
.step-title {
  margin: 0 0 8px;
  font-size: 24px;
}
.step-text {
  flex: 1;
  margin: 0 0 16px;
  color: var(--text-muted);
  font-size: 16px;
  line-height: 1.45;
}
.step .mc-btn {
  align-self: flex-start;
}
@media (max-width: 860px) {
  .steps {
    grid-template-columns: 1fr;
  }
  .step:not(:last-child)::after {
    top: 100%;
    left: 46px;
    width: 6px;
    height: 30px;
    margin: 3px 0 0;
    background: repeating-linear-gradient(180deg, var(--sky) 0 6px, transparent 6px 12px);
  }
}
</style>
