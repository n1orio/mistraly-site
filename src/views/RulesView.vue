<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Search,
  X,
  Link as LinkIcon,
  Check,
  ArrowUpRight,
  HelpCircle,
  Clock
} from 'lucide-vue-next'
import { rulesData, rulesMeta } from '../data/rules'

const searchQuery = ref('')
const copiedRuleId = ref<string | null>(null)
const currentHash = ref('')

// Глобальный поиск
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
          targetId: rule.anchor
        })
      }
    })
  })

  return results
})

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) {
    const yOffset = -100
    const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset
    window.scrollTo({ top: y, behavior: 'smooth' })
  }
}

// Копирование ссылки
function copyRuleLink(num: string) {
  const ruleId = `rule-${num.replace(/\./g, '-')}`
  const url = `${window.location.origin}${window.location.pathname}#${ruleId}`

  navigator.clipboard.writeText(url).then(() => {
    copiedRuleId.value = ruleId
    currentHash.value = ruleId
    window.history.replaceState(null, '', `#${ruleId}`)
    setTimeout(() => {
      if (copiedRuleId.value === ruleId) {
        copiedRuleId.value = null
      }
    }, 2000)
  })
}

function selectSearchResult(targetId: string) {
  searchQuery.value = ''
  currentHash.value = targetId
  window.history.replaceState(null, '', `#${targetId}`)
  setTimeout(() => scrollTo(targetId), 50)
}

function handleHashChange() {
  const hash = window.location.hash.replace('#', '')
  if (hash) {
    currentHash.value = hash
    setTimeout(() => scrollTo(hash), 150)
  }
}

onMounted(() => {
  handleHashChange()
  window.addEventListener('hashchange', handleHashChange)
})

onUnmounted(() => {
  window.removeEventListener('hashchange', handleHashChange)
})
</script>

<template>
  <main class="w-full flex-1 flex flex-col items-center justify-start page-bg bg-[var(--bg-page)] text-[var(--text-main)] px-4 sm:px-6 lg:px-8 pt-28 pb-28 sm:pt-36">
    <div class="w-full max-w-[1500px]">

      <!-- Заголовок страницы -->
      <div class="text-center mb-10 sm:mb-12">
        <h1 class="font-heading text-3xl sm:text-4xl text-[var(--text-main)] tracking-tight mb-2">
          Свод <span class="word-hl">правил</span>
        </h1>
        <p class="text-xs sm:text-sm text-[var(--text-muted)] max-w-lg mx-auto">
          {{ rulesMeta.subtitle }}
        </p>
      </div>

      <!-- ГЛОБАЛЬНЫЙ ПОИСК -->
      <div class="relative w-full max-w-2xl mx-auto mb-10">
        <div class="search-bar-wrap flex items-center bg-[#151619] border border-white/15 p-2.5 px-4 shadow-xl rounded-lg">
          <Search :size="18" class="text-zinc-400 shrink-0 mr-3 pointer-events-none" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Быстрый поиск по всем правилам (читы, твинк, дирижабль, чат)..."
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

        <!-- Выпадающий список совпадений -->
        <div
          v-if="searchQuery.trim()"
          class="absolute left-0 right-0 top-full mt-2 bg-[#17181c] border border-white/15 p-3 shadow-2xl z-40 max-h-96 overflow-y-auto space-y-2 rounded-lg text-left"
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
            class="p-2.5 bg-black/30 hover:bg-white/10 transition cursor-pointer border border-white/5 flex flex-col gap-1 rounded"
          >
            <div class="flex items-center gap-2">
              <span class="font-heading font-black text-xs text-[#0099FF]">
                {{ res.ruleNum }} {{ res.ruleTitle }}
              </span>
              <span class="text-[10px] font-mono text-zinc-500">
                ({{ res.chapterTitle }})
              </span>
            </div>
            <p class="text-xs text-zinc-300 leading-relaxed">
              {{ res.matchSnippet }}
            </p>
          </div>
        </div>
      </div>

      <!--
        ИДЕАЛЬНО СБАЛАНСИРОВАННАЯ ТРЁХКОЛОНОЧНАЯ СЕТКА:
        Слева сайдбар (260px) + ПО ЦЕНТРУ ПРАВИЛА (max-w-3xl) + Справа балансир (260px)
        В результате центральный блок находится ТОЧНО по центру экрана!
      -->
      <div class="w-full flex justify-center items-start gap-8 relative">

        <!-- ЛЕВАЯ ПАНЕЛЬ: Оглавление глав (Sticky, 260px) -->
        <aside class="hidden xl:flex flex-col gap-2 w-64 shrink-0 sticky top-24 select-none">
          <div class="text-[11px] font-mono font-bold tracking-widest text-zinc-500 uppercase px-2 mb-1 text-left">
            РАЗДЕЛЫ КОДЕКСА
          </div>

          <div
            v-for="chap in rulesData"
            :key="chap.id"
            @click="scrollTo(chap.id)"
            class="toc-btn group p-3 flex items-center justify-between bg-[#151619] hover:bg-[#1a1b1f] border border-white/5 hover:border-white/15 transition-all duration-150 cursor-pointer rounded-lg border-l-4"
            :style="{ borderLeftColor: chap.badgeColor }"
          >
            <div class="flex items-center gap-2.5 min-w-0 pr-2">
              <component :is="chap.icon" :size="15" class="shrink-0" :style="{ color: chap.badgeColor }" />
              <span class="font-heading font-bold text-xs text-zinc-300 group-hover:text-white transition-colors truncate">
                {{ chap.title }}
              </span>
            </div>
            <ArrowUpRight :size="13" class="text-zinc-600 group-hover:text-zinc-300 transition shrink-0" />
          </div>
        </aside>

        <!-- ЦЕНТРАЛЬНЫЙ БЛОК: Читательская лента строго по центру экрана -->
        <div class="w-full max-w-3xl flex-1 flex flex-col gap-8">
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

            <!-- Список правил в главе -->
            <div class="space-y-4">
              <article
                v-for="rule in chap.rules"
                :key="rule.num"
                :id="rule.anchor"
                class="rule-box p-4 sm:p-5 rounded-lg border transition-all duration-300 relative group"
                :class="[
                  rule.isWarning ? 'border-red-500/25 bg-red-500/[0.03]' : 'border-white/[0.06] bg-[#101113]/70',
                  currentHash === rule.anchor ? 'is-target-highlight' : ''
                ]"
              >
                <!-- Заголовок правила + кнопка копирования ссылки -->
                <div class="flex items-start justify-between gap-3 mb-2.5">
                  <div class="flex items-center gap-2.5 flex-wrap">
                    <span
                      class="font-mono text-xs font-bold px-2 py-0.5 rounded select-all"
                      :class="rule.isWarning ? 'text-red-300 bg-red-500/20' : 'text-zinc-300 bg-white/10'"
                    >
                      § {{ rule.num }}
                    </span>
                    <h3 class="font-heading font-bold text-base sm:text-lg text-white tracking-tight">
                      {{ rule.title }}
                    </h3>
                  </div>

                  <!-- КНОПКА СКОПИРОВАТЬ ССЫЛКУ -->
                  <button
                    type="button"
                    @click="copyRuleLink(rule.num)"
                    class="copy-link-btn flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono transition cursor-pointer select-none"
                    :class="copiedRuleId === rule.anchor
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/15 border border-white/10'"
                    :title="'Скопировать ссылку на правило ' + rule.num"
                  >
                    <template v-if="copiedRuleId === rule.anchor">
                      <Check :size="13" class="text-emerald-400" />
                      <span>Скопировано!</span>
                    </template>
                    <template v-else>
                      <LinkIcon :size="13" />
                      <span class="opacity-0 group-hover:opacity-100 transition-opacity hidden sm:inline">Ссылка</span>
                    </template>
                  </button>
                </div>

                <!-- Текст правила -->
                <div
                  class="rule-body text-sm sm:text-[15px] text-zinc-300 leading-relaxed mb-3.5"
                  v-html="rule.html"
                ></div>

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

        <!-- ПРАВАЯ ПАНЕЛЬ: Балансир (Sticky, 260px) — сохраняет центр экрана -->
        <aside class="hidden xl:flex flex-col gap-3 w-64 shrink-0 sticky top-24 select-none">
          <!-- Поддержка -->
          <div class="p-4 bg-[#151619] border border-white/10 rounded-lg text-left shadow-lg">
            <div class="flex items-center gap-2 text-zinc-300 font-heading font-bold text-xs uppercase mb-1.5">
              <HelpCircle :size="15" class="text-[#0099FF]" />
              <span>{{ rulesMeta.supportTitle }}</span>
            </div>
            <p class="text-xs text-zinc-400 leading-relaxed mb-3">
              {{ rulesMeta.supportText }}
            </p>
            <a
              :href="rulesMeta.supportLink"
              target="_blank"
              rel="noopener noreferrer"
              class="font-heading font-black text-xs uppercase tracking-wider text-[#0099FF] hover:underline inline-flex items-center gap-1"
            >
              {{ rulesMeta.supportLinkText }} →
            </a>
          </div>

          <!-- Инфо-виджет -->
          <div class="p-4 bg-[#151619] border border-white/5 rounded-lg text-left font-mono text-[11px] text-zinc-500 space-y-2">
            <div class="flex items-center gap-1.5 text-zinc-400">
              <Clock :size="13" />
              <span>РЕДАКЦИЯ: {{ rulesMeta.edition }}</span>
            </div>
            <div class="border-t border-white/5 pt-2">
              {{ rulesMeta.disclaimer }}
            </div>
          </div>
        </aside>

      </div>
    </div>
  </main>
</template>

<style scoped>
/* Фирменное выделение слова в заголовке */
.word-hl {
  display: inline-block;
  color: #181611;
  background: #FF4444;
  font-weight: 400;
  padding: 0 0.28em;
  margin: 0 0.04em;
  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;
  transform: rotate(-1.5deg);
  cursor: default;
  user-select: none;
}

/* Карточка главы */
.chapter-card {
  box-shadow: 0 8px 24px -4px rgba(0, 0, 0, 0.5);
}

/* Сайдбар */
.toc-btn {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
}

/*
 * ЭФФЕКТ ВЫДЕЛЕНИЯ ПРАВИЛА ПРИ ПЕРЕХОДЕ ПО ССЫЛКЕ:
 * Неоновая подсветка + мягкая пульсация
 */
.is-target-highlight,
:target {
  border-color: #0099FF !important;
  background: rgba(0, 153, 255, 0.08) !important;
  box-shadow: 0 0 24px rgba(0, 153, 255, 0.35), inset 0 0 0 1px #0099FF !important;
  animation: rulePulse 2s ease-out;
}

@keyframes rulePulse {
  0% {
    box-shadow: 0 0 35px rgba(0, 153, 255, 0.8), inset 0 0 0 2px #0099FF;
    transform: scale(1.01);
  }
  50% {
    box-shadow: 0 0 24px rgba(0, 153, 255, 0.4), inset 0 0 0 1px #0099FF;
    transform: scale(1);
  }
  100% {
    box-shadow: 0 0 18px rgba(0, 153, 255, 0.25), inset 0 0 0 1px #0099FF;
  }
}
.rule-body :deep(p) + :deep(p) {
  margin-top: 0.75rem;
}

.rule-body :deep(.rule-list) {
  margin: 0.5rem 0 0 1.1rem;
  list-style: disc;
}

.rule-body :deep(ol.rule-list) {
  list-style: decimal;
}

.rule-body :deep(li) {
  margin-top: 0.25rem;
}

.rule-body :deep(.rule-code) {
  font-family: theme('fontFamily.mono');
  background: rgba(255, 255, 255, 0.08);
  padding: 0 0.3em;
  border-radius: 3px;
  font-size: 0.9em;
}

.rule-body :deep(.rule-link) {
  color: #0099FF;
  text-decoration: underline;
}
</style>
