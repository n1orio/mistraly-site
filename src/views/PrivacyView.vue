<script setup lang="ts">
import LegalDoc from '../components/LegalDoc.vue'
import { docs } from '../data/legal'
</script>

<template>
  <main class="w-full flex-1 flex flex-col items-center page-bg bg-[var(--bg-page)] text-[var(--text-main)]">
    <LegalDoc :doc="docs.privacy" />
  </main>
</template>
