import type { Project } from '@/types/project'
import demoVideo from '@/assets/videos/traffic-analyzer-demo.mp4'
import demoPoster from '@/assets/videos/traffic-analyzer-poster.webp'

/**
 * 项目的**唯一内容来源**。加项目、改文案都在这个文件里，不动组件。
 *
 * **这里刻意不接数据库。** 正文是排版：一句引子、一段正文、一句旁白，
 * 外加按需出现的数字 / 短句 / 表格（highlight: 12 这种字段指向的是
 * 「整张表只亮这一行」—— 它表达的是版式意图，不是数据）。
 * 把它们拆成 project / block / block_stat / block_point / block_table_row
 * 五张表，或者整块塞进一个 JSON 列，除了多一份要维护的状态，什么也没换来。
 *
 * 会增长、要持久化的东西才进库：**点赞数和评论**（见 data/reactions.ts），
 * 它们按 slug 挂在这份内容上，正文一个字都不在数据库里。
 */

export const projects: Project[] = [
  {
    slug: 'industrial-llm-rag',
    name: 'RAT-LLM: A Retrieval-Augmented Temporal LLM for Zero-Shot Soft Sensing in Multimode Industrial Processes',
    period: '2025.10 - 2026.08',
    end: '2026.08',
    role: '第一作者',
    keywords: ['Retrieval-augmented LLM', 'Zero-shot soft sensing', 'MTRM', 'PEFT / LoRA'],
    summary: '针对多工况工业过程在未知工况下因分布偏移导致传统软测量模型泛化失效的问题，提出 RAT-LLM（Retrieval-Augmented Temporal LLM）零样本软测量框架，通过多尺度时序检索从源域历史数据中挖掘可迁移动态模式，结合 MTRM 多粒度时序表征与 Cross-Attention 完成检索上下文重构，并采用 PEFT/LoRA 将预训练 LLM 适配至工业连续信号，同时设计 Similarity–Utility Alignment 机制，以预测效用反向优化检索策略，最终在两个真实氨合成工业过程中验证其对未知工况的零样本泛化能力。',
    lede: 'RAT-LLM is a retrieval-augmented temporal LLM built for zero-shot soft sensing in multimode industrial processes: retrieve transferable historical dynamics, reprogram them into LLM-compatible temporal representations, and let the model infer quality variables without any target-mode training data.',
    blocks: [
      {
        kicker: '',
        lead: 'Known modes can look perfect. Then everything breaks.',
        text: 'Industrial processes operate in multiple modes. In the revised ZSSS protocol the model is trained only on known source modes and evaluated on entirely unseen target modes; target segments never enter training or the retrieval candidate set. The challenge is therefore not ordinary forecasting — it is generalization across distribution shift, with no target-mode labels.',
        points: ['Known modes · source domain — HLT pooled R² 0.9454 · PD pooled R² 0.9466.', 'Unknown modes · target domain — the same baseline families collapse: Time-LlaMA falls to R² −22.3839 on HLT Unknown 2, where RAT-LLM holds at +0.3617.'],
        aside: 'The research question: when the operating mode is new, can historical local dynamics act as transferable empirical priors?',
      },
      {
        kicker: '',
        lead: 'One researcher. One full loop.',
        text: 'This was a solo research project. I handled the pipeline from problem formulation and method design through implementation, baseline adaptation, experiments and visualization to the manuscript itself.',
        stats: [
          {
            value: '85.04',
            unit: 'M',
            label: 'Total parameters, reported configuration',
          },
          {
            value: '90',
            unit: '+',
            label: 'Experiment runs and groups tracked',
          },
          {
            value: '4',
            unit: '×',
            label: 'NVIDIA RTX 4080 16GB used for training',
          },
          {
            value: '12',
            label: 'Baselines across LLM, Transformer, CNN and recurrent families',
          },
          {
            value: '2',
            label: 'Real industrial cases: HLT and PD',
          },
          {
            value: '20.24',
            unit: 'ms',
            label: 'CPU latency on HLT, batch 1, mean of 100 runs',
          },
        ],
        aside: 'Execution details come from the project development record; benchmark metrics are from the revised manuscript.',
      },
      {
        kicker: '',
        lead: 'Zero-shot means zero leakage.',
        text: 'The revised manuscript makes the evaluation condition explicit: known modes provide labels for training, the source-domain candidate set is unlabeled and used only for retrieval, and unknown modes stay isolated for evaluation.',
        table: {
          head: ['Stage', 'Data', 'Role in the pipeline'],
          rows: [
            ['Known modes 1–3', 'HLT source domain', 'Training labels'],
            ['Candidate set', '≈15k unlabeled source segments', 'Retrieval only (x, no y)'],
            ['Unknown 1', 'Mode 4, unseen in training and retrieval', 'Test'],
            ['Unknown 2', 'Mode 5, stronger distribution shift', 'Test'],
          ],
        },
        aside: 'Isolation rule: no target segment enters training or the retrieval knowledge base.',
      },
      {
        kicker: '',
        lead: 'Retrieve. Reprogram. Reason.',
        text: 'RAT-LLM is organized as a three-stage system. The retrieval encoder searches for dynamically relevant history; MTRM turns the query and the retrieved sequences into complementary temporal representations; PEFT adapts a lightweight GPT-2 backbone to fuse those tokens and regress the quality variable.',
        points: ['01 / Retrieval — pointwise and dilated temporal convolutions map the query into a latent dynamic space, where a cosine Top-K picks the history to reuse.', '02 / Representation — MTRM keeps two paths: fine-grained patch tokens preserve the query’s own dynamics, coarse retrieval tokens suppress noisy history.', '03 / Adaptation — a frozen backbone carries the knowledge; LoRA plus trainable positional embeddings and LayerNorm carry the adaptation.', 'Output — the quality variable ŷ is read from the final hidden state.'],
        aside: 'The two paths are separated on purpose: transient local structure and retrieved context are different kinds of evidence, and they entangle badly when forced through one channel.',
      },
      {
        kicker: '',
        lead: 'The first proof was not the final model.',
        text: 'My earliest successful retrieval version concatenated the query with the retrieved sequences, compressed the time dimension with an MLP, then fed the result to an LLM. It proved the point that mattered: retrieval could move an Unknown Mode R² from negative to positive. Everything after that was built to make the signal cleaner, more structured and more trainable.',
        points: ['Step 01 · Hard retrieval — raw temporal signals compared with Euclidean or cosine nearest-neighbour. Easy to build, and wrong in an instructive way: similarity is not utility.', 'Step 02 · First success — retrieved sequences concatenated along the time axis, MLP-compressed back to the original length, then passed to the LLM. The first run where retrieval pushed an Unknown Mode R² from negative to positive.', 'Step 03 · RAT-LLM — learned retrieval, MTRM separating fine query modelling from coarse historical context, and Similarity–Utility Alignment feeding predictive utility back to the retriever.'],
      },
      {
        kicker: '',
        lead: 'Find what helps, not just what looks close.',
        text: 'Two candidates can sit at nearly the same distance in embedding space and differ completely in whether they help the predictor. During training each candidate is evaluated in isolation; the resulting predictive utility becomes a pseudo-label distribution, and a KL divergence aligns it with the retriever’s own similarity distribution.',
        table: {
          caption: 'Illustrative candidate ranking · concept view',
          head: ['Candidate', 'Similarity', 'Utility'],
          rows: [
            ['A / 01', '0.96', '0.34'],
            ['B / 02', '0.88', '0.92'],
            ['C / 03', '0.82', '0.66'],
            ['D / 04', '0.74', '0.52'],
          ],
          highlight: 1,
        },
        aside: 'Training loop: standard forward path → per-candidate forward path → predictive utility distribution → KL alignment → retriever update.',
      },
      {
        kicker: '',
        lead: 'Pressure-tested on two real processes.',
        text: 'The manuscript evaluates RAT-LLM on real ammonia-synthesis data from the High-Low Transformer (HLT) and Pre-Decarbonization (PD) units. Each case holds one known source regime and two unseen target modes with increasing distribution shift.',
        stats: [
          {
            value: '0.9454',
            label: 'HLT · known modes, pooled',
          },
          {
            value: '0.7795',
            label: 'HLT · unknown mode 1',
          },
          {
            value: '0.3617',
            label: 'HLT · unknown mode 2',
          },
          {
            value: '0.9466',
            label: 'PD · known modes, pooled',
          },
          {
            value: '0.8091',
            label: 'PD · unknown mode 1',
          },
          {
            value: '0.5499',
            label: 'PD · unknown mode 2',
          },
        ],
        aside: 'The unknown modes are where the baselines stop working. RMSE / MAE for the HLT unknown modes: 0.0212 / 0.0157 and 0.0346 / 0.0272.',
      },
      {
        kicker: '',
        lead: 'Full benchmark · HLT case',
        text: 'Twelve state-of-the-art baselines across LLM, Transformer, CNN and recurrent families, all under the same leakage-free protocol. RAT-LLM is the only one that stays positive once the operating mode is unknown.',
        table: {
          head: ['Model', 'Known R²', 'Unknown 1 R²', 'Unknown 2 R²'],
          rows: [
            ['GPT4TS', '0.5897', '0.3245', '−4.8773'],
            ['CALF', '0.7883', '−0.9709', '−1.1483'],
            ['Time-LlaMA', '0.8402', '−0.3859', '−22.3839'],
            ['Transformer', '0.8970', '0.3239', '−0.2020'],
            ['Crossformer', '0.7668', '−0.6070', '−1.1730'],
            ['Pathformer', '0.9172', '−0.3765', '−4.8289'],
            ['LSTM', '0.9570', '0.3618', '−1.9380'],
            ['ST-LSTM', '0.9582', '0.5460', '−7.6657'],
            ['STA-LSTM', '0.9281', '0.6024', '−6.3539'],
            ['DCNN', '0.9654', '−0.2611', '−3.3091'],
            ['LDCNN', '0.8890', '−0.6148', '−6.9451'],
            ['MSACNN', '0.9578', '0.6349', '−4.4895'],
            ['RAT-LLM', '0.9454', '0.7795', '0.3617'],
          ],
          highlight: 12,
        },
      },
      {
        kicker: '',
        lead: 'Not a toy benchmark.',
        text: 'Both cases come from ammonia-synthesis process units. HLT predicts outlet residual CO concentration; PD predicts residual CO₂ concentration.',
        points: ['HLT · High-Low Transformer unit — 26 process variables → residual CO. 20,898 train · 5,973 validation · 2,985 known-mode test · ≈15,000 retrieval candidates · 2,000 unknown-mode samples.', 'PD · Pre-Decarbonization unit — 15 process variables → residual CO₂. 8,232 train · 2,352 validation · 1,176 known-mode test · ≈6,600 retrieval candidates.'],
        aside: 'The retrieval candidate set is source-domain data without quality labels (x only); ground-truth y in the target domain is reserved for evaluation. Source: the revised RAT-LLM manuscript — terminology and benchmark values follow it.',
      },
    ],
  },
  {
    slug: 'traffic-analyzer',
    name: '基于 YOLO11 的无人机交通流智能分析系统',
    period: '2025.2 - 2025.9',
    end: '2025.09',
    role: '核心开发者',
    keywords: ['YOLO11', 'ByteTrack', '流水线并行', '多进程 + 共享内存', 'FastAPI'],
    summary:
      '面向公安交管高架场景，构建基于 YOLO11 与 ByteTrack 的无人机交通流智能分析系统。完成高架区域分割、车辆与车道线跟踪、速度与密度估计及异常事件识别，并针对多阶段视觉任务的串行瓶颈，引入 DAG 任务编排、多进程与共享内存构建流水线并行推理架构，最终通过 FastAPI 完成算法服务化。',
    lede:
      '面向公安交管高架场景，将 YOLO11、ByteTrack 与多阶段视觉分析组织成实时并行推理流水线，再通过 FastAPI 提供批处理与实时流式服务。',
    blocks: [
      {
        kicker: '真实运行场景',
        lead: '让无人机成为交通监测工具。',
        text:
          '系统直接处理无人机航拍视频，对双向高架道路进行独立区域分析，持续输出车辆检测、交通流量、密度、速度及异常事件等信息。',
        video: {
          src: demoVideo,
          poster: demoPoster,
          caption: 'Area 1 / Area 2 · 车辆检测与区域分析',
        },
        points: [
          '目标场景 — 公安交管高架道路 · 无人机空中交通分析',
          '核心能力 — 道路区域分割 · 车辆/车道线检测（并跟踪） · 速度/密度估计 · 异常事件',
          '系统输出 — 分析视频 · 交通指标 · 事件提醒 · 实时结果流',
          '技术栈 — Python · PyTorch · YOLO11 · ByteTrack · FastAPI · 多进程 · 共享内存',
        ],
      },
      {
        kicker: '性能优化',
        lead: '从 19.8 FPS 到 74.6 FPS。',
        text:
          '真正的瓶颈不在目标检测，而在多阶段任务的串行等待。将处理链拆分成独立阶段后，不同视频帧可以同时处于不同阶段，让整条流水线持续推进。',
        table: {
          caption: '处理方式对照',
          head: ['处理方式', '吞吐', '说明'],
          rows: [
            [
              '串行',
              '19.8 FPS',
              '一帧依次走完分割、车辆跟踪、车道线跟踪与指标计算；前一阶段没有结束，后一阶段无法开始',
            ],
            [
              '流水线并行',
              '74.6 FPS',
              '各阶段拆成独立任务持续运行，不同视频帧同时处于不同处理阶段',
            ],
          ],
          highlight: 1,
        },
        // aside:
        //   '性能提升的核心不是单纯更换模型，而是改变任务执行方式：让多个阶段同时处理不同视频帧，从“所有步骤依次等待”变成“多个阶段持续并行推进”。',
      },
      {
        kicker: '系统架构',
        lead: '多进程 + 共享内存。',
        text:
          '主进程负责视频输入输出、任务调度、共享内存与 API；道路分割、车辆跟踪和车道线跟踪分别运行在独立进程中，最终由主进程中的后处理线程完成多路结果汇合。',
        flow: {
          caption: '系统处理架构',
          stages: [
            {
              title: '主进程',
              items: [
                { name: '视频输入输出'},
                { name: '任务调度'},
                { name: 'API'}
              ],
            },
            // {
            //   title: '共享内存',
            //   items: [{ name: '共享图像缓冲区'}],
            // },
            {
              title: '三个计算进程',
              items: [
                { name: '道路分割'},
                { name: '车辆跟踪'},
                { name: '车道线跟踪'},
              ],
            },
            {
              title: '结果汇合',
              items: [
                {
                  name: '后处理线程',
                  note: '按帧编号对齐多路结果，计算速度、密度、拥堵与事件状态',
                },
              ],
            },
          ],
        },
        points: [
          '大图像走共享内存 — 避免在多个进程之间反复复制完整图像，任务消息携带帧编号和轻量元数据',
          '不同视觉阶段独立运行 — 道路分割、车辆跟踪和车道线跟踪分别占用独立计算资源，不再被单一串行流程绑在一起',
          '结果按照帧编号重新对应 — 多路计算完成后，根据同一视频帧的编号重新汇合，保证最终结果和原始视频顺序一致',
          // '为什么后处理使用线程 — 后处理需要频繁访问共享内存、结果队列并及时回收资源，留在主进程中可以减少额外的跨进程通信，同时让视频提交、结果回收和 CPU 后处理彼此重叠',
        ],
      },
      {
        kicker: 'AI 数据链路',
        lead: '从模型结果到真正的交通状态。',
        text:
          '模型只负责提供分割、检测和跟踪；系统进一步把这些结果转化为车辆速度、密度与事件状态，让 AI 模型输出最终进入业务逻辑。',
        flow: {
          caption: 'AI 数据链路',
          stages: [
            {
              title: '视觉感知',
              items: [
                { name: 'YOLO11', note: '道路 / 车辆 / 车道线' },
                { name: 'ByteTrack', note: '跨帧目标轨迹' },
              ],
            },
            {
              title: '运动计算',
              items: [
                { name: '像素 → 物理尺度', note: '车辆宽度 ≈ 2.2 m' },
                { name: '跨帧位移', note: '车辆 / 车道线' },
              ],
            },
            {
              title: '交通业务状态',
              items: [
                { name: '速度'},
                { name: '密度'},
                { name: '事件', note: '拥堵 / 异常目标' },
              ],
            },
          ],
        },
        points: [
          // '分区域、分车道统计 — 每个高架实体独立计算，每条车道分别统计 vehicle count · speed · density',
          '速度估计 — 先利用车道线在连续帧之间的位移，估计无人机相对地面的运动速度；再根据车辆在连续帧之间的像素位移，计算车辆相对无人机的运动速度；最后将两者结合，得到车辆相对地面的车速，并对连续帧结果进行滤波',
          '密度估计 — 使用“高架实体内车辆像素面积 ÷ 高架实体像素面积”计算图像空间密度',
          '项目示例规则 — AVG SPEED < 10 且 DENSITY > 50 判定拥堵；motorcycle / person 进入高架实体区域时触发事件提醒',
        ],
      },
      {
        kicker: '服务化',
        lead: '让视觉算法从离线脚本变成可调用的服务。',
        text:
          '使用 FastAPI + Uvicorn 封装完整分析链路，同时提供批处理任务和实时流式推送两条使用路径，让 AI 推理能力真正进入应用层。',
        flow: {
          caption: '服务链路',
          stages: [
            {
              title: '调用方',
              items: [{ name: '前端'}],
            },
            {
              title: '接口层',
              items: [{ name: 'FastAPI'}],
            },
            {
              title: '推理',
              items: [{ name: 'AI 推理流水线'}],
            },
            {
              title: '产出',
              items: [{ name: '分析结果'}],
            },
          ],
        },
        table: {
          caption: '接口设计',
          head: ['方法', '接口', '作用'],
          rows: [
            ['POST', '/analyze', '提交视频分析任务，适合批处理工作流'],
            ['WS', '/stream', '实时推送分析结果与交通状态'],
            ['GET', '/result/{task_id}', '获取指定分析任务的结果'],
          ],
        },
        points: [
          '批处理 — 提交完整视频任务，分析完成后通过任务 ID 获取结果',
          '实时流式 — 通过 WebSocket 持续接收分析结果和交通状态变化',
        ],
      },
    ],
    metrics: [
      {
        value: '74.6',
        unit: 'FPS',
        label: '系统吞吐',
      },
      {
        value: '3.8',
        unit: '×',
        label: '相较串行基准的吞吐提升',
      },
      {
        value: '13.4',
        unit: 'ms',
        label: '单帧平均延迟',
      },
    ],
    metricsNote:
      '19.8 FPS → 74.6 FPS：性能提升主要来自流水线并行，而不是单纯替换模型。',
    // href: 'https://github.com/lizao-hub/traffic-analyzer',
    // hrefLabel: 'GitHub 仓库',
  },
]

/** 从新到旧。列表页和详情页的「上一件 / 下一件」都按这个顺序。 */
export const projectsByDate = [...projects].sort((a, b) => b.end.localeCompare(a.end))


/** 清单里找一条。slug 不存在就是 undefined，路由守卫靠它退回清单页。 */
export function findProject(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug)
}

/**
 * 详情页底部的「上一件 / 下一件」。
 * 走 projectsByDate 而不是 projects，和列表页是同一条顺序。
 *
 * ⚠️ **当前没有落点**：详情页底部改成了「回列表」（下方一个出口），
 * 相邻项目导航 2026-09-20 撤掉了。函数留着 —— 顺序口径和列表页共用一条，
 * 哪天真要再接回去，直接接上即可。
 */
export function projectNeighbours(slug: string): { prev?: Project; next?: Project } {
  const index = projectsByDate.findIndex((project) => project.slug === slug)
  if (index === -1) return {}
  return { prev: projectsByDate[index - 1], next: projectsByDate[index + 1] }
}
