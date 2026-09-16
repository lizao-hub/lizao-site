<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import LineIcon from '@/components/LineIcon.vue'
import type { PhotoItem } from '@/types/photo'

const props = defineProps<{
  photos: PhotoItem[]
  index: number | null
  /** 灯箱标题，用于 aria-label */
  label: string
}>()

const emit = defineEmits<{
  (event: 'update:index', value: number | null): void
}>()

const closeButton = ref<HTMLButtonElement | null>(null)
let lastFocused: Element | null = null

const isOpen = computed(() => props.index !== null)
const active = computed(() => (props.index === null ? null : (props.photos[props.index] ?? null)))

function close() {
  emit('update:index', null)
}

function step(delta: number) {
  if (props.index === null || props.photos.length === 0) return
  const total = props.photos.length
  emit('update:index', (props.index + delta + total) % total)
}

function onKeydown(event: KeyboardEvent) {
  if (!isOpen.value) return
  if (event.key === 'Escape') close()
  if (event.key === 'ArrowLeft') step(-1)
  if (event.key === 'ArrowRight') step(1)
}

watch(isOpen, async (open) => {
  // 打开时锁住页面滚动，并把焦点挪进对话框
  document.body.style.overflow = open ? 'hidden' : ''

  if (open) {
    lastFocused = document.activeElement
    window.addEventListener('keydown', onKeydown)
    await nextTick()
    closeButton.value?.focus()
  } else {
    window.removeEventListener('keydown', onKeydown)
    if (lastFocused instanceof HTMLElement) lastFocused.focus()
    lastFocused = null
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition name="page">
      <div
        v-if="active"
        class="veil fixed inset-0 flex flex-col items-center justify-center p-4 sm:p-8"
        :style="{ zIndex: 'var(--z-lightbox)' }"
        role="dialog"
        aria-modal="true"
        :aria-label="label"
        @click.self="close"
      >
        <div class="flex max-h-[80dvh] max-w-[min(100%,68rem)] items-center justify-center">
          <img
            :src="active.src"
            :alt="`${active.albumName}的第 ${active.index} 张照片`"
            class="max-h-[80dvh] max-w-full border border-[color:var(--veil-ink)] object-contain"
            decoding="async"
          />
        </div>

        <p v-if="active.note" class="mt-5 max-w-[40rem] text-center text-[0.9rem] leading-relaxed">
          {{ active.note }}
        </p>

        <p class="mt-3 font-mono text-[0.72rem] tracking-[0.08em] opacity-70">
          {{ String((index ?? 0) + 1).padStart(2, '0') }} /
          {{ String(photos.length).padStart(2, '0') }}
        </p>

        <button
          ref="closeButton"
          type="button"
          class="absolute right-4 top-4 flex h-10 w-10 items-center justify-center border border-[color:var(--veil-ink)] transition-opacity duration-200 hover:opacity-60"
          aria-label="关闭"
          @click="close"
        >
          <LineIcon name="close" :size="14" />
        </button>

        <button
          v-if="photos.length > 1"
          type="button"
          class="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-[color:var(--veil-ink)] transition-opacity duration-200 hover:opacity-60 sm:left-6"
          aria-label="上一张"
          @click="step(-1)"
        >
          <LineIcon name="left" :size="14" />
        </button>

        <button
          v-if="photos.length > 1"
          type="button"
          class="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center border border-[color:var(--veil-ink)] transition-opacity duration-200 hover:opacity-60 sm:right-6"
          aria-label="下一张"
          @click="step(1)"
        >
          <LineIcon name="right" :size="14" />
        </button>
      </div>
    </Transition>
  </Teleport>
</template>
