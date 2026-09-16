/**
 * 关于页的数据。全部来自 doc/RESUME.md。
 * 只收录适合公开的部分：教育、能力、项目、科研、竞赛、助教。
 * 实习意向、到岗时间、电话与邮箱按要求不展示。
 */

export const profile = {
  name: 'LI枣的自留地',
  /** 一句话定位，首页首屏和关于页共用 */
  role: '数学硕士研究生 · 工业时序大模型 / AI Agent',
  tagline:
    '杭州师范大学数学硕士研究生，研究方向为工业时序大模型、工业软测量与 AI Agent 应用，关注算法从实验到在线服务的完整落地链路。',
  github: 'https://github.com/lizao-hub',
  githubLabel: '@lizao-hub',
  /** 首页展示的重点方向标签 */
  focus: ['工业时序大模型', '工业软测量', 'RAG 检索增强', 'AI Agent', 'PyTorch'],
} as const

export interface Education {
  school: string
  major: string
  degree: string
  period: string
  detail: string
}

export const education: Education[] = [
  {
    school: '杭州师范大学',
    major: '数学',
    degree: '硕士研究生（在读）',
    period: '2024.9 - 2027.6',
    detail: '研究生学业奖学金 2 次，预计 2027 年 6 月毕业。具备扎实的算法与数据结构基础。',
  },
  {
    school: '宁波工程学院',
    major: '数据科学与大数据技术',
    degree: '工学学士',
    period: '2020.9 - 2024.6',
    detail: '新桥奖学金，优秀毕业论文奖。',
  },
]

export interface SkillGroup {
  title: string
  summary: string
  items: string[]
}

export const skillGroups: SkillGroup[] = [
  {
    title: '编程语言与基础算法',
    summary: '熟练使用 Python、R、C、TypeScript，掌握常用数据结构与基础算法。',
    items: ['Python', 'R', 'C', 'TypeScript', '数据结构', '排序与搜索', '动态规划', '图遍历', 'OOP / 装饰器 / 生成器'],
  },
  {
    title: '大模型与 AI Agent',
    summary: '熟悉 Prompt 工程、Agent 工作流与 Function Calling 工具调用链路。',
    items: ['Prompt 工程', 'Agent 工作流', 'Function Calling', 'RAG', 'Agent 框架', '链路调试'],
  },
  {
    title: '工业时序与数据处理',
    summary: '熟悉工业时序数据处理全流程，熟练使用 PyTorch 并理解时序基座模型。',
    items: ['数据清洗', '异常值检测', '缺失值填充', '噪声滤波', '特征工程', 'PyTorch', 'Transformer', '时序基座模型'],
  },
  {
    title: '系统、网络与工程服务',
    summary: '理解系统与网络基础，能用 FastAPI 把算法封装成在线服务。',
    items: ['进程 / 线程', 'IPC', 'TCP/IP', 'HTTP / HTTPS', 'WebSocket', 'SQL', 'FastAPI', 'Git'],
  },
]

export interface Paper {
  title: string
  venue: string
  status: '录用' | '在审'
  role: string
}

export const papers: Paper[] = [
  {
    title:
      'RASS: Retrieval-Augmented Soft Sensing with Large Language Models for Zero-Shot Prediction Under Unknown Industrial Conditions',
    venue: 'ARCAI',
    status: '录用',
    role: '第一作者',
  },
  {
    title:
      'RAT-LLM: A Retrieval-Augmented Temporal LLM for Zero-Shot Soft Sensing in Multimode Industrial Processes',
    venue: 'IEEE T-ASE',
    status: '在审',
    role: '第一作者',
  },
]

export interface Award {
  prize: string
  competition: string
  date: string
}

/** 一行一条，不展开细节：看得见奖项层级、赛事和时间就够了 */
export const awards: Award[] = [
  { prize: '一等奖', competition: '第十届浙江省大学生电子设计竞赛（嵌入式 / 算法）', date: '2022.8' },
  { prize: '二等奖', competition: '第十四届全国大学生数学竞赛', date: '2023.1' },
  { prize: '三等奖', competition: '第十二届浙江省大学生智能汽车竞赛（视觉组）', date: '2023.7' },
  { prize: '优胜奖', competition: '第十一届浙江省大学生智能汽车竞赛', date: '2022.7' },
]

export const assistantship = {
  role: 'Python 程序设计基础课程助教',
  org: '杭州师范大学',
  period: '2025、2026',
  detail: '负责辅导学生编程实践与算法调试。',
} as const
