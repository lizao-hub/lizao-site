<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { X, ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { useLocale } from '@/composables/useLocale'
import { navCopy } from '@/data/navCopy'
import { friendPhotos } from '@/data/photos'

const { locale } = useLocale()

// 当前打开的照片序号，null 表示画廊关闭
const activeIndex = ref<number | null>(null)

// 拍平成一个数组，方便左右切换时跨相册翻阅
const flatPhotos = computed(() =>
  friendPhotos.flatMap((album) =>
    album.images.map((src) => ({
      src,
      caption: album.name[locale.value],
      album: album.album,
    })),
  ),
)

const activePhoto = computed(() =>
  activeIndex.value === null ? null : flatPhotos.value[activeIndex.value],
)

function open(index: number) {
  activeIndex.value = index
}

function close() {
  activeIndex.value = null
}

function step(delta: number) {
  if (activeIndex.value === null) return
  const total = flatPhotos.value.length
  activeIndex.value = (activeIndex.value + delta + total) % total
}

function onKeydown(event: KeyboardEvent) {
  if (activeIndex.value === null) return
  if (event.key === 'Escape') close()
  if (event.key === 'ArrowLeft') step(-1)
  if (event.key === 'ArrowRight') step(1)
}

watch(activeIndex, (value) => {
  // 打开时锁住页面滚动，关闭时恢复
  document.body.style.overflow = value === null ? '' : 'hidden'
  if (value === null) {
    window.removeEventListener('keydown', onKeydown)
  } else {
    window.addEventListener('keydown', onKeydown)
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <main class="mx-auto max-w-6xl px-4 py-12">
    <h1 class="text-2xl font-bold">{{ navCopy[locale].friends }}</h1>

    <p v-if="flatPhotos.length === 0" class="mt-8 text-center italic text-zinc-500">
      {{ locale === 'zh' ? '照片还在路上' : 'Photos coming soon' }}
    </p>

    <template v-else>
      <section v-for="album in friendPhotos" :key="album.album" class="mt-10">
        <h2 class="text-sm font-medium uppercase tracking-wider text-zinc-500">
          {{ album.name[locale] }}
        </h2>

        <ul class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-4">
          <li
            v-for="(src, index) in album.images"
            :key="src"
            class="group aspect-[4/5] overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
          >
            <button
              type="button"
              class="h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-zinc-100 dark:focus-visible:ring-offset-zinc-900"
              :aria-label="
                locale === 'zh'
                  ? `放大查看${album.name.zh}的第 ${index + 1} 张照片`
                  : `Enlarge photo ${index + 1} from ${album.name.en}`
              "
              @click="open(flatPhotos.findIndex((photo) => photo.src === src))"
            >
              <img
                :src="src"
                :alt="locale === 'zh' ? `${album.name.zh}的照片 ${index + 1}` : `Photo ${index + 1} of ${album.name.en}`"
                loading="lazy"
                decoding="async"
                class="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
              />
            </button>
          </li>
        </ul>
      </section>
    </template>

    <!-- 灯箱：点击缩略图后全屏查看 -->
    <Teleport to="body">
      <div
        v-if="activePhoto"
        class="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        :aria-label="locale === 'zh' ? '照片大图' : 'Photo viewer'"
        @click.self="close"
      >
        <img
          :src="activePhoto.src"
          :alt="activePhoto.caption"
          class="max-h-[85dvh] max-w-full rounded-lg object-contain shadow-2xl"
        />

        <p class="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 text-sm text-zinc-300">
          {{ activePhoto.caption }} · {{ (activeIndex ?? 0) + 1 }} / {{ flatPhotos.length }}
        </p>

        <button
          type="button"
          class="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-zinc-100 transition-colors hover:bg-white/20 active:scale-95"
          :aria-label="locale === 'zh' ? '关闭' : 'Close'"
          @click="close"
        >
          <X :size="20" :stroke-width="1.75" aria-hidden="true" />
        </button>

        <button
          type="button"
          class="absolute left-3 rounded-full bg-white/10 p-2 text-zinc-100 transition-colors hover:bg-white/20 active:scale-95 sm:left-6"
          :aria-label="locale === 'zh' ? '上一张' : 'Previous photo'"
          @click="step(-1)"
        >
          <ChevronLeft :size="22" :stroke-width="1.75" aria-hidden="true" />
        </button>

        <button
          type="button"
          class="absolute right-3 rounded-full bg-white/10 p-2 text-zinc-100 transition-colors hover:bg-white/20 active:scale-95 sm:right-6"
          :aria-label="locale === 'zh' ? '下一张' : 'Next photo'"
          @click="step(1)"
        >
          <ChevronRight :size="22" :stroke-width="1.75" aria-hidden="true" />
        </button>
      </div>
    </Teleport>
  </main>
</template>
