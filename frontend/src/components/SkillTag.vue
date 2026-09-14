<script setup lang="ts">
defineProps<{ label: string }>()
</script>

<template>
  <span class="pixel-tag">{{ label }}</span>
</template>
