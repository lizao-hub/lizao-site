<script setup lang="ts">
/**
 * 手绘边框的共享 SVG 定义。
 *
 * 只放 <defs>：滤镜与可复用的手绘路径。在 App.vue 里挂一次，
 * 全站通过 CSS 的 filter: url(#rough-edge) 或 <use href="#..."> 引用。
 *
 * 为什么是静态路径 + 一个轻滤镜，而不是给所有元素挂 feTurbulence：
 * 见 ADR-0003。滤镜挂在大量节点上有真实的 repaint 开销，
 * 且 Safari 与 Chrome 的扰动结果不一致，手绘的「手感」会随浏览器漂移。
 */
</script>

<template>
  <svg width="0" height="0" aria-hidden="true" focusable="false" class="absolute">
    <defs>
      <!--
        极轻的边缘扰动。给静态装饰元素用，让直线不是数学上的直线。
        scale 故意很小：大了会变成「抖动的矢量图」，不是「手画的线」。
      -->
      <filter id="rough-edge" x="-2%" y="-2%" width="104%" height="104%">
        <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="7" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
      </filter>

      <!-- 手绘小波浪：区块之间的呼吸符 -->
      <path
        id="sketch-wave"
        d="M0 5 C 8 0, 16 10, 24 5 S 40 0, 48 5 S 64 10, 72 5 S 88 0, 96 5"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
      />
    </defs>
  </svg>
</template>
