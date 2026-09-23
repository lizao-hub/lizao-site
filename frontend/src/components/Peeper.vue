<script setup lang="ts">
/**
 * 留言页写留言那一行右边的小人：眼睛跟着鼠标转，高跟那一行一样。
 *
 * ## 两层：脸是前景，瞳孔在它后面
 *
 * `assets/peeper/` 里两张图都是 1254×1254、透明底、同一套坐标：
 *
 *   - `face.webp` —— 人物，**眼睛那两处是镂空的**（alpha = 0 的洞）。
 *   - `pupil.webp` —— 只有两颗瞳孔，其余全透明。
 *
 * 摆法是**瞳孔在下、脸在上**，两层同尺寸叠住。瞳孔整层平移，被脸上那两个
 * 洞裁掉 —— 于是它怎么动都不会跑到眼白外面，也**不需要 `clip-path` 去算眼眶**。
 * 洞里没被瞳孔盖住的部分是透明的，露出背后的纸色，看起来正好是眼白。
 *
 * 这是这两张素材的关键：**别把瞳孔摆到脸上面**。放上去就没了裁切，
 * 一动就糊到眼皮和脸上（试过，一眼假）。
 *
 * ## 跟随：只看方向，不追坐标
 *
 * 算的是鼠标相对小人的**方向**（除以距离做归一），瞳孔沿这个方向偏移一个
 * 固定量。所以它不会「粘」在光标上，而是像人一样往那边瞟一眼；鼠标贴到脸上
 * 时没有方向可言，就看回正前方。
 *
 * 用的是 rAF 而不是每次 mousemove 直接写 transform：把「算方向」从高频事件里
 * 挪出来，一帧最多写一次样式。
 *
 * ## 位移为什么是百分比
 *
 * 写成**相对画布的百分比**（`translate(x%, y%)`），不是像素：小人尺寸随视口走
 * （见样式里的 clamp），百分比自动跟着缩放，不用去读 `getBoundingClientRect`
 * 折算像素。图是正方形，`translateX` / `translateY` 的百分比基数同宽同高，
 * 两轴共用一个数就行。这一层又正好与画布同尺寸，所以百分比基数就是画布。
 *
 * ## 位置校准（换素材要重量）
 *
 * 两颗瞳孔相对眼洞整体偏右下一点点（画的时候手放的）：眼洞中心平均
 * (514.8, 605.5)、瞳孔中心平均 (517.5, 610.8)，差 (−2.75, −5.25) 源像素。
 * 除以 1254 约等于 (−0.22%, −0.42%)，就是下面 `BASE` 那两个常数 ——
 * 把整层拉回眼洞中心的固定偏移。量法是拿两张图的 alpha 通道找洞与瞳孔的行列占用。
 */
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import faceSrc from '@/assets/peeper/face.webp'
import pupilSrc from '@/assets/peeper/pupil.webp'

/**
 * 瞳孔能偏离眼眶中心多远（相对画布的百分比）。
 *
 * 2026-09-23 从 3 收到 1.5（减半）：3 那档在写留言那一行里显得太跳，
 * 现在是很轻的一瞟。再往下收（1 以下）就看不太出它在跟谁了。
 */
const MAX_GAZE = 1.5
/** 把瞳孔层拉回眼洞中心的固定偏移（见文件头「位置校准」）。 */
const BASE_X = -0.22
const BASE_Y = -0.42
/**
 * 跟随的两道阈值（占画布宽的比例）：
 *   - `DEAD_ZONE` 之内当作「没有方向」，看回正前方；
 *   - 从它到 `FULL_ZONE` 之间偏移**渐强**（线性），再远就是满偏移。
 * 有这一段渐变，光标从小人身边滑过时瞳孔是「慢慢瞟过去」的，
 * 不会在死区边界上从正中一步跳到满偏。
 */
const DEAD_ZONE = 0.035
const FULL_ZONE = 0.16

/** 瞳孔层当前的位移（相对画布的百分比），直接进 `translate()`。 */
const gaze = reactive({ x: BASE_X, y: BASE_Y })

/** 量方向用的外框（= 画布那一块，见模板）。 */
const stageEl = ref<HTMLElement | null>(null)

let raf = 0
let pointer: MouseEvent | null = null

function center() {
  gaze.x = BASE_X
  gaze.y = BASE_Y
}

function track() {
  raf = 0
  const stage = stageEl.value
  if (!stage || !pointer) return

  const rect = stage.getBoundingClientRect()
  const dx = pointer.clientX - (rect.left + rect.width / 2)
  const dy = pointer.clientY - (rect.top + rect.height / 2)
  const dist = Math.hypot(dx, dy)

  // 光标就在脸上：没有方向，看正前方
  if (dist < rect.width * DEAD_ZONE) {
    center()
    return
  }

  const span = rect.width * (FULL_ZONE - DEAD_ZONE)
  const strength = Math.min(1, (dist - rect.width * DEAD_ZONE) / span)
  const magnitude = MAX_GAZE * strength

  // dx / dist、dy / dist 就是单位方向向量，不必再走一次 atan2
  gaze.x = BASE_X + (dx / dist) * magnitude
  gaze.y = BASE_Y + (dy / dist) * magnitude
}

function onMove(event: MouseEvent) {
  pointer = event
  if (!raf) raf = requestAnimationFrame(track)
}

/**
 * 光标离开文档时回正 —— 否则瞳孔会一直停在「最后看向的那个方向」上，
 * 看起来像卡住了。用 `mouseout` 而不是 `mouseleave`：
 * `relatedTarget` 为 null 才代表光标出了文档（元素之间移动时它指向新目标），
 * 这个判定在各浏览器上比 `document` 的 `mouseleave` 可靠。
 */
function onOut(event: MouseEvent) {
  if (!event.relatedTarget) center()
}

onMounted(() => {
  // 见文件尾：关掉动效偏好的人不接这套跟随，瞳孔停在正中
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  window.addEventListener('mousemove', onMove, { passive: true })
  document.addEventListener('mouseout', onOut)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onMove)
  document.removeEventListener('mouseout', onOut)
  if (raf) cancelAnimationFrame(raf)
})
</script>

<template>
  <!--
    装饰：不参与语义（读屏不必念出一个「会看人的小人」），也不接鼠标
    （它不可点，见样式里的 pointer-events）。
    窄屏（≤640px）整块不显示，理由见样式。
  -->
  <div class="peeper" aria-hidden="true">
    <div ref="stageEl" class="peeper__stage">
      <!--
        顺序即层次，别调：瞳孔在前、脸在后 —— 脸把瞳孔裁在眼洞里（见文件头）。
      -->
      <img
        class="peeper__pupil"
        :src="pupilSrc"
        alt=""
        :style="{ transform: `translate(${gaze.x}%, ${gaze.y}%)` }"
      />
      <img class="peeper__face" :src="faceSrc" alt="" />
    </div>
  </div>
</template>

<style scoped>
/*
 * 小人**不带底**：整块透明，直接趴在纸面上。人物是透明底的原图，
 * 眼睛那两个镂空也是透的 —— 于是它跟纸是连着的，不是贴了一张白卡片上去。
 *
 * ⚠️ 「眼白靠纸」只在浅底上成立：洞里没被瞳孔盖住的部分露的就是**背后的东西**。
 * 挪到深色或花的东西上面要另补一层白（把 `face` 的 alpha 通道填白当底层），
 * 否则眼白会跟着变暗。
 *
 * ## 尺寸：高跟着写留言那一块，宽由正方形跟出来
 *
 * 它是留言页那一行（`.guestbook__write`）的第二个 flex 项，父级 `align-items:
 * stretch` 把它的**高**拉到跟表单一样。宽没有写死 —— 原图是正方形，
 * 这里的 `aspect-ratio: 1 / 1` 把高换算成宽。
 *
 * 所以它**没有尺寸旋钮**了（曾经有个 `--peeper-size`）：它现在绑在表单的高上，
 * 想让它大一点，就加高表单（比如 `rows` 多一行）。
 *
 * 定位全交给父级，这里不写 `position`。
 * （曾经用 `position: absolute` 把它挂到页面右下角 —— 那版要 PagePlaceholder 的
 *   `.page-bottom` 是 `position: relative`，否则最近的定位祖先会落到 App.vue
 *   那个把页脚也包在里面的盒子上，小人会掉到页脚下面去。）
 */
.peeper {
  /* 高由父级 stretch 定（= 写留言那一块的高），宽按原图的正方形跟出来 */
  aspect-ratio: 1 / 1;
  /* 不可点，也不该拦住底下的链接与文字的点击 */
  pointer-events: none;
  user-select: none;
}

/* 画布那一块：正方形，两层图都铺在这里，百分比位移以它为准 */
.peeper__stage {
  position: relative;
  width: 100%;
  height: 100%;
}

/*
 * 两层同尺寸叠住：
 *   - `pupil` 绝对定位、上层平移（`:style` 里的 translate）。
 *   - `face` 盖在它上面，靠自己的镂空把瞳孔裁在眼洞里。
 * 两张都是正方形原图，`contain` 在正方形里就是刚好铺满、不变形。
 */
.peeper__pupil,
.peeper__face {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/*
 * 窄屏不显示。它现在是个 flex 项，会跟表单抢宽度（表单要留够 22rem 才读得下去），
 * 而窄屏在站里只做三件事（挪字、收边距、托 44px），蹲一个角色不是其中一件。
 * 想在手机上也留着，把这一段删掉，再把 `gap` 收一档。
 */
@media (max-width: 640px) {
  .peeper {
    display: none;
  }
}
</style>
