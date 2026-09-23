<script setup lang="ts">
/**
 * 留言。屋里那叠**横放的**书点开就是这里（右侧那一叠，见 data/scenes.ts）。
 *
 * ## 它是站点级的一页
 *
 * 留言原来挂在每个项目详情页的底下（组件 `ProjectGuestbook.vue`），
 * 2026-09-23 搬到这里：一条「网站做得不错」并不属于某个项目，
 * 而按项目分着看，等于同一面墙被切成两半。点赞同时整块下线。
 *
 * ## 取不到数据不能整块不渲染
 *
 * 详情页那条规矩是「取不到就什么都不画」——对，因为那时它只是正文底下的一块装饰，
 * 后端没起时正文照常。**这一页不行**：它的全部内容就是那一次请求，
 * 整块不渲染 = 一张白纸，连「为什么什么都没有」都不说。
 *
 * 所以这里照实说：列表位写一句「读不到留言」，表单照常在（提交失败会自己报错），
 * 页尾那句实话也跟着变（见 `footnote`）。
 *
 * ## 顺序
 *
 * 先读留言、再写留言 —— 和详情页那时同一个道理：先听完别人说的，再开口。
 * 列表从旧到新，接口那边就是这个顺序（见 backend/guestbook.py）。
 */
import { computed, onMounted, ref } from 'vue'
import PagePlaceholder from '@/components/PagePlaceholder.vue'
import Peeper from '@/components/Peeper.vue'
import { fetchComments, postComment } from '@/data/guestbook'
import type { Comment } from '@/types/guestbook'

/** 留言。**null = 还没读到**（后端没起 / 请求失败），和「读到了但是空的」是两回事。 */
const comments = ref<Comment[] | null>(null)
const name = ref('')
const body = ref('')
const sending = ref(false)
const error = ref<string | null>(null)

/**
 * 页尾那句实话。三种状态各说各的 —— 它随这一页真实的样子变，
 * 不是一句写死的按语（规矩见 PagePlaceholder.vue）。
 */
const footnote = computed(() => {
  if (comments.value === null) return '这会儿读不到留言。'
  if (!comments.value.length) return '还没有人留言 —— 你可以是第一个。'
  return `一共 ${comments.value.length} 条，都在这上面了。`
})

onMounted(async () => {
  comments.value = await fetchComments()
})

const canSend = computed(
  () => name.value.trim() !== '' && body.value.trim() !== '' && !sending.value,
)

async function send() {
  if (!canSend.value) return
  sending.value = true
  error.value = null

  try {
    const created = await postComment(name.value, body.value)
    if (comments.value === null) {
      // 之前没读到（列表还是「读不到」那行）：发完再读一次，
      // 读不到就保持原样 —— 它确实已经写上去了，只是这一页看不见。
      comments.value = await fetchComments()
    } else {
      comments.value.push(created)
    }
    body.value = ''
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '没发出去'
  } finally {
    sending.value = false
  }
}

/**
 * ISO 字符串 → `2026.09.23 14:51`（**当地时间**）。
 *
 * 比别处多带一个钟点：卡片顶上那一行是**专给时间的一条**（见模板），
 * 只写日期的话它和页尾那句按语没区别，而且同一分钟里的两条留言
 * 看起来会一模一样。（时间戳进库是 UTC，这里用 `Date` 转成本地。）
 */
function formatStamp(iso: string): string {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  const day = `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`
  return `${day} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
</script>

<template>
  <PagePlaceholder label="留言" :footnote="footnote">
    <section class="shell guestbook">
      <ul v-if="comments?.length" class="guestbook__wall">
        <li v-for="item in comments" :key="item.id" class="comment">
          <!-- 三段：时间 / 内容 / 人，每段之间一条横线（见样式） -->
          <p class="comment__time">{{ formatStamp(item.createdAt) }}</p>
          <p class="comment__body">{{ item.body }}</p>
          <p class="comment__name">{{ item.name }}</p>
        </li>
      </ul>

      <!-- 读到了、但一条都没有 -->
      <p v-else-if="comments" class="guestbook__empty">还没有人留言。写一句吧。</p>

      <!-- 根本没读到。**要说出来**，不能留白（见文件头） -->
      <p v-else class="guestbook__empty">读不到留言，等一下再刷新看看。</p>

      <!--
        输入框收一道 44em（和详情页同一档阅读行宽）：铺满整个外框会太长。
        右边并排放着小人（Peeper），两边**同高** —— 见样式里的 stretch。
      -->
      <div class="guestbook__write">
        <form class="guestbook__form max-w-prose" @submit.prevent="send">
          <input
            v-model="name"
            class="guestbook__field"
            type="text"
            maxlength="24"
            aria-label="名字"
            placeholder="名字"
          />
          <textarea
            v-model="body"
            class="guestbook__field guestbook__field--area"
            rows="3"
            maxlength="500"
            aria-label="留言"
            placeholder="说点什么"
          />
          <button type="submit" class="guestbook__submit" :disabled="!canSend">
            {{ sending ? '写着' : '写上去' }}
          </button>
          <p v-if="error" class="guestbook__error">{{ error }}</p>
        </form>

        <!--
          小人是这一行的第二个 flex 项：`stretch` 把它拉到跟表单一样高，
          宽度由原图的正方形跟出来。它挂在整页右下角那版已回退（见 Peeper.vue）。
        -->
        <Peeper class="guestbook__peeper" />
      </div>
    </section>
  </PagePlaceholder>
</template>

<style scoped>
/*
 * 这一页的排版走**纸面上的墨色**（`--ink-black` + 透明度分层），
 * 和项目页 / 详情页是同一路：全页只有一个颜色，层级靠透明度和字号分。
 *
 * 上下边距抄项目清单那一页：上面把内容从导航条下沿拉开（这一页没有门面图，
 * 不能像项目/影像那样贴着导航），下面那 1.5rem 让给 PagePlaceholder 的页尾按语
 * （它自己还有 .page-top 的 6rem）。
 */
.guestbook {
  padding-top: 4.75rem;
  padding-bottom: 1.5rem;
  /*
   * 全页一个颜色，写在这一层就够了（子元素、孙元素都继承）——
   * 卡片里那三段都不再各写一遍。透明度那几档是相对**纯黑**算的，
   * 漏了这一行它们算的就是纸面上的 --ink，整个观感会软一档。
   */
  color: var(--ink-black);
}

/* ------------------------------------------------------------------
   一面卡片墙

   一张留言 = 一片贴在纸上的小卡片：三段（时间 / 内容 / 人），
   段与段之间一条淡痕。样式和影像页的照片框**同一路**（--surface 的浅底、
   一条 --line-soft 的边、2px 的硬偏移），只是**不是正方形**：
   它装的是三行字，不是一张图。

   卡片比照片框小一档（桌面 3 列下约 251×191，照片是 272×272，
   面积约六成），所以列间距要比影像页**再松一点**（2.5rem → 3.5rem）——
   卡片小、间距大，一片看过去才是「一颗一颗摆着的」，不是一块纹理。
   ------------------------------------------------------------------ */
.guestbook__wall {
  display: grid;
  /*
   * `minmax(0, 1fr)` 而不是 `1fr` —— 这一条不是风格问题，是修 bug：
   * `1fr` 等价于 `minmax(auto, 1fr)`，那个 `auto` 最小值是**内容的 min-content**，
   * 而卡片里的名字行是 `white-space: nowrap`，它的 min-content 就是整串名字
   * 的宽度 —— 于是轨道被顶宽，**整面墙比页面还宽**（实测一个 40 字的名字
   * 把 470px 的卡片撚成 600px，三列直接溢出）。
   * 写成 0，轨道才真的听 `1fr` 的话，里面的 `overflow: hidden` 也才有东西可截。
   */
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 3.5rem;
}

/*
 * 一张卡片。`min-height` 不是装饰性的：一段话被 clamp 在三行以内，
 * 卡片本身的高度就由它定住 —— 于是**整面墙的卡片一样高**。
 * 不写它的话，一条「好」和一条三行的留言会摆出两种高度，一片就散了。
 * （时间行在上、名字行被 margin-top:auto 压在下沿，两条横线因此
 *   在每一张卡片上都对齐；中间那条随留言长短走，见 .comment__body。）
 *
 * 圆角不跟手绘零件库那一组走：这里是**相纸**，影像页那些方框也没有圆角
 * （会按下去的东西才有圆角，卡片不接鼠标）。
 */
.comment {
  display: flex;
  flex-direction: column;
  min-height: 12rem;
  padding: 1rem 1.15rem;
  background: var(--surface);
  border: 1px solid var(--line-soft);
  /* 一点硬偏移，像压在纸上的实体 —— 和影像页的照片框同一路（硬偏移是默认笔法） */
  box-shadow: 2px 2px 0 var(--line-soft);
}

/*
 * 三段之间的两条横线，以及它们上下的呼吸。
 * 写法是「上边那段的 padding-bottom + 一条线，下边那段的 padding-top」，
 * 不用 margin：margin 在 flex 列里会和 stretch 打架，而 padding 一定是卡片内的。
 *
 * ⚠️ **正文那一段不能给 padding-bottom**（它是单独写的一条，见下），
 * 原因不在排版而在裁剪：`overflow: hidden` 是按 **padding box** 裁的，
 * 正文上留了底内边距，就等于把裁剪线下移了那么多 —— 而 line-clamp
 * 截掉的那一行仍然在布局里（它只负责把盒子限到三行高），于是
 * **第 4 行行盒的顶部会从那条缝里露出来**，截图上就是一行被剃了头的字。
 * 实测：0.55rem 的底内边距 = 8.8px，露出来的正好是那 8.8px。
 * 所以中间的呼吸交给下面那段（名字行）的 padding-top，不在正文里留。
 */
.comment__time {
  padding-bottom: 0.55rem;
  border-bottom: 1px solid var(--line-soft);
}

.comment__body {
  border-bottom: 1px solid var(--line-soft);
}

.comment__body,
.comment__name {
  padding-top: 0.55rem;
}

/*
 * 顶上那行时间、底下那行名字：**各只给一行**，超了打省略号。
 *
 * 两个都是「一行装得下、长了就截」的东西（时间一直是 16 个字符，
 * 名字后端限 24 字）。`min-width: 0` 是 flex 列里的老坑：不给它，
 * 子项的宽度按内容撑，`text-overflow` 就没有可截的余地。
 */
.comment__time,
.comment__name {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.comment__time {
  font-size: 0.78rem;
  letter-spacing: 0.12em;
  /*
   * 0.55 是**下限，不是起点**：它对纸约 4.55:1，正好压在 AA 那条线上
   * （整站这个数是量过的，见详情页那段说明）。这一行只有 12px，
   * 再淡一档（0.5 左右只有 3.9:1）就和抗锯齿一起糊掉了。
   * 想让它更轻，动的是字距和字号，不是这里。
   */
  opacity: 0.55;
}

/*
 * 中段：留言本身。**最多三行，超了打省略号**（`-webkit-line-clamp`）。
 *
 * ⚠️ **别在这个元素上写 `flex: 1`。** 试过：clamp 确实会在第三行末尾
 * 打上省略号，但同时那个 flex 把这个盒子撑得比三行高，于是**第四行还是
 * 画在了盒子里**，只被 `overflow: hidden` 从盒子下沿切掉半截。
 * line-clamp 要求盒高由它自己（内容）决定，一旦被外部拉高就不算数了。
 * （另有一个同源的坑在 padding-bottom 上，见上面两条横线那一段。）
 *
 * 所以：中段高度由内容定，**名字行改用 `margin-top: auto` 顶到卡片下沿**。
 * 代价是一行与三行的留言，中间那条横线不在同一个高度（而时间和名字两条
 * 永远对齐）—— 换来的是「短留言不会拖着一大片空白的中段」。
 *
 * 三行是「卡片比照片小」和「看得出一条留言在说什么」之间取的档：
 * 桌面一行约二十来个字，三行六十上下，短的留言基本能看全。
 */
.comment__body {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  font-size: 0.9375rem;
  line-height: 1.8;
  opacity: 0.72;
  /* 留言是别人写的，可能带长换行或整段 URL —— 都别把版式撑破 */
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.comment__name {
  /* 见 .comment__body 那段：不靠 flex 撑标题，靠这条把自己压在卡片下沿 */
  margin-top: auto;
  font-size: 0.8125rem;
  letter-spacing: 0.08em;
  opacity: 0.6;
}

.guestbook__empty {
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  opacity: 0.55;
}

/*
 * 写留言这一块：上面一条分节线，里面**左边表单、右边小人，并排、同高**。
 *
 * 用 **grid** 而不是 flex，这一点不能换：小人的高由父级 stretch 决定，
 * 而它的宽要由高跟出来（原图是正方形，见 Peeper.vue）。flex 先定主轴（宽）
 * 再拉伸交叉轴（高），`aspect-ratio` 在那个顺序下算不出宽 —— 实测宽是 0；
 * grid 先把行高定下来、再算列宽，才能得到正方形。
 *
 * 第一列 `1fr`：表单吃掉剩下的宽度（它自己再用 max-w-prose 封到 44em），
 * 第二列 `auto`：小人那一列，宽 = 高。
 *
 * 分节线划在这一层而不是表单上：它是「墙」和「写」之间那条边界，
 * 现在横跨这一整行（表单 + 小人）。
 */
.guestbook__write {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 2.5rem;
  margin-top: 3.5rem;
  padding-top: 2.5rem;
  border-top: 1px solid var(--line-soft);
}

/* 列宽由 grid 给，这里只保证窄屏下能让出宽度（内容全是 `width: 100%`） */
.guestbook__form {
  min-width: 0;
}

/*
 * 输入框：只留一条下边线，不画框 —— 和这一页「靠透明度分层」是同一个路子。
 * 字号与浓度都借项目详情页那一套：正文 `1rem` / `0.66`，
 * 那页的**下限是 0.55（4.55:1）**（见 ProjectView.vue 的 .detail__meta）。
 *
 * ⚠️ **别在这个元素上写 `opacity`。** 它和 `::placeholder` 自己的 opacity 是
 * **相乘**的：原来这里 0.66、提示那边 0.3，合成 0.198 —— 对纸只有 1.75:1。
 * 而空表单里看得见的就是占位提示，于是整块成了灰雾（2026-09-23 修的就是这个）。
 * 浓度改成各写各的，谁也不乘谁。
 *
 * 字号给 `1rem` 顺手解掉一件事：iOS Safari 只对 font-size < 16px 的输入框
 * 自动放大整页，1rem 正好是 16px，窄屏里那条覆写因此可以删了。
 */
.guestbook__field {
  display: block;
  width: 100%;
  padding: 0.5rem 0;
  border: 0;
  border-bottom: 1px solid var(--line);
  background: transparent;
  font-size: 1rem;
  line-height: 1.95;
  /* 用户自己写下的字：满浓度（详情页标题那一档），不叠 opacity */
  color: var(--ink-black);
  transition: border-color 200ms linear;
}

.guestbook__field:focus {
  border-bottom-color: var(--ink-black);
}

/*
 * 占位提示：**单独一档浓度**。0.6 对纸约 5.6:1 —— 比站上的下限
 * （4.55:1）还高一档，因为它是要给人读的；和上面输入后的满浓度也差得够开，
 * 「这是提示 / 这是我写的」一眼分得清。
 */
.guestbook__field::placeholder {
  color: var(--ink-black);
  opacity: 0.6;
}

.guestbook__field--area {
  margin-top: 1.25rem;
  resize: vertical;
}

/*
 * 提交按钮：细线框 + **手绘圆角**（手绘零件库里的同一组数值）。
 * 全站唯一一件穿上手绘圆角的零件 —— 会按下去的东西可以带圆角。
 *
 * 浓度 0.7（对纸约 7:1）而不是之前的 0.55：0.55 是站上的下限（4.55:1），
 * 一个按上去才有反应的按钮压在线上太保守了。
 */
.guestbook__submit {
  margin-top: 1.5rem;
  padding: 0.55rem 1.5rem;
  border: 1px solid var(--line);
  border-radius: 14px 10px 15px 9px / 9px 15px 10px 14px;
  background: transparent;
  font-size: 0.8125rem;
  letter-spacing: 0.16em;
  opacity: 0.7;
  color: var(--ink-black);
  transition:
    transform 140ms linear,
    opacity 200ms linear,
    border-color 200ms linear;
}

.guestbook__submit:hover:not(:disabled) {
  opacity: 1;
  border-color: var(--ink-black);
}

/* 按下时往右下压一点，像纸被按下去 */
.guestbook__submit:active:not(:disabled) {
  transform: translate(1px, 1px);
}

/*
 * 没填完时是禁用的，也是**第一眼看到的那个状态** —— 所以别把它压到看不见：
 * 0.28 对纸只有约 1.9:1（原来就是它和占位提示一起把这一块变成灰雾的），
 * 现在 0.45（约 3.4:1）：读得出来，又和启用时的 0.7 差得清楚。
 */
.guestbook__submit:disabled {
  opacity: 0.45;
  cursor: default;
}

/* 出错那句要比正文实一档 —— 它是要人停下来的 */
.guestbook__error {
  margin-top: 0.9rem;
  font-size: 0.8125rem;
  letter-spacing: 0.16em;
  opacity: 0.72;
}

/*
 * 窄屏：卡片墙按影像页那两档收列数。
 *
 * ≤640px 两列（间距跟着卡片一起收到 2rem —— 桌面 3.5rem 是对着 251px 的
 * 卡片定的，比例 0.22；手机上不收，卡片之间会散成一片），
 * ≤480px 一列：375px 上两列只有约 155px 宽，三行字一行摊不到十个字，
 * 每条留言都被截成一句半 —— 那不是卡片，是碎片。
 *
 * 输入框的字号不用在这里再抬一档：它本来就写着 1rem（16px）。
 * 那个数是**功能性的**，不是审美 —— iOS Safari 会对 font-size < 16px
 * 的输入框自动放大整页，一聚焦就跳一下、还得手动缩回去（见 .guestbook__field）。
 * 「写上去」提到 44px 高，和站上其它可按的东西同一个下限（WCAG 2.5.5）。
 */
@media (max-width: 640px) {
  .guestbook__wall {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2rem;
  }

  .guestbook__submit {
    min-height: 44px;
    padding-inline: 1.75rem;
  }
}

@media (max-width: 480px) {
  .guestbook__wall {
    grid-template-columns: minmax(0, 1fr);
    gap: 1.75rem;
  }
}
</style>
