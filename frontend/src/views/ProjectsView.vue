<script setup lang="ts">
/**
 * 做过的东西。屋里那台电脑点开就是这里。
 *
 * 从上到下三段：
 *   1. 门面图（高空云海，一架飞机）—— 紧贴导航条，宽度同另外三个视图的主图
 *      （走 `.plate` = `--page-w` 本身）。清单是正文，另走 `.shell`（带内边距）。
 *   2. **项目清单** —— 每个项目只有标题 / 关键字 / 摘要 + 一个看详情的口子
 *   3. 页尾一句实话（「目前 N 个项目，都在这上面了。」）—— 由 PagePlaceholder
 *      的 `footnote` 给。**不再有「这一页还在造」那种自我否定**：清单就在上面摆着
 * 前两段的关系由 PagePlaceholder 定：图是它的 `image`，清单走它的默认 slot。
 *
 * **排版走首页那一路的纯黑**（`--ink-black`）而不是纸面上的灰墨 `--ink`：
 * 首页那三行字压在亮天空上用的是纯黑，这一页要求「和首页一样的黑字」。
 * 全页只有一个颜色，层级全靠**字号 + 透明度**分出来 ——
 * 序号最浅，摘要次之，标题与关键字是实的。
 *
 * 每一项只留用户点名的四样东西（标题 / 关键字 / 摘要 / 看详情），
 * 时间、角色、指标都收进详情页 —— 列表页是目录，不是简历。
 */
import PagePlaceholder from '@/components/PagePlaceholder.vue'
import { RiArrowRightSLine } from '@remixicon/vue'
import { projectsByDate } from '@/data/projects'
import banner from '@/assets/backgrounds/projects/projects.webp'

/** 序号 01 / 02 / 03，和首页「01 | 27届 | INTP」是同一种数法。 */
function ordinal(index: number): string {
  return String(index + 1).padStart(2, '0')
}
</script>

<template>
  <PagePlaceholder
    label="做过的东西"
    :image="banner"
    image-alt="高空云海，一架飞机正在云上飞过"
    :footnote="`目前 ${projectsByDate.length} 个项目，都在这上面了。`"
  >
    <section class="shell projects">
      <ol class="projects__list">
        <li v-for="(project, i) in projectsByDate" :key="project.slug" class="project">
          <!--
            整行是一个链接：鼠标落在标题上也点得进详情。
            右边那个「看详情」是它的**可见口子** —— 整行可点这件事
            不说出来是猜不到的，所以明写一行。
          -->
          <RouterLink class="project__row" :to="`/projects/${project.slug}`">
            <span class="project__index figure" aria-hidden="true">{{ ordinal(i) }}</span>

            <span class="project__body">
              <h2 class="project__name">{{ project.name }}</h2>
              <ul class="project__keywords">
                <li v-for="keyword in project.keywords" :key="keyword" class="project__keyword">
                  {{ keyword }}
                </li>
              </ul>
              <span class="project__summary">{{ project.summary }}</span>

              <span class="project__more">
                <span class="rule-link">看详情</span>
                <RiArrowRightSLine size="14px" class="inline-block shrink-0 align-[-0.125em]" />
              </span>
            </span>
          </RouterLink>
        </li>
      </ol>
    </section>
  </PagePlaceholder>
</template>

<style scoped>
/*
 * 清单。上边距把它和门面图拉开，下边距交给 PagePlaceholder 的那句按语
 * （它自己还有 2.5rem）—— 两处加起来才是「清单 / 按语」之间的距离。
 */
.projects {
  padding-top: 4.75rem;
  padding-bottom: 1.5rem;
  /*
   * 这一页的「字重」旋钮。
   *
   * `font-weight` 在这两页上是**空的**，别去改它：站上两套 webfont 各只有一档
   * （Wotfard 400 / 霞鹜文楷 300），汉字正文走系统字体。实测（40px 同一串汉字，
   * 数渲染出来的深色像素）：300 / 400 / 500 三档的墨量**分毫不差**，写到 600 才动 ——
   * 而 600 是浏览器自己描的合成加粗，一次跳 +74~83%，那是「再加粗一倍」，不是「一点」。
   *
   * 所以「粗一点」只能自己描：宽度按 em 给（随字号缩放，大标题与正文同一个比例）。
   * **这个数是量出来的，不是估的** —— 在详情页那段 16px 正文上把同一块区域
   * 截图数深色像素（同一个基准、同一台机器）：
   *     0.0125em → +6.8% ／ 0.02em → +19.9% ／ 0.03em → +45.3%
   * 取 0.02em：笔画约粗两成，看得出来，又没到把楷体的笔画糊在一起。
   *
   * ⚠️ **别照大字的测量去折算小的**：细描边不是线性的。同样这个效果，在 40px 的
   * canvas 上 0.25px 就量到 +11%，换成 em 写进页面（0.008em → 16px 上 0.128px）
   * 实测只有 +0.6% —— 等于没加。要调这个值，**必须按真实页面重新量一遍**。
   * 想还原就直接删掉这一行。
   *
   * 它是继承属性，写在这个外框上一次就覆盖全页（子元素、孙元素都实测过），
   * 所以页面里各处不要各写一份。
   */
  -webkit-text-stroke: 0.02em currentColor;
}

/*
 * 序号占左边一条固定的槽（4rem），标题 / 关键字 / 摘要叠在右边。
 * 好处是三项的正文左边界落在同一条线上，序号位数变多也不会挤到正文。
 */
.project__row {
  display: grid;
  grid-template-columns: 4rem 1fr;
  align-items: start;
  padding-block: 2.25rem;
}

/* 项与项之间一条淡线。首项不要。 */
.project + .project {
  border-top: 1px solid var(--line-soft);
}

/* 序号：最浅的一档，只用来数数，不参与阅读 */
.project__index {
  padding-top: 0.5rem;
  font-size: 0.8125rem;
  letter-spacing: 0.16em;
  color: var(--ink-black);
  opacity: 0.32;
}

.project__body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

/*
 * 标题。`font-weight` 不写：霞鹜文楷只有 300 一档，写别的数也是白写（见 .projects）。
 * 粗度由外框那一行描边统一给，这里只定字号。
 */
.project__name {
  font-size: clamp(21px, 1.85vw, 27px);
  line-height: 1.55;
  letter-spacing: 0.02em;
  color: var(--ink-black);
}

/*
 * 关键字：和首页那几行小字同一路，靠字距拉开。
 *
 * 透明度 0.52 → 0.56：前者对纸只有 4.22:1，**在 13px 这种小字号上
 * 已经低于 AA 的 4.5**，加上抗锯齿再掉一档就偏糊了。0.56 是 4.7:1，
 * 改动幅度小到看不出层级变化，但把这一行从「勉强」挪到「读得清」。
 *
 * 项与项之间**没有分隔字符**，只有一条画出来的竖线（见 .project__keyword）。
 * 原来是 `join('   ·   ')`：那个 `·` 在中文里是「间隔号」，按规矩只该
 * 夹在汉字中间（阿·枣），拿来分英文缩写（`MTRM · PEFT / LoRA`）既不合
 * 中文规矩，又和内容里本来就有的 `/` 撞脸。逗号、顿号、斜杠都有这个问题 ——
 * 所以这里干脆不用标点，画一条线：站上分层次本来就靠排线与留白。
 *
 * 折行是允许的（`flex-wrap`）：项多起来自己往下走，不挤成一行。
 * 代价是折行后行首会留一条孤立的竖线，桌面视口下四个关键字走不满一行，
 * 见不到这种情况。真遇到了再给 `:first-child` 之外加一条按行分组的规矩。
 */
.project__keywords {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.7em;
  margin-top: 0.85rem;
  font-size: 0.8125rem;
  letter-spacing: 0.14em;
  color: var(--ink-black);
  opacity: 0.56;
}

.project__keyword {
  display: inline-flex;
  align-items: center;
  gap: 0.7em;
}

/*
 * 竖线：1px 宽、0.8em 高，跟着字号走。颜色取 currentColor。
 *
 * 透明度给 0.8 而不是 1：父级那 0.56 会**再乘一次**（合成后约 0.45），
 * 于是它比关键字浅小半档 —— 是分隔，不是内容。**别再往下调了**：
 * 试过 0.6（合成 0.34），在真机上淡到像是屏幕上的脏点，等于没画。
 * 装饰性线条不适用 WCAG 的正文阈值，但「看不见的分隔」是零分。
 */
.project__keyword + .project__keyword::before {
  content: '';
  width: 1px;
  height: 0.8em;
  background: currentColor;
  opacity: 0.8;
}

/*
 * 摘要：读的那一行，行高放宽。
 *
 * **不设宽度上限**，撑满正文列 —— 44 个汉字一行的 max-w-prose 是给
 * 长文的阅读行宽定的（详情页正文仍在用），放在这里会让摘要只占正文列
 * 三分之二、平白多出一截空白。列表项的摘要只有一两行，宽一点更好扫。
 * 上限仍由 `.shell`（= --page-w）兜着，超宽屏也不会拉到读不动。
 */
.project__summary {
  margin-top: 0.9rem;
  font-size: 1rem;
  line-height: 1.95;
  color: var(--ink-black);
  opacity: 0.62;
}

/*
 * 「看详情」。平时压得比摘要还浅，鼠标进到这一行才实起来 ——
 * 三个项目的这一行因此不会抢标题的注意力。
 */
.project__more {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  margin-top: 1.5rem;
  font-size: 0.8125rem;
  letter-spacing: 0.16em;
  color: var(--ink-black);
  /* 0.45 对纸只有 3.32:1 —— 它是这一项唯一的行动口子，按 AA 要 4.5:1。
     0.55（4.55:1）是踩线的最小值；悬停仍然实到 1，层级照旧。 */
  opacity: 0.55;
  transition: opacity 220ms linear;
}

/*
 * 悬停：整行亮起来。下划线从左边长出来（.rule-link 自带那套），
 * 但它默认挂在自己的 hover 上 —— 鼠标落在标题上时也该长，
 * 所以由父级来触发。
 */
.project__row:hover .project__more,
.project__row:focus-visible .project__more {
  opacity: 1;
}

.project__row:hover .rule-link::after,
.project__row:focus-visible .rule-link::after {
  transform: scaleX(1);
}
</style>
