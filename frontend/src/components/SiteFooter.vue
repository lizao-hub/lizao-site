<script setup lang="ts">
/**
 * 页脚。**每一页都有，湖边除外**（那一页整页就是一幅景，没有「页面底部」）。
 *
 * 由 App.vue 的 `hasFooter` 决定挂载。屋里曾经也在排除之列（舞台是 fixed
 * 铺满视口的景，页脚会被顶到屏幕外）—— 舞台改成走文档流之后它回来了。
 *
 * 内容只有三行 —— 签名 + 署名 + 备案号。**默认不加导航、图标、第二列** ——
 * 页脚的职责是备案 + 署名（见下段），要加东西之前先想清楚它是不是该在这儿。
 *
 * 签名是 `profile.signature`（湖边那三行景里的第二行也是这一句，
 * **同一句话只写一处**）。它排在最上、字大一档：它是这一块里唯一像人说的
 * 一句话，下面两行是事务与法定的。层级靠字号，不靠颜色。
 *
 * 曾经这里还有「屋里」与 GitHub 两个去向（2026-09-19 照构建产物补文件时
 * 带进来的），已删：屋里本来就在主导航的「关于我」里，内容页的读者一眼
 * 就能看到，页脚再放一遍是把同一个出口说了两次。页脚的职责是两件 ——
 * 把备案号摆到每一页底部（合规要求），顺带署个名。
 *
 * ⚠️ 备案号有两条硬规矩（**必须原样展示**、**必须链到工信部备案系统**），
 * 写在 `data/profile.ts` 的 `beian` 上，改之前先去读那一段。
 */
import { beian, profile } from '@/data/profile'
</script>

<template>
  <footer class="shell footer">
    <p class="footer__sign">{{ profile.signature }}</p>

    <p class="footer__line">© 2026 {{ profile.name }}</p>

    <p class="footer__line">
      <a class="footer__beian" :href="beian.href" target="_blank" rel="noopener noreferrer">
        {{ beian.number }}
      </a>
    </p>
  </footer>
</template>

<style scoped>
/*
 * 页脚。
 *
 * 宽度走 .shell —— 和导航两端、主图两端、正文两边落在同一条线上
 * （全站「一条线」的规矩，见 main.css 的 --page-w）。
 *
 * 上边那道 hairline 用 --line-soft：main.css 里写明了分隔线就只有这一条
 * （「要分隔线就用 border-top: 1px solid var(--line-soft)」）。
 * 它和正文之间那段空白是**页面自己的 .page-bottom（9rem）**，
 * 页脚不再往上加 margin —— 两个数叠起来会把页脚推到离内容 12rem 的地方。
 */
.footer {
  padding-top: 2.5rem;
  padding-bottom: 3.5rem;
  border-top: 1px solid var(--line-soft);
  text-align: center;
}

/*
 * 三行字：签名 / 署名 / 备案号，同一个颜色（--ink-soft）。
 *
 * 颜色取 --ink-soft（对纸 5.21 : 1），**不是 --ink-faint**（2.62 : 1）：
 * 站上给正文定的下限是 4.55 : 1（见 main.css 详情页那一段，
 * 那句「下限 .55，别再降」），而备案号是小字、又是法定要看得清的一行，
 * 不能踩到下限以下。层级靠字号（1rem / 0.78rem 两档）
 * 与那道 hairline 分，不靠再调淡一档颜色。
 */
.footer__sign {
  font-size: 1rem;
  letter-spacing: 0.1em;
  color: var(--ink-soft);
}

.footer__line {
  font-size: 0.78rem;
  letter-spacing: 0.04em;
  color: var(--ink-soft);
}

/* 签名与它下面那两行之间要空开一档，否则三行看着像同一句被拆开了 */
.footer__sign + .footer__line {
  margin-top: 1rem;
}

.footer__line + .footer__line {
  margin-top: 0.5rem;
}

/*
 * 备案号。虚线描边是站上唯一那种「这里可以点」的暗示 ——
 * 和页尾按语里那枚「回屋里」同一个写法（dashed + text-underline-offset），
 * 悬停变强调色。
 *
 * color 用 inherit：备案号是**法定的那一行**，不该靠颜色和署名分家，
 * 两行看着就是同一块小字，只是其中一行能点。
 */
.footer__beian {
  color: inherit;
  text-decoration: underline;
  text-decoration-style: dashed;
  text-underline-offset: 0.28em;
  transition: color 200ms linear;
}

.footer__beian:hover,
.footer__beian:focus-visible {
  color: var(--accent);
}

/*
 * 手机：把备案号的可点范围托到 44px（全站窄屏三件事之一，见 main.css 文件头）。
 *
 * 那行字实测只有 142×15 —— 手指按不准（WCAG 2.5.5 建议 44×44）。
 * 写法抄 `ProjectView.vue` 的 `.detail__back`：**padding 撑起来、
 * 等量负 margin 收回去**，于是命中区大了而排版一点没动
 * （正 margin 会把上面那行署名一起推开）。
 *
 * 横向不用管：备案号本身就有一百多像素宽。
 */
@media (max-width: 640px) {
  .footer__beian {
    display: inline-block;
    padding-block: 0.65rem;
    margin-block: -0.65rem;
  }
}
</style>
