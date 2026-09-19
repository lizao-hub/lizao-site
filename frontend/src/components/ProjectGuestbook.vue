<script setup lang="ts">
/**
 * 项目留言区：点赞 + 留言。**全站唯一会发请求的地方。**
 *
 * ⚠️ 这个文件是 2026-09-19 傍晚**按构建产物重建**的：原文件被一次误删带走，
 * 没进回收站（git rm / rm 是直接 unlink）、也没进 VS Code 的本地历史。
 * 来源有两个：当天 16:08 的 `dist/assets/ProjectView-Mjp9F6PU.js`（逻辑与模板）
 * 和 `dist/assets/ProjectView-Dwy4BWi1.css`（样式）。**所以注释比别处少** ——
 * 压缩产物里留不住注释，只有类名、props、事件名这些字符串能原样取回。
 * 行为与删掉前一致，但**当时的注释找不回来了**，别以为这里是新写的。
 *
 * **取不到数据就整块不渲染**（`likes === null` 时 return 空节点）：
 * 后端没起的时候详情页正文照常，只是没有留言区 —— 不报错、不留空壳。
 * 这是这一页的规矩：会失败的东西不该在页面上留下残骸。
 */
import { computed, ref, watch } from 'vue'
import { RiHeartLine } from '@remixicon/vue'
import { fetchReactions, hasLiked, postComment, postLike, rememberLike } from '@/data/reactions'
import type { Comment, Reactions } from '@/types/reaction'

const props = defineProps<{ slug: string }>()

/** 点赞数。null = 还没拿到（后端没起），此时整块不渲染。 */
const likes = ref<number | null>(null)
const comments = ref<Comment[]>([])
/** 这一台浏览器是否已经点过。防重复只靠 localStorage，理由在 data/reactions.ts 顶部。 */
const liked = ref(false)
const name = ref('')
const body = ref('')
const sending = ref(false)
const error = ref<string | null>(null)

watch(
  () => props.slug,
  async (slug) => {
    likes.value = null
    comments.value = []
    error.value = null
    liked.value = hasLiked(slug)

    const data: Reactions | null = await fetchReactions(slug)
    if (!data) return
    likes.value = data.likes
    comments.value = data.comments
  },
  { immediate: true },
)

async function like() {
  if (liked.value || likes.value === null) return

  // 先乐观地 +1，服务端回不来再退回去
  const previous = likes.value
  likes.value = previous + 1
  liked.value = true

  const total = await postLike(props.slug)
  if (total === null) {
    likes.value = previous
    liked.value = false
    error.value = '没记上，等一下再点'
    return
  }
  likes.value = total
  rememberLike(props.slug)
}

const canSend = computed(
  () => name.value.trim() !== '' && body.value.trim() !== '' && !sending.value,
)

async function send() {
  if (!canSend.value) return
  sending.value = true
  error.value = null

  try {
    comments.value.push(await postComment(props.slug, name.value, body.value))
    body.value = ''
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '没发出去'
  } finally {
    sending.value = false
  }
}

/** ISO 字符串 → 2026.09.19 */
function formatDate(iso: string): string {
  const date = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`
}
</script>

<template>
  <section v-if="likes !== null" class="guestbook">
    <h2 class="guestbook__lead">留言</h2>

    <div class="guestbook__row">
      <button
        type="button"
        class="guestbook__like"
        :class="{ 'is-on': liked }"
        :disabled="liked"
        :aria-pressed="liked"
        :aria-label="liked ? '已经点过赞了' : '点赞'"
        @click="like"
      >
        <!--
          点赞图标走 `@remixicon/vue` 的 `RiHeartLine`，矢量、fill=currentColor，
          颜色由父级 .guestbook__like 的 color + opacity 控制（见下面样式）。
        -->
        <RiHeartLine class="guestbook__thumb" />
        <span class="figure guestbook__count">{{ likes }}</span>
      </button>

      <p class="guestbook__hint">{{ liked ? '记下了' : '觉得不错就点一下' }}</p>
    </div>

    <ul v-if="comments.length" class="guestbook__list">
      <li v-for="item in comments" :key="item.id" class="guestbook__item">
        <p class="guestbook__meta">{{ item.name }} · {{ formatDate(item.createdAt) }}</p>
        <p class="guestbook__body">{{ item.body }}</p>
      </li>
    </ul>
    <p v-else class="guestbook__empty">还没有人留言</p>

    <form class="guestbook__form" @submit.prevent="send">
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
  </section>
</template>

<style scoped>
/*
 * 这一块的所有层级都靠**透明度**，没有边框也没有底色 ——
 * 详情页是全站唯一「不手绘」的地方，加装饰就散了。
 * 字号 0.78rem / 0.9375rem 这一档是**下限**：再小就读不出。
 */
.guestbook {
  margin-top: 4.5rem;
  padding-top: 2.5rem;
  border-top: 1px solid var(--line-soft);
}

.guestbook__lead {
  font-size: 1.125rem;
  letter-spacing: 0.02em;
  color: var(--ink-black);
}

.guestbook__row {
  display: flex;
  align-items: baseline;
  gap: 0.9rem;
  margin-top: 1.5rem;
}

/*
 * 点赞按钮。**没有边框、没有底色** —— 它就是一枚图标加一个数字。
 * 位图不吃 currentColor，颜色只能靠 opacity：平时 .55，鼠标进来才实。
 */
.guestbook__like {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  opacity: 0.55;
  color: var(--ink-black);
  transition:
    transform 140ms linear,
    opacity 200ms linear;
}

.guestbook__like:hover:not(:disabled) {
  opacity: 1;
}

.guestbook__like:active:not(:disabled) {
  transform: scale(0.94);
}

.guestbook__like.is-on {
  opacity: 1;
}

.guestbook__like:disabled {
  cursor: default;
}

.guestbook__thumb {
  display: block;
  width: 17px;
  height: 17px;
}

.guestbook__count {
  font-size: 1.05rem;
  line-height: 1;
}

.guestbook__hint {
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  opacity: 0.55;
  color: var(--ink-black);
}

.guestbook__list {
  margin-top: 2.25rem;
}

.guestbook__item + .guestbook__item {
  margin-top: 1.35rem;
  padding-top: 1.35rem;
  border-top: 1px solid var(--line-soft);
}

.guestbook__meta {
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  opacity: 0.55;
  color: var(--ink-black);
}

.guestbook__body {
  margin-top: 0.35rem;
  font-size: 1rem;
  line-height: 1.95;
  opacity: 0.66;
  color: var(--ink-black);
  /* 留言是别人写的，可能带长换行或整段 URL —— 都别把版式撑破 */
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.guestbook__empty {
  margin-top: 2.25rem;
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  opacity: 0.55;
  color: var(--ink-black);
}

.guestbook__form {
  margin-top: 2.5rem;
}

/* 输入框只留一条下边线，不画框 —— 和这一页「靠透明度分层」是同一个路子 */
.guestbook__field {
  display: block;
  width: 100%;
  padding: 0.5rem 0;
  border: 0;
  border-bottom: 1px solid var(--line);
  background: transparent;
  font-size: 0.9375rem;
  line-height: 1.7;
  opacity: 0.66;
  color: var(--ink-black);
  transition: border-color 200ms linear;
}

.guestbook__field:focus {
  opacity: 1;
  border-bottom-color: var(--ink-black);
}

.guestbook__field::placeholder {
  opacity: 0.3;
  color: var(--ink-black);
}

.guestbook__field--area {
  margin-top: 1.25rem;
  resize: vertical;
}

/*
 * 提交按钮：细线框 + **手绘圆角**。
 * 详情页原本禁止圆角，那条限制已废止 —— 禁的是「装饰的圆角」，
 * 会按下去的不连坐。圆角那一组数值是手绘零件库里的同一组。
 */
.guestbook__submit {
  margin-top: 1.5rem;
  padding: 0.55rem 1.5rem;
  border: 1px solid var(--line);
  border-radius: 14px 10px 15px 9px / 9px 15px 10px 14px;
  background: transparent;
  font-size: 0.8125rem;
  letter-spacing: 0.16em;
  opacity: 0.55;
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

.guestbook__submit:disabled {
  opacity: 0.28;
  cursor: default;
}

.guestbook__error {
  margin-top: 0.9rem;
  font-size: 0.78rem;
  letter-spacing: 0.16em;
  opacity: 0.66;
  color: var(--ink-black);
}
</style>
