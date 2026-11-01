<script setup lang="ts">
import { computed } from 'vue'
import { iconUrl, themeOf, themeOfPlayer } from '../lib/nameThemes'

/** Ник как в игре: иконка темы и цвет, у Глитча ещё синяя тень. */
const props = defineProps<{ name: string; theme?: string; size?: number }>()

const t = computed(() => (props.theme ? themeOf(props.theme) : themeOfPlayer(props.name)))
const px = computed(() => props.size ?? 16)
</script>

<template>
  <span class="name-tag" :style="{ color: t.name, textShadow: t.shadow ? `1px 1px 0 ${t.shadow}` : undefined }">
    <img :src="iconUrl(t)" alt="" :style="{ width: `${px}px`, height: `${px}px` }" />{{ name }}
  </span>
</template>

<style>
.name-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-width: 0;
  /* Вес от родителя: у шрифта заголовков одно начертание, жирность его ломает. */
  font-weight: inherit;
}
.name-tag img {
  flex: none;
  image-rendering: pixelated;
}
</style>
