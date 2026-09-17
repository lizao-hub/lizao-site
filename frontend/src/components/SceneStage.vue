<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import type { Scene, SceneHotspot, SceneLayer } from '@/types/scene'

/**
 * 场景舞台。两个场景（湖边 / 屋内）共用这一个组件，差别全在 scenes.ts 的数据里。
 *
 * 三条来自原稿的、踩过坑才得到的规则：
 *
 * 1. **舞台维持 2848:1602 的比例**，用 min(100vw, 100vh * 比例) 铺满视口。
 *    层全部按参考画布的百分比定位，所以任何视口下相对位置都不变。
 * 2. **物件的可点区域是独立的透明小块，不是物件本身。**
 *    原稿试过用 clip-path 抠出轮廓来限制点击，实测 elementFromPoint 完全
 *    无视 clip-path，电脑的透明处会把压在它下面的书抢走。所以：
 *    .art 只负责好看（pointer-events: none），.zone 负责接鼠标。
 * 3. **容器必须有在流内的子元素撑高。** 如果 .hot 的子元素全部绝对定位，
 *    它的高度就是 0，zone 的 top/bottom 百分比会全部解析成 0，点击区消失。
 *    所以 .art 是 position: relative 的。
 *
 * 动效包线见 ADR-0005：只做物件自身的呼吸 / 摇曳，悬停只缩放，
 * 不跟鼠标做视差，不加光晕和投影。
 */

const props = withDefaults(
  defineProps<{
    scene: Scene
    /** 顶部提示文案。不传就不显示 */
    hint?: string
  }>(),
  { hint: undefined },
)

const emit = defineEmits<{ interact: [] }>()

/** 第一次碰到任意物件之后提示变淡，之后不再打扰 */
const quiet = ref(false)

function onEnter() {
  if (quiet.value) return
  quiet.value = true
  emit('interact')
}

/**
 * 当前被碰到的组。只有**组**需要这个状态：三叠书是一个组件，
 * 鼠标落在任何一叠上，三叠要一起缩放，而 CSS 的 :hover 只看得到
 * 鼠标底下的那一个元素，所以得自己记一下。
 *
 * 不成组的物件（电脑、相机）不需要额外的类：.hot:hover .art 就够了。
 * 写成两者都走 is-active 的话，非组的物件永远拿不到那个类，
 * 反而把 CSS 已经做对的事情拆掉。
 */
const activeGroups = ref(new Set<string>())

function setGroupActive(spot: SceneHotspot, active: boolean) {
  if (!spot.group) return
  const next = new Set(activeGroups.value)
  if (active) next.add(spot.group)
  else next.delete(spot.group)
  activeGroups.value = next
}

/** 只有「被某个在组的成员碰到」的组才亮 */
function isGroupActive(spot: SceneHotspot): boolean {
  return Boolean(spot.group && activeGroups.value.has(spot.group))
}

/** 每组的标签挂在该组第一叠的位置上，一组只有一枚 */
const groupLabelAnchor = computed(() => {
  const anchors = new Map<string, SceneHotspot>()
  for (const spot of props.scene.hotspots) {
    if (spot.group && !anchors.has(spot.group)) anchors.set(spot.group, spot)
  }
  return anchors
})

function showLabel(spot: SceneHotspot): boolean {
  return !spot.group || groupLabelAnchor.value.get(spot.group)?.id === spot.id
}

function layerStyle(layer: SceneLayer) {
  return {
    left: `${layer.left}%`,
    top: `${layer.top}%`,
    width: `${layer.width}%`,
  }
}

function zoneStyle(zone: { left: number; top: number; right: number; bottom: number }) {
  return {
    left: `${zone.left}%`,
    top: `${zone.top}%`,
    right: `${zone.right}%`,
    bottom: `${zone.bottom}%`,
  }
}
</script>

<template>
  <div class="stage-wrap">
    <div class="stage" :data-scene="scene.id">
      <!-- 布景层：不可点击，只有自身的呼吸 / 摇曳 -->
      <template v-for="layer in scene.layers" :key="`layer-${layer.id}`">
        <span
          v-if="!scene.hotspots.some((spot) => spot.id === layer.id)"
          class="art-layer"
          :class="layer.motion && `motion-${layer.motion}`"
          :style="layerStyle(layer)"
        >
          <img :src="layer.src" alt="" aria-hidden="true" />
        </span>
      </template>

      <!-- 热点：物件本体 + 压在它上面的透明可点块 -->
      <div
        v-for="spot in scene.hotspots"
        :key="`hot-${spot.id}`"
        class="hot"
        :class="[isGroupActive(spot) && 'is-group-active']"
        :style="layerStyle(spot)"
        @pointerenter="onEnter"
      >
        <RouterLink
          class="hot__link"
          :to="spot.to"
          :aria-label="spot.label"
          @pointerenter="setGroupActive(spot, true)"
          @pointerleave="setGroupActive(spot, false)"
          @focus="setGroupActive(spot, true); onEnter()"
          @blur="setGroupActive(spot, false)"
        >
          <template v-for="(zone, i) in spot.zones" :key="`zone-${spot.id}-${i}`">
            <span class="zone" :style="zoneStyle(zone)" />
          </template>
        </RouterLink>

        <span class="art" :class="spot.motion && `motion-${spot.motion}`">
          <img :src="spot.src" :alt="spot.alt ?? ''" />
        </span>

        <span v-if="showLabel(spot)" class="tag">{{ spot.label }}</span>
      </div>

      <p v-if="hint" class="hint" :class="{ 'is-quiet': quiet }">
        {{ hint }}
      </p>

      <slot />
    </div>
  </div>
</template>

<style scoped>
/* ---------- 舞台 ---------- */
.stage-wrap {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--scene-paper);
}

.stage {
  position: relative;
  /* 参考画布 2848×1602。两个场景共用同一比例，所以层坐标可以互换 */
  aspect-ratio: 2848 / 1602;
  width: min(100vw, calc(100vh * 2848 / 1602));
  height: min(100vh, calc(100vw * 1602 / 2848));
  overflow: hidden;
}

/* ---------- 布景层 ---------- */
.art-layer,
.art {
  position: absolute;
  display: block;
  pointer-events: none;
  user-select: none;
}

/* .art 必须是流内的：它撑出 .hot 的高度，下面的百分比才有参照。
   写成 absolute 的话 .hot 高度为 0，点击区会整体消失。 */
.hot .art {
  position: relative;
}

.art-layer img,
.art img {
  width: 100%;
  display: block;
  -webkit-user-drag: none;
}

/* ---------- 热点 ---------- */
.hot {
  position: absolute;
}

.hot__link {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: block;
  /* 链接本身不画东西，真正可点的是里面的 .zone */
}

.hot__link:focus-visible {
  outline: none;
}

.zone {
  position: absolute;
  display: block;
  border-radius: 6px;
}

/* 悬停 / 聚焦：只缩放。
   普通物件靠 :hover / :focus-within 就够；
   成组的物件（三叠书）额外看 is-group-active，鼠标在任意一叠上，整组一起动。 */
.hot:hover .art,
.hot:focus-within .art,
.hot.is-group-active .art {
  transform: scale(1.035);
}

.art {
  transform-origin: 50% 100%;
  transition: transform 420ms cubic-bezier(0.2, 0.7, 0.3, 1);
}

/* ---------- 悬停标签 ---------- */
.tag {
  position: absolute;
  left: 50%;
  bottom: 100%;
  z-index: 3;
  margin-bottom: 0.5em;
  padding: 0.42em 1.1em;
  white-space: nowrap;
  border-radius: 999px;
  background: var(--scene-paper-veil);
  color: var(--scene-wood);
  font-size: clamp(10px, 0.8vw, 15px);
  letter-spacing: 0.18em;
  text-indent: 0.18em;
  opacity: 0;
  pointer-events: none;
  transform: translateX(-50%);
  transition: opacity 300ms ease;
}

.hot:hover .tag,
.hot:focus-within .tag,
.hot.is-group-active .tag {
  opacity: 1;
}

/* 靠左边的物件：标签左对齐，别跑出画面。
   相机在最左（29.21%），其余都在它右边。 */
.stage[data-scene='room'] .hot:first-of-type .tag {
  left: 0;
  transform: none;
}

/* ---------- 顶部提示 ---------- */
.hint {
  position: absolute;
  left: 50%;
  top: 3.1%;
  z-index: 3;
  transform: translateX(-50%);
  white-space: nowrap;
  padding: 0.52em 1.5em;
  border-radius: 999px;
  background: var(--scene-paper-veil);
  color: var(--scene-ink-soft);
  text-align: center;
  font-size: clamp(9px, 0.82vw, 14px);
  letter-spacing: 0.28em;
  text-indent: 0.28em;
  pointer-events: none;
  transition: opacity 600ms ease;
}

.hint.is-quiet {
  opacity: 0.34;
}

/* ---------- 各层自身的呼吸 / 摇曳 ---------- */
/* 幅度都很小。这是环境动效，不是表演。 */
.motion-sway img {
  animation: sway 9s ease-in-out infinite;
  transform-origin: 20% 0;
}
.motion-sway-soft img {
  animation: sway-soft 11s ease-in-out infinite;
  transform-origin: 50% 100%;
}
.motion-sway-strong img {
  animation: sway-strong 7s ease-in-out infinite;
  transform-origin: 30% 100%;
}
.motion-breathe img {
  animation: breathe 5.5s ease-in-out infinite;
  transform-origin: 50% 100%;
}
.motion-note-lift img {
  animation: note-lift 7s ease-in-out infinite;
  transform-origin: 50% 100%;
}

@keyframes sway {
  0%,
  100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(0.6deg);
  }
}
@keyframes sway-soft {
  0%,
  100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(0.35deg);
  }
}
@keyframes sway-strong {
  0%,
  100% {
    transform: rotate(0deg) scaleY(1);
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
@keyframes note-lift {
  0%,
  100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(-1.2deg);
  }
}

/*
  竖屏手机：舞台按 16:9 铺满会变成一条两成高的窄带，
  上方下方各留一大片空白，而文字和热点都缩到看不清。
  （原文的解法是直接居中，那在竖屏上就是一条带子。）

  这里改成：舞台顶到视口顶部，高度按比例算，剩下的空间交给 slot 里的文案。
  不改比例、不裁切 —— 裁切会把 left:80% 的小木屋整块切掉。
*/
@media (max-aspect-ratio: 1 / 1) {
  .stage-wrap {
    align-items: flex-start;
  }
  .stage {
    width: 100vw;
    height: auto;
    flex: 0 0 auto;
  }
  .tag {
    display: none;
  }
}

/* 悬停标签在触屏上没有意义，也不该吃掉布局 */
@media (hover: none) {
  .tag {
    display: none;
  }
}
</style>
