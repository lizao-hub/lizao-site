<script setup lang="ts">
import { useLocale } from '@/composables/useLocale'
import { navCopy } from '@/data/navCopy'

const { locale } = useLocale()
</script>

<template>
  <main class="mx-auto max-w-6xl px-4 py-12">
    <h1 class="text-2xl font-bold">{{ navCopy[locale].about }}</h1>
  </main>
</template>
