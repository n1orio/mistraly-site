<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Download, Coffee, Rocket, ShieldCheck, Monitor, Package, Copy, Check } from 'lucide-vue-next'

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
    <div class="text-center mb-14">
      <h2 class="font-heading text-2xl sm:text-3xl text-[var(--text-main)] tracking-tight mb-2">
        Скачать <span class="word-hl">лаунчер</span>
      </h2>
      <p class="text-xs sm:text-sm text-[var(--text-muted)]">Один файл — и больше ничего ставить не нужно</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-start">
      <!-- Загрузка -->
      <div class="lg:col-span-6 dl-wrap">
        <span class="dl-tag">Mistraly Launcher{{ release ? ' ' + release.version : '' }}</span>
        <div class="dl-card">
          <div v-if="loading" class="dl-loading" aria-label="Загрузка">
            <span class="dl-spinner" />
          </div>

          <template v-else-if="release && available.length">
            <template v-if="primary">
            <div class="flex items-center gap-3 mb-1 text-[#D1FAE5]">
              <Monitor :size="18" />
              <span class="text-sm">Для вашей системы — {{ PLATFORMS[primary].label }}</span>
            </div>
            <p class="text-xs text-[var(--text-muted)] mb-6">
              {{ PLATFORMS[primary].hint }}<template v-if="release.files[primary]?.size"> · {{ size(release.files[primary]?.size) }}</template>
              <template v-if="release.date"> · от {{ date(release.date) }}</template>
            </p>

            <span class="dl-btn-wrap">
              <a :href="release.files[primary]!.url" class="dl-btn" download>
                <Download :size="18" />
                Скачать для {{ PLATFORMS[primary].label }}
              </a>
            </span>
            </template>

            <template v-else>
              <div class="flex items-center gap-3 mb-1 text-[#D1FAE5]">
                <Monitor :size="18" />
                <span class="text-sm">Для {{ PLATFORMS[detected].label }} сборка скоро появится</span>
              </div>
              <p class="text-xs text-[var(--text-muted)] mb-6">
                Пока лаунчер готов для: {{ available.map((p) => PLATFORMS[p].label).join(', ') }}.
              </p>
              <span class="dl-btn-wrap">
                <a :href="release.files[shown!]!.url" class="dl-btn dl-btn--muted" download>
                  <Download :size="18" />
                  Скачать для {{ PLATFORMS[shown!].label }}
                </a>
              </span>
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
            <p class="font-heading text-xl text-white mb-2">Скоро здесь</p>
            <p class="text-sm text-[var(--text-muted)] leading-relaxed mb-6">
              Публичная сборка лаунчера готовится к выходу. Ссылку на скачивание опубликуем в
              Discord-сообществе — а пока можно войти и оформить проходку.
            </p>
            <span class="dl-btn-wrap">
              <router-link to="/shop" class="dl-btn dl-btn--muted">Оформить проходку →</router-link>
            </span>
          </template>
        </div>
      </div>

      <!-- Flatpak: быстрая установка на любом Linux -->
      <div v-if="flatpak" id="flatpak" class="lg:col-span-12 fp-card scroll-mt-24">
        <div class="flex items-center gap-3 mb-2">
          <span class="feat-icon"><Package :size="18" /></span>
          <span class="font-heading text-lg text-white">Установка через Flatpak</span>
        </div>
        <p class="text-sm text-[var(--text-muted)] leading-relaxed mb-4">
          Работает на любом дистрибутиве: Steam Deck, Fedora, Ubuntu, Arch, Mint. Одна команда
          подключает репозиторий Mistraly и ставит лаунчер — он появится в меню приложений как
          «Mistraly», а новые версии будут приходить вместе с остальными обновлениями системы.
          Игра и сборка хранятся в <code>~/.mistraly</code>, как и у AppImage.
        </p>
        <div class="fp-code">
          <pre><code>{{ flatpakCommands }}</code></pre>
          <button type="button" class="fp-copy" :aria-label="copied ? 'Скопировано' : 'Скопировать команды'" @click="copyFlatpak">
            <component :is="copied ? Check : Copy" :size="16" />
            {{ copied ? 'Скопировано' : 'Копировать' }}
          </button>
        </div>
        <p class="text-xs text-[var(--text-muted)] mt-3">
          Обновить: <code>flatpak update</code> или «Центр приложений». Удалить:
          <code>flatpak uninstall --user net.mistraly.launcher</code>.
          Без терминала — <a :href="flatpak.url" class="fp-link">откройте эту ссылку</a>,
          и GNOME Software или Discover предложат установить Mistraly.
          Ставили раньше из файла Mistraly.flatpak? Удалите его командой выше и установите заново —
          тогда заработают обновления; игра и сборка в <code>~/.mistraly</code> останутся.
        </p>
      </div>

      <!-- Что умеет -->
      <ul class="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <li v-for="f in features" :key="f.title" class="feat">
          <span class="feat-icon"><component :is="f.icon" :size="18" /></span>
          <span class="feat-title font-heading">{{ f.title }}</span>
          <span class="feat-text">{{ f.text }}</span>
        </li>
      </ul>
    </div>
  </section>
</template>

<style scoped>
.word-hl {
  display: inline-block;
  color: #142306;
  background: #4ade80;
  font-weight: 400;
  padding: 0 0.28em;
  margin: 0 0.04em;
  transform: rotate(-1.5deg);
  user-select: none;
}

/* Карточка загрузки: тень на обёртке, форма — на самой карточке,
   иначе clip-path срезал бы drop-shadow. */
.dl-wrap {
  position: relative;
  filter: drop-shadow(10px 12px 0 rgba(0, 0, 0, 0.5));
}
.dl-tag {
  position: absolute;
  top: -14px;
  left: 18px;
  z-index: 2;
  padding: 5px 11px;
  background: #4ade80;
  color: #142306;
  font-family: 'Russo One', sans-serif;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  transform: rotate(-2deg);
  box-shadow: 3px 4px 0 #0c1512;
}
.dl-card {
  position: relative;
  padding: 38px 30px 30px;
  background: linear-gradient(180deg, #19221e 0%, #111814 100%);
  clip-path: polygon(0% 2%, 100% 0%, 99% 100%, 1% 97%);
  min-height: 250px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.dl-card::after {
  content: '';
  position: absolute;
  inset: 5px;
  clip-path: inherit;
  box-shadow: inset 0 0 0 1px rgba(74, 222, 128, 0.18);
  pointer-events: none;
}

.dl-loading {
  display: flex;
  justify-content: center;
}
.dl-spinner {
  width: 26px;
  height: 26px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top-color: #4ade80;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.dl-btn-wrap {
  display: inline-flex;
  align-self: flex-start;
  filter: drop-shadow(8px 8px 0 #0c1512);
  transition: filter 0.2s ease;
}
.dl-btn-wrap:hover {
  filter: drop-shadow(11px 11px 0 rgba(0, 0, 0, 0.8));
}
.dl-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 15px 30px;
  color: #142306;
  font-family: 'Russo One', sans-serif;
  font-size: 15px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-decoration: none;
  transform: rotate(-1.5deg);
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.dl-btn::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  background: #4ade80;
  clip-path: polygon(0% 12%, 100% 0%, 100% 100%, 0% 88%);
  transition: background-color 0.2s ease;
}
.dl-btn--muted {
  color: #fff;
}
.dl-btn--muted::before {
  background: #0099ff;
}
.dl-btn:hover {
  transform: rotate(-1.5deg) scale(1.05);
  color: #0d0e10;
}
.dl-btn:hover::before {
  background: #fff;
}
.dl-btn:focus-visible {
  outline: 2px solid #4ade80;
  outline-offset: 4px;
}

.dl-others {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin-top: 22px;
  font-size: 12px;
  color: var(--text-muted);
}
.dl-others a {
  color: #d1fae5;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: rgba(209, 250, 229, 0.3);
}
.dl-others a:hover {
  text-decoration-color: currentColor;
}

.fp-card {
  position: relative;
  padding: 24px 24px 22px;
  background: #16181b;
  clip-path: polygon(0% 2%, 100% 0%, 99.5% 100%, 0.5% 96%);
}
.fp-card code {
  font-family: ui-monospace, 'JetBrains Mono', monospace;
  font-size: 0.92em;
  color: #d1fae5;
}
.fp-code {
  position: relative;
  background: #0c0f0d;
  border: 1px solid rgba(74, 222, 128, 0.18);
}
.fp-code pre {
  margin: 0;
  padding: 16px 18px;
  padding-right: 130px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.7;
  white-space: pre;
}
.fp-copy {
  position: absolute;
  top: 10px;
  right: 10px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #4ade80;
  color: #142306;
  font-family: 'Russo One', sans-serif;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.fp-copy:hover {
  background: #fff;
}
.fp-copy:focus-visible {
  outline: 2px solid #4ade80;
  outline-offset: 3px;
}
.fp-link {
  color: #d1fae5;
  text-decoration: underline;
  text-underline-offset: 3px;
}
@media (max-width: 640px) {
  .fp-code pre {
    padding-right: 18px;
    padding-top: 52px;
  }
}

.feat {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px 18px 20px;
  background: #16181b;
  clip-path: polygon(0% 3%, 100% 0%, 99% 100%, 1% 97%);
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.feat:hover {
  transform: translate(-2px, -3px);
}
.feat-icon {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  margin-bottom: 4px;
  background: rgba(74, 222, 128, 0.12);
  color: #4ade80;
}
.feat-title {
  font-size: 15px;
  color: #fff;
}
.feat-text {
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-muted);
}
</style>
