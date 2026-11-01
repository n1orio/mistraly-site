<script setup lang="ts">
interface ModItem {
  id: string
  title: string
  description: string
  icon: string
}

const mods: ModItem[] = [
  {
    id: 'create',
    title: 'Create',
    description: 'Инженерия и кинетические механизмы, автоматизация огромных фабрик и куча новых рецептов.',
    icon: '/images/mods/create.webp',
  },
  {
    id: 'aeronautics',
    title: 'Create Aeronautics',
    description: 'Полноценные дирижабли и воздушные суда. Стройте корабли из любых блоков, поднимайте их в небо, управляйте полётом с физикой столкновений и ветров.',
    icon: '/images/mods/aeronautics.webp',
  },
  {
    id: 'nomansland',
    title: "No Man's Land",
    description: 'Полная переработка генерации, новые модели и текстуры животных. Разнообразие механик и структур.',
    icon: '/images/mods/nomansland.webp',
  },
  {
    id: 'origins',
    title: 'Кастомные Origins',
    description: 'Новые классы и расы вписаные в лор и тематику сервера: Человек, потомок эльфов, потомок дворфов',
    icon: '/images/mods/origins.webp',
  }
]

function showFallback(e: Event) {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
  const fb = img.nextElementSibling as HTMLElement | null
  if (fb) fb.style.display = 'flex'
}
</script>

<template>
  <section class="w-full max-w-5xl px-4 pt-24 pb-16">
    <div class="section-head">
      <h2 class="section-title">Сердце <span class="word-hl">сервера</span></h2>
      <p class="section-sub">Надоела ванилла?</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <article v-for="mod in mods" :key="mod.id" class="mod mc-panel">
        <span class="mc-slot">
          <img
            :src="mod.icon"
            :alt="mod.title"
            class="w-14 h-14 object-cover select-none"
            draggable="false"
            loading="lazy"
            @error="showFallback"
          />
          <span class="icon-fallback hidden font-heading uppercase">{{ mod.id.slice(0, 3) }}</span>
        </span>
        <div class="min-w-0">
          <h3 class="mod-title">{{ mod.title }}</h3>
          <p class="mod-text">{{ mod.description }}</p>
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
