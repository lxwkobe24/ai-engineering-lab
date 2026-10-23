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
