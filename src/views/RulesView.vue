<script setup lang="ts">
import { ref, computed } from 'vue'
import { Shield, BookOpen, Anchor, MessageSquare, Scale, Search, X, AlertTriangle, ArrowUpRight } from 'lucide-vue-next'

const searchQuery = ref('')

interface RuleChapter {
  id: string
  title: string
  badge: string
  badgeColor: string
  icon: any
  rules: {
    num: string
    title: string
    text: string
    penalty?: string
    isWarning?: boolean
  }[]
}

const rulesData: RuleChapter[] = [
  {
    id: 'sec-general',
    title: '1. Основные положения',
    badge: 'БАЗА',
    badgeColor: '#0099FF',
    icon: Shield,
    rules: [
      {
        num: '1.1',
        title: 'Уважение и комфортная атмосфера',
        text: 'Сервер нацелен на полу-РП игру, эстетику стимпанка и свободную инженерию. Запрещены любые формы вредительства, целенаправленной токсичности, оскорблений на национальной почве и срыва чужого игрового процесса.',
        penalty: 'Варн / Мут от 2 часов / Бан до 3 дней'
      },
      {
        num: '1.2',
        title: 'Единство игрового профиля',
        text: 'Одному человеку разрешено играть строго с одного аккаунта. Вход привязан к вашей учетной записи Discord. Запрещено регистрировать твинки для обхода наказаний или передавать доступ третьим лицам.',
        penalty: 'Перманентный бан всех связанных аккаунтов'
      },
      {
        num: '1.3',
        title: 'Чит-клиенты и запрещенные модификации',
        text: 'Категорически запрещено использование X-Ray, FreeCam, Baritone, Fly, KillAura, автокликеров для прокачки ферм в AFK и любых модификаций, дающих нечестное преимущество над другими инженерами.',
        penalty: 'Бан навсегда без права амнистии',
        isWarning: true
      }
    ]
  },
  {
    id: 'sec-create',
    title: '2. Механизмы и фабрики Create',
    badge: 'ИНЖЕНЕРИЯ',
    badgeColor: '#FFCC00',
    icon: BookOpen,
    rules: [
      {
        num: '2.1',
        title: 'Оптимизация нагрузок и стабильность TPS',
        text: 'Мир рассчитывает физику сотен шестеренок. Запрещено оставлять вхолостую работающие циклические механизмы (вечные конвейеры, помпы без резервуаров). Выключайте неиспользуемые узлы через муфты (Clutch).',
        penalty: 'Предупреждение / Принудительный демонтаж узла'
      },
      {
        num: '2.2',
        title: 'Лаг-машины и деструктивные схемы',
        text: 'Намеренное создание конструкций, роняющих частоту тиков сервера ниже 18 TPS, приравнивается к вредительству. Если ваш завод вызывает локальные фризы, инженер обязан оптимизировать схему.',
        penalty: 'Удаление постройки / Бан до 7 дней',
        isWarning: true
      }
    ]
  },
  {
    id: 'sec-aeronautics',
    title: '3. Воздушный флот и бои',
    badge: 'АВИАЦИЯ',
    badgeColor: '#22C55E',
    icon: Anchor,
    rules: [
      {
        num: '3.1',
        title: 'Суверенитет воздушных судов',
        text: 'Каждый собранный дирижабль считается приватной территорией его создателя. Нахождение на чужом судне без приглашения капитана дает право экипажу устранить нарушителя на месте.',
        penalty: 'Игровой момент'
      },
      {
        num: '3.2',
        title: 'Правила воздушных сражений и пушек',
        text: 'Сражения дирижаблей разрешены только по взаимному согласию сторон либо в нейтральной зоне открытого неба (Warzone). Запрещено обстреливать мирные верфи, доки новичков и спавн.',
        penalty: 'Откат повреждений + Бан 3–14 дней'
      },
      {
        num: '3.3',
        title: 'Запрет таранов-камикадзе',
        text: 'Категорически запрещено собирать неуправляемые взрывные дирижабли с целью намеренно врезаться в чужие базы или мирные поселения.',
        penalty: 'Перманентный бан по железу',
        isWarning: true
      }
    ]
  },
  {
    id: 'sec-chat',
    title: '4. Текстовая и радиосвязь',
    badge: 'СВЯЗЬ',
    badgeColor: '#A855F7',
    icon: MessageSquare,
    rules: [
      {
        num: '4.1',
        title: 'Позиционный микрофон (Voice Chat)',
        text: 'Запрещено включать саундпады, громкие посторонние шумы, бассбусты и музыку в общественных местах. Нарушение личных границ и преследование игроков с микрофоном наказывается мутом.',
        penalty: 'Отключение голосового чата от 12 часов'
      },
      {
        num: '4.2',
        title: 'Общий чат и спам',
        text: 'Запрещен капс, частый флуд, неадекватное поведение и реклама сторонних серверов/услуг.',
        penalty: 'Мут от 1 часа / Бан при рекламе'
      }
    ]
  },
  {
    id: 'sec-justice',
    title: '5. Модерация и логирование',
    badge: 'БЕЗОПАСНОСТЬ',
    badgeColor: '#EF4444',
    icon: Scale,
    rules: [
      {
        num: '5.1',
        title: 'Аудит и подача тикетов',
        text: 'На сервере ведется поминутная история каждого блока, контейнера и выстрела. При инциденте зафиксируйте координаты и откройте тикет в Discord. Попытка обмануть состав модерации удваивает срок наказания.',
        penalty: 'Увеличение наказания x2'
      },
      {
        num: '5.2',
        title: 'Откаты и компенсация ущерба',
        text: 'Ущерб от гриферства или серверных сбоев восстанавливается администрацией в полном объеме (Rollback). Ресурсы возвращаются пострадавшей стороне.',
        penalty: 'Восстановление без потерь'
      }
    ]
  }
]

// ГЛОБАЛЬНЫЙ ПОИСК ПО ВСЕМУ ТЕКСТУ
const searchResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []

  const results: {
    chapterTitle: string
    ruleNum: string
    ruleTitle: string
    matchSnippet: string
    targetId: string
  }[] = []

  rulesData.forEach(chapter => {
    chapter.rules.forEach(rule => {
      const inTitle = rule.title.toLowerCase().includes(q)
      const inText = rule.text.toLowerCase().includes(q)
      const inNum = rule.num.includes(q)

      if (inTitle || inText || inNum) {
        let snippet = rule.text
        const idx = snippet.toLowerCase().indexOf(q)
        if (idx !== -1) {
          const start = Math.max(0, idx - 40)
          const end = Math.min(snippet.length, idx + q.length + 60)
          snippet = (start > 0 ? '...' : '') + snippet.slice(start, end) + (end < snippet.length ? '...' : '')
        }

        results.push({
          chapterTitle: chapter.title,
          ruleNum: rule.num,
          ruleTitle: rule.title,
          matchSnippet: snippet,
          targetId: `rule-${rule.num.replace('.', '-')}`
        })
      }
    })
  })

  return results
})

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) {
    const yOffset = -90
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
}

function selectSearchResult(targetId: string) {
  searchQuery.value = ''
  setTimeout(() => scrollTo(targetId), 50)
}
</script>

<template>
  <main class="w-full flex-1 flex flex-col items-center justify-start page-bg bg-[var(--bg-page)] text-[var(--text-main)] px-4 sm:px-8 lg:px-12 pt-28 pb-24 sm:pt-36">
    <!-- Расширенный контейнер до 1500px на весь монитор -->
    <div class="w-full max-w-[1500px]">

      <!-- Заголовок страницы -->
      <div class="text-center mb-10 sm:mb-12">
        <h1 class="font-heading text-3xl sm:text-4xl text-[var(--text-main)] tracking-tight mb-2">
          Свод <span class="word-hl">правил</span>
        </h1>
        <p class="text-xs sm:text-sm text-[var(--text-muted)] max-w-xl mx-auto">
          Официальный кодекс инженеров, пилотов и исследователей сервера Mistraly.
        </p>
      </div>

      <!-- ГЛОБАЛЬНЫЙ ПОИСК ПО ВСЕМУ ТЕКСТУ -->
      <div class="relative w-full max-w-3xl mx-auto mb-12">
        <div class="search-bar-wrap flex items-center bg-[#151619] border border-white/15 p-2.5 px-4 shadow-xl rounded-lg">
          <Search :size="18" class="text-zinc-400 shrink-0 mr-3 pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Быстрый поиск по всем правилам (например: 'читы', 'твинк', 'дирижабль', 'фермы')..."
            class="w-full bg-transparent text-sm font-mono text-white placeholder:text-zinc-500 outline-none"
          />
          <button
            v-if="searchQuery"
            @click="searchQuery = ''"
            class="text-zinc-400 hover:text-white transition p-1 cursor-pointer"
          >
            <X :size="16" />
          </button>
        </div>

        <!-- Выпадающие результаты поиска -->
        <div
          v-if="searchQuery.trim()"
          class="absolute left-0 right-0 top-full mt-2 bg-[#17181c] border border-white/15 p-3 shadow-2xl z-40 max-h-96 overflow-y-auto space-y-2 rounded-lg"
        >
          <div class="text-[11px] font-mono text-zinc-400 px-2 pb-1 border-b border-white/10 flex justify-between">
            <span>НАЙДЕНО СОВПАДЕНИЙ: {{ searchResults.length }}</span>
            <span>НАЖМИТЕ ДЛЯ ПЕРЕХОДА</span>
          </div>

          <div v-if="searchResults.length === 0" class="p-4 text-center text-xs font-mono text-zinc-500">
            По запросу «{{ searchQuery }}» ничего не найдено
          </div>

          <div
            v-for="res in searchResults"
            :key="res.targetId"
            @click="selectSearchResult(res.targetId)"
            class="p-2.5 bg-black/30 hover:bg-white/10 transition cursor-pointer border border-white/5 flex flex-col gap-1 text-left rounded"
          >
            <div class="flex items-center gap-2">
              <span class="font-heading font-black text-xs text-[#0099FF]">
                {{ res.ruleNum }} {{ res.ruleTitle }}
              </span>
              <span class="text-[10px] font-mono text-zinc-500">
                ({{ res.chapterTitle }})
              </span>
            </div>
            <p class="text-xs text-zinc-300 font-normal leading-relaxed">
              {{ res.matchSnippet }}
            </p>
          </div>
        </div>
      </div>

      <!-- ГЛАВНАЯ СЕТКА: Сайдбар слева + Широкая лента чтения справа -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        <!-- ЛЕВАЯ КОЛОНКА: Закрепленная навигация (Sticky TOC) -->
        <aside class="lg:col-span-4 xl:col-span-3 sticky top-24 hidden lg:flex flex-col gap-2">
          <div class="text-[11px] font-mono font-bold tracking-widest text-zinc-500 uppercase px-2 mb-1">
            РАЗДЕЛЫ КОДЕКСА
          </div>

          <div
            v-for="chap in rulesData"
            :key="chap.id"
            @click="scrollTo(chap.id)"
            class="toc-btn group p-3.5 flex items-center justify-between bg-[#151619] hover:bg-[#1a1b1f] border border-white/5 hover:border-white/15 transition-all duration-150 cursor-pointer rounded-lg border-l-4"
            :style="{ borderLeftColor: chap.badgeColor }"
          >
            <div class="flex items-center gap-3 min-w-0 pr-2">
              <component :is="chap.icon" :size="16" class="shrink-0" :style="{ color: chap.badgeColor }" />
              <span class="font-heading font-bold text-xs text-zinc-300 group-hover:text-white transition-colors truncate">
                {{ chap.title }}
              </span>
            </div>
            <ArrowUpRight :size="14" class="text-zinc-600 group-hover:text-zinc-300 transition shrink-0" />
          </div>

          <!-- Помощь / Тикеты -->
          <div class="mt-4 p-4 bg-[#151619] border border-white/10 rounded-lg text-left">
            <span class="font-heading font-black text-xs uppercase text-zinc-200 block mb-1">
              Нужна помощь?
            </span>
            <p class="text-xs text-zinc-400 leading-relaxed mb-3">
              Если вас загриферили или произошел спор, создайте тикет в Discord.
            </p>
            <a
              href="https://discord.gg"
              target="_blank"
              class="font-heading font-black text-xs uppercase tracking-wider text-[#0099FF] hover:underline inline-flex items-center gap-1"
            >
              Открыть тикет в Discord →
            </a>
          </div>
        </aside>

        <!-- ПРАВАЯ КОЛОНКА: Чистая полноразмерная лента чтения без ряби и эффектов -->
        <div class="lg:col-span-8 xl:col-span-9 flex flex-col gap-8">
          <section
            v-for="chap in rulesData"
            :key="chap.id"
            :id="chap.id"
            class="chapter-card p-6 sm:p-8 bg-[#141517] border border-white/10 rounded-xl text-left"
          >
            <!-- Заголовок раздела -->
            <div class="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
              <div class="flex items-center gap-3.5">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-white/10"
                  :style="{ backgroundColor: chap.badgeColor + '15', color: chap.badgeColor }"
                >
                  <component :is="chap.icon" :size="20" />
                </div>
                <h2 class="font-heading font-black text-xl sm:text-2xl text-white tracking-tight">
                  {{ chap.title }}
                </h2>
              </div>

              <span
                class="font-heading font-black text-[10px] uppercase tracking-wider px-2.5 py-1 text-black rounded"
                :style="{ backgroundColor: chap.badgeColor }"
              >
                {{ chap.badge }}
              </span>
            </div>

            <!-- Список правил внутри главы: чистый, комфортный для глаз текст -->
            <div class="space-y-4">
              <article
                v-for="rule in chap.rules"
                :key="rule.num"
                :id="`rule-${rule.num.replace('.', '-')}`"
                class="rule-box p-4 sm:p-5 rounded-lg border transition-colors duration-150"
                :class="rule.isWarning ? 'border-red-500/25 bg-red-500/[0.03]' : 'border-white/[0.06] bg-[#101113]/60'"
              >
                <!-- Заголовок правила -->
                <div class="flex items-start justify-between gap-3 mb-2.5">
                  <div class="flex items-center gap-2.5">
                    <span
                      class="font-mono text-xs font-bold px-2 py-0.5 rounded"
                      :class="rule.isWarning ? 'text-red-300 bg-red-500/20' : 'text-zinc-300 bg-white/10'"
                    >
                      § {{ rule.num }}
                    </span>
                    <h3 class="font-heading font-bold text-base sm:text-lg text-white tracking-tight">
                      {{ rule.title }}
                    </h3>
                  </div>

                  <AlertTriangle v-if="rule.isWarning" :size="17" class="text-red-400 shrink-0 mt-0.5" />
                </div>

                <!-- Текст правила: удобный для чтения размер шрифта и интервал -->
                <p class="text-sm sm:text-[15px] text-zinc-300 leading-relaxed font-normal mb-3.5">
                  {{ rule.text }}
                </p>

                <!-- Плашка наказания -->
                <div v-if="rule.penalty" class="flex flex-wrap items-center gap-2 text-xs font-mono pt-3 border-t border-white/[0.06]">
                  <span class="text-zinc-500 uppercase tracking-wider font-semibold">Наказание:</span>
                  <span
                    class="px-2 py-0.5 rounded text-[11px]"
                    :class="rule.isWarning ? 'bg-red-500/15 text-red-300 font-bold' : 'bg-white/5 text-zinc-300'"
                  >
                    {{ rule.penalty }}
                  </span>
                </div>
              </article>
            </div>
          </section>
        </div>

      </div>
    </div>
  </main>
</template>

<style scoped>
/* Фирменное выделение слова в заголовке */
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

/* Карточки глав: мягкая естественная тень */
.chapter-card {
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.5);
}

/* Кнопки сайдбара */
.toc-btn {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}
</style>
