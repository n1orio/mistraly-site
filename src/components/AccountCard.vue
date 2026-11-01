<script setup lang="ts">
import { computed } from 'vue'
import { accountLook } from '../lib/accountColors'

/** Карточка счёта как BankUi.card в игре: красители, золото с бликом и глитч. */
const props = defineProps<{
  name: string
  description?: string
  color: number
  tag?: string
  balance?: number
  selected?: boolean
}>()

const look = computed(() => accountLook(props.color))
</script>

<template>
  <div class="acc" :class="[`acc--${look.kind}`, { 'is-on': selected }]" :style="{ '--acc': look.bar, '--acc-a': look.tint }">
    <div class="acc-text">
      <span class="acc-line">
        <b class="acc-name" :data-text="name" :style="look.kind === 'dye' ? { color: look.text } : undefined">{{ name }}</b>
        <small v-if="tag" class="acc-tag">{{ tag }}</small>
      </span>
      <small v-if="description" class="acc-desc">{{ description }}</small>
    </div>
    <span v-if="balance !== undefined" class="acc-money">
      <img src="/images/wiki/mist.png" alt="" />{{ balance.toLocaleString('ru-RU') }}
    </span>
  </div>
</template>

<style>
.acc {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  margin-bottom: 4px;
  padding: 7px 10px 7px 12px;
  overflow: hidden;
  background: var(--panel);
  text-align: left;
}
/* Полоса слева, как в игре. */
.acc::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: var(--acc);
}
.acc.is-on {
  box-shadow: inset 0 0 0 2px #fff;
}
.acc-text {
  position: relative;
  min-width: 0;
}
.acc-line {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
}
.acc-name {
  position: relative;
  font-weight: 700;
}
.acc-tag {
  color: var(--text-sub);
  font-size: 13px;
}
.acc-desc {
  display: block;
  color: var(--text-muted);
  font-size: 13px;
}
.acc-money {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: none;
  color: #32b3ff;
  font-weight: 700;
}
.acc-money img {
  width: 16px;
  height: 16px;
  image-rendering: pixelated;
}

/* Краситель: цвет выцветает от полосы вправо на первые 120 пикселей. */
.acc--dye {
  background: linear-gradient(90deg, var(--acc-a), transparent 180px), var(--panel);
}

/* Золото: перелив по карточке, блик раз в несколько секунд, полоса течёт сверху вниз. */
.acc--gold {
  background: linear-gradient(90deg, rgba(184, 134, 11, 0.16), rgba(255, 216, 74, 0.16), rgba(255, 246, 194, 0.16), rgba(255, 216, 74, 0.16), rgba(184, 134, 11, 0.16)) 0 0 / 200% 100%, var(--panel);
  outline: 1px solid rgba(255, 216, 74, 0.45);
  outline-offset: -1px;
  animation: acc-flow 4s linear infinite;
}
.acc--gold::before {
  background: linear-gradient(180deg, #b8860b, #ffd84a, #fff6c2, #ffd84a, #b8860b) 0 0 / 100% 200%;
  animation: acc-stripe 4s linear infinite;
}
.acc--gold::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: -30px;
  width: 18px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  animation: acc-shine 3.2s linear infinite;
}
.acc--gold .acc-name {
  background: linear-gradient(90deg, #d4a93e, #ffe27a, #fff9da, #ffe27a, #d4a93e) 0 0 / 200% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: acc-flow 4s linear infinite;
}

/* Глитч: красно-синие края расходятся, имя двоится, полоса иногда рвётся. */
.acc--glitch {
  background: linear-gradient(90deg, rgba(255, 42, 60, 0.16), transparent 120px, transparent calc(100% - 120px), rgba(0, 160, 255, 0.16)), #14151f;
  box-shadow: inset 2px 0 0 rgba(255, 42, 60, 0.7), inset -2px 0 0 rgba(0, 160, 255, 0.7), inset 0 1px 0 rgba(255, 42, 60, 0.7), inset 0 -1px 0 rgba(0, 160, 255, 0.7);
}
.acc--glitch::before {
  width: 3px;
  background: #fff;
  box-shadow: 2px 0 0 #00a0ff;
}
.acc--glitch::after {
  content: '';
  position: absolute;
  left: 3px;
  right: 0;
  top: 40%;
  height: 2px;
  background: rgba(255, 42, 60, 0.45);
  box-shadow: 8px 1px 0 rgba(0, 160, 255, 0.45);
  opacity: 0;
  animation: acc-tear 3s steps(1, end) infinite;
}
.acc--glitch .acc-name {
  color: #fff;
  animation: acc-split 1.8s steps(1, end) infinite;
}
.acc.is-on.acc--glitch {
  box-shadow: inset 0 0 0 2px #fff;
}
@keyframes acc-flow {
  to {
    background-position: -200% 0, 0 0;
  }
}
@keyframes acc-stripe {
  to {
    background-position: 0 -200%;
  }
}
@keyframes acc-shine {
  to {
    left: calc(100% + 30px);
  }
}
@keyframes acc-tear {
  0%, 62%, 70%, 100% {
    opacity: 0;
    top: 40%;
  }
  63%, 66% {
    opacity: 1;
    top: 62%;
  }
}
@keyframes acc-split {
  0%, 100% {
    text-shadow: -1px 0 0 #ff2a3c, 1px 0 0 #00a0ff;
  }
  50% {
    text-shadow: -2px 0 0 #ff2a3c, 2px 0 0 #00a0ff;
  }
  92% {
    text-shadow: -3px 0 0 #ff2a3c, 3px 0 0 #00a0ff;
  }
}
@media (prefers-reduced-motion: reduce) {
  .acc, .acc::before, .acc::after, .acc-name {
    animation: none !important;
  }
}
</style>
