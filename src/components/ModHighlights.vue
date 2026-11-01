<script setup lang="ts">

const features = [
  {
    id: 'bank',
    title: 'Банк и рынок',
    description: 'Своя валюта мист, банкоматы, счета и магазины игроков. На рынке видно, кто что продаёт и где искать лавку.',
    icon: '/images/wiki/chat/bank.png'
  },
  {
    id: 'death',
    title: 'Смерть без боли',
    description: 'Хотбар и броня остаются при вас, а остальные вещи ждут в могиле на месте гибели. Без беготни за выпавшим лутом.',
    icon: '/images/wiki/chat/skull.png'
  },
  {
    id: 'lod',
    title: 'Дальняя прорисовка',
    description: 'Наш мод Uno показывает мир далеко за обычной дальностью, поэтому горы и леса видно до самого горизонта.',
    icon: '/images/wiki/chat/global.png'
  },
  {
    id: 'polish',
    title: 'Новые механики',
    description: 'Своя добыча руды с заточкой на точиле, система достижений, инвентарь с темами оформления и слотами под артефакты.',
    icon: '/images/wiki/chat/pick.png'
  }
]
</script>

<template>
  <section class="w-full max-w-5xl px-4 pt-8 pb-2">
    <div class="section-head">
      <h2 class="section-title">Сердце <span class="word-hl">сервера</span></h2>
      <p class="section-sub">Ванилла, только лучше</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <article v-for="item in features" :key="item.id" class="mod mc-panel">
        <span class="mc-slot"><img :src="item.icon" alt="" class="w-8 h-8 [image-rendering:pixelated]" /></span>
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
  gap: 12px;
  padding: 12px;
}
.mod:hover {
  background: var(--panel-hi);
}
.mod-title {
  margin: 0 0 2px;
  font-size: 16px;
  line-height: 1.25;
}
.mod-text {
  margin: 0;
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.45;
}
</style>
