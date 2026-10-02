<script setup lang="ts">
interface ModItem {
  id: string
  title: string
  description: string
  icon: string
  accentColor: string
  iconBg: string
  clipPath: string
  hoverTilt: string
}

const mods: ModItem[] = [
  {
    id: 'create',
    title: 'Create',
    description: 'Инженерия и кинетические механизмы, автоматизация огромных фабрик и куча новых рецептов.',
    icon: '/images/mods/create.webp',
    accentColor: '#E05929',
    iconBg: '#24150e',
    clipPath: 'polygon(0% 1.5%, 100% 0%, 99.5% 98.5%, 0.8% 100%)',
    hoverTilt: '-rotate-1'
  },
  {
    id: 'aeronautics',
    title: 'Create Aeronautics',
    description: 'Полноценные дирижабли и воздушные суда. Стройте корабли из любых блоков, поднимайте их в небо, управляйте полётом с физикой столкновений и ветров.',
    icon: '/images/mods/aeronautics.webp',
    accentColor: '#0099FF',
    iconBg: '#0f1f2e',
    clipPath: 'polygon(0.5% 0%, 99% 2%, 100% 100%, 0% 98%)',
    hoverTilt: 'rotate-1'
  },
  {
    id: 'nomansland',
    title: "No Man's Land",
    description: 'Полная переработка генерации, новые модели и текстуры животных. Разнообразие механик и структур.',
    icon: '/images/mods/nomansland.webp',
    accentColor: '#22C55E',
    iconBg: '#152015',
    clipPath: 'polygon(0% 2.5%, 100% 0.5%, 98.5% 99%, 1.5% 97.5%)',
    hoverTilt: '-rotate-1'
  },
  {
    id: 'origins',
    title: 'Кастомные Origins',
    description: 'Новые классы и расы вписаные в лор и тематику сервера: Человек, потомок эльфов, потомок дворфов',
    icon: '/images/mods/origins.webp',
    accentColor: '#A855F7',
    iconBg: '#1e1429',
    clipPath: 'polygon(1% 0%, 99.5% 1.8%, 99% 97.8%, 0% 100%)',
    hoverTilt: 'rotate-1'
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
  <section class="w-full max-w-5xl px-4 py-24">
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
    <div class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12 lg:gap-x-10 lg:gap-y-14 pt-6">
      <div
        v-for="mod in mods"
        :key="mod.id"
        class="card-outer group cursor-pointer"
        :class="mod.hoverTilt"
      >
        <!-- Иконка с жесткой тенью и комиксным отскоком -->
        <div class="popout-icon-box pointer-events-none">
          <div
            class="icon-hard-shadow relative z-10 w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-lg overflow-hidden flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3 group-hover:-translate-y-1"
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

        <!-- КАРТОЧКА: с комиксным растром при ховере -->
        <div
          class="card-box p-6 sm:p-7 pt-5 flex flex-col justify-between h-full min-h-[190px] relative overflow-hidden"
          :style="{ clipPath: mod.clipPath, '--accent': mod.accentColor }"
        >
          <!-- Точечный комиксный полутоновый растр (Ben-Day dots), всплывающий при hover -->
          <div class="comic-dots-pattern" aria-hidden="true" />

          <div class="relative z-10">
            <!-- Верхняя строка: Название мода (активный прыжок при ховере) -->
            <div class="flex items-center mb-5 pl-16 sm:pl-20">
              <span
                class="mod-title-tag font-heading font-black text-base sm:text-lg tracking-tight px-3 py-1 inline-block text-white"
                :style="{ backgroundColor: mod.accentColor }"
              >
                {{ mod.title }}
              </span>
            </div>

            <!-- Описание мода -->
            <p class="text-xs sm:text-sm text-zinc-300/80 leading-relaxed font-normal transition-colors duration-200 group-hover:text-zinc-100">
              {{ mod.description }}
            </p>
          </div>

          <!-- Нижний индикатор цвета: растягивается как ударная линия комикса -->
          <div
            class="h-[3px] w-12 mt-5 opacity-60 transition-all duration-300 ease-out group-hover:w-full group-hover:opacity-100 relative z-10"
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

/*
 * КОМИКСНЫЙ POP-UP ЭФФЕКТ ДЛЯ ВСЕЙ КАРТОЧКИ:
 * При наведении карточка выскакивает навстречу (-4px по осям),
 * а тень становится глубже, шире и контрастнее (14px).
 */
.card-outer {
  position: relative;
  filter: drop-shadow(8px 8px 0px rgba(0, 0, 0, 0.45));
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
              filter 0.22s ease;
}

.card-outer:hover {
  transform: translate(-3px, -4px);
  filter: drop-shadow(13px 13px 0px rgba(0, 0, 0, 0.65));
}

/* Базовый чистый бокс без рамок */
.card-box {
  background: linear-gradient(180deg, #18191c 0%, #111214 100%);
  border: none !important;
  outline: none !important;
  box-shadow: none !important;
}

/*
 * КОМИКСНЫЙ ТОЧЕЧНЫЙ РАСТР (Ben-Day Dots):
 * Проявляется при наведении с легким акцентным оттенком мода
 */
.comic-dots-pattern {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  background-image: radial-gradient(var(--accent) 1.5px, transparent 1.5px);
  background-size: 9px 9px;
  background-position: 0 0;
  transition: opacity 0.25s ease;
  z-index: 1;
}

.group:hover .comic-dots-pattern {
  opacity: 0.12; /* Едва заметный стильный типографский растр */
}

/* Вылет иконки за край */
.popout-icon-box {
  position: absolute;
  top: -16px;
  left: -12px;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Тень иконки усиливается при ховере */
.icon-hard-shadow {
  filter: drop-shadow(0 5px 7px rgba(0, 0, 0, 0.6));
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
              filter 0.25s ease;
}

.group:hover .icon-hard-shadow {
  filter: drop-shadow(4px 8px 10px rgba(0, 0, 0, 0.85));
}

/* Плашка с названием мода: комиксный отскок и доворот */
.mod-title-tag {
  transform: rotate(-1.5deg);
  box-shadow: 3px 3px 0px rgba(0, 0, 0, 0.45);
  user-select: none;
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.22s ease;
}

.group:hover .mod-title-tag {
  transform: scale(1.05) rotate(-3deg);
  box-shadow: 4px 4px 0px rgba(0, 0, 0, 0.8);
}
</style>
