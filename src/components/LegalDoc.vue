<script setup lang="ts">
import type { LegalDoc } from '../data/legal'

defineProps<{ doc: LegalDoc }>()
</script>

<template>
  <section class="w-full max-w-3xl mx-auto px-4 py-14 sm:py-20">
    <header class="mb-8">
      <h1 class="font-heading text-3xl sm:text-4xl text-[var(--text-main)] tracking-tight mb-3">
        {{ doc.title }}
      </h1>
      <p class="text-sm text-[var(--text-muted)] mb-2">{{ doc.lead }}</p>
      <p class="text-xs text-[var(--text-sub)]">
        Редакция от {{ doc.updated }}
      </p>
    </header>

    <div class="flex flex-col gap-8">
      <div v-for="section in doc.sections" :key="section.title">
        <h2 class="font-heading text-lg text-[var(--text-main)] mb-3">
          {{ section.title }}
        </h2>
        <p
          v-for="(para, i) in section.body"
          :key="i"
          class="text-sm text-[var(--text-muted)] leading-relaxed mb-3 last:mb-0"
        >
          {{ para }}
        </p>
        <ul
          v-if="section.list"
          class="list-disc pl-5 mt-2 flex flex-col gap-2"
        >
          <li
            v-for="(item, i) in section.list"
            :key="i"
            class="text-sm text-[var(--text-muted)] leading-relaxed"
          >
            {{ item }}
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>