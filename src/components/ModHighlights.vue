<script setup lang="ts">
import { markRaw } from 'vue'
import { Globe, Shield, Sparkles, Wallet } from '../lib/icons'

const features = [
  {
    id: 'bank',
    title: 'Банк и рынок',
    description: 'Своя валюта мист, банкоматы, счета и магазины игроков. На рынке видно, кто что продаёт и где искать лавку.',
    icon: markRaw(Wallet)
  },
  {
    id: 'death',
    title: 'Смерть без боли',
    description: 'Хотбар и броня остаются при вас, а остальные вещи ждут в могиле на месте гибели. Без беготни за выпавшим лутом.',
    icon: markRaw(Shield)
  },
  {
    id: 'lod',
    title: 'Дальняя прорисовка',
    description: 'Наш мод Uno показывает мир далеко за обычной дальностью, поэтому горы и леса видно до самого горизонта.',
    icon: markRaw(Globe)
  },
  {
    id: 'polish',
    title: 'Новые механики',
    description: 'Своя добыча руды с заточкой на точиле, система достижений, инвентарь с темами оформления и слотами под артефакты.',
    icon: markRaw(Sparkles)
  }
]
</script>

<template>
  <section class="w-full max-w-5xl px-4 pt-24 pb-16">
    <div class="section-head">
      <h2 class="section-title">Сердце <span class="word-hl">сервера</span></h2>
      <p class="section-sub">Ванилла, только лучше</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <article v-for="item in features" :key="item.id" class="mod mc-panel">
        <span class="mc-slot"><component :is="item.icon" :size="36" /></span>
        <div class="min-w-0">
          <h3 class="mod-title">{{ item.title }}</h3>
          <p class="mod-text">{{ item.description }}</p>
        </div>
      </article>
    </div>
  </section>
</template>


<style scoped>
.mod {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  padding: 20px;
}
.mod:hover {
  background: var(--panel-hi);
}
.mod .mc-slot {
}
.mod-title {
  margin: 0 0 6px;
  font-size: 24px;
  line-height: 1.25;
}
.mod-text {
  margin: 0;
  color: var(--text-muted);
  font-size: 16px;
  line-height: 1.45;
}
</style>
