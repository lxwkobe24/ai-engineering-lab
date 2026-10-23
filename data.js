/*
 * 内容数据文件 — 这是站点的可编辑“知识内容层”。
 * 请将下面的示例文章替换为真实的学习笔记；不要上传任何涉密业务资料。
 * 新增文章请在 window.LAB_DATA.notes 数组中添加对象，slug 保持唯一。
 */
window.LAB_DATA = {
  profile: {
    name: "罗雄炜",
    headline: "AI Engineer / Agent & LLM Systems",
    introduction: "我专注于大语言模型、Agent 与 AI 工程化，持续研究模型原理、系统架构和真实业务落地。"
  },
  categories: [
    {id:"engineering",number:"01",name:"编程与软件工程",desc:"Python 并发、API、架构设计、可观测性与工程质量。",icon:"code",topic:"工程",details:"用可靠的软件系统托住智能应用。"},
    {id:"fundamentals",number:"02",name:"AI / 深度学习",desc:"PyTorch、自动微分、Attention、Transformer 与优化算法。",icon:"brain",topic:"算法",details:"从数学与训练过程理解模型。"},
    {id:"llm",number:"03",name:"LLM 与训练",desc:"预训练、微调、对齐、长上下文、推理机制。",icon:"sparkles",topic:"LLM",details:"理解模型能力从何而来。"},
    {id:"rag",number:"04",name:"RAG 与知识工程",desc:"Embedding、BM25、RRF、Rerank、GraphRAG 与评测。",icon:"layers",topic:"RAG",details:"将知识检索变成可靠的答案。"},
    {id:"agent",number:"05",name:"Agent / Harness",desc:"Skills、MCP、Tools、规划执行、记忆与状态管理。",icon:"network",topic:"Agent",details:"让智能体真正安全地完成任务。"},
    {id:"evaluation",number:"06",name:"模型评测与安全",desc:"评测集、质量指标、提示词注入、安全与权限边界。",icon:"shield",topic:"评测",details:"用数据和机制建立可信度。"},
    {id:"multimodal",number:"07",name:"多模态智能",desc:"OCR、ASR、TTS、视觉理解、音视频分析与文档解析。",icon:"aperture",topic:"多模态",details:"跨越文本、图像、语音与视频。"},
    {id:"production",number:"08",name:"推理与生产工程",desc:"vLLM、SGLang、分布式、容器、性能分析和 SLA。",icon:"server",topic:"推理",details:"从可运行走到可运营。"},
    {id:"source",number:"09",name:"开源源码研究",desc:"精读优秀仓库，追踪设计权衡与真实工程实现。",icon:"git",topic:"源码",details:"由使用者成长为构建者。"}
  ],
  notes: [
    {
      slug:"harness-vs-workflow",category:"Agent",title:"Harness、Agent 与 Workflow：真正的边界在哪里？",
      desc:"从运行时、工具协议、上下文装配与执行控制四个视角理解智能体框架。",read:12,date:"专题草稿",featured:true,
      body:`## 为什么要区分它们？

Workflow 更偏向预定义的步骤，Agent 强调在约束下动态选择行动，而 **Harness 更像承载智能体执行的运行基座**：它把模型调用、工具执行、权限、状态、上下文与观察能力组织成一个可以长期运行的系统。

同样一个“查询客户问题 → 检索知识 → 生成结论”的需求，固定流程可以用 Workflow 实现；如果需要根据问题内容自主选择数据源、进行补充验证，再决定调用哪项工具，Agent 才显出价值。

## 从四个边界理解架构

- **模型边界**：LLM 负责决策或生成，不能把它当作拥有真实权限的进程。
- **工具边界**：Tools 执行具体动作，必须受权限、入参校验和审计控制。
- **运行时边界**：Harness 处理会话、任务生命周期、超时、重试和恢复。
- **业务边界**：Skill 描述完成某类任务的方法，MCP 可以作为跨进程工具接入协议。

## 一个最小执行闭环

\`\`\`text
用户意图
   ↓
上下文组装 → 模型决策
                ↓
          Skill / Tool 选择
                ↓
          权限校验与执行
                ↓
          结果观察 / 状态更新
                ↓
          继续执行或返回
\`\`\`

## 真正值得工程化的问题

1. Skill 是一次性全文注入，还是采用按需发现和渐进式加载？
2. 工具调用出错后，哪些动作可以重试，哪些动作必须阻断？
3. 模型上下文是否会泄露企业内部数据？
4. 一次执行跨越多个服务时，如何追踪、取消和恢复？

> 核心结论：Harness 的价值并非“更强的提示词”，而是将 Agent 的行为变得可约束、可观察、可维护。

## 动手练习

做一个只包含两个 Skill（知识检索与文档摘要）的最小 Harness，分别测量成功率、任务步骤数、端到端延迟和异常恢复率。`
    },
    {
      slug:"asyncio-concurrency",category:"工程",title:"asyncio、Bounded Concurrency 与超时边界",
      desc:"为什么异步不等于无限并发？从事件循环到限流和超时预算。",read:10,date:"专题草稿",
      body:`## 协作式并发的本质

\`asyncio\` 适合 I/O 密集任务：当协程执行到 \`await\` 时，会主动让出执行权，让事件循环调度其他就绪任务。它不是自动让 CPU 运算并行运行。

## 为什么要有 Bounded Concurrency？

如果同时请求 1000 个外部模型接口，可能把连接池、下游队列和内存耗尽。使用 \`Semaphore\` 给在途任务设置上限，是保护系统与下游服务的基本手段。

\`\`\`python
import asyncio

semaphore = asyncio.Semaphore(8)

async def bounded_call(item):
    async with semaphore:
        async with asyncio.timeout(10):
            return await call_model(item)
\`\`\`

这里的 \`call_model\` 是需要自行实现的异步模型请求函数。

## Timeout Boundary 不是一个数字

实际系统中需要区分请求级截止时间、单次模型请求超时、工具级超时与重试总预算。比如一次用户请求预算 15 秒，不能给每次重试都分配 15 秒，否则整体 SLA 无法保证。

- 为整个请求建立 Deadline。
- 每次工具执行只能使用剩余时间预算。
- 幂等操作才适合自动重试；有副作用的操作要特别谨慎。
- 要能传播取消信号，并做好执行资源清理。

## 动手练习

实现一个并发 100 个模拟请求的服务端测试，分别设置并发上限为 5、20、100，记录吞吐、P95 时延和失败率。`
    },
    {
      slug:"hybrid-rag",category:"RAG",title:"RAG 检索融合：BM25、向量召回、RRF 与 Rerank",
      desc:"理解稀疏检索和语义检索的互补性，设计可评估的多路召回流程。",read:14,date:"专题草稿",
      body:`## 为什么不能只依赖向量检索？

语义检索擅长同义表达，BM25 擅长专有名词、型号、编号等精确词项。企业知识库往往两类查询同时存在，所以常采用混合检索。

## 常见流水线

\`\`\`text
用户问题
  ├── BM25 词法检索 ──────┐
  └── Embedding 向量检索 ─┤
                        ↓
                 RRF 排名融合
                        ↓
                  Reranker 重排
                        ↓
                证据校验 / 生成
\`\`\`

## RRF 的直觉

RRF 只依赖各检索器的排名，不要求原始相关性分数可以比较：

\`RRF(d) = Σ 1 / (k + rank_i(d))\`

排名越靠前，贡献越大。实践中，\`k\` 常取 60 作为起始点，但应使用评测集调参。

## 评估指标要匹配场景

- \`Recall@K\`：相关文档能否进入候选集合？
- \`MRR / nDCG\`：关键证据是否排在前面？
- 证据忠实度：生成答案是否确实由召回内容支持？
- P95 时延：多级检索是否超出交互预算？

## 动手练习

制作一份 100 条左右的真实匿名化测试问答，分别评估 BM25、Embedding、混合检索及加入 Rerank 后的表现，而不是只看单条 Demo。`
    },
    {
      slug:"llm-inference",category:"推理",title:"从 Prefill 到 Decode：一次 LLM 推理到底发生了什么？",
      desc:"理解 KV Cache、连续批处理、TPOT、TTFT 与吞吐之间的权衡。",read:13,date:"专题草稿",
      body:`## 两种性质不同的计算

**Prefill** 负责处理已有输入 token，通常包含规模较大的矩阵运算；**Decode** 通常每轮为各序列生成下一个 token，容易受到访存和 KV Cache 管理影响。

## KV Cache 存了什么？

自回归推理会重用历史 token 在注意力计算中产生的 Key 和 Value，避免每个生成步骤重复计算全部前缀。更长上下文意味着更大的缓存压力。

## 关键性能指标

- **TTFT**：从发起请求到返回首个 token 的时间。
- **TPOT**：首 token 之后，每新增 token 的平均时间。
- **吞吐**：一定时间内输出 token 数；需注明是全局还是每请求。
- **请求成功率 / P95**：反映服务在真实并发下的稳定性。

## 为什么连续批处理有价值？

不同请求的输入和输出长度各异，静态批处理容易浪费资源。持续地将新请求加入可执行批次、移除完成请求，可以提升整体 GPU 利用率，但延迟和公平性需要综合评估。

## 动手练习

设计一组不同输入长度与输出长度的基准测试，比较并发数变化下的 TTFT、TPOT、整体吞吐和显存使用曲线。`
    },
    {
      slug:"transformer-attention",category:"算法",title:"Self-Attention 原理：从矩阵公式到 PyTorch 实现",
      desc:"从 Q、K、V 的来源到缩放点积注意力，建立可计算的直觉。",read:11,date:"专题草稿",
      body:`## Attention 在解决什么？

Self-Attention 允许序列中的不同位置根据内容互相聚合信息，使模型不必依赖固定局部窗口才能建立远距离关联。

## 从 Q、K、V 到输出

设输入序列特征为 X，经线性映射得到 Q、K、V，计算 \`softmax(QKᵀ / √dₖ) V\`。其中除以 \`√dₖ\` 是为了缓解点积随维度增大而导致 Softmax 饱和的问题。

\`\`\`python
import torch
import torch.nn.functional as F

def attention(q, k, v):
    scale = q.shape[-1] ** -0.5
    scores = (q @ k.transpose(-2, -1)) * scale
    weights = F.softmax(scores, dim=-1)
    return weights @ v
\`\`\`

## 工程上还要考虑什么？

训练时可能需要因果掩码、padding mask、Dropout 等机制。普通实现会显式构造注意力矩阵，在长序列下增加内存开销；FlashAttention 等方法通过分块和 IO 感知优化降低显存访问压力。

## 动手练习

自己实现单头注意力，然后比较它与 PyTorch \`scaled_dot_product_attention\` 的数值差异、显存占用与速度。`
    },
    {
      slug:"skill-loading",category:"Agent",title:"Agent Skill 如何发现、加载与执行？",
      desc:"把 Skill 看作渐进式加载的任务能力，而非一次性塞入 Prompt。",read:9,date:"专题草稿",
      body:`## 为什么有 Skill？

当工具数量与工作流程变多，全部塞入系统提示词会增加上下文开销，也让模型难以判断哪种流程更合适。Skill 通常提供名称、用途描述、指令和辅助资源，可用于按需调用。

## 一个典型的 Skill 目录

\`\`\`text
skills/
  document-analysis/
    SKILL.md
    references/
      policy.md
    scripts/
      extract.py
\`\`\`

不同运行时对元数据、加载、权限和执行方式的要求可能并不完全一致。

## 推荐的执行链路

1. 启动时发现可用的 Skill 元信息。
2. 根据任务匹配候选能力。
3. 在需要时加载详细使用说明及相关资源。
4. 对外部执行动作校验权限、沙箱和参数。
5. 保留可追踪的执行结果与失败信息。

## 容易忽略的安全问题

Skill 指令属于可能被污染的内容源，不应因为它位于本地文件夹就默认可信。特别是能够读取敏感文件、发起网络请求或执行 Shell 的脚本，必须进行代码审查和权限隔离。

## 动手练习

在同一个智能体中加载三个 Skill，对比“全量指令注入”和“按需加载”在 token 消耗、工具路由准确率和最终任务成功率上的差异。`
    },
    {
      slug:"evaluation-harness",category:"评测",title:"如何构建一个可信的 Agent 评测 Harness？",
      desc:"把任务完成率、工具轨迹、安全性与成本整合到自动化评测。",read:12,date:"专题草稿",
      body:`## 不能只问“答案对不对”

一个 Agent 即使最后给出正确文本，也可能调用了不必要的敏感工具、遗漏校验步骤或者产生了不可接受的成本。评测必须覆盖过程和结果。

## 四层评测结构

- **任务集**：真实需求、边界案例、异常案例及攻击案例。
- **轨迹层**：工具选择、参数、重试、错误恢复、权限检查。
- **结果层**：答案正确性、证据支持、结构化输出有效性。
- **效率层**：P50/P95 延迟、token 成本、工具调用次数。

## 将数据集版本化

每次修改提示词、Skill 或模型时，用相同的固定评测集做回归，再用新鲜样本确认泛化能力。注意避免测试集污染。

## 动手练习

选 30 个覆盖常见任务和失败路径的样本，建立 JSONL 格式输入输出与预期检查，跑通一套能自动出对比报告的最小评测链。`
    },
    {
      slug:"distributed-training",category:"LLM",title:"大模型分布式训练：TP、PP、DP 的取舍逻辑",
      desc:"从显存容量、通信开销与流水线气泡理解并行策略。",read:15,date:"专题草稿",
      body:`## 为什么分布式并行不可避免？

当模型参数、优化器状态和激活无法放入单张卡的显存，就需要在设备之间分配计算与存储。

## 三种典型并行方式

- **DP 数据并行**：多份模型处理不同样本，同步梯度；配合优化器状态分片可以改善显存占用。
- **TP 张量并行**：切分同一层内的张量运算；常需频繁集合通信。
- **PP 流水线并行**：不同设备承载不同层，微批次在流水线中流动，需控制流水线气泡。

## 设计取舍

通信网络、模型结构、batch 大小、序列长度和微批次数量都会影响最佳配置。不要用某一组集群参数直接套所有规模的训练任务。

## 动手练习

为一个给定参数量和集群配置的训练任务估算参数、梯度、优化器和激活所需显存，再比较不同 TP/PP/DP 配比下的通信与流水线影响。`
    },
    {
      slug:"multimodal-voice",category:"多模态",title:"语音智能质检：ASR、说话人分离与情绪识别",
      desc:"拆解从录音文件到可审核的结构化质检结论。",read:11,date:"专题草稿",
      body:`## 从音频到可审核证据

典型语音质检不是简单的“录音发给一个模型”。稳定的流程要处理音频切分、静音、信道、说话人、识别与业务规则。

## 技术模块

1. 音频预处理：采样率统一、VAD 分段、噪声与声道处理。
2. ASR：将语音转为文字，保留时间戳和置信度相关信息。
3. 说话人分离：区分客服与客户发言，但需要可靠的角色映射。
4. 情绪或行为识别：可结合声学模型与文本上下文，避免直接把情绪推断当作事实。
5. 质检 Agent：根据证据判定业务风险，并输出可复核片段。

## 关键风险

方言、重叠讲话、背景噪声、短句和业务术语会显著影响效果。情绪识别具有不确定性，不适合单独作为对个人的处罚依据。

## 动手练习

用可合法使用的公开音频样例做一条最小质检链路，报告 CER/WER、时间戳误差和人工一致性，并保留原始证据定位。`
    },
    {
      slug:"ai-gateway",category:"工程",title:"统一 AI Gateway：从模型 API 到服务治理",
      desc:"如何将流式接口、负载均衡、熔断、超时与监控结合起来。",read:12,date:"专题草稿",
      body:`## 为什么需要统一 AI 网关？

当多个应用直接请求不同模型服务时，鉴权、日志、重试、模型路由和限流策略容易散落在各业务服务中。统一网关能收敛横切能力。

## 核心能力

- 统一协议与模型命名，兼容流式与非流式返回。
- 根据模型与服务实例状态进行路由与负载分配。
- 建立队列、并发、token 级指标与业务侧监控。
- 针对可安全重试的失败设计退避、兜底与熔断。
- 将用户、应用、模型配额与审计清晰关联。

## SSE 流式代理中的坑

流式传输必须正确处理客户端断开、上游取消、心跳、响应缓冲和异常终止。不能单纯把字符串拼接视为可靠的 SSE 代理。

## 动手练习

构建一个小型 FastAPI 代理，支持两个模拟模型服务，设计并发压测，并使用 Prometheus 记录延迟、成功率、上游错误与 token 使用。`
    },
    {
      slug:"tool-call-security",category:"Agent",title:"Tools、MCP、Skills：能力组织与安全边界",
      desc:"用一张清晰的分层图理解三者的职责与组合方式。",read:10,date:"专题草稿",
      body:`## 不要把三个概念混在一起

**Tool** 是可执行动作，**MCP** 提供一种工具和上下文能力的标准化接入方式，**Skill** 更强调如何完成一类任务的指令、流程和辅助资源。

## 推荐的层次

\`\`\`text
用户需求
  ↓
Agent Runtime / Harness
  ├── Skill: 场景方法与流程
  └── Tool Router
         ├── 本地工具
         ├── 内部 HTTP API
         └── MCP 服务端
\`\`\`

## 安全检查

高风险工具至少要有参数校验、角色权限、身份透传、操作记录和适当的人工确认。把“模型认为可以调用”与“系统授权允许调用”严格分开。

## 动手练习

把同一个文档摘要任务分别实现为本地 Python Tool、MCP Tool、Skill + Tool 组合，对比部署、复用、权限和维护复杂度。`
    },
    {
      slug:"reading-source",category:"源码",title:"读源码不是从第一行开始：工程化研究方法",
      desc:"通过核心路径追踪、断点和最小实验，建立对大型开源仓库的理解。",read:9,date:"专题草稿",
      body:`## 先建立问题，再进入源码

阅读成熟的 AI 项目时，从文件树逐行开始通常效率很低。更好的方式是先定义一个具体问题，例如“请求是如何被加入调度队列的？”再追踪入口和关键调用路径。

## 推荐方法

1. 明确运行环境和可复现的版本号。
2. 从 README、架构图和启动命令找到真实入口。
3. 用日志、断点或 profiling 观察一个最小请求。
4. 在关键边界画出状态变化和数据流。
5. 用小实验验证自己的猜想，记录反例和限制。

## 研究记录模板

\`\`\`text
问题：
测试版本：
入口文件 / 函数：
关键调用链：
核心数据结构：
实验与观测：
设计取舍：
还没搞懂的地方：
\`\`\`

## 动手练习

任选 vLLM 或一个 Agent Runtime，针对“一次请求从输入到工具调用”的完整路径写一篇能被其他人复现实验步骤的源码分析。`
    }
  ],
  projects: [
    {id:"harness",type:"PERSONAL R&D",featured:true,icon:"network",title:"Enterprise Agent Harness",desc:"为企业内网环境设计可扩展的智能体运行基座：Skill 插件化、工具调用、任务控制、安全隔离与可观测性。",tags:["Agent","Skills","MCP","Docker"],status:"架构探索 / 工程研究",detail:`## 目标

让业务能力以可组合的 Skill 接入统一智能体运行时，同时将 LLM 调用和本地执行环境解耦，支持离线部署。

## 核心模块

- **Runtime**：会话、状态、执行计划与任务生命周期。
- **Skills**：按需发现、加载、执行与版本管理。
- **Tools**：统一工具调用、参数校验、权限控制和审计。
- **Model Adapter**：兼容外部模型 API、流式输出和失败处理。
- **Observability**：执行轨迹、指标、日志和安全事件。

## 当前研究重点

离线依赖打包、Docker 容器部署、Skill 发现策略和真实业务执行边界。`},
    {id:"gateway",type:"SYSTEM DESIGN",icon:"server",title:"Unified AI Gateway",desc:"统一管理多模型接口和模型服务实例，研究流式响应、请求调度、模型路由、容错策略与监控治理。",tags:["FastAPI","SSE","Redis","Prometheus"],status:"工程实践 / 方案沉淀",detail:`## 为什么要统一服务入口？

当业务应用增多，模型接入方式、鉴权、超时与监控策略逐渐分散。网关统一横切能力，能够简化上层应用开发。

## 设计要点

- Generate / Embedding / Rerank 等能力抽象。
- 模型路由、负载均衡、限流和故障恢复。
- 请求与 token 级可观测性。
- SSE 流传输、取消传播与超时边界。

## 下一步实验

使用匿名化压力测试，建立跨模型和不同并发条件下的容量分析方法。`},
    {id:"rag",type:"AI APPLICATION",icon:"layers",title:"Agentic RAG Research",desc:"围绕混合检索、动态工具路由、多轮问答、证据校验构建可复现的知识增强问答系统。",tags:["Embedding","BM25","RRF","Rerank"],status:"方案迭代 / 质量评估",detail:`## 目标

让复杂知识检索由“相似度最高”走向“证据充分、可追溯、可评价”。

## 关键流程

1. Query 规范化、改写及必要的指代消解。
2. 并行多路召回，RRF 排名融合。
3. Reranker 精排与证据质量检查。
4. 使用可追溯证据生成答案。
5. 评测集回归：召回质量、答案忠实度与延迟。

## 下一步实验

比较父子分块和不同 Rerank 策略对准确率与延迟的影响。`},
    {id:"training",type:"MODEL SYSTEMS",icon:"brain",title:"LLM Training & Inference Lab",desc:"研究 Transformer、分布式训练、KV Cache、推理调度与显存管理，用数据理解效率瓶颈。",tags:["PyTorch","Megatron","vLLM","CUDA"],status:"持续学习 / 实验记录",detail:`## 研究方向

- 深入 Transformer 和语言模型训练原理。
- 理解 TP、PP、DP 与优化器内存分片。
- 实测 Prefill / Decode 和批处理性能。
- 研究量化与 Kernel 优化带来的取舍。

## 实验规范

记录硬件、软件版本、模型、输入输出长度、并发参数、吞吐、P95 和显存占用；避免只展示没有上下文的单个 benchmark 数字。`}
  ],
  roadmap: [
    {phase:"PHASE 01",title:"扎实基础 · 从理论到代码",desc:"构建能独立排查和实现 AI 系统的基本功。",items:["Python 高级特性、asyncio 与并发模型","HTTP / SSE / gRPC 与 FastAPI 服务","PyTorch、反向传播与 Attention","Docker、Linux、Git、CI 与自动化测试"]},
    {phase:"PHASE 02",title:"掌握智能 · 从模型到 Agent",desc:"理解算法基础，并能设计智能系统的关键能力。",items:["LLM 预训练、SFT、DPO 与强化学习基础","RAG 多路检索、重排、切分与评测","Agent、Skills、MCP 与 Harness 运行原理","多模态 OCR / ASR / 视觉与音视频处理"]},
    {phase:"PHASE 03",title:"构建生产 · 从 Demo 到系统",desc:"以可靠性、可扩展性和真实价值检验设计。",items:["vLLM / SGLang 调度、KV Cache 与性能优化","评测 Harness、模型安全和权限隔离","日志、Tracing、SLA、灰度与故障恢复","精读开源源码，交付一个可维护的 Agent 平台"]}
  ]
};

window.LAB_DATA.notes.unshift({
  "slug": "paper-to-code",
  "category": "源码",
  "title": "从论文到代码：建立一份能复查的阅读记录",
  "desc": "把论文主张、实现位置和实验结果分开，避免读完很多却难以复现。",
  "read": 5,
  "body": "## 带着一个问题阅读\n不要把“读完全文”当作唯一目标。先写下具体问题：这个方法改变了什么？它依赖什么条件？论文中的收益是在怎样的比较下得到的？用问题约束阅读范围，可以减少在细节中迷失。\n\n## 第一遍：画主张地图\n读摘要、方法图和结论，只记录待验证的主张。为每个主张标出章节或图表位置。作者报告的结果仍然是作者的结果，不应直接写成自己的复现结论。\n\n## 第二遍：把符号映射到代码\n选择一个与方法相关的入口，例如注意力层的前向过程。标注输入输出维度、损失构造、训练循环和数据处理的位置。固定仓库提交；文件路径在后续版本中可能改变。\n以 Karpathy 的 build-nanogpt 为练习材料，可以观察教学实现如何逐步构建训练流程。它是教学仓库，不应作为所有模型训练系统的生产模板。\n\n## 第三遍：最小验证\n先运行小规模输入检查维度和损失，再决定是否投入完整训练。复现所需的数据、算力或版本不足时，明确写“尚未验证”，而不是把一次成功启动当作复现成功。\n\n## 可复查的记录模板\n```text\n阅读问题：\n论文或文档 URL / 版本：\n仓库 URL / commit：\n方法主张 / 对照基线：\n实现入口 / 输入输出：\n本次改变的变量：\n运行环境 / 随机种子：\n结果：待运行\n局限 / 未解释现象：\n```\n\n## 如何判断这次阅读有效\n尝试不用原文重新解释一个模块，并写出一个可能让结论不成立的条件。如果无法指出适用边界，继续检查数据设定、评价指标和比较基线，而不是堆更多术语。\n\n## 原始资料\n[Karpathy：build-nanogpt 教学代码与视频](https://github.com/karpathy/build-nanogpt)\n\n## 下一步\n从一个小函数开始写阅读记录，把原文证据、代码证据、自己的推断分别标注。以后再读同类论文，就能比较设计取舍而不只是比较标题。",
  "status": "学习指南",
  "date": "2026-10-23",
  "level": "原理 → 实验"
});

window.LAB_DATA.notes.unshift({
  "slug": "async-cancellation-lab",
  "category": "工程",
  "title": "异步任务取消：把超时变成可解释的结果",
  "desc": "用任务生命周期检查并发系统：谁拥有子任务，谁负责清理，谁报告失败。",
  "read": 5,
  "body": "## 超时不是任务自动消失\n调用方不再等待，并不保证远端已经停止，也不保证本地资源已经释放。设计异步逻辑时，应分别考虑等待者、子任务、网络连接和远端操作的生命周期。\n\n## 先写所有权\n每个创建任务的位置，都应能回答：谁等待它？谁取消它？异常在哪里被观察？程序退出前是否等待清理完成？遗失任务引用或忽略异常，会让问题变成偶发日志，而不是明确的执行结果。\n\n## 区分几种失败\n单请求超时说明这一请求超过时间预算；批次超时说明整个工作单元无法及时结束；上游取消说明调用者已不再需要结果。三者可以有不同日志与重试行为。不要无差别捕获后返回空列表，否则调用方无法区分“没有数据”和“没有查成功”。\n\n## 建议实验\n1. 准备三个模拟 I/O 任务：正常返回、抛出错误、等待较久。\n2. 设置并发上限，记录任务开始、结束和清理日志。\n3. 在批次执行期间主动取消，观察仍在运行的任务是否结束。\n4. 确认清理逻辑放在合适的 finally 中，取消信号没有被意外吞掉。\n5. 对照逐个等待与结构化任务管理的差异，注明 Python 版本。\nPython 的 TaskGroup 在 3.11 引入；不要在更旧解释器中直接复制使用。已有项目要先核对最低版本，再选对应实现方式。\n\n## 验收清单\n所有创建的任务最终都处于可解释的结束状态；失败任务的异常被观察；连接与锁得到释放；用户取消后不会继续无意义地派生新任务；日志可以还原任务所属批次。\n这些是待运行的检查项。实现通过后再记录版本、时间和结果。\n\n## 原始资料\n[Python 官方文档：Coroutines and tasks](https://docs.python.org/3/library/asyncio-task.html)\n\n## 向生产问题延伸\n当工具会写入外部系统时，本地取消无法回滚已发生的远端副作用。为写操作设计状态查询和幂等策略，不能只依赖 asyncio 的取消机制。",
  "status": "学习指南",
  "date": "2026-10-23",
  "level": "原理 → 实验"
});

window.LAB_DATA.notes.unshift({
  "slug": "agent-stop-rules",
  "category": "Agent",
  "title": "Agent 运行边界：成功、失败与何时停止",
  "desc": "给工具循环设计预算、终止条件和可观察状态，避免只演示成功路径。",
  "read": 6,
  "body": "## 先画状态，而不是先加工具\n从一个只读任务开始，例如从公开资料中收集三条出处。明确输入、允许使用的工具、成功条件和交付格式。任务能否成功，应该可以通过结果检查，而不是让模型仅凭一句“我完成了”结束。\n\n## 一个最小状态机\n```text\n接收目标 → 选择动作 → 校验参数与权限 → 执行工具\n                       ↓                  ↓\n                   拒绝或澄清       保存观察与剩余预算\n                                          ↓\n                          完成 / 重试 / 继续 / 停止并报告\n```\n把运行状态放在应用程序中维护。模型输出可以提出动作，但不能自行扩大权限、取消预算或把工具错误改写为成功。\n\n## 三类独立的停止条件\n成功停止：结果满足预先写下的验收规则。\n预算停止：步骤数、时间或调用成本达到上限，即使尚未完成也要结束并说明缺口。\n异常停止：持续收到相同错误、输出无法验证，或需要当前授权之外的操作。\n具体预算由任务风险和成本决定，不存在对所有 Agent 都合适的统一步数。\n\n## 重试前先判断副作用\n只读请求的临时超时与创建订单后的响应丢失，不能使用同样的重试策略。对于写操作，需要幂等键、操作状态查询或人工处理边界，避免重复执行。失败记录至少包含动作类型、错误分类、尝试次数以及是否可能已经产生副作用。\n\n## 建议练习\n1. 实现只读工具的假执行器，返回成功、超时、格式错误三类结果。\n2. 在第三次相同失败前结束循环，报告已经取得与尚缺的证据。\n3. 注入带有“忽略之前指令”文本的工具结果，确认它只被当成资料处理。\n4. 输出完整动作轨迹，并检查终止原因和剩余预算。\n假执行器用于验证控制逻辑，不应把模拟输出展示为真实查询结果。\n\n## 原始资料\n[Anthropic：Building effective agents](https://www.anthropic.com/research/building-effective-agents)\n\n## 阅读边界\n该文章发布于 2024 年，适合学习基本组织模式。具体产品 API 和工具能力需要查看当前文档；这里不把历史接口当作最新用法。",
  "status": "学习指南",
  "date": "2026-10-23",
  "level": "原理 → 实验"
});

window.LAB_DATA.notes.unshift({
  "slug": "rag-evaluation-lab",
  "category": "RAG",
  "title": "RAG 小实验：先建证据集，再比较检索策略",
  "desc": "用可追溯的问题、证据和失败分类，让“回答更好”成为可检查的判断。",
  "read": 7,
  "body": "## 从一个可检验的问题开始\n如果答案不准确，可能是资料根本没有答案、检索没有命中、切块破坏了证据，或模型没有忠实使用上下文。把这些问题统称为“模型不够强”，会掩盖下一步该修改什么。\n\n## 准备最小证据集\n选择一小组允许公开使用的技术文档，保留 URL、版本或抓取日期。人工编写一批问题，并标注支持答案的原文片段及文档 ID。包含能回答、不能回答、跨段落和容易混淆的问题。练习可以从 20 个问题开始，但这个规模不支持对生产表现作强结论。\n把用于调整策略的问题与最终保留验证的问题分开。不要看到验证题失败，就不断针对这些题修改配置，再把同一批题当作独立测试。\n\n## 先测检索，再测生成\n检索阶段先观察：前 k 条结果是否包含支持答案的证据？如果每题有多个相关片段，还要区分“至少命中一个”的问题命中率与相关片段召回率。报告指标定义，不能只给一个叫 recall 的数字。\n生成阶段分别检查答案正确性、引用是否真的支持结论，以及资料不足时是否承认无法回答。流畅文字不能替代证据。\n\n## 建议实验矩阵\n1. 固定数据、问题和评测规则，建立一种简单检索基线。\n2. 单独改变 chunk 大小，检查证据是否被切断。\n3. 加入另一类召回策略，观察它补回了哪些问题。\n4. 再加入重排，记录排序变化与额外延迟。\n5. 最后比较生成回答，保留所有错误样例。\n\n## 失败记录模板\n```text\n问题 ID / 数据版本：\n期望证据 / 实际召回：\n检索配置 / 生成配置：\n失败阶段：资料缺失 / 未召回 / 排序 / 引用 / 推理\n单项修改：\n复测结果：待运行\n```\n这一流程是学习用的实验建议，不是本站已有的性能报告。\n\n## 原始资料\n[RAG 原始论文：Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401)\n\n## 阅读提示\n论文中的训练和建模设定，与今天常见的“检索后拼提示词”系统并不完全相同。阅读时把论文方法、工程简化和自己的实验分别记录。",
  "status": "学习指南",
  "date": "2026-10-23",
  "level": "原理 → 实验"
});

window.LAB_DATA.notes.unshift({
  "slug": "kv-cache-budget",
  "category": "推理",
  "title": "KV Cache 预算：把上下文长度换算成显存",
  "desc": "区分权重与缓存，用明确假设估算长上下文的成本，再设计验证方法。",
  "read": 5,
  "body": "## 先区分两笔内存\n模型权重和 KV Cache 是不同的预算。权重描述模型参数；KV Cache 保存已处理 token 的键和值，以便生成新 token 时复用。两者可能采用不同的数据类型，因此不能只看权重量化位数推断缓存大小。\n\n## 一个明确的估算模型\n对于各层使用相同配置、所有 token 都保留缓存的简化模型，缓存字节数约等于：\n```text\n2 × 层数 × 批量 × token 数 × KV 头数 × 每头维度 × 每元素字节数\n```\n开头的 2 代表 K 和 V。采用分组查询注意力时，应填 KV 头数，而不是查询头数。换算 GiB 要除以 1024 的三次方。\n\n## 手算一次\n假设 32 层、8 个 KV 头、头维度 128、批量 1、4096 个 token，缓存使用每元素 2 字节。代入得到 536870912 字节，即 0.5 GiB。token 数变成 8192 时，在其他假设不变的情况下变成 1 GiB。这是公式推导，不是某款 GPU 的测量结果。\n本页学习书架中的滑块采用同一组配置，可以用它观察线性关系。\n\n## 为什么实际显存不同\n运行还需要权重、激活、临时工作区和分配器余量。静态缓存可能按最大长度预分配；动态缓存、滑动窗口、缓存量化或卸载会改变占用方式。不同请求的长度与共享前缀，也会让服务端预算更复杂。\n\n## 建议实验\n1. 固定模型版本、缓存类型、dtype、设备和生成参数。\n2. 分别测试短输入与长输入，记录输入及输出 token 数。\n3. 区分设备已分配内存、保留内存与进程级占用，保持口径一致。\n4. 观察生成前后增量，并与理论估算对比。\n5. 把不一致解释为待验证假设，而不是立即判定框架有问题。\n\n## 原始资料\n[Transformers Cache strategies](https://huggingface.co/docs/transformers/kv_cache)\n\n## 复盘问题\n限制来自权重、缓存还是计算吞吐？减少并发与缩短上下文分别改变哪一项？你的结论只适用于哪组参数？",
  "status": "学习指南",
  "date": "2026-10-23",
  "level": "原理 → 实验"
});

window.LAB_DATA.notes.unshift({
  "slug": "attention-shapes",
  "category": "算法",
  "title": "读懂 Attention：先追踪形状，再验证因果遮罩",
  "desc": "从 Q/K/V 的维度到一个可手算的例子，用最小检查理解信息如何流动。",
  "read": 6,
  "body": "## 先回答一个问题\n预测下一个 token 时，当前位置应该能看到哪些输入？理解 Attention 时，先画信息可见范围，再看矩阵公式。这里讨论单头、无 dropout 的教学情形；多头实现还需要整理头维度。\n\n## 把形状写出来\n设序列长度为 T，输入宽度为 D，每个头的查询与键宽度为 d。输入 X 的形状是 T×D。线性投影得到 Q、K、V；当 V 的宽度也取 d 时，三者均为 T×d。Q 与 K 的转置相乘得到 T×T 的分数矩阵：第 i 行描述第 i 个位置对所有键的位置偏好。\n分数除以 d 的平方根，施加可见性遮罩，再沿键所在的最后一维做 softmax。权重乘 V 得到 T×d 的结果。softmax 不是沿 token 查询维度随意归一化；每一行才是一次完整的注意力分配。\n\n## 一个可手算的例子\n假设单个查询对两个可见键的缩放后分数都是 0，那么 softmax 权重为 0.5 和 0.5。如果两个 value 分别为 2 和 6，输出就是 4。若第二个键被屏蔽，其分数设为负无穷，输出变为 2。这个例子用于检验信息流，并不描述完整模型。\n\n## 建议实验\n1. 在固定随机种子的条件下构造 T=4、d=8 的 Q/K/V。\n2. 写出矩阵乘法、缩放、遮罩和 softmax 的逐步实现，先关闭 dropout。\n3. 检查每一行权重的和约为 1，被屏蔽位置的权重约为 0。\n4. 只修改未来 token 的 K/V，确认之前位置的输出不变。\n5. 使用相同输入与遮罩，对照 PyTorch 的实现；记录误差容限、dtype 和设备。\n\n## 容易混淆的边界\n不同 API 的布尔遮罩语义不一定一致，应核对所调用函数的说明。全遮罩行、混合精度和 fused kernel 可能改变数值行为。理解公式之后，再讨论计算优化；不要用一个示例的浮点完全相等作为所有实现的验收条件。\n\n## 原始资料\n[PyTorch scaled_dot_product_attention](https://docs.pytorch.org/docs/stable/generated/torch.nn.functional.scaled_dot_product_attention.html)\n\n## 留下什么记录\n交付一张维度图、一份最小对照脚本和一次因果性检查。记录尚未解释的误差，不填写未运行的结果。",
  "status": "学习指南",
  "date": "2026-10-23",
  "level": "原理 → 实验"
});

window.LAB_DATA.paths = [
  {
    "title": "读懂模型如何工作",
    "label": "01 / MODEL FOUNDATIONS",
    "desc": "先建立形状与信息流直觉，再连接训练和推理。",
    "slugs": [
      "attention-shapes",
      "transformer-attention",
      "kv-cache-budget"
    ],
    "outcome": "产出：维度图 + 缓存预算"
  },
  {
    "title": "构建有证据的智能应用",
    "label": "02 / RAG & AGENTS",
    "desc": "从检索证据走向工具执行，保留验证与停止条件。",
    "slugs": [
      "rag-evaluation-lab",
      "hybrid-rag",
      "agent-stop-rules"
    ],
    "outcome": "产出：证据集 + 动作轨迹"
  },
  {
    "title": "让系统可解释、可复查",
    "label": "03 / ENGINEERING PRACTICE",
    "desc": "掌握任务生命周期，把论文阅读转成工程记录。",
    "slugs": [
      "async-cancellation-lab",
      "paper-to-code",
      "evaluation-harness"
    ],
    "outcome": "产出：失败清单 + 实验记录"
  }
];
window.LAB_DATA.resources = [
  {
    "type": "博主",
    "title": "Lil’Log",
    "author": "Lilian Weng",
    "why": "围绕研究问题组织长文与参考资料。",
    "task": "整理论点与证据对应表。",
    "url": "https://lilianweng.github.io/"
  },
  {
    "type": "博主",
    "title": "Josh W. Comeau",
    "author": "Josh Comeau",
    "why": "通过小例子解释复杂机制。",
    "task": "把一个 AI 概念拆成小练习。",
    "url": "https://www.joshwcomeau.com/"
  },
  {
    "type": "博主",
    "title": "Anthony Fu",
    "author": "Anthony Fu",
    "why": "从清晰的项目入口进入代码和文章。",
    "task": "为研究方向写清目标与下一步。",
    "url": "https://antfu.me/"
  },
  {
    "type": "博主",
    "title": "Illustrated ML archive",
    "author": "Jay Alammar",
    "why": "用图解建立直觉；后续写作已迁移。",
    "task": "画一个模块的数据流与维度。",
    "url": "https://jalammar.github.io/"
  },
  {
    "type": "文档",
    "title": "Attention API",
    "author": "PyTorch",
    "why": "核对遮罩、参数和数值行为。",
    "task": "验证因果性与维度。",
    "url": "https://docs.pytorch.org/docs/stable/generated/torch.nn.functional.scaled_dot_product_attention.html"
  },
  {
    "type": "文档",
    "title": "Cache strategies",
    "author": "Hugging Face",
    "why": "理解缓存方案的取舍。",
    "task": "对照预算记录实际占用。",
    "url": "https://huggingface.co/docs/transformers/kv_cache"
  },
  {
    "type": "文档",
    "title": "Coroutines and tasks",
    "author": "Python",
    "why": "追踪任务创建、取消与清理。",
    "task": "完成一个任务取消实验。",
    "url": "https://docs.python.org/3/library/asyncio-task.html"
  },
  {
    "type": "论文",
    "title": "Retrieval-Augmented Generation",
    "author": "Lewis et al.",
    "why": "从原论文理解检索与生成。",
    "task": "区分论文设定与工程实现。",
    "url": "https://arxiv.org/abs/2005.11401"
  },
  {
    "type": "工程",
    "title": "Building effective agents",
    "author": "Anthropic · 2024",
    "why": "阅读基本模式，注意历史版本边界。",
    "task": "画出带预算的工具循环。",
    "url": "https://www.anthropic.com/research/building-effective-agents"
  },
  {
    "type": "工程",
    "title": "build-nanogpt",
    "author": "Andrej Karpathy",
    "why": "沿教学实现理解训练过程。",
    "task": "追踪一次前向与反向传播。",
    "url": "https://github.com/karpathy/build-nanogpt"
  }
];
