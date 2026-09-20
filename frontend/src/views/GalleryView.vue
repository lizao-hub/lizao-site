<script setup lang="ts">
/**
 * 影像。屋里桌上那台相机点开就是这里。
 *
 * 从上到下三段（和项目页同一种节奏）：
 *   1. 门面图 —— 举着相机取景，取景框里正是湖边那幅景。这页是相机的去向，
 *      图就该是「正透过相机在看」。摆放由 PagePlaceholder 负责。
 *   2. **照片墙** —— 后端 `/media/photos/` 下的每张照片，一行三张、正方形。
 *      顺序、增删都由后台管理页控制，前端只负责拉清单渲染。
 *   3. 页尾一句实话（「共 N 张，还会再加。」）—— 由 PagePlaceholder 的
 *      `footnote` 给。**不再有「还在造」那句**：照片就在上面摆着。
 *
 * **加图走后台**：在 `/admin` 上传，照片写进后端目录、立即可见，
 * 不用重新构建（照片是用户内容，不打包进静态产物）。
 */
import { ref, onMounted } from 'vue'
import PagePlaceholder from '@/components/PagePlaceholder.vue'
import banner from '@/assets/backgrounds/gallery/gallery.webp'

/**
 * 我的照片。
 *
 * **运行时**从后端拉清单（`GET /api/photos`），每张以 `/media/photos/<name>`
 * 的形式由后端直接发文件。`/api/photos` 返回的 `url` 就是现成地址。
 *
 * 这样后台上传 / 排序 / 删除会**立刻反映到网站上**，不用重新构建 ——
 * 照片是用户内容，不该被打进静态产物（之前打包进 dist，上传了也看不到，
 * 就是因为构建期就把目录定死了）。顺序由后端按文件名编号排好，
 * 和后台管理页看到的一致。
 *
 * 后端没起：照片墙留空，门面图与正文照常。
 */
const photos = ref<{ url: string; alt: string }[]>([])

/** 序号 01 / 02 / 03，和首页、项目页是同一种数法。 */
function ordinal(index: number): string {
  return String(index + 1).padStart(2, '0')
}

onMounted(async () => {
  try {
    const res = await fetch('/api/photos')
    if (!res.ok) return
    const data = (await res.json()) as { photos: { url: string }[] }
    photos.value = data.photos.map((p, i) => ({
      url: p.url,
      alt: `影像 ${ordinal(i)}`,
    }))
  } catch {
    // 后端没起：照片墙留空，不阻塞正文
  }
})
</script>

<template>
  <PagePlaceholder
    label="影像"
    :image="banner"
    image-alt="举着相机取景"
    :footnote="`共 ${photos.length} 张，还会再加。`"
  >
    <!--
      照片墙走 .plate（= --page-w 本身），和上面那张门面图**同宽同边** ——
      这一页上下的图因此都落在同一条线上，也和另外三个视图的主图对齐。
    -->
    <section v-if="photos.length" class="plate gallery">
      <h2 class="sr-only">照片</h2>

      <ul class="gallery__grid">
        <li v-for="photo in photos" :key="photo.url" class="photo">
          <img
            class="photo__img"
            :src="photo.url"
            :alt="photo.alt"
            loading="lazy"
            decoding="async"
          />
        </li>
      </ul>
    </section>
  </PagePlaceholder>
</template>

<style scoped>
/*
 * 照片墙。上边距把它和门面图拉开，下边距交给 PagePlaceholder 的按语
 * （它自己还有 2.5rem）—— 两处加起来才是「照片 / 按语」之间的距离。
 * 这两个数和项目页清单是同一套，两页因此是同一种节奏。
 */
.gallery {
  padding-top: 4.75rem;
  padding-bottom: 1.5rem;
}

/*
 * 一行三张。列间距与行间距同一个值，横竖看起来才是均匀的一片。
 *
 * 间距放得比正文松：一排照片挨太紧会糊成一整块纹理，看不出每张在拍什么。
 * 2.5rem（正常桌面视口下 40px）下三张之间才有呼吸。
 * **代价是格子跟着变小** —— 三列都是 1fr，间距吃掉多少格子就少多少
 * （--page-w 914 时约 286 → 275px 见方），所以别再往上加太多。
 *
 * 列数在窄屏收到两档：≤640px 只收间距、仍是三张，≤480px 改成两张
 * （见样式末尾那段 —— 375px 上三张只剩 107px 见方，看不出拍的是什么）。
 */
.gallery__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 2.5rem;
}

/*
 * 一张照片 = 一块白相纸：正方形，四周一圈白边，中间是裁成正方形的图。
 *
 * 正方形走 aspect-ratio。Tailwind 的 preflight 设了 `box-sizing: border-box`，
 * 而 border-box 下 aspect-ratio 算的是**外框** —— 于是连白边一起是正方形，
 * 白边不会把格子挤成上下比左右瘦的长条。这条要是改了 box-sizing，
 * 整片就会歪。
 *
 * 白边用**百分比**（相对格子宽度，275px 的格子约合 10px），
 * 不用 px 也不用 vw：格子的实际尺寸由 --page-w 决定，而 --page-w 同时
 * 跟视口宽和视口高走 —— 写死 px 在大屏会显得太细，写 vw 又会在
 * 宽而矮的屏上偏厚。百分比跟着格子一起缩放，任何视口下都是同一个比例。
 * （格子宽度 = (--page-w − 两条 gap) / 3，见 .gallery__grid。）
 *
 * 悬停时整块相纸放大一点、投影跟着拉开 —— 像把它从纸面上捏起来。
 * 只走 transform 与 box-shadow（不动 width / padding），所以**不推挤邻居**：
 * 放大 5% 在 40px 的间距里铺得开（单边各让出 7px，剩下 26px），两张不会叠上。
 * 缓动曲线与时长跟站上的按钮是同一套（那条弹性曲线）。
 */
.photo {
  display: block;
  aspect-ratio: 1 / 1;
  padding: 3.5%;
  background: var(--photo-frame);
  border: 1px solid var(--line-soft);
  /* 一点硬偏移，像压在纸上的实体 —— 站上的立体感靠色块偏移，不用模糊投影 */
  box-shadow: 2px 2px 0 var(--line-soft);
  transition:
    transform 200ms cubic-bezier(0.34, 1.56, 0.64, 1),
    box-shadow 200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

.photo:hover {
  transform: scale(1.05);
  /* 投影拉开 = 离纸面更远，仍然没有模糊量（模糊投影是站上的禁忌） */
  box-shadow: 6px 6px 0 var(--line-soft);
}

/*
 * 减少动效时不留「放大」这个过程，直接落到悬停的终态。
 *
 * main.css 那条全站规则只把时长压到 0.01ms，缩放本身还在 ——
 * 而这个效果纯属装饰，没必要让对动效敏感的人看到画面一跳。
 * 光标也**不改成手型**：照片仍然不可点（没有大图 / 灯箱），
 * 手型会许一个按下去什么也不会发生的承诺。
 */
@media (prefers-reduced-motion: reduce) {
  .photo:hover {
    transform: none;
  }
}

/*
 * 图裁满内框：原图什么比例都行，摆进来一律是正方形，不拉变形、不留白边。
 * 裁掉的是构图边缘 —— **竖图和人像会被裁得比较狠**，
 * 将来真放进这种图，得回来给它们单独一档（比如 `object-position: top`）。
 */
.photo__img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/*
 * 窄屏：间距跟着格子一起收。
 *
 * 桌面那 2.5rem（40px）是按 275px 的格子定的 —— 间距 / 格子 ≈ 0.15。
 * 手机上一个 40px 的间距对着只剩 113px 的格子，比例变成 0.35：
 * 一眼看过去是「三张浮在纸上的照片」，不是「一面照片墙」。
 * 1rem 把比例拉回 0.13，格子和桌面一样是「贴着一点缝」的关系。
 *
 * 另外给整面墙加一条左右内边距：照片墙走 .plate（= --page-w 本身、
 * 不带正文内边距），桌面上它和门面图同宽、顶到版心两端是对的；
 * 手机上版心就是屏幕，最左最右那两张会直接贴着屏幕边 —— 那不是出血，
 * 是没排好。1.25rem 和 .shell 在窄屏那一档同一个数，图与字因此同边。
 */
@media (max-width: 640px) {
  .gallery {
    padding-inline: 1.25rem;
  }

  .gallery__grid {
    gap: 1rem;
  }
}

/*
 * 更小的手机（≤480px）：三列改成两列。
 *
 * 三列是这一页的节奏，能保就保 —— 但 375px 上每格只剩 (375−40−32)/3 ≈ 100px，
 * 再减去 3.5% 的白边，图只有 93px 见方，比一枚图标大不了多少，
 * 「一面照片墙」的说法在那是撑不住的。两列换来 157px，是能看清构图的尺寸。
 * 480px 这条线是按「三列时每格能否到 140px」定的：再宽一点三列就够用。
 */
@media (max-width: 480px) {
  .gallery__grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
