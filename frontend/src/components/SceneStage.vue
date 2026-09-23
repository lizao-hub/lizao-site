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
 * ## 舞台的两层：画（.stage__art）与字（.stage__caption）
 *
 * 桌面上下两层**盒子完全重合**（都是 `.stage` 那一块），所以图层坐标、文案
 * 位置、点击区域和拆开之前一字不差。分成两层是为了窄屏：手机竖屏的画只占
 * 屏幕四分之一高，字压在画上会被裁掉（详见文件末尾「窄屏」那一段），
 * 那时字要能落到画的下面去 —— 于是需要一层「只装画」的盒子把它撑住。
 *
 * ## 舞台也可以不进 fixed：flow
 *
 * 湖边整页就是一幅景（fixed 铺满视口）；屋里底下还要有页脚，于是它要走
 * 文档流 —— 见下面 `.stage-wrap--flow` 那一段。
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
 * **湖边那一边**的 `.stage-wrap` 是 `position: fixed`。任何非 none 的 transform
 * 都会让祖先变成 fixed 后代的包含块，于是 `inset: 0` 按那个祖先的高度解析 ——
 * 而场景页的 `main` 自身高度是 0，舞台会被整个推出屏幕。**这是踩过的坑，别再踩。**
 * （屋里走了文档流，不受这条约束；但两个场景共用 App.vue 那层祖先，
 * 所以这条实际上对**两页**都成立。）
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
    /**
     * 屋里要用：舞台**回到文档流**，不再 fixed 铺满视口。
     *
     * 这是「屋里要有页脚」的前提 —— fixed 的舞台会把页脚顶到屏幕外（
     * 页脚在 App.vue，挂在 RouterView 后面）。代价是这一页从此可以往下滚。
     * 湖边不开：那一页整页就是一幅景，没有页脚，也不需要滚。
     */
    flow?: boolean
  }>(),
  { navClearance: false, flow: false },
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
  <div
    class="stage-wrap"
    :class="[navClearance && 'stage-wrap--nav-clearance', flow && 'stage-wrap--flow']"
  >
    <div class="stage" :data-scene="scene.id">
      <!--
        画。图层全是绝对定位的，百分比以这个盒子为参照 ——
        它必须和 .stage 一样大（桌面就是 inset:0，窄屏它才自己撑住 16:9）。
      -->
      <div class="stage__art">
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
      </div>

      <!--
        字。桌面和被点名的宽屏一样是「铺满画的一层」，本身不吃鼠标
        （.intro 自己也是 pointer-events:none，联系方式那两枚图标自己开回来）。
      -->
      <div class="stage__caption">
        <slot />
      </div>
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

/*
 * 屋里：舞台**回到文档流**（RoomView 传 flow）。
 *
 * 它不再 fixed 铺满视口 —— 这是「屋里要有页脚」的前提：fixed 的舞台会把
 * 页脚（在 App.vue，挂在 RouterView 后面）整个顶到屏幕外。代价是这一页
 * 从此可以往下滚。
 *
 * min-height 取「视口高减导航」，是为了让舞台仍然占满首屏：
 * 页脚因此落在首屏下沿之外 —— 往下滚一点点才见面，视口再高也不会在
 * 页脚底下留一条空白纸。
 *
 * padding-top 归零：导航是 sticky 的、自己占文档流里的一条（见 SiteNav），
 * 桌面上那条 --nav-h 的让位在这里就成了多出来的空档。
 * （窄屏那一段早就这么做了，见文件末尾。）
 *
 * **景靠上，不居中**（align-items: flex-start）：屋里现在也是「导航 + 图 +
 * 内容 + 页脚」的一套页，图的上沿就该和项目 / 影像那两张门面图一样**贴着
 * 导航下沿**。湖边不跟着改 —— 它整页就是一幅景，居中那道纸边是「裱在纸上的
 * 画」那个说法，见 .stage-wrap 上面那段。
 *
 * 代价：景下面会留出一大条纸（实测 1440×900 上是 139px）才开始页脚。
 * 这一条**以前是上下各一半**的（居中时上 69 / 下 69）—— 现在上下不等，
 * 上边为 0、全是下边。这是「贴住导航」与「占满一屏」两个要求夹出来的结果。
 *
 * 用两个类名写选择器（而不是单写 --flow）：这条规则要和上面的
 * --nav-clearance 抢 padding-top、和 .stage-wrap 抢 align-items，
 * 靠 . 的数量压过它们，不靠谁写在后面。
 */
.stage-wrap--nav-clearance.stage-wrap--flow {
  position: static;
  height: auto;
  min-height: calc(100vh - var(--nav-h));
  min-height: calc(100svh - var(--nav-h));
  padding-top: 0;
  align-items: flex-start;
}

.stage {
  position: relative;
  width: min(100%, var(--stage-w));
  aspect-ratio: 2848 / 1602;
  overflow: hidden;
}

/* 画：桌面就是 .stage 本身那一块，图层的百分比坐标因此不受影响 */
.stage__art {
  position: absolute;
  inset: 0;
}

/* 字：同样铺满 .stage；不吃鼠标，里面的链接自己开（见 RoomView 的 .links） */
.stage__caption {
  position: absolute;
  inset: 0;
  pointer-events: none;
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

/* ==================================================================
   窄屏（手机）：画在上，字在下

   画是 2848:1602 的横幅。手机竖屏的视口高差不多是宽的两倍，所以
   「画占满屏宽」时它只有约屏幕四分之一高（375×667 上实测 360×203），
   上下各留一大片空纸；而压在画上那几行字是按 16:9 的高度排的 ——
   块高 176px 对画高 203px，于是：名字折成两行、后面几行被画的下沿裁掉，
   引导语还会横着顶出画的右沿（`white-space: nowrap`）。
   上下留纸边本身是桌面就有的说法，**不算 bug**；被裁掉的字才算。

   所以窄屏不再把字压在画上，改成纵向流式：画占满屏宽，字落到画下面的纸上。
   字号阶梯、颜色、字距与动效仍然只在 main.css 的 .intro 那份里（那里还有
   一段窄屏的覆盖）；这里只管**盒子**。

   断点取 640px（Tailwind 的 sm，全站唯一一处窄屏分支）：
   比这更宽的手机横屏与桌面窗口，16:9 的画在高度上是铺得开的，
   照桌面那套「字压在景上」更好看。
   ================================================================== */
@media (max-width: 640px) {
  /*
    整块（画 + 字）在屏内居中，上下留一样宽的纸边 ——
    和桌面「像一幅裱在纸上的画」是同一个说法。
    用 svh 而不是 vh：手机浏览器的地址栏收起／展开会让 vh 变，
    svh 取最小那一档，字不会被地址栏压住。
  */
  .stage-wrap {
    position: static;
    height: auto;
    flex-direction: column;
    justify-content: center;
    min-height: 100vh;
    min-height: 100svh;
  }

  /*
    屋里那条导航是 sticky 的、自己占文档流里的一条（64px），
    舞台不用再让位 —— 桌面上那个 padding-top 在这里要撤掉，
    否则空出一条导航的空白。剩下的高度才是要居中的范围。
  */
  .stage-wrap--nav-clearance {
    padding-top: 0;
    min-height: calc(100vh - var(--nav-h));
    min-height: calc(100svh - var(--nav-h));
  }

  /*
    上面那条 --flow 里的 `align-items: flex-start` 是给**桌面**写的：
    那里主轴是横向，它管的是纵轴（景靠上）。窄屏这一层的 `flex-direction`
    翻成了 column，align-items 管的是横轴 —— 再留着 flex-start 就是左边对齐，
    不再是居中（视口又矮又宽、--stage-w 收得比 100% 还窄时才看得出来）。
    纵向的居中由 `justify-content: center` 给，还和湖边一致。
  */
  .stage-wrap--nav-clearance.stage-wrap--flow {
    align-items: center;
  }

  /* 这一层不再裁：字要落到它的下沿之外去 */
  .stage {
    aspect-ratio: auto;
    overflow: visible;
  }

  /* 画自己撑住 16:9 的比例（宽高只有它一个出口） */
  .stage__art {
    position: relative;
    width: 100%;
    aspect-ratio: 2848 / 1602;
    overflow: hidden;
  }

  /* 字回到文档流：位置由 main.css 的窄屏那段给 */
  .stage__caption {
    position: static;
  }

  /*
    可点范围托底到 44px 见方（WCAG 2.5.5 的建议值）。
    画缩到屏宽之后，小木屋只有约 31×21、相机约 36×25 —— 手指点不准。
    热点里最挤的一处是相机右沿到电脑左沿的约 12px 空隙，44px 兜完还剩几像素，
    不会互相抢点击。只在窄屏生效：桌面上那几件东西本来就远大于这个尺寸。
  */
  .hot__link {
    min-width: 44px;
    min-height: 44px;
  }
}
</style>
