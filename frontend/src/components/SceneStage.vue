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

/** 按 id 找热点。图层在渲染时要决定「它是布景还是热点」，查这一次。 */
const hotspotIndex = computed(() => {
  const map = new Map<string, SceneHotspot>()
  for (const spot of props.scene.hotspots) map.set(spot.id, spot)
  return map
})

function hotspotOf(id: string): SceneHotspot | undefined {
  return hotspotIndex.value.get(id)
}

/**
 * 实际要画的层，按绘制顺序。
 *
 * layers 里的每一层原样保留（顺序就是叠放顺序）；
 * 不在 layers 里的热点追在后面 —— 两个场景的写法不一样：
 * 湖景的小屋只写在 hotspots 里，屋内那几个物件两边都写了。
 * 这里补齐一下，免得一个场景因为少写一行就安静少掉一个热点。
 */
const drawList = computed<SceneLayer[]>(() => {
  const ids = new Set(props.scene.layers.map((layer) => layer.id))
  const extras = props.scene.hotspots.filter((spot) => !ids.has(spot.id))
  return [...props.scene.layers, ...extras]
})

/*
 * 悬停：只缩放，CSS 的 :hover / :focus-within 就够了。
 * 曾经有一个「组」的概念（三叠书一起缩放），靠一个 activeGroups
 * 状态把 is-group-active 挂到整组上。现在只有一叠书可点，
 * 那个机制连同类型里的 group 字段一起拿掉了。
 *
 * 悬停标签（鼠标移到物件上弹出来的文字）也已整个拿掉。
 * label 字段现在只用于 aria-label，不再渲染成可见的 .tag。
 */

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
    <div class="stage" :data-scene="scene.id">      <!--
        一层一层画，**顺序就是 scene.layers 的顺序**：数组前面的在远处。

        这里刻意不做「先画布景、再画热点」两轮回圈。之前就是那么写的，
        结果是 layers 的先后完全失效 —— 所有**装饰图层都会被压在所有热点下面**，
        数据里把马克杯排在书后面也没用（马克杯要浮在书前）。
        两轮的代价是一个看不见的 z-order bug，不值。

        热点和普通图层的区别只在「接不接鼠标」：
        热点多一层 .hot 包裹（内含 .zone 可点块和悬停标签）。
      -->
      <template v-for="layer in drawList" :key="`layer-${layer.id}`">
        <!-- 普通布景层：不接鼠标，只有自身极轻的呼吸 / 摇曳 -->
        <span
          v-if="!hotspotOf(layer.id)"
          class="art-layer"
          :class="layer.motion && `motion-${layer.motion}`"
          :style="layerStyle(layer)"
        >
          <img :src="layer.src" alt="" aria-hidden="true" />
        </span>

        <!-- 热点：物件本体 + 压在它上面的透明可点块 -->
        <div
          v-else
          class="hot"
          :style="layerStyle(layer)"
          @pointerenter="onEnter"
        >
          <RouterLink
            class="hot__link"
            :to="hotspotOf(layer.id)!.to"
            :aria-label="hotspotOf(layer.id)!.label"
            @focus="onEnter"
          >
            <template
              v-for="(zone, i) in hotspotOf(layer.id)!.zones"
              :key="`zone-${layer.id}-${i}`"
            >
              <span class="zone" :style="zoneStyle(zone)" />
            </template>
          </RouterLink>

          <span class="art" :class="layer.motion && `motion-${layer.motion}`">
            <img :src="layer.src" :alt="hotspotOf(layer.id)!.alt ?? ''" />
          </span>

          <!-- 悬停标签已按要求整个拿掉，不再有鼠标移到物件上弹出的文字。 -->
        </div>
      </template>

      <p v-if="hint" class="hint" :class="{ 'is-quiet': quiet }">
        {{ hint }}
      </p>

      <slot />
    </div>
  </div>
</template>

<style scoped>
/* ---------- 舞台 ---------- */
/*
 * 注意：.stage-wrap 是 position:fixed，所以**任何祖先上的 transform
 * 都会把它变成那个祖先的子盒**（transform 会创建包含块）。
 * 场景页的 <main> 子元素全是 fixed，高度本来就是 0，
 * 一旦 main 带上 transform，这个 inset:0 就会按 0 高度解析，
 * 整个舞台被推出屏幕（曾经在 room-in 动画上踩过这个坑）。
 *
 * 所以约定：**场景页的祖先一律不得有 transform / filter / perspective**。
 * 入场动画挂在 .stage 自己身上，见下面的 scene-in。
 * 这里用 100dvh 而不是 inset:0，手机上地址栏收起时不会跳。
 */
.stage-wrap {
  position: fixed;
  inset: 0;
  height: 100vh;
  height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--scene-paper);
}

/* 入场：透明 + 极轻的缩放。放在舞台上，不放在祖先上。 */
.stage {
  animation: scene-in 1s ease both;
}

@keyframes scene-in {
  from {
    opacity: 0;
    transform: scale(1.012);
  }
  to {
    opacity: 1;
    transform: none;
  }
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

/* 悬停 / 聚焦：只缩放。 */
.hot:hover .art,
.hot:focus-within .art {
  transform: scale(1.035);
}

.art {
  transform-origin: 50% 100%;
  transition: transform 420ms cubic-bezier(0.2, 0.7, 0.3, 1);
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
}
</style>
