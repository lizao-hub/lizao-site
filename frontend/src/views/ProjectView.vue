<script setup lang="ts">
/**
 * 一个项目的详情页。/projects/<slug>。
 *
 * **这一页是极简的：单栏、一条细线。**
 * - 没有门面图、没有卡片、没有阴影 —— 全页只有字、留白和分隔线，
 *   **外加极少数「不放就说不清」的实拍**（`video`，到目前全站只有一处）。
 *   色块偏移是站上的手绘语言，读数的地方用不上。
 * - **圆角不在此列。** 早先这一页连圆角一起禁了，但禁掉的是「装饰的圆角」
 *   （卡片、相框），**会按下去的东西不该被连坐** —— 留言页那个按钮跟着站上那组
 *   手绘圆角走，它让「这能点」一眼可读，比一条直角细线管用。
 * - 外框走 `.shell`（= --page-w，和其他页、导航同一条左右边界），
 *   里面的正文再收一道 `max-w-prose`（44em）—— 舒服的阅读行宽不跟着外框变宽。
 *
 * 内容顺序：时间/角色 → 标题 → 关键字 → 引言 → 分节正文 → 结果 → 回列表。
 * **出口只有一个，在页面最下方**（`做过的东西`）。原来顶部还有一个同名口子、
 * 底部另有一组「上一件 / 下一件」，2026-09-20 都撤了：读完一页该做的事是
 * 决定去哪儿，而不是在同一条路上一直往下走。`data/projects.ts` 的
 * `projectNeighbours` 因此暂时没有落点（函数留着）。
 *
 * 留言区 2026-09-23 搬走了：原来接在这里（`ProjectGuestbook`，按 slug 取），
 * 现在独立成一页 `/guestbook`（见 views/GuestbookView.vue）—— 一条
 * 「网站做得不错」并不属于某个项目，分着看等于把一面墙切成两半。
 * 这一页因此**不再发任何请求**，正文就是全部。
 *
 * 一小节（block）由几样可选的东西拼出来：分类小字（`kicker`）、引子、正文、
 * 现场画面（`video`）、这一节自己的数字（`stats`）、一串并列的短句（`points`）、
 * 一张表（`table`）、一条通路（`flow`），最后是旁白（`aside`）。
 * **它们仍是同一套东西**，不是新装饰：大号数字复用页尾「结果」那套排法，
 * 表只有几条细线、全表只亮一行（`highlight`），短句前面一枚淡短横，
 * 视频也只垫一条和表格同族的细线，通路靠序号、留白和一条细线分阶段 ——
 * **没有一个方块、没有一个箭头**。
 * 加这几样是因为项目页真要讲规模、基准、现场和流向，光靠段落说不清 ——
 * **能写成一段话的，就别搬出表格来；文字能作证的，就别搬出视频来。**
 * 这一页还是「读数的地方」，不是面板，更不是作品集。
 */
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { RiArrowLeftSLine } from '@remixicon/vue'
import { findProject } from '@/data/projects'

const route = useRoute()

/**
 * 用 computed 而不是取一次：路由切到另一个 slug 时组件不重建。
 *
 * 正文是**同步**的 —— 它就在 `data/projects.ts` 里，不依赖任何接口。
 * 这一页也**不发任何请求**（留言 2026-09-23 搬到独立一页去了）。
 */
const project = computed(() => findProject(String(route.params.slug)))

/** 小节序号 01 / 02 …，和清单页同一种数法（见 ProjectsView.vue） */
function ordinal(index: number): string {
  return String(index + 1).padStart(2, '0')
}
</script>

<template>
  <main class="page-bottom">
    <!--
      slug 对不上任何项目时什么都不渲染。正常路径不会走到这里 ——
      路由的 beforeEnter 会把不存在的 slug 退回清单页（见 router/index.ts），
      这个 v-if 只是兜住「守卫改了但组件没跟上」的那种情况。
    -->
    <article v-if="project" class="shell detail">
      <header class="detail__head">
        <p class="detail__meta">{{ project.period }} · {{ project.role }}</p>
        <h1 class="detail__name">{{ project.name }}</h1>
        <!--
          关键字：项与项之间是**一条画出来的竖线**，不是 `·`。
          理由和列表页同一份（见 ProjectsView.vue 的 .project__keywords）——
          中文的间隔号只该夹在汉字中间，拿来分英文缩写既不合规矩，
          又和内容里本来就有的 `/`（`PEFT / LoRA`）撞脸。
        -->
        <ul class="detail__keywords">
          <li v-for="keyword in project.keywords" :key="keyword" class="detail__keyword">
            {{ keyword }}
          </li>
        </ul>
      </header>

      <!-- 引言：详情页想说得更细就用 lede，没写才退回列表页那句摘要 -->
      <p class="detail__lede max-w-prose">{{ project.lede ?? project.summary }}</p>

      <div class="detail__blocks max-w-prose">
        <section v-for="(block, i) in project.blocks" :key="i" class="detail__block">
          <!--
            节头：序号 + 分类小字（「性能优化」「系统架构」）。**两样一起出现，
            或者都不出现** —— 单有序号只是装饰，单有分类看不出这一节是第几节。
            上面那条淡痕是这一页第三处线（前两处是表的分隔与旁白的左边），
            和「结果」小节用的是同一档（--line-soft）。
          -->
          <p v-if="block.kicker" class="detail__block-head">
            <span class="detail__block-index figure" aria-hidden="true">{{ ordinal(i) }}</span>
            <span class="detail__block-kicker">{{ block.kicker }}</span>
          </p>

          <h2 v-if="block.lead" class="detail__lead">{{ block.lead }}</h2>
          <p class="detail__text">{{ block.text }}</p>

          <!--
            现场画面。**全站只有这里会出现媒体**，一页最多一段（类型注释里写着判据）。
            说明排在图下面 —— 和表的 caption 在上面刻意相反：表先说要读什么，
            视频先看完再解释在看什么。
            播放控件走原生 `controls`，不另画一个按钮：这一页素得很，
            而原生控件自带键盘与读屏支持，自己画一个就得把那些一起补齐。
          -->
          <figure v-if="block.video" class="detail__figure">
            <video
              class="detail__video"
              :src="block.video.src"
              :poster="block.video.poster"
              :aria-label="block.video.caption ?? '项目演示视频'"
              controls
              muted
              loop
              playsinline
              preload="metadata"
            />
            <figcaption v-if="block.video.caption" class="detail__caption detail__caption--below">
              {{ block.video.caption }}
            </figcaption>
          </figure>

          <!--
            通路（`flow`）：按顺序推进的阶段，阶段里并排的就表示「同时发生」。
            判据写在 types/project.ts 的 ProjectFlow 上：流向本身是内容时才用。
          -->
          <figure v-if="block.flow" class="detail__figure">
            <figcaption v-if="block.flow.caption" class="detail__caption">
              {{ block.flow.caption }}
            </figcaption>
            <ol class="detail__flow">
              <li v-for="(stage, s) in block.flow.stages" :key="s" class="detail__flow-stage">
                <p class="detail__flow-title">
                  <span class="detail__flow-index figure" aria-hidden="true">
                    {{ ordinal(s) }}
                  </span>
                  <span>{{ stage.title }}</span>
                </p>

                <ul class="detail__flow-items">
                  <li v-for="(item, k) in stage.items" :key="k" class="detail__flow-item">
                    <span class="detail__flow-name">{{ item.name }}</span>
                    <span v-if="item.note" class="detail__flow-note">{{ item.note }}</span>
                  </li>
                </ul>
              </li>
            </ol>
          </figure>

          <!-- 这一节自己的数字。用的是和页尾「结果」同一套排法（见 .detail__metrics） -->
          <dl v-if="block.stats?.length" class="detail__metrics">
            <div v-for="stat in block.stats" :key="stat.label" class="detail__metric">
              <dt class="detail__metric-label">{{ stat.label }}</dt>
              <dd class="detail__metric-value figure">
                {{ stat.value }}<span v-if="stat.unit" class="detail__metric-unit">{{ stat.unit }}</span>
              </dd>
            </div>
          </dl>

          <!-- 并列的短句：流程、步骤、几件并排的事。一行一条，不打序号 -->
          <ul v-if="block.points?.length" class="detail__points">
            <li v-for="(point, j) in block.points" :key="j" class="detail__point">{{ point }}</li>
          </ul>

          <!-- 表：只有数字必须对齐时才出现。第一列是行名，走 th 让读屏也知道 -->
          <figure v-if="block.table" class="detail__figure">
            <figcaption v-if="block.table.caption" class="detail__caption">
              {{ block.table.caption }}
            </figcaption>
            <table class="detail__table">
              <thead>
                <tr>
                  <th v-for="(cell, j) in block.table.head" :key="j" scope="col">{{ cell }}</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, r) in block.table.rows"
                  :key="r"
                  :class="{ 'is-mark': block.table.highlight === r }"
                >
                  <!-- 第一列是这一行的名字，走 th / scope=row；其余是数据 -->
                  <th scope="row" class="detail__rowhead">{{ row[0] }}</th>
                  <td v-for="(cell, j) in row.slice(1)" :key="j" class="detail__cell">
                    {{ cell }}
                  </td>
                </tr>
              </tbody>
            </table>
          </figure>

          <!-- 旁白：比正文小一号、浅一档，缩进一行，一眼看得出不是资料 -->
          <p v-if="block.aside" class="detail__aside">{{ block.aside }}</p>
        </section>
      </div>

      <section v-if="project.metrics?.length" class="detail__results max-w-prose">
        <h2 class="detail__lead">结果</h2>
        <dl class="detail__metrics">
          <div v-for="metric in project.metrics" :key="metric.label" class="detail__metric">
            <dt class="detail__metric-label">{{ metric.label }}</dt>
            <dd class="detail__metric-value figure">
              {{ metric.value }}<span v-if="metric.unit" class="detail__metric-unit">{{ metric.unit }}</span>
            </dd>
          </div>
        </dl>

        <p v-if="project.metricsNote" class="detail__aside">{{ project.metricsNote }}</p>
      </section>

      <!--
        这一页唯一的出口，**在页面最下方**。
        它和正文同一档宽度、同一条左边界，安安静静一行小字 ——
        看完一个项目的人已经滚到底了，这里不需要再喊一次。
      -->
      <nav class="detail__foot" aria-label="返回清单">
        <RouterLink to="/projects" class="detail__back">
          <RiArrowLeftSLine size="15px" class="inline-block shrink-0 align-[-0.125em]" />
          项目列表
        </RouterLink>
      </nav>
    </article>
  </main>
</template>

<style scoped>
.detail {
  padding-top: 3.5rem;
  /*
   * 和清单页同一个「粗一点」：描边、按 em、写在外框上一次覆盖全页。
   * 为什么不用 `font-weight`、0.02em 是怎么量出来的，写在
   * `ProjectsView.vue` 的 `.projects` 那段注释里（不在这里重抄一遍）。
   */
  -webkit-text-stroke: 0.02em currentColor;
}

.detail__head {
  margin-top: 3rem;
}

/*
 * 元信息（时间 / 角色 / 英文关键字 / 结果标签）。
 *
 * 0.4 → 0.55：0.4 对纸只有 2.83:1，13px 的字在那个浓度上就是一片灰雾 ——
 * 而这里写的是**时间、角色、指标名**，是读的人要拿去用的东西，
 * 不是装饰。0.55（4.55:1）是这一页的**下限**，比它更淡的一律不合格。
 * 层级改由字号承担：旁白 15px、元信息 13px，本来就分了大小。
 */
.detail__meta {
  font-size: 0.8125rem;
  letter-spacing: 0.18em;
  color: var(--ink-black);
  opacity: 0.55;
}

/*
 * 标题。`font-weight` 不写 —— 霞鹜文楷只有 300 一档（见 .detail 的描边那一行）。
 * 这一页的层级仍然靠字号和留白，这里只把字号往上抬一档。
 */
.detail__name {
  margin-top: 1rem;
  font-size: clamp(26px, 2.9vw, 41px);
  line-height: 1.45;
  letter-spacing: 0.02em;
  color: var(--ink-black);
}

/*
 * 关键字。这是标题区最浅的一档，但**关键字是内容不是装饰** ——
 * 原来那 0.5 对纸只有 3.7:1，在 13px 上读着发虚，抬到 0.56（4.7:1）。
 * 它和 .detail__meta 因此同深了，层级改由**位置**分（一行在标题上、一行在下）。
 */
.detail__keywords {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.8em;
  margin-top: 1.1rem;
  font-size: 0.8125rem;
  letter-spacing: 0.16em;
  color: var(--ink-black);
  opacity: 0.56;
}

.detail__keyword {
  display: inline-flex;
  align-items: center;
  gap: 0.8em;
}

/*
 * 项间那条竖线：比关键字浅小半档（父级 0.56 会再乘一次）。
 *   **别调更低** —— 合成到 0.34 就淡得像屏幕上的脏点，等于没画。
 *
 * 挂在上一项的尾巴上（::after）而不是下一项的开头（::before）：
 * 手机窄屏下关键字会一个一行，线挂在开头就会让每一行都以一条孤立的竖线起头。
 * 理由与间距的算法同列表页，见 ProjectsView.vue 的 .project__keyword。
 */
.detail__keyword:not(:last-child)::after {
  content: '';
  width: 1px;
  height: 0.8em;
  background: currentColor;
  opacity: 0.8;
}

/* 引言：比正文大一号，比正文浅一档 —— 它是介绍，不是内容 */
.detail__lede {
  margin-top: 2.75rem;
  font-size: 1.125rem;
  line-height: 2.05;
  color: var(--ink-black);
  opacity: 0.64;
}

.detail__blocks {
  margin-top: 4rem;
}

.detail__block + .detail__block {
  margin-top: 3.4rem;
}

/*
 * 节头：序号 + 分类小字，上面压一条淡痕。
 *
 * 序号走 `.figure`（手写数字），和清单页左边那一列、页尾「结果」的标签
 * 是同一套数法。**分类小字和序号同一档浓度**（0.55，这一页的下限）——
 * 它们是同一行东西的两半，不是两层层级；真正分层的靠它下面那个标题
 * （18px、0.66 的正文色，还带描边）。
 */
.detail__block-head {
  display: flex;
  align-items: baseline;
  gap: 0.8em;
  padding-top: 1rem;
  margin-bottom: 1.1rem;
  border-top: 1px solid var(--line-soft);
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  color: var(--ink-black);
  opacity: 0.55;
}

.detail__block-index {
  font-size: 0.85em;
  letter-spacing: 0.08em;
}

/* 小节标题：走站上统一的标题字体，只是压小、压黑 */
.detail__lead {
  font-size: 1.125rem;
  letter-spacing: 0.02em;
  color: var(--ink-black);
}

.detail__text {
  margin-top: 0.7rem;
  font-size: 1rem;
  line-height: 1.95;
  color: var(--ink-black);
  opacity: 0.66;
}

/*
 * 旁白。左侧一条细线代替引号：像是从正文里让出去的一句话。
 * 不写斜体 —— 中文没有斜体传统，倾斜只会让字变丑。
 */
.detail__aside {
  margin-top: 0.9rem;
  padding-left: 1.1rem;
  border-left: 1px solid var(--line);
  font-size: 0.9375rem;
  line-height: 1.9;
  color: var(--ink-black);
  /* 0.48 → 0.56（4.7:1）。旁白是**正文的一部分**（只是语气更轻），
     3.67:1 在 15px 上偏淡；它左边那条线已经说明了「这是旁白」。 */
  opacity: 0.56;
}

/*
 * 短句清单（`points`）：流程、步骤、几件并排的事。
 * 前面一枚淡短横，比句子本身再浅一档 —— 它只负责起个头，不是内容。
 * 那道横用 background 画，不写字符：换字体不会让它变成别的样子。
 */
.detail__points {
  margin-top: 1.5rem;
  list-style: none;
}

.detail__point {
  position: relative;
  padding-left: 1.25rem;
  font-size: 1rem;
  line-height: 1.95;
  color: var(--ink-black);
  opacity: 0.66;
}

.detail__point + .detail__point {
  margin-top: 0.4rem;
}

.detail__point::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0.96em;
  width: 0.62rem;
  height: 1px;
  background: currentColor;
  opacity: 0.45;
}

/*
 * 通路（`flow`）：一排阶段，每个阶段下面并排它自己的几件事。
 *
 * **刻意没有画成流程图** —— 没有箭头、没有方框、没有底色。
 * 阶段之间靠三样东西分：序号（01 / 02，走 .figure）、一条细线、
 * 以及同一阶段里并排的条目本身（并排 = 同时发生）。
 * 一旦开始给节点加框连线，这一页就从「读数的地方」变成了稿子。
 *
 * 列宽下限 8.5rem 和页尾「结果」数字那一组取同一个值：
 * 这是「一列里放得下四个汉字名 + 一行小字说明」的宽度，也保证 704px 正文
 * 里稳是三四列。auto-fit 会按实际正文宽自己决定列数，不需要断点写死。
 */
.detail__flow {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
  gap: 2rem 1.5rem;
  list-style: none;
}

/* 阶段上方那条线：比节头那条实一档，它是「阶段」这个概念的载体 */
.detail__flow-stage {
  padding-top: 0.9rem;
  border-top: 1px solid var(--line);
}

.detail__flow-title {
  display: flex;
  align-items: baseline;
  gap: 0.6em;
  font-size: 0.8125rem;
  letter-spacing: 0.16em;
  color: var(--ink-black);
  opacity: 0.55;
}

.detail__flow-index {
  font-size: 0.85em;
  letter-spacing: 0.08em;
}

.detail__flow-items {
  margin-top: 1rem;
  list-style: none;
}

.detail__flow-item + .detail__flow-item {
  margin-top: 1.05rem;
}

/*
 * 条目：名称和说明是两档。名称跟正文同深（0.66），
 * 说明跟旁白同深（0.55，这一页的下限）—— 说明是「名称的注释」，
 * 不是独立的一段正文，所以不上正文那一档。
 */
.detail__flow-name {
  display: block;
  font-size: 0.9375rem;
  line-height: 1.7;
  color: var(--ink-black);
  opacity: 0.66;
}

.detail__flow-note {
  display: block;
  margin-top: 0.22rem;
  font-size: 0.8125rem;
  line-height: 1.7;
  color: var(--ink-black);
  opacity: 0.55;
}

/*
 * 手机：通路落成一列。
 *
 * 8.5rem 的列在 335px 正文里能排成两列，但一列只剩 160px ——
 * 「道路分割 / YOLO11 · Area 1 / Area 2」这种「名称 + 说明」在 160px 里
 * 每行只放得下五六个字，断成一片。通路不是清单，条目之间是并列关系，
 * 竖着排反而读得出「三个阶段」这件事。
 */
@media (max-width: 640px) {
  .detail__flow {
    grid-template-columns: 1fr;
    gap: 1.75rem;
  }
}

/*
 * 表（`table`）。**这是这一页唯一会出现竖着一列数字的地方**，所以格外克制：
 * 没有外框、没有底色、没有圆角，只有表头下面一条实线、每行一条淡痕 ——
 * 和这一页其它的线是同一族。
 *
 * 数字走 tabular-nums：位数对齐才是它值得做成表的唯一理由，对不齐就是白做。
 * **不设 nowrap** —— 单元格里有长句子（数据划分那种），撑宽了会顶出阅读行宽。
 */
.detail__figure {
  margin: 1.9rem 0 0;
}

.detail__caption {
  margin-bottom: 0.9rem;
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  color: var(--ink-black);
  opacity: 0.38;
}

/* 视频下面那行说明：字号不变，只是换到图的另一边（上面那条 margin 归零） */
.detail__caption--below {
  margin-top: 0.9rem;
  margin-bottom: 0;
}

/*
 * 现场画面。**这是这一页唯一不是字的东西**，所以格外克制：
 * 零圆角、零投影、不加相框，只有一条和表格同族的细线把它收在纸上。
 *
 * aspect-ratio 是**占位**用的：`preload="metadata"` 下尺寸要等元数据回来才知道，
 * 不留这一行，视频加载完整页会往下跳一次（源片是 1280×720，正好 16:9）。
 * object-fit: contain 是兜底 —— 将来换成别的比例也只是上下留边，不会裁掉画面。
 */
.detail__video {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: contain;
  /* 封面还没画上去的那一瞬间铺这一档，比一块黑好看，也和纸是一族 */
  background: var(--line-soft);
  border: 1px solid var(--line);
}

.detail__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
  line-height: 1.6;
  font-variant-numeric: tabular-nums;
}

.detail__table thead th {
  padding: 0 0 0.65rem;
  font-weight: 400;
  font-size: 0.75rem;
  letter-spacing: 0.14em;
  text-align: right;
  color: var(--ink-black);
  opacity: 0.38;
  border-bottom: 1px solid var(--line);
}

.detail__rowhead,
.detail__cell {
  padding: 0.55rem 0;
  font-weight: 400;
  color: var(--ink-black);
  opacity: 0.6;
  border-bottom: 1px solid var(--line-soft);
}

.detail__rowhead,
.detail__table thead th:first-child {
  padding-right: 1.25rem;
  text-align: left;
}

.detail__cell {
  padding-left: 1rem;
  text-align: right;
}

/*
 * 手机：表格与「回列表」各收一档。
 *
 * 表：296px 宽里塞三列（实测 94 / 117 / 85），字还是 14px 的话单元格里
 * 每个词都要折一次行，读数这件事在折行里就散了 —— 所以压到 13px、
 * 把列间距（padding）从 1rem 收到 0.6rem，把省下的宽度还给文字。
 * 另外给 `figure` 加一条 `overflow-x: auto` 兜底：**万一**将来某张表列更多，
 * 横着撑出去的是这一块、不是整页（页面横向溢出在手机上是最难看的一种坏）。
 * 现在的三列用不上这条，它只是护栏。
 */
@media (max-width: 640px) {
  .detail__figure {
    overflow-x: auto;
  }

  .detail__table {
    font-size: 0.8125rem;
  }

  .detail__rowhead,
  .detail__table thead th:first-child {
    padding-right: 0.75rem;
  }

  .detail__cell {
    padding-left: 0.6rem;
  }

  /*
   * 「做过的东西」是这一页唯一的出口，文字只有 23px 高。
   * 和站上其它可按的东西同一个做法：padding 撑到 44px、负 margin 抵回去，
   * 于是盒子长在字外面，版式一格没动。
   */
  .detail__back {
    padding-block: 0.65rem;
    margin-block: -0.65rem;
  }

  /*
    最浅的那两档抬到 0.5。

    表的说明、指标名、表头在桌面上是 0.38（对纸 2.9:1）—— 那里它们只是
    「压在角落的注」，读的人是把脸凑在屏幕前的。**手机是端在手上读的**：
    12~13px 的字在 2.9:1 上就是一片灰雾，而这个站上最实在的信息
    （「结果」那几个数字叫什么）正写在指标名上。
    0.5 是 4.1:1 —— 没到正文那档，层级还在（比元信息的 0.55 还差半档），
    但已经从「看不清」挪到「读得出」。**只改窄屏**，桌面那一档不动。
  */
  .detail__caption,
  .detail__metric-label {
    opacity: 0.5;
  }

  .detail__table thead th {
    opacity: 0.5;
  }
}

/*
 * 被点名的那一行（`highlight`）。**全表只有这一行是实的。**
 * 默认不给这一页加颜色，所以照这一页自己的语言来：透明度顶到 1，
 * 底下那条线从淡痕换成看得见的那一档。其余各行一律停在 0.6。
 */
.detail__table tr.is-mark .detail__rowhead,
.detail__table tr.is-mark .detail__cell {
  opacity: 1;
  border-bottom-color: var(--line);
}

/* 结果：上方一条淡线把它和正文分开，是这一页唯一的分节 */
.detail__results {
  margin-top: 4.5rem;
  padding-top: 2.5rem;
  border-top: 1px solid var(--line-soft);
}

/*
 * 数字排成一行行。标签在上（浅、小、字距开），数字在下（大、走 .figure）。
 *
 * 列宽下限 11rem 是按**最长的标签**定的：中文标签四个字一行就完，
 * 英文标签要折行，列太窄就会折成三行、整块看着发毛。
 * 704px 的正文宽下这是三列 —— 三列刚好每列 200 出头。
 */
.detail__metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(11rem, 1fr));
  gap: 2rem 1.5rem;
  margin-top: 1.75rem;
}

/*
 * 数字格。多数项目里标签只有四个字（「系统吞吐」），一行就完；
 * 但英文标签会折成两三行，而 dd 是跟在 dt 后面的 —— 标签一长，
 * 同一行里的数字就各站各的高度，一列数看着是歪的。
 *
 * 所以格子改成竖排 + `space-between`：标签在上面自己折行，**数字一律贴底**。
 * 格子本身被 .detail__metrics 拉伸成等高，于是「贴底」就等于「同一行对齐」。
 * 标签都是一行时（现有的另外两个项目）这条规则不产生任何位移。
 */
.detail__metric {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/*
 * 手机：下限从 11rem 收到 8.5rem，好排成两列。
 *
 * 11rem 是按**最长的标签**定的（英文标签要折行，列太窄会折成三行）；
 * 但手机上正文宽只有 335px，11rem 一列的直接结果就是**一列到底** ——
 * 四个指标竖着排 598px 高，翻两屏才看完「结果」，而它本来是四句结论。
 * 8.5rem（136px）在 335px 里正好是两列，标签仍然是「四个字一行」的宽度。
 */
@media (max-width: 640px) {
  .detail__metrics {
    grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
    gap: 1.5rem 1rem;
  }
}

.detail__metric-label {
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  color: var(--ink-black);
  opacity: 0.38;
}

/* 数字：手写体的数字很好看，站上大号数字一律用它 */
.detail__metric-value {
  margin-top: 0.5rem;
  font-size: clamp(26px, 2.4vw, 37px);
  line-height: 1.1;
  color: var(--ink-black);
}

.detail__metric-unit {
  margin-left: 0.14em;
  font-size: 0.46em;
  letter-spacing: 0.06em;
  opacity: 0.55;
}

/*
 * 页面最下方那一个出口。上方一条淡线把它和留言区分开，
 * 和「结果」用的是同一档线 —— 这一页的线一共就这三处。
 *
 * 桌面这一版没有 justify-content: space-between：
 * 出口只剩一个了，摊开左右反而像是丢了什么。
 */
.detail__foot {
  margin-top: 4rem;
  padding-top: 2rem;
  border-top: 1px solid var(--line-soft);
}

/*
 * 回列表：一枚安静的小字口子，鼠标进来才实。
 *
 * 静止态 0.45 → 0.55。0.45 对纸是 3.32:1，而这是**这一页唯一的出口**；
 * 它是链接，按 AA 要 4.5:1，0.55 正好压在线上（4.55:1）。
 * 「安静」仍然成立 —— 悬停照样实到 1，和正文的落差也没变。
 */
.detail__back {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.8125rem;
  letter-spacing: 0.16em;
  color: var(--ink-black);
  opacity: 0.55;
  transition: opacity 200ms linear;
}
.detail__back:hover,
.detail__back:focus-visible {
  opacity: 1;
}
</style>
