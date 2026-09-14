export interface ProjectMetric {
  /** 数字部分，用像素字体展示 */
  value: string
  /** 单位，跟在数字后面 */
  unit?: string
  /** 这个数字说明什么 */
  label: string
}

export interface Project {
  /** 路由参数 /projects/:slug */
  slug: string
  name: string
  /** 用于排序和列表展示，取结束月份，形如 2026.08 */
  end: string
  /** 展示用的起止时间 */
  period: string
  /** 我在项目里的角色 */
  role: string
  summary: string
  tags: string[]
  /** 项目详情页的要点，一行一条，尽量短 */
  highlights: string[]
  /** 只放简历里真实存在的量化结果，没有就留空 */
  metrics?: ProjectMetric[]
  href?: string
  hrefLabel?: string
}
