<script setup lang="ts">
import { computed, ref } from 'vue'
import PhotoTile from '@/components/PhotoTile.vue'
import PhotoLightbox from '@/components/PhotoLightbox.vue'
import SectionFade from '@/components/SectionFade.vue'
import { friendAlbums, friendPhotos, myPhotos, myPhotosIsEmpty } from '@/data/photos'

const mineIndex = ref<number | null>(null)
const friendIndex = ref<number | null>(null)

/** 朋友照片按相册分组展示，但灯箱要能跨相册翻页，所以算好每个相册的起始下标 */
const friendOffsets = computed(() => {
  let acc = 0
  return friendAlbums.map((album) => {
    const start = acc
    acc += album.photos.length
    return start
  })
})
</script>

<template>
  <main class="shell page-top page-bottom">
    <header>
      <h1 class="text-[1.8rem] leading-tight sm:text-[2rem]">影像</h1>
      <p class="mt-5 max-w-[40rem] text-[0.95rem] leading-[1.9] text-ink-soft">
        简历之外的部分：我自己拍的照片，和朋友们的照片。点开可以看大图。
      </p>
    </header>

    <!-- 我的照片 -->
    <section class="mt-14">
      <h2 class="text-[1.2rem]">我的照片</h2>
      <div class="pixel-rule mt-4" />

      <div v-if="myPhotos.length > 0" class="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <SectionFade
          v-for="(photo, i) in myPhotos"
          :key="photo.id"
          as="div"
          :delay="i * 50"
        >
          <PhotoTile
            :src="photo.src"
            :alt="`我的照片：第 ${photo.index} 张`"
            :caption="photo.note"
            @open="mineIndex = i"
          />
        </SectionFade>
      </div>

      <div
        v-else-if="myPhotosIsEmpty"
        class="mt-6 grid aspect-[4/3] place-items-center border-2 border-dashed border-line px-8 text-center sm:aspect-[16/6]"
      >
        <p class="max-w-[34rem] text-[0.9rem] leading-relaxed text-ink-soft">
          这里还空着。把压过的照片放进
          <span class="font-mono text-[0.85rem] text-accent">src/assets/photos-life/</span>
          ，这一格会自己满。
        </p>
      </div>
    </section>

    <!-- 朋友的照片 -->
    <section class="mt-16">
      <h2 class="text-[1.2rem]">朋友的照片</h2>
      <div class="pixel-rule mt-4" />

      <p v-if="friendAlbums.length === 0" class="mt-6 text-[0.9rem] text-ink-soft">
        照片还在路上。
      </p>

      <div v-for="(album, ai) in friendAlbums" :key="album.album" class="mt-8">
        <p class="font-mono text-[0.75rem] text-ink-soft">
          {{ album.name }} / {{ album.photos.length }} 张
        </p>

        <div class="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <SectionFade
            v-for="(photo, pi) in album.photos"
            :key="photo.id"
            as="div"
            :delay="pi * 50"
          >
            <PhotoTile
              :src="photo.src"
              :alt="`${album.name}：第 ${photo.index} 张`"
              :caption="photo.note"
              @open="friendIndex = (friendOffsets[ai] ?? 0) + pi"
            />
          </SectionFade>
        </div>
      </div>
    </section>

    <PhotoLightbox
      :photos="myPhotos"
      :index="mineIndex"
      label="我的照片"
      @update:index="mineIndex = $event"
    />
    <PhotoLightbox
      :photos="friendPhotos"
      :index="friendIndex"
      label="朋友的照片"
      @update:index="friendIndex = $event"
    />
  </main>
</template>
