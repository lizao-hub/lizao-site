import type { Project } from '@/types/project'

/**
 * 三个项目全部来自 doc/RESUME.md，按结束时间倒序。
 * 量化指标只写简历里已有的数字，不补充推算值。
 */
export const projects: Project[] = [
  {
    slug: 'industrial-llm-rag',
    name: '面向工业垂直领域的大语言模型微调与检索增强应用研究',
    end: '2026.08',
    period: '2025.10 - 2026.08',
    role: '第一作者',
    summary:
      '针对工业垂直领域通用大模型适配性差、场景落地困难的问题，聚焦垂直领域大模型微调与 RAG 融合方案，完成数据集构建、微调优化、场景适配验证与技术评估。',
    tags: ['LoRA 微调', 'RAG', '数据治理', '消融实验'],
    highlights: [
      '垂直领域数据治理：完成工业专属场景数据的清洗、降噪、筛选与结构化重构，构建适配大模型微调的高质量垂直领域数据集。',
      '大模型微调优化：采用 LoRA 轻量化微调方案，对齐工业垂直领域专业知识与业务逻辑，解决通用模型场景适配度低、输出不准的问题。',
      'RAG 与微调融合：结合检索增强技术弥补微调模型知识时效性不足的缺陷，搭建垂直领域专属应用框架，提升未知工业场景下的泛化能力。',
      '技术预研与落地验证：完成多组消融对比实验，输出技术调研与评估报告，相关研究成果已整理为学术论文，1 篇录用、1 篇在审。',
    ],
  },
  {
    slug: 'pi-agent-analytics',
    name: '基于 pi-agent SDK 的数据分析智能体',
    end: '2026.07',
    period: '2026.6 - 2026.7',
    role: '独立开发',
    summary:
      '完整实现数据分析 AI Agent 应用，覆盖分层 Prompt、工作流编排、自定义工具调用与安全拦截的完整链路。',
    tags: ['Agent 工作流', 'Prompt 工程', 'Function Calling', 'ReAct'],
    highlights: [
      '实现分层 Prompt 模板引擎，根据用户权限动态拼装上下文，完成 Agent 工作流搭建，掌握 Prompt 工程实践。',
      '设计自定义数据查询工具调用链路，增加执行前安全拦截护栏，自动修正错误 SQL，提升 Agent 执行鲁棒性。',
      '改造 Agent 内部 ReAct 执行流程，搭建事件监控，实现全执行链路可视化，完成智能应用原型开发验证。',
    ],
  },
  {
    slug: 'traffic-analyzer',
    name: '基于 YOLO11 的无人机交通流智能分析系统',
    end: '2025.09',
    period: '2025.2 - 2025.9',
    role: '核心开发者',
    summary: '面向无人机航拍视频的多任务实时分析系统，从检测跟踪到算法服务化的完整链路。',
    tags: ['YOLO11', 'ByteTrack', '多进程 + 共享内存', 'FastAPI'],
    metrics: [
      { value: '74.6', unit: 'FPS', label: '系统吞吐' },
      { value: '3.8', unit: 'x', label: '性能提升' },
      { value: '13.4', unit: 'ms', label: '单帧平均延迟' },
    ],
    highlights: [
      '基于 YOLO11 + ByteTrack 完成检测与跟踪，结合相机标定与逆透视变换完成像素坐标到世界坐标的转换。',
      '设计 DAG 任务编排与流水线并行推理架构，采用多进程 + 共享内存机制完成并发推理优化，系统吞吐由 19.8 FPS 提升至 74.6 FPS。',
      '将算法封装为 FastAPI REST / WebSocket 在线服务，支持批处理与流式推送，完成算法产品化验证。',
    ],
    href: 'https://github.com/lizao-hub/traffic-analyzer',
    hrefLabel: 'GitHub 仓库',
  },
]

/** 从新到旧。列表页和首页的「精选项目」都读这一份。 */
export const projectsByDate: Project[] = [...projects].sort((a, b) => b.end.localeCompare(a.end))

export function findProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug)
}

export function projectNeighbours(slug: string): { prev?: Project; next?: Project } {
  const index = projectsByDate.findIndex((project) => project.slug === slug)
  if (index === -1) return {}
  return {
    prev: projectsByDate[index - 1],
    next: projectsByDate[index + 1],
  }
}
