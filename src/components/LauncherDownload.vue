<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Download, Coffee, Rocket, ShieldCheck, Monitor, Package, Copy, Check } from '../lib/icons'

/**
 * Блок загрузки лаунчера (#launcher).
 *
 * Раньше кнопка «Скачать лаунчер» вела на якорь #launcher, которого на
 * странице не было, — скачать лаунчер с сайта было нельзя.
 *
 * Ссылки не зашиты в код: при релизе рядом с установщиками кладётся
 * /downloads/latest.json, и сайт подхватывает новую версию без пересборки.
 * /downloads/* на проде отдаёт Caddy из /opt/mistraly/downloads на VDS —
 * туда и кладутся установщики, а не в public/ этого репозитория.
 *
 *   {
 *     "version": "0.2.0",
 *     "date": "2026-10-14",
 *     "files": {
 *       "windows": { "url": "/downloads/Mistraly_0.2.0_x64-setup.exe", "size": 9123456 },
 *       "linux":   { "url": "/downloads/Mistraly_0.2.0_amd64.AppImage", "size": 81234567 },
 *       "deb":     { "url": "/downloads/Mistraly_0.2.0_amd64.deb", "size": 9123456 },
 *       "rpm":     { "url": "/downloads/Mistraly-0.2.0-1.x86_64.rpm", "size": 9123456 },
 *       "flatpak": { "url": "/downloads/flatpak/net.mistraly.launcher.flatpakref" },
 *       "macos":   { "url": "/downloads/Mistraly_0.2.0_universal.dmg", "size": 12345678 }
 *     }
 *   }
 *
 * Нет файла — блок честно пишет «скоро», а не ведёт на 404.
 */

type Platform = 'windows' | 'linux' | 'macos'
/** Дополнительные Linux-пакеты: показываются ссылками рядом с AppImage. */
type Extra = 'deb' | 'rpm' | 'flatpak'

interface Asset {
  url: string
  size?: number
}

interface Release {
  version: string
  date?: string
  files: Partial<Record<Platform | Extra, Asset>>
}

const PLATFORMS: Record<Platform, { label: string; hint: string }> = {
  windows: { label: 'Windows', hint: 'Windows 10 и 11, установщик .exe' },
  linux: { label: 'Linux', hint: 'AppImage — запускается без установки' },
  macos: { label: 'macOS', hint: 'Apple Silicon и Intel, образ .dmg' },
}

const release = ref<Release | null>(null)
const loading = ref(true)

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase()
  if (ua.includes('mac')) return 'macos'
  if (ua.includes('linux') && !ua.includes('android')) return 'linux'
  return 'windows'
}

const detected = detectPlatform()

const available = computed(() =>
  (Object.keys(PLATFORMS) as Platform[]).filter((p) => release.value?.files[p])
)

/**
 * Кнопка «для вашей системы» — только если файл под неё действительно есть.
 * Раньше Windows-посетителю без .exe предлагался Linux как «ваша система».
 */
const primary = computed(() => (available.value.includes(detected) ? detected : null))

/** Что стоит на главной кнопке: своя система, а если её нет — первая доступная. */
const shown = computed(() => primary.value ?? available.value[0] ?? null)

const others = computed(() => available.value.filter((p) => p !== shown.value))

const linuxExtras = computed(() =>
  (['deb', 'rpm'] as const)
    .map((k) => ({ key: k, file: release.value?.files[k] }))
    .filter((x): x is { key: 'deb' | 'rpm'; file: Asset } => !!x.file)
)

const flatpak = computed(() => release.value?.files.flatpak ?? null)

/**
 * Ставим из нашего Flatpak-репозитория по .flatpakref: он сам подключает
 * репозиторий (с ключом подписи) и Flathub для рантайма, а дальше
 * обновления приходят через `flatpak update` и Центр приложений.
 * Полный URL — команды копируют в терминал, относительный путь там не сработает.
 */
const flatpakRefUrl = computed(() =>
  flatpak.value ? new URL(flatpak.value.url, window.location.origin).href : ''
)
const flatpakCommands = computed(() =>
  flatpak.value
    ? [`flatpak install --user -y ${flatpakRefUrl.value}`, 'flatpak run net.mistraly.launcher'].join('\n')
    : ''
)

const copied = ref(false)
async function copyFlatpak() {
  try {
    await navigator.clipboard.writeText(flatpakCommands.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1800)
  } catch {
    /* буфер обмена недоступен — команды видны и так */
  }
}

function size(bytes?: number) {
  if (!bytes) return ''
  return `${(bytes / 1024 / 1024).toFixed(0)} МБ`
}

function date(d?: string) {
  if (!d) return ''
  const v = new Date(d)
  return Number.isNaN(v.getTime()) ? d : v.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

onMounted(async () => {
  try {
    const res = await fetch('/downloads/latest.json', { cache: 'no-cache' })
    const type = res.headers.get('content-type') || ''
    // SPA-фолбэк отдаёт index.html со статусом 200 — это не релиз.
    if (res.ok && type.includes('json')) {
      const data = (await res.json()) as Release
      if (data?.files && Object.keys(data.files).length) release.value = data
    }
  } catch {
    /* сети нет — покажем «скоро» */
  } finally {
    loading.value = false
  }
})

const features = [
  { icon: Download, title: 'Сборка и обновления', text: 'Скачивает модпак и ставит обновления перед запуском — сверяя контрольные суммы.' },
  { icon: Coffee, title: 'Java и NeoForge сами', text: 'Нет Java 21 — скачает. Minecraft 1.21.1 и NeoForge тоже поставит сам.' },
  { icon: Rocket, title: 'Сразу на сервер', text: 'Вход через Discord, а после загрузки игра подключается к Mistraly без ввода адреса.' },
  { icon: ShieldCheck, title: 'Понятные ошибки', text: 'Упала игра — покажет причину и хвост лога. «Проверить файлы» чинит битую установку.' },
]
</script>

<template>
  <section id="launcher" class="w-full max-w-5xl mx-auto px-4 pt-10 pb-24 scroll-mt-24">
    <div class="section-head">
      <h2 class="section-title">Скачать <span class="word-hl">лаунчер</span></h2>
      <p class="section-sub">Один файл — и больше ничего ставить не нужно</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-start">
      <!-- Загрузка -->
      <div class="lg:col-span-6">
        <div class="dl-card mc-panel">
          <span class="mc-tag dl-tag">Mistraly Launcher{{ release ? ' ' + release.version : '' }}</span>
          <div v-if="loading" class="dl-loading" aria-label="Загрузка">
            <span class="mc-spinner" />
          </div>

          <template v-else-if="release && available.length">
            <template v-if="primary">
            <div class="flex items-center gap-3 mb-1 text-[var(--text-main)]">
              <Monitor :size="18" />
              <span>Для вашей системы — {{ PLATFORMS[primary].label }}</span>
            </div>
            <p class="text-[15px] text-[var(--text-muted)] mb-6">
              {{ PLATFORMS[primary].hint }}<template v-if="release.files[primary]?.size"> · {{ size(release.files[primary]?.size) }}</template>
              <template v-if="release.date"> · от {{ date(release.date) }}</template>
            </p>

             <a :href="release.files[primary]!.url" class="mc-btn dl-btn" download>
                <Download :size="18" />
                Скачать для {{ PLATFORMS[primary].label }}</a>
            </template>

            <template v-else>
              <div class="flex items-center gap-3 mb-1 text-[var(--text-main)]">
                <Monitor :size="18" />
                <span>Для {{ PLATFORMS[detected].label }} сборка скоро появится</span>
              </div>
              <p class="text-[15px] text-[var(--text-muted)] mb-6">
                Пока лаунчер готов для: {{ available.map((p) => PLATFORMS[p].label).join(', ') }}.
              </p>
               <a :href="release.files[shown!]!.url" class="mc-btn dl-btn" download>
                  <Download :size="18" />
                  Скачать для {{ PLATFORMS[shown!].label }}</a>
            </template>

            <div v-if="shown === 'linux' && linuxExtras.length" class="dl-others">
              <span>Пакетом:</span>
              <a v-for="x in linuxExtras" :key="x.key" :href="x.file.url" download>
                .{{ x.key }}<template v-if="x.file.size"> · {{ size(x.file.size) }}</template>
              </a>
            </div>

            <div v-if="others.length" class="dl-others">
              <span>Другие системы:</span>
              <a v-for="p in others" :key="p" :href="release.files[p]!.url" download>
                {{ PLATFORMS[p].label }}<template v-if="release.files[p]?.size"> · {{ size(release.files[p]?.size) }}</template>
              </a>
            </div>
          </template>

          <template v-else>
            <p class="font-heading text-[24px] mb-2">Скоро здесь</p>
            <p class="text-[var(--text-muted)] leading-relaxed mb-6">
              Публичная сборка лаунчера готовится к выходу. Ссылку на скачивание опубликуем в
              Discord-сообществе — а пока можно войти и оформить проходку.
            </p>
             <router-link to="/shop" class="mc-btn dl-btn">Оформить проходку →</router-link>
          </template>
        </div>
      </div>

      <!-- Flatpak: быстрая установка на любом Linux -->
      <div v-if="flatpak" id="flatpak" class="lg:col-span-12 fp-card mc-panel scroll-mt-24">
        <div class="flex items-center gap-3 mb-2">
          <span class="mc-slot feat-icon"><Package :size="18" /></span>
          <span class="font-bold text-[17px]">Установка через Flatpak</span>
        </div>
        <p class="text-[var(--text-muted)] leading-relaxed mb-4">
          Работает на любом дистрибутиве: Steam Deck, Fedora, Ubuntu, Arch, Mint. Одна команда
          подключает репозиторий Mistraly и ставит лаунчер — он появится в меню приложений как
          «Mistraly», а новые версии будут приходить вместе с остальными обновлениями системы.
          Игра и сборка хранятся в <code>~/.mistraly</code>, как и у AppImage.
        </p>
        <div class="fp-code mc-well">
          <pre><code>{{ flatpakCommands }}</code></pre>
          <button type="button" class="fp-copy mc-btn mc-btn--sm" :aria-label="copied ? 'Скопировано' : 'Скопировать команды'" @click="copyFlatpak">
            <component :is="copied ? Check : Copy" :size="16" />
            {{ copied ? 'Скопировано' : 'Копировать' }}
          </button>
        </div>
        <p class="text-[15px] text-[var(--text-muted)] mt-3">
          Обновить: <code>flatpak update</code> или «Центр приложений». Удалить:
          <code>flatpak uninstall --user net.mistraly.launcher</code>.
          Без терминала — <a :href="flatpak.url" class="mc-link">откройте эту ссылку</a>,
          и GNOME Software или Discover предложат установить Mistraly.
          Ставили раньше из файла Mistraly.flatpak? Удалите его командой выше и установите заново —
          тогда заработают обновления; игра и сборка в <code>~/.mistraly</code> останутся.
        </p>
      </div>

      <!-- Что умеет -->
      <ul class="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <li v-for="f in features" :key="f.title" class="feat mc-panel">
          <span class="mc-slot feat-icon"><component :is="f.icon" :size="18" /></span>
          <span class="feat-title font-heading">{{ f.title }}</span>
          <span class="feat-text">{{ f.text }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.dl-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  min-height: 250px;
  padding: 44px 24px 24px;
}
.dl-tag {
  position: absolute;
  top: 16px;
  left: 24px;
}
.dl-loading {
  align-self: center;
}
.dl-others {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin-top: 20px;
  font-size: 15px;
  color: var(--text-muted);
}
.dl-others a {
  color: var(--sky);
  text-decoration: underline;
  text-underline-offset: 3px;
}
.dl-others a:hover {
  color: #fff;
}
.fp-card {
  padding: 24px;
}
.fp-card code {
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 0.88em;
  color: var(--sky);
}
.fp-code {
  position: relative;
}
.fp-code pre {
  margin: 0;
  padding: 16px 150px 16px 18px;
  overflow-x: auto;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre;
}
.fp-copy {
  position: absolute;
  top: 8px;
  right: 8px;
}
@media (max-width: 640px) {
  .fp-code pre {
    padding-right: 18px;
    padding-top: 60px;
  }
}
.feat {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px;
}
.feat-icon {
  width: 48px;
  height: 48px;
  margin: 0 0 8px;
}
.feat-title {
  font-family: 'Noto Sans', 'Helvetica Neue', Arial, sans-serif;
  font-weight: 700;
  font-size: 17px;
  line-height: 1.3;
}
.feat-text {
  font-size: 15px;
  line-height: 1.4;
  color: var(--text-muted);
}
</style>
