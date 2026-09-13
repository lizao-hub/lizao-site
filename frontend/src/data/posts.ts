import type { Post } from '@/types/post'

export const posts: Post[] = [
  {
    slug: 'python-to-vue-first-week',
    title: '从 Python 转前端的第一周：我的心智模型是怎么崩的',
    date: '2026-08-14',
    summary:
      '习惯了 Python 的同步执行和明确报错，第一次看到响应式数据流的时候整个人是懵的。这篇记录了七个我踩过的坑，以及后来怎么把它们翻译成 Python 里熟悉的概念。',
    tags: ['前端入门', 'Vue', '学习笔记'],
  },
  {
    slug: 'why-i-still-write-scripts',
    title: '写了两年前端之后，我为什么还在写 Python 脚本',
    date: '2026-06-02',
    summary:
      '前端负责把东西展示给人看，Python 负责把东西算出来。这两件事不冲突。分享几个我现在还在用脚本解决的实际问题，从批量重命名图片到给博客生成 RSS。',
    tags: ['Python', '工具链', '随笔'],
  },
  {
    slug: 'reading-source-code-as-a-beginner',
    title: '小白读源码的正确姿势：从报错堆栈倒着看',
    date: '2026-04-21',
    summary:
      '很多人劝新手读框架源码，但我试过之后发现顺序搞反了。比起从头读，从一次真实的报错出发、一路往上追，效率高得多。这里是我总结的三步流程和一个完整例子。',
    tags: ['学习方法', '调试'],
  },
  {
    slug: 'css-layout-notes',
    title: 'Flex 和 Grid 到底什么时候用哪个',
    date: '2026-02-09',
    summary:
      '我把过去半年写过的所有布局翻了一遍，按维度归纳了一下判断标准。结论比想象中简单：一维用 Flex，二维用 Grid，剩下的都是习惯问题。',
    tags: ['CSS', '布局'],
  },
]

export function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`)
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}
