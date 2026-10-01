<script setup lang="ts">
interface ModItem {
  id: string
  title: string
  description: string
  icon: string
  accentColor: string
  iconBg: string
  clipPath: string
}

const mods: ModItem[] = [
  {
    id: 'create',
    title: 'Create',
    description: 'Вращательная энергия, кинетические механизмы, конвейеры и фабрики. Полная автоматизация без магии — только чистая эстетика шестерёнок.',
    icon: '/images/mods/create.webp',
    accentColor: '#E05929',
    iconBg: '#24150e',
    clipPath: 'polygon(0% 1.5%, 100% 0%, 99.5% 98.5%, 0.8% 100%)'
  },
  {
    id: 'aeronautics',
    title: 'Create Aeronautics',
    description: 'Полноценные дирижабли и воздушные суда. Стройте корабли из любых блоков, поднимайте их в небо, управляйте полётом с физикой столкновений и ветров.',
    icon: '/images/mods/aeronautics.webp',
    accentColor: '#0099FF',
    iconBg: '#0f1f2e',
    clipPath: 'polygon(0.5% 0%, 99% 2%, 100% 100%, 0% 98%)'
  },
  {
    id: 'nomansland',
    title: "No Man's Land",
    description: 'Мрачная дикая природа: густые первозданные леса, подлесок, реалистичные скалистые массивы и атмосферный эмбиент викторианской эпохи.',
    icon: '/images/mods/nomansland.webp',
    accentColor: '#22C55E',
    iconBg: '#152015',
    clipPath: 'polygon(0% 2.5%, 100% 0.5%, 98.5% 99%, 1.5% 97.5%)'
  },
  {
    id: 'origins',
    title: 'Кастомные Origins',
    description: 'Уникальные расы и классы, сбалансированные под воздушные бои и механизмы: от прирожденных механиков до крылатых авантюристов со своими баффами.',
    icon: '/images/mods/origins.webp',
    accentColor: '#A855F7',
    iconBg: '#1e1429',
    clipPath: 'polygon(1% 0%, 99.5% 1.8%, 99% 97.8%, 0% 100%)'
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
  <section class="w-full max-w-5xl px-4 py-10">
    <!-- Заголовок секции -->
    <div class="text-center mb-8">
      <h2 class="font-heading text-2xl sm:text-3xl text-[var(--text-main)] tracking-tight mb-2">
        Сердце <span class="word-hl">сервера</span>
      </h2>
      <p class="text-xs sm:text-sm text-[var(--text-muted)] max-w-2xl mx-auto">
        Мы собрали модульный сеттинг, где инженерия дополняет исследование мира и делает каждый полёт дирижабля осмысленным.
      </p>
    </div>

    <!-- Сетка 2x2 -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 lg:gap-x-10 lg:gap-y-7 pt-2">
      <div
        v-for="mod in mods"
        :key="mod.id"
        class="card-outer group transition-transform duration-200 hover:-translate-y-1"
      >
        <!-- Иконка с жесткой тенью -->
        <div class="popout-icon-box pointer-events-none">
          <div
            class="icon-hard-shadow relative z-10 w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-lg overflow-hidden flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-2"
            :style="{ backgroundColor: mod.iconBg }"
          >
            <img
              :src="mod.icon"
              :alt="mod.title"
              class="w-full h-full object-cover select-none"
              draggable="false"
              loading="lazy"
              @error="showFallback"
            />
            <div
              class="icon-fallback hidden w-full h-full items-center justify-center font-heading font-black text-base uppercase"
              :style="{ color: mod.accentColor }"
            >
              {{ mod.id.slice(0, 3) }}
            </div>
          </div>
        </div>

        <!--
          КАРТОЧКА:
          Никаких border, никаких box-shadow: inset!
          Только чистый градиентный фон, обрезаемый клипом.
        -->
        <div
          class="card-box p-6 sm:p-7 pt-5 flex flex-col justify-between h-full min-h-[190px]"
          :style="{ clipPath: mod.clipPath }"
        >
          <div>
            <!-- Верхняя строка: Название мода -->
            <div class="flex items-center mb-5 pl-16 sm:pl-20">
              <span
                class="mod-title-tag font-heading font-black text-base sm:text-lg tracking-tight px-3 py-1 inline-block text-white"
                :style="{ backgroundColor: mod.accentColor }"
              >
                {{ mod.title }}
              </span>
            </div>

            <!-- Описание мода -->
            <p class="text-xs sm:text-sm text-zinc-300/80 leading-relaxed font-normal">
              {{ mod.description }}
            </p>
          </div>

          <!-- Нижний индикатор цвета -->
          <div
            class="h-[3px] w-12 mt-5 opacity-60 transition-all duration-300 group-hover:w-20 group-hover:opacity-100"
            :style="{ backgroundColor: mod.accentColor }"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
/* Твой стиль плашки в заголовке */
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

/* Жесткая тень карточки */
.card-outer {
  position: relative;
  filter: drop-shadow(8px 8px 0px rgba(0, 0, 0, 0.45));
}

/*
 * 100% ЧИСТАЯ КАРТОЧКА:
 * Убраны ВСЕ тени и рамки внутри блока, вызывавшие белые полосы
 */
.card-box {
  background: linear-gradient(180deg, #18191c 0%, #111214 100%);
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

/* Вылет иконки за край */
.popout-icon-box {
  position: absolute;
  top: -16px;
  left: -12px;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
}

/*
 * Тень строго ПОД иконкой.
 * Раньше стояло box-shadow: 10px 10px — смещение вбок, из-за чего вокруг
 * иконки появлялся ореол. drop-shadow падает только вниз, без свечения.
 */
.icon-hard-shadow {
  filter: drop-shadow(0 5px 7px rgba(0, 0, 0, 0.6));
}

/* Плашка с названием мода */
.mod-title-tag {
  transform: rotate(-1.5deg);
  box-shadow: 3px 3px 0px rgba(0, 0, 0, 0.45);
  user-select: none;
}
</style>
