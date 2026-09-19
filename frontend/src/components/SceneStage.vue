<script setup lang="ts">
/**
 * 把一份场景数据渲染成**可点的景**。两个场景页（湖边 / 屋里）共用这一个组件。
 *
 * ⚠️ 这个文件是 2026-09-19 傍晚**按构建产物重建**的：原文件被一次误删带走，
 * 没进回收站（git rm / rm 是直接 unlink），VS Code 本地历史里也没有。
 * 依据是当天 16:08 的 `dist/assets/index-CLVRkYAK.js`（逻辑与模板）
 * 与 `index-ByAWI7oe.css`（样式与 @keyframes）。类名、props、事件名都原样留着，
 * **注释留不住** —— 这里的注释是重建时按产物里能看出的行为补的。
 *
 * ## 它只做三件事
 *
 * 1. **按数组顺序叠图层**。`layers` 的先后就是远近：数组前面的在远处。
 *    所以**别**给某一层写 z-index —— 那会让「顺序即叠放」失效。
 * 2. **把坐标换算成百分比**。所有 left/top/width 都是相对 2848×1602
 *    参考画布的百分比（不是相对视口），舞台自己维持这个比例，层跟着缩放。
 * 3. **在热点上放可点区域**。热点是 `.hot`，里面有一枚铺满的 `RouterLink`
 *    和若干个 `.zone` —— 可点的是 zone，不是整个方框。
 *
 * ## 祖先不得有 transform / filter / perspective
 *
 * `.stage-wrap` 是 `position: fixed`。任何非 none 的 transform 都会让祖先
 * 变成 fixed 后代的包含块，于是 `inset: 0` 按那个祖先的高度解析 —— 而场景页的
 * `main` 自身高度是 0，舞台会被整个推出屏幕。**这是踩过的坑，别再踩。**
 *
 * ## 动效
 *
 * 场景自身不做入场动画；各场景页只吃 App.vue 那次全站页面淡入。
 * 层的摇动幅度都是零点几度，靠 `transform-origin` 和时长区分远近感。
 */
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import type { Scene, SceneHotspot, SceneLayer, SceneZone } from '@/types/scene'

const props = withDefaults(
  defineProps<{
    /** 图层、热点、可点区域、坐标 —— 见 data/scenes.ts */
    scene: Scene
    /** 屋里要用：舞台整体往下让出导航条的高度 */
    navClearance?: boolean
  }>(),
  { navClearance: false },
)

const hotspotIndex = computed(() => {
  const map = new Map<string, SceneHotspot>()
  for (const spot of props.scene.hotspots) map.set(spot.id, spot)
  return map
})

function hotspotOf(id: string): SceneHotspot | undefined {
  return hotspotIndex.value.get(id)
}

/**
 * 绘制顺序 = layers 原样 + **没写进 layers 的热点**追在后面。
 *
 * 两个场景的写法不一样：湖景的小屋只写在 hotspots 里，屋内那几个物件两边都写了。
 * 这条兜底保证「只登记成热点」的层不会被漏画。
 */
const drawList = computed<SceneLayer[]>(() => {
  const ids = new Set(props.scene.layers.map((layer) => layer.id))
  const extras = props.scene.hotspots.filter((spot) => !ids.has(spot.id))
  return [...props.scene.layers, ...extras]
})

function layerStyle(layer: SceneLayer) {
  return { left: `${layer.left}%`, top: `${layer.top}%`, width: `${layer.width}%` }
}

function zoneStyle(zone: SceneZone) {
  return {
    left: `${zone.left}%`,
    top: `${zone.top}%`,
    right: `${zone.right}%`,
    bottom: `${zone.bottom}%`,
  }
}
</script>

<template>
  <div class="stage-wrap" :class="navClearance && 'stage-wrap--nav-clearance'">
    <div class="stage" :data-scene="scene.id">
      <template v-for="layer in drawList" :key="`layer-${layer.id}`">
        <!-- 热点：可点的区域（zones）压在画上面 -->
        <div
          v-if="hotspotOf(layer.id)"
          class="hot"
          :style="layerStyle(layer)"
        >
          <RouterLink
            class="hot__link"
            :to="hotspotOf(layer.id)!.to"
            :aria-label="hotspotOf(layer.id)!.label"
          >
            <span
              v-for="(zone, i) in hotspotOf(layer.id)!.zones"
              :key="`zone-${layer.id}-${i}`"
              class="zone"
              :style="zoneStyle(zone)"
            />
          </RouterLink>

          <span class="art" :class="layer.motion && `motion-${layer.motion}`">
            <img :src="layer.src" :alt="hotspotOf(layer.id)!.alt ?? ''" />
          </span>
        </div>

        <!-- 装饰层：只是画，不接鼠标 -->
        <span
          v-else
          class="art-layer"
          :class="layer.motion && `motion-${layer.motion}`"
          :style="layerStyle(layer)"
        >
          <img :src="layer.src" alt="" aria-hidden="true" />
        </span>
      </template>

      <slot />
    </div>
  </div>
</template>

<style scoped>
/*
 * 舞台只有**一档**：宽 = min(100%, --stage-w)，高由 aspect-ratio 换出。
 * 曾经有两档（湖边满屏、屋里留边），切页时会跳，后来统一了 ——
 * 别为了「首页该满屏」再加回第二档。
 */
.stage-wrap {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: var(--paper);
}

.stage-wrap--nav-clearance {
  padding-top: var(--nav-h);
}

.stage {
  position: relative;
  width: min(100%, var(--stage-w));
  aspect-ratio: 2848 / 1602;
  overflow: hidden;
}

.art-layer,
.art {
  position: absolute;
  display: block;
  pointer-events: none;
  user-select: none;
}

/* 热点里的画要**回到正常流**：.hot 已经有百分比定位，画跟着它的盒子走 */
.hot .art {
  position: relative;
}

.art-layer img,
.art img {
  display: block;
  width: 100%;
  -webkit-user-drag: none;
}

.hot {
  position: absolute;
}

/* 铺满整个热点方框；真正的可点范围由里面的 .zone 决定 */
.hot__link {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: block;
}

.hot__link:focus-visible {
  outline: none;
}

.zone {
  position: absolute;
  display: block;
  border-radius: 6px;
}

.art {
  transform-origin: 50% 100%;
  transition: transform 420ms cubic-bezier(0.2, 0.7, 0.3, 1);
}

.hot:hover .art,
.hot:focus-within .art {
  transform: scale(1.035);
}

/* ---------- 层的动效：都是零点几度，靠时长与原点分远近 ---------- */

.motion-sway img {
  transform-origin: 20% 0;
  animation: 9s ease-in-out infinite sway;
}

.motion-sway-soft img {
  transform-origin: 50% 100%;
  animation: 11s ease-in-out infinite sway-soft;
}

.motion-sway-strong img {
  transform-origin: 30% 100%;
  animation: 7s ease-in-out infinite sway-strong;
}

.motion-breathe img {
  transform-origin: 50% 100%;
  animation: 5.5s ease-in-out infinite breathe;
}

@keyframes sway {
  0%,
  100% {
    transform: rotate(0);
  }
  50% {
    transform: rotate(0.6deg);
  }
}

@keyframes sway-soft {
  0%,
  100% {
    transform: rotate(0);
  }
  50% {
    transform: rotate(0.35deg);
  }
}

@keyframes sway-strong {
  0%,
  100% {
    transform: rotate(0) scaleY(1);
  }
  50% {
    transform: rotate(0.7deg) scaleY(1.01);
  }
}

@keyframes breathe {
  0%,
  100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.006);
  }
}
</style>
