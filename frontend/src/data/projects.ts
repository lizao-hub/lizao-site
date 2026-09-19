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
        lead: 'Known modes can look perfect. Then everything breaks.',
        text: 'Industrial processes operate in multiple modes. In the revised ZSSS protocol the model is trained only on known source modes and evaluated on entirely unseen target modes; target segments never enter training or the retrieval candidate set. The challenge is therefore not ordinary forecasting — it is generalization across distribution shift, with no target-mode labels.',
        points: ['Known modes · source domain — HLT pooled R² 0.9454 · PD pooled R² 0.9466.', 'Unknown modes · target domain — the same baseline families collapse: Time-LlaMA falls to R² −22.3839 on HLT Unknown 2, where RAT-LLM holds at +0.3617.'],
        aside: 'The research question: when the operating mode is new, can historical local dynamics act as transferable empirical priors?',
      },
      {
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
        lead: 'Retrieve. Reprogram. Reason.',
        text: 'RAT-LLM is organized as a three-stage system. The retrieval encoder searches for dynamically relevant history; MTRM turns the query and the retrieved sequences into complementary temporal representations; PEFT adapts a lightweight GPT-2 backbone to fuse those tokens and regress the quality variable.',
        points: ['01 / Retrieval — pointwise and dilated temporal convolutions map the query into a latent dynamic space, where a cosine Top-K picks the history to reuse.', '02 / Representation — MTRM keeps two paths: fine-grained patch tokens preserve the query’s own dynamics, coarse retrieval tokens suppress noisy history.', '03 / Adaptation — a frozen backbone carries the knowledge; LoRA plus trainable positional embeddings and LayerNorm carry the adaptation.', 'Output — the quality variable ŷ is read from the final hidden state.'],
        aside: 'The two paths are separated on purpose: transient local structure and retrieved context are different kinds of evidence, and they entangle badly when forced through one channel.',
      },
      {
        lead: 'The first proof was not the final model.',
        text: 'My earliest successful retrieval version concatenated the query with the retrieved sequences, compressed the time dimension with an MLP, then fed the result to an LLM. It proved the point that mattered: retrieval could move an Unknown Mode R² from negative to positive. Everything after that was built to make the signal cleaner, more structured and more trainable.',
        points: ['Step 01 · Hard retrieval — raw temporal signals compared with Euclidean or cosine nearest-neighbour. Easy to build, and wrong in an instructive way: similarity is not utility.', 'Step 02 · First success — retrieved sequences concatenated along the time axis, MLP-compressed back to the original length, then passed to the LLM. The first run where retrieval pushed an Unknown Mode R² from negative to positive.', 'Step 03 · RAT-LLM — learned retrieval, MTRM separating fine query modelling from coarse historical context, and Similarity–Utility Alignment feeding predictive utility back to the retriever.'],
      },
      {
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
    keywords: ['YOLO11', 'ByteTrack', '多进程 + 共享内存', 'FastAPI'],
    summary: '面向公安交管高架场景，基于 YOLO11、ByteTrack 构建无人机交通流实时分析系统，完成高架分割、车辆与车道线跟踪、车速/密度估计、车道级流量统计及拥堵与异常事件识别，并通过 DAG 流水线、多进程与共享内存实现高并发推理，最终以 FastAPI 完成算法服务化。',
    lede: '基于 YOLO11 的无人机交通流智能分析系统。将高架路面分割、车辆与车道线追踪、像素—物理尺度估计、速度与密度计算组织成一条实时并行推理流水线，并通过 FastAPI 服务化。',
    blocks: [
      {
        lead: 'Aerial video becomes a traffic instrument.',
        text: '真实运行视频：双向高架被独立分区，系统持续给出车辆检测、数量、密度 与无人机速度等运行信息。',
        video: {
          src: demoVideo,
          poster: demoPoster,
          caption: 'Area 1 / Area 2 · detection + tracking overlay',
        },
        points: ['目标场景 — 公安局交通管理支队高架大队 · UAV aerial traffic analysis', '运行环境 — RTX 4080 · i7 · CUDA · PyTorch · FastAPI · Uvicorn', '系统输出 — Flow · Speed · Density，以及车道 / 匝道级统计与事件提醒'],
      },
      {
        lead: 'The bottleneck was not detection. It was orchestration.',
        text: '把串行任务拆成独立的 stage，让不同帧在不同 stage 上同时执行；大图像进入共享内存，队列里只传轻量级的 seq 与 result。',
        stats: [
          {
            value: '19.8',
            unit: 'FPS',
            label: 'Baseline · single-process serial pipeline',
          },
          {
            value: '74.6',
            unit: 'FPS',
            label: 'System throughput · pipeline parallelism',
          },
          {
            value: '3.8',
            unit: '×',
            label: 'Throughput uplift · 74.6 ÷ 19.8 ≈ 3.77',
          },
          {
            value: '13.4',
            unit: 'ms',
            label: 'Average frame latency · project benchmark',
          },
        ],
        points: ['01 · Video Decode — read / write frame', '02 · Road Segmentation — YOLO11 · Area 1 / 2', '03 · Vehicle Tracking — YOLO11 + ByteTrack', '04 · Lane Tracking — lane geometry', '05 · Pixel → World — scale / coordinate', '06 · Traffic Metrics — speed / density', '07 · Service — REST / WebSocket'],
      },
      {
        lead: 'Four processes. Shared pixels. One ordered result stream.',
        text: '主进程负责提交、共享内存、调度与 API；S / V / L 三个 worker 进程承担主要视觉计算；P 线程负责按 seq 汇合三路结果并做 CPU 后处理。',
        stats: [
          {
            value: '4',
            unit: 'processes',
            label: '主进程 + S / V / L 三个 worker',
          },
          {
            value: '5',
            unit: 'threads',
            label: 'worker 内部单线程循环，主进程另有 P 线程',
          },
        ],
        table: {
          caption: 'Process topology',
          head: ['Process', 'Role'],
          rows: [
            ['MAIN — TrafficAnalyzerMP', 'API · frame I/O · scheduling · shared memory'],
            ['S / cuda:4 — seg_worker', 'YOLO11 road segmentation · masked / overlay / masks'],
            ['V / cuda:5 — veh_worker', 'vehicle tracking · mask grouping · result packet'],
            ['L / cuda:6 — lane_worker', 'lane-line tracking · lane boxes'],
            ['P / CPU thread — post_loop', 'seq alignment · speed / density / congestion · final emit'],
            ['OUTPUT — result stream', 'threading.Queue for streaming · dict for batch results'],
          ],
        },
        points: ['FRAME — 大图走共享内存，只有轻量包走 multiprocessing.Queue', 'q_to_s — 主线程 → S：只发 seq，worker 按 seq 自己去共享内存读像素', 'q_s_to_l/v/p — S 分割完成后，把 seq + 轻量元数据扇出给车道、车辆与后处理三路', 'q_l/v_to_p — L / V 把 lane_boxes、veh_pkt 这类小结果送进 P 线程', 'barrier — P 线程等同一 seq 的 S / L / V 三路齐全，再进最终后处理'],
      },
      {
        lead: 'Why P is a thread, not another process.',
        text: 'P 频繁访问共享内存、queue 和 semaphore；把它留在主进程里，可以省掉额外的 pickle / IPC 与桥接线程。',
        points: ['01 · Prevent backpressure deadlock — 主线程可能因槽位已满而阻塞，P 线程在后台释放槽位；拆开生产者与消费者之后，系统才能持续推进。', '02 · Overlap I/O + CPU post — 读帧、写共享内存与后处理可以重叠执行，numpy / cv2 的 CPU 工作不必占住 API 的提交流程。', '03 · Zero-copy return path — P 在主进程里能直接读共享内存、写结果队列并释放槽位；独立进程反而多出一趟跨进程结果传递。'],
      },
      {
        lead: 'Turn tracked pixels into traffic states.',
        text: '统计范围覆盖每个高架实体与每条车道；速度、密度与事件信息共同构成最终的交通状态。',
        points: ['Detection taxonomy — 系统实际输出 5 类目标：car / truck / bus / motorcycle / person。车辆类型用于计数、车流量与速度统计；motorcycle / person 出现在高架实体内时进入事件提醒。', 'Per-ramp / per-lane statistics — 每个高架实体独立计算，每条车道分别统计：vehicle count · traffic flow · lane flow · speed · density。其中密度 = 实体内车辆像素面积 ÷ 高架实体像素面积，用来和速度一起评估拥堵。', 'Pixel → Physical Scale — 用检测到的小客车像素宽度对齐经验物理宽度（vehicle width(px) ↔ ~2.2 m）建立比例，再把车道线中心的跨帧像素位移用于估计无人机自身的速度。', 'Ground Speed — 车辆帧间像素位移先得到相对无人机的速度，再结合无人机估计速度，并对帧间结果滤波。', 'Event / Congestion Logic — 当前已确定的示例规则：AVG SPEED < 10 · DENSITY > 60 判定为拥堵；motorcycle / person 出现在高架实体内时触发事件提醒。'],
      },
      {
        lead: 'The algorithm leaves the notebook.',
        text: '通过 FastAPI + Uvicorn 封装成在线服务，同时覆盖批处理与流式推送两条路径。',
        table: {
          caption: 'API',
          head: ['Method', 'Endpoint', '做什么'],
          rows: [
            ['POST', '/analyze', '提交分析任务，面向批处理工作流'],
            ['WS', '/stream', '实时流式推送分析结果'],
            ['GET', '/result/{task_id}', '获取指定任务的结果'],
          ],
        },
        aside: '运行栈 Python · PyTorch · CUDA · FastAPI · Uvicorn。从单进程串行的 19.8 FPS 到流水线并行后的 74.6 FPS —— 围绕真实的无人机视频，把检测、跟踪、几何与交通指标组织成一套可服务化的实时系统。',
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
        label: '性能提升',
      },
      {
        value: '13.4',
        unit: 'ms',
        label: '单帧平均延迟',
      },
    ],
    metricsNote: '吞吐的提升主要来自流水线：把检测、跟踪、坐标转换拆成独立的段之后，它们可以并行跑在不同的帧上，而不是排队等上一段结束。',
    href: 'https://github.com/lizao-hub/traffic-analyzer',
    hrefLabel: 'GitHub 仓库',
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
 */
export function projectNeighbours(slug: string): { prev?: Project; next?: Project } {
  const index = projectsByDate.findIndex((project) => project.slug === slug)
  if (index === -1) return {}
  return { prev: projectsByDate[index - 1], next: projectsByDate[index + 1] }
}
