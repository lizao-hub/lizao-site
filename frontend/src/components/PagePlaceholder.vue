<script setup lang="ts">
/**
 * 内容页的壳：门面图 + 内容 + 页尾一句按语。
 *
 * 页尾那句话由 `footnote` 给 —— 它是**这一页的实话**（「目前 3 个项目，
 * 都在这上面了。」），不是提示，也不是进度。
 *
 * ⚠️ 不传 `footnote` 时它会退回「这一页还在造」那句。**那是给真的空页留的**，
 * 有内容的两个页（项目清单、影像）都必须传 —— 页尾不许出现「还在造」，
 * 内容就在上面摆着，说它没做完是自我否定。
 */
defineProps<{
  label: string
  /** 顶部场景图（构建后的 URL）。不传就只有一个文字块。 */
  image?: string
  /** 场景图的替代文本；纯装饰的图传空字符串 */
  imageAlt?: string
  /** 页尾那句实话。有内容的页都要给。 */
  footnote?: string
}>()
</script>

<template>
  <main class="page-bottom">
    <!--
      顶部场景图：紧贴导航条下沿，中间不留空隙（所以这里没有 .page-top）。
      宽度走 .plate（= --page-w 本身），和湖边的景、屋里的景、导航条两端
      落在同一条线上 —— 四个视图的主图同宽。
    -->
    <div v-if="image" class="plate">
      <img class="placeholder__banner" :src="image" :alt="imageAlt ?? ''" />
    </div>

    <!--
      页面自己的内容。容器由调用方自己套（项目页用 .shell），
      这个组件不替它决定宽度 —— 空页和内容页的排版是两件事。
    -->
    <slot />

    <div class="shell placeholder page-top" :class="{ 'placeholder--below': image }">
      <!-- 给搜索引擎和读屏一个标题，页面本身不显示 -->
      <h1 class="sr-only">{{ label }}</h1>

      <!-- 有内容：页尾是一句实话，到此为止 -->
      <p v-if="footnote" class="placeholder__line">{{ footnote }}</p>

      <!-- 没内容：这一页确实还没做完，才说这句话 -->
      <template v-else>
        <p class="placeholder__line">「{{ label }}」这一页还在造。</p>

        <p class="placeholder__hint">
          先回
          <RouterLink class="placeholder__link" to="/room">屋里</RouterLink>
          待着吧。
        </p>
      </template>
    </div>
  </main>
</template>

<style scoped>
/*
 * 顶部场景图。
 *
 * 宽度撑满 .plate（= --page-w 本身，不带正文的 2rem 内边距），
 * 于是它顶到「页面布局宽度」的两端上，和湖边的景、屋里的景同宽；
 * 高度按原图比例走 —— 这两张都是 2.2:1 左右的长横幅，不需要裁。
 *
 * **不加边框、不加圆角**：它是「景」，不是贴在纸上的一张照片。
 * 站上带手绘相框的图（.figure、.photo__frame）表达的是「一张照片」，
 * 而这两张是页面自己的门面，加框反而把它降格成贴上去的卡片。
 */
.placeholder__banner {
  display: block;
  width: 100%;
  height: auto;
}

/*
 * 上面还有东西（场景图，和／或调用方塞进来的内容）时，
 * 文字块的上边距收一档（覆盖全局 .page-top 的 pt-24）：
 * 它现在是一句页尾按语，不该跟正文一样从 6rem 的地方起。
 * scoped 属性的特异性高于 .page-top，不用动全局那条约定。
 */
.placeholder--below {
  padding-top: 2.5rem;
}

/*
 * 只借用站点变量，不新造颜色。整体比正文更轻：
 * 这一页没有内容，语气也就不该比内容页重。
 */
.placeholder {
  text-align: center;
}

.placeholder__line {
  font-size: 1.0625rem;
  letter-spacing: 0.06em;
  color: var(--ink-soft);
}

.placeholder__hint {
  margin-top: 0.9em;
  font-size: 0.85rem;
  letter-spacing: 0.04em;
  color: var(--ink-faint);
}

/* 下划线走虚线，和手绘质感同路，不用实线直线 */
.placeholder__link {
  color: var(--accent);
  text-decoration: underline;
  text-decoration-style: dashed;
  text-underline-offset: 0.28em;
}
</style>
