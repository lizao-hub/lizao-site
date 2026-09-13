<script setup lang="ts">
// 以后在这里 import 你的组件，例如：
// import AboutMe from './components/AboutMe.vue'
</script>

<template>
  <div class="page">
    <!-- 头部：头像 + 名字 + 一句话介绍 -->
    <header class="hero">
      <!-- 把头像图片放到 src/assets/ 里，然后改下面的 src -->
      <!-- <img class="avatar" src="./assets/avatar.jpg" alt="我的头像" /> -->
      <h1>你好，我是 XXX 👋</h1>
      <p class="tagline">一个正在学习前端的 Python 开发者</p>
    </header>

    <!-- 关于我 -->
    <section class="card">
      <h2>关于我</h2>
      <p>
        这里写你的自我介绍。比如你的学习经历、兴趣爱好、正在做的事情。
      </p>
    </section>

    <!-- 技能 -->
    <section class="card">
      <h2>技能</h2>
      <ul class="skills">
        <li>Python</li>
        <li>HTML / CSS</li>
        <li>Vue 3（学习中）</li>
      </ul>
    </section>

    <!-- 联系方式 -->
    <section class="card">
      <h2>联系我</h2>
      <p>
        邮箱：<a href="mailto:you@example.com">you@example.com</a>
      </p>
      <p>
        GitHub：<a href="https://github.com/你的用户名" target="_blank">github.com/你的用户名</a>
      </p>
    </section>

    <footer class="footer">
      <p>© 2026 XXX</p>
    </footer>
  </div>
</template>

<style scoped>
.page {
  max-width: 720px;
  margin: 0 auto;
  padding: 48px 24px;
}

.hero {
  text-align: center;
  margin-bottom: 40px;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 16px;
}

.hero h1 {
  font-size: 2rem;
  margin-bottom: 8px;
}

.tagline {
  color: #6b7280;
}

.card {
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card h2 {
  font-size: 1.25rem;
  margin-bottom: 12px;
  color: #42b883;
}

.skills {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  list-style: none;
}

.skills li {
  background: #e8f5ef;
  color: #2c3e50;
  padding: 6px 14px;
  border-radius: 999px;
  font-size: 0.9rem;
}

.footer {
  text-align: center;
  color: #9ca3af;
  font-size: 0.85rem;
  margin-top: 40px;
}
</style>
