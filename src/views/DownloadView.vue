<script setup lang="ts">
import LauncherDownload from '../components/LauncherDownload.vue'
</script>

<template>
  <!-- Отдельная страница загрузки. Раньше блок жил внизу главной, и кнопки
       «Скачать лаунчер» прокручивали к нему длинную страницу. -->
  <main class="w-full flex-1 flex flex-col items-center justify-start page-bg bg-[var(--bg-page)] text-[var(--text-main)] pt-20 sm:pt-28">
    <LauncherDownload />
  </main>
</template>
