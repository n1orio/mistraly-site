<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  Search,
  X,
  Link as LinkIcon,
  Check,
  HelpCircle,
  Clock
} from '../lib/icons'
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
  <main class="w-full flex-1 flex flex-col items-center justify-start text-[var(--text-main)] px-4 sm:px-6 lg:px-8 pt-14 pb-20 sm:pt-20">
    <div class="w-full max-w-[1400px]">
      <div class="section-head">
        <h1 class="section-title">Свод <span class="word-hl">правил</span></h1>
        <p class="section-sub max-w-lg mx-auto">{{ rulesMeta.subtitle }}</p>
      </div>

      <!-- Глобальный поиск -->
      <div class="relative w-full max-w-2xl mx-auto mb-10">
        <label class="search mc-input">
          <Search :size="24" class="shrink-0 text-[var(--sky)]" />
          <input
            v-model="searchQuery"
            type="text"
            aria-label="Поиск по правилам"
            placeholder="Быстрый поиск по всем правилам (читы, твинк, приват, чат)..."
          />
          <button v-if="searchQuery" type="button" aria-label="Очистить" class="search-x" @click="searchQuery = ''">
            <X :size="24" />
          </button>
        </label>

        <div v-if="searchQuery.trim()" class="found mc-panel">
          <div class="found-head">Найдено совпадений: {{ searchResults.length }}</div>
          <div v-if="searchResults.length === 0" class="p-4 text-center text-[var(--text-muted)]">
            По запросу «{{ searchQuery }}» ничего не найдено
          </div>
          <button
            v-for="res in searchResults"
            :key="res.targetId"
            type="button"
            class="found-row"
            @click="selectSearchResult(res.targetId)"
          >
            <span class="found-num">{{ res.ruleNum }} {{ res.ruleTitle }}</span>
            <span class="found-chap">{{ res.chapterTitle }}</span>
            <span class="found-snip">{{ res.matchSnippet }}</span>
          </button>
        </div>
      </div>

      <!-- Три колонки: боковые равной ширины держат ленту правил по центру экрана -->
      <div class="w-full flex justify-center items-start gap-8 relative">
        <aside class="hidden xl:flex flex-col gap-2 w-64 shrink-0 sticky top-24">
          <div class="side-head">Разделы кодекса</div>
          <button v-for="chap in rulesData" :key="chap.id" type="button" class="toc" @click="scrollTo(chap.id)">
            <component :is="chap.icon" :size="24" class="shrink-0 text-[var(--sky)]" />
            <span class="truncate">{{ chap.title }}</span>
          </button>
        </aside>

        <div class="w-full max-w-3xl flex-1 flex flex-col gap-8 min-w-0">
          <section v-for="chap in rulesData" :id="chap.id" :key="chap.id" class="chapter mc-panel scroll-mt-24">
            <header class="chapter-head">
              <span class="mc-slot chapter-icon"><component :is="chap.icon" :size="24" /></span>
              <h2 class="chapter-title">{{ chap.title }}</h2>
              <span class="mc-tag">{{ chap.badge }}</span>
            </header>

            <div class="flex flex-col gap-4">
              <article
                v-for="rule in chap.rules"
                :id="rule.anchor"
                :key="rule.num"
                class="rule mc-well group"
                :class="{ 'is-warn': rule.isWarning, 'is-target': currentHash === rule.anchor }"
              >
                <div class="flex items-start justify-between gap-3 mb-2">
                  <div class="flex items-baseline gap-2.5 flex-wrap min-w-0">
                    <span class="rule-num">§ {{ rule.num }}</span>
                    <h3 class="rule-title">{{ rule.title }}</h3>
                  </div>
                  <button
                    type="button"
                    class="rule-link"
                    :class="{ 'is-done': copiedRuleId === rule.anchor }"
                    :title="'Скопировать ссылку на правило ' + rule.num"
                    :aria-label="'Скопировать ссылку на правило ' + rule.num"
                    @click="copyRuleLink(rule.num)"
                  >
                    <component :is="copiedRuleId === rule.anchor ? Check : LinkIcon" :size="24" />
                  </button>
                </div>

                <div class="rule-body" v-html="rule.html"></div>

                <div v-if="rule.penalty" class="rule-pen">
                  <span>Наказание:</span>
                  <span class="mc-tag" :class="rule.isWarning ? 'mc-tag--bad' : 'mc-tag--dim'">{{ rule.penalty }}</span>
                </div>
              </article>
            </div>
          </section>
        </div>

        <aside class="hidden xl:flex flex-col gap-3 w-64 shrink-0 sticky top-24">
          <div class="mc-panel p-4">
            <div class="flex items-center gap-2 font-bold text-[17px] mb-2">
              <HelpCircle :size="24" class="text-[var(--sky)]" />
              <span>{{ rulesMeta.supportTitle }}</span>
            </div>
            <p class="text-[15px] text-[var(--text-muted)] leading-snug mb-3">{{ rulesMeta.supportText }}</p>
            <a :href="rulesMeta.supportLink" target="_blank" rel="noopener noreferrer" class="mc-btn mc-btn--sm mc-btn--discord">
              {{ rulesMeta.supportLinkText }}
            </a>
          </div>
          <div class="text-[14px] text-[var(--text-sub)] px-2 leading-snug">
            <div class="flex items-center gap-1.5 mb-2 text-[var(--text-muted)]">
              <Clock :size="12" />
              <span>Редакция: {{ rulesMeta.edition }}</span>
            </div>
            {{ rulesMeta.disclaimer }}
          </div>
        </aside>
      </div>
    </div>
  </main>
</template>

<style scoped>
.search {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
}
.search input {
  flex: 1;
  min-width: 0;
  background: none;
  border: 0;
  outline: 0;
  color: var(--text-main);
  font: inherit;
}
.search input::placeholder {
  color: var(--text-sub);
}
.search-x {
  display: grid;
  background: none;
  border: 0;
  color: var(--text-muted);
  cursor: pointer;
}
.search-x:hover {
  color: #fff;
}
.found {
  position: absolute;
  z-index: 40;
  top: 100%;
  left: 3px;
  right: 3px;
  max-height: 24rem;
  margin-top: 9px;
  padding: 10px;
  overflow-y: auto;
}
.found-head,
.side-head {
  padding: 0 4px 6px;
  color: var(--text-sub);
  font-weight: 700;
  font-size: 14px;
}
.found-row {
  display: block;
  width: 100%;
  padding: 8px 10px;
  background: var(--well);
  border: 0;
  color: inherit;
  text-align: left;
  cursor: pointer;
}
.found-row + .found-row {
  margin-top: 4px;
}
.found-row:hover {
  background: var(--panel-hi);
}
.found-num {
  color: var(--sky);
  font-weight: 700;
}
.found-chap {
  margin-left: 8px;
  color: var(--text-sub);
  font-size: 14px;
}
.found-snip {
  display: block;
  color: var(--text-muted);
  font-size: 15px;
  line-height: 1.35;
}
.toc {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--panel);
  color: var(--text-main);
  border: 2px solid var(--ink);
  text-align: left;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
}
.toc:active {
  transform: translateY(2px);
}
.toc:hover {
  background: var(--panel-hi);
}
.chapter {
  padding: 20px;
}
.chapter-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 18px;
}
.chapter-icon {
  width: 48px;
  height: 48px;
}
.chapter-title {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
}
@media (max-width: 640px) {
  .chapter {
    padding: 14px;
  }
  .chapter-title {
    font-size: 24px;
  }
}
.rule {
  padding: 14px 16px;
  scroll-margin-top: 90px;
}
.rule.is-warn {
  --edge: #6B1F2B;
}
.rule.is-target {
  --edge: var(--sky);
}
.rule-num {
  flex: none;
  color: var(--sky);
  font-weight: 700;
  font-size: 15px;
}
.rule.is-warn .rule-num {
  color: var(--bad);
}
.rule-title {
  font-family: 'Noto Sans', 'Helvetica Neue', Arial, sans-serif;
  font-weight: 700;
  margin: 0;
  font-size: 17px;
  line-height: 1.3;
}
.rule-link {
  display: grid;
  flex: none;
  background: none;
  border: 0;
  color: var(--text-sub);
  cursor: pointer;
}
.rule-link:hover {
  color: #fff;
}
.rule-link.is-done {
  color: var(--ok);
}
.rule-body {
  color: var(--text-muted);
  font-size: 16px;
  line-height: 1.5;
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
  font-family: ui-monospace, monospace;
  background: var(--panel);
  padding: 0 0.3em;
  font-size: 0.9em;
}
.rule-body :deep(.rule-link) {
  color: var(--sky);
  text-decoration: underline;
}
.rule-pen {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  color: var(--text-sub);
  font-size: 15px;
}
</style>
