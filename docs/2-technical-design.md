# Frontend Agent Workflow 技术方案

## 1. 文档目标

本文档基于《Frontend Agent Workflow PRD》进一步下沉到技术实现层，目标是：

1. 将产品需求映射为可执行的技术模块。
2. 给出前后端、Agent、RAG、存储、接口、状态流转的实现方案。
3. 按开发顺序拆分实现步骤，形成可直接落地的开发蓝图。
4. 为后续代码生成、模块细化、任务拆分提供统一依据。

本文档强调：**先打通 MVP 主链路，再逐步增强**。

---

## 2. 总体技术目标

项目目标不是做一个“能聊天”的 AI 页面，而是做一个**面向前端工程任务的可视化 Agent Workflow 平台**。

技术上需要保证以下几点：

1. **任务闭环**：文件上传 → 切片索引 → 任务执行 → 结构化输出。
2. **流程可解释**：每个 Agent 都有明确输入、输出、状态和耗时。
3. **模块可替换**：模型调用、检索策略、存储方式可演进。
4. **首版轻量**：优先自己搭出最小执行器和最小 RAG，而不是引入大量重框架。
5. **前端展示强**：执行链路、结构化结果、节点状态是核心亮点。

---

## 3. 技术选型与原因

## 3.1 前端

### 选型

* React
* TypeScript
* Vite
* Tailwind CSS
* Zustand
* React Router（如需要单独详情页）
* React Markdown
* 代码高亮组件（如 react-syntax-highlighter）
* React Flow（可选，用于 Agent 节点图）

### 原因

1. React 更适合多区域复杂状态展示与流程可视化。
2. TypeScript 便于定义任务、节点、检索结果、结构化输出等类型。
3. Vite 启动快，适合快速搭建与迭代。
4. Zustand 足够轻量，适合管理任务执行态、节点状态、文件列表。
5. Tailwind CSS 有利于快速构建三栏工作台界面。

---

## 3.2 后端

### 选型

* Node.js
* Express
* Multer（文件上传）
* fs/promises（本地文件管理）
* better-sqlite3 或 sqlite3（推荐 better-sqlite3）
* uuid（ID 生成）

### 原因

1. Express 足够轻，开发速度快。
2. Node 生态适合处理文件上传、文本解析、任务编排。
3. SQLite 足够支持 MVP 的文件索引、任务记录、节点记录、结果存储。
4. 首版无需上 Nest，不把精力消耗在框架规范上。

---

## 3.3 AI / Agent / 检索

### 选型

* OpenAI 兼容接口封装
* 手写 Workflow Orchestrator
* 本地轻量切片 + 关键词检索
* embedding 检索作为增强能力预留

### 原因

1. 模型层用兼容接口，后续方便切换不同模型。
2. 自己实现工作流执行器，面试时更能讲清楚架构与调度逻辑。
3. RAG 首版先保证“可用”，不追求复杂向量系统。
4. 先完成工程上下文注入，再考虑优化检索精度。

---

## 4. 总体架构设计

## 4.1 架构概览

系统分为五层：

1. **前端展示层**：负责文件管理、任务输入、执行状态、结果展示。
2. **接口层**：负责接收上传、创建任务、查询任务、获取结果。
3. **工作流编排层**：负责驱动 Agent 顺序执行和状态记录。
4. **RAG 与上下文层**：负责文件解析、切片、索引、检索。
5. **存储层**：负责持久化文件、切片、任务、节点、结果。

---

## 4.2 模块关系

[Client]
↓
[API Routes]
↓
[Workflow Orchestrator]
├─ Planner Agent
├─ Retriever Agent
├─ Analyzer Agent
├─ Generator Agent
└─ Reviewer Agent
↓
[RAG Module]
├─ File Parser
├─ Chunker
├─ Indexer
└─ Searcher
↓
[Storage]
├─ files
├─ chunks
├─ tasks
├─ workflow_nodes
└─ task_results

---

## 5. MVP 主链路实现拆解

主链路如下：

1. 用户上传文件。
2. 后端保存文件。
3. 系统解析文件内容。
4. 系统根据文件类型切片并写入索引。
5. 用户输入任务并点击执行。
6. 后端创建任务记录。
7. Workflow Orchestrator 依次执行 Planner → Retriever → Analyzer → Generator → Reviewer。
8. 每个节点执行前后均落库节点状态。
9. 最终产出结构化结果并落库。
10. 前端轮询或实时获取任务状态与最终结果并展示。

---

## 6. 前端技术方案

## 6.1 前端页面结构

推荐采用三栏工作台布局。

### 左栏：项目区

职责：

* 文件上传
* 文件列表/文件树
* 历史任务
* 任务模板入口（预留）

### 中栏：任务执行区

职责：

* 输入任务
* 发起执行
* 展示 Agent 工作流节点
* 展示执行日志和进度

### 右栏：结果区

职责：

* 展示结构化结果
* 查看涉及文件
* 查看风险点
* 复制文档草稿

---

## 6.2 前端页面拆分

### 1）WorkbenchPage

主页面，承载三栏结构。

### 2）FilePanel

显示上传按钮、文件列表、删除文件。

### 3）TaskInputPanel

输入任务文本，点击执行。

### 4）WorkflowPanel

展示节点状态：planning / retrieving / analyzing / generating / reviewing。

### 5）NodeDetailDrawer

点击节点后展示输入摘要、输出摘要、耗时、错误。

### 6）ResultPanel

展示最终结果卡片。

### 7）HistoryPanel

显示历史任务列表，可点击切换查看。

---

## 6.3 前端状态管理设计

使用 Zustand 管理全局状态。

### 推荐 Store 拆分

#### useFileStore

管理：

* files
* uploadStatus
* parseStatus
* selectedFileId

#### useTaskStore

管理：

* currentTaskId
* currentTaskContent
* taskList
* taskStatus
* workflowNodes
* finalResult

#### useUIStore

管理：

* selectedNode
* resultTab
* sidebarCollapsed

### 关键原因

1. 文件、任务、UI 状态职责不同，拆分后更清晰。
2. 工作流执行时状态会频繁变化，避免组件层层传递 props。
3. 后续方便增加多项目空间或多任务切换。

---

## 6.4 前端数据流

### 文件上传数据流

1. 用户选择文件。
2. 调用 `POST /files/upload`。
3. 后端返回文件列表和解析状态。
4. 前端刷新文件列表。

### 任务执行数据流

1. 用户输入任务。
2. 调用 `POST /tasks` 创建任务。
3. 前端记录 taskId。
4. 前端轮询：

   * `GET /tasks/:id`
   * `GET /tasks/:id/workflow`
   * `GET /tasks/:id/result`
5. 根据状态更新工作流 UI 和结果区。

### 历史任务查看数据流

1. 用户点击历史任务。
2. 调用详情接口。
3. 回填 workflowNodes 与 finalResult。

---

## 6.5 前端组件实现建议

### 文件列表组件

展示字段：

* 文件名
* 类型
* 解析状态
* 上传时间

### 节点流程组件

每个节点展示：

* 节点名称
* 状态
* 耗时
* 是否可点击展开

### 结果卡片组件

建议拆分：

* RelatedFilesCard
* AnalysisCard
* SuggestionsCard
* RisksCard
* DocDraftCard
* NextStepsCard

### 节点详情抽屉

展示：

* 输入摘要
* 输出摘要
* 原始 JSON（调试模式）
* 错误信息

---

## 7. 后端技术方案

## 7.1 后端目录结构建议

```text
server/
├─ src/
│  ├─ app.ts
│  ├─ routes/
│  │  ├─ files.ts
│  │  ├─ tasks.ts
│  │  └─ retrieval.ts
│  ├─ controllers/
│  │  ├─ fileController.ts
│  │  ├─ taskController.ts
│  │  └─ retrievalController.ts
│  ├─ services/
│  │  ├─ fileService.ts
│  │  ├─ taskService.ts
│  │  └─ resultService.ts
│  ├─ workflow/
│  │  ├─ orchestrator.ts
│  │  ├─ types.ts
│  │  └─ nodeRunner.ts
│  ├─ agents/
│  │  ├─ plannerAgent.ts
│  │  ├─ retrieverAgent.ts
│  │  ├─ analyzerAgent.ts
│  │  ├─ generatorAgent.ts
│  │  └─ reviewerAgent.ts
│  ├─ rag/
│  │  ├─ parser.ts
│  │  ├─ chunker.ts
│  │  ├─ indexer.ts
│  │  ├─ searcher.ts
│  │  └─ types.ts
│  ├─ models/
│  │  ├─ llmClient.ts
│  │  ├─ promptBuilder.ts
│  │  └─ schemas.ts
│  ├─ storage/
│  │  ├─ db.ts
│  │  ├─ repositories/
│  │  │  ├─ fileRepo.ts
│  │  │  ├─ chunkRepo.ts
│  │  │  ├─ taskRepo.ts
│  │  │  ├─ workflowRepo.ts
│  │  │  └─ resultRepo.ts
│  ├─ utils/
│  │  ├─ logger.ts
│  │  ├─ fileType.ts
│  │  └─ time.ts
│  └─ constants/
│     └─ workflow.ts
```

---

## 7.2 后端分层职责

### Route 层

职责：

* 接收请求
* 参数校验
* 调用 service
* 返回统一响应

### Controller / Service 层

职责：

* 组织业务逻辑
* 调用存储、工作流、检索模块

### Workflow 层

职责：

* 负责任务节点编排
* 状态记录
* 错误处理

### Agent 层

职责：

* 面向某一个节点的业务职责
* 接收统一上下文输入
* 输出结构化节点结果

### RAG 层

职责：

* 解析文件
* 文档和代码切片
* 检索相关 chunk

### Storage 层

职责：

* 所有数据落库
* 屏蔽数据库操作细节

---

## 8. 数据库与存储设计

## 8.1 为什么用 SQLite

MVP 阶段使用 SQLite 的原因：

1. 本地开发简单。
2. 不需要额外数据库服务。
3. 足够支持中小规模文件、chunk、任务和结果存储。
4. 面试中也更容易讲清楚持久化方案。

---

## 8.2 表设计

## 8.2.1 files

字段：

* id
* name
* path
* ext
* mime_type
* size
* content
* parse_status
* created_at
* updated_at

说明：

* content 可选直接存文本，也可以只保存文件路径再实时读取。
* MVP 推荐：文本文件内容存库，原文件也保留在 uploads 目录。

---

## 8.2.2 chunks

字段：

* id
* file_id
* file_path
* chunk_type
* title
* symbol_name
* language
* content
* summary
* keywords
* order_index
* created_at

说明：

* `chunk_type` 区分 doc/code。
* `title` 用于 markdown 小节。
* `symbol_name` 用于函数/组件名。

---

## 8.2.3 tasks

字段：

* id
* content
* status
* started_at
* finished_at
* created_at
* updated_at

状态值：

* queued
* running
* done
* error

---

## 8.2.4 workflow_nodes

字段：

* id
* task_id
* node_name
* status
* input_json
* output_json
* started_at
* finished_at
* duration_ms
* error_message
* created_at

---

## 8.2.5 task_results

字段：

* id
* task_id
* related_files_json
* analysis_json
* suggestions_json
* risks_json
* doc_draft
* next_steps_json
* created_at

---

## 8.2.6 sessions（预留）

字段：

* id
* current_context_json
* created_at
* updated_at

首版可以不启用。

---

## 9. 文件上传与解析实现方案

## 9.1 上传流程

1. 前端上传文件。
2. Express + Multer 接收文件。
3. 保存至 `/uploads` 目录。
4. 识别文件类型。
5. 文本类文件读取内容。
6. 写入 `files` 表。
7. 触发解析和切片。
8. 写入 `chunks` 表。

---

## 9.2 支持的文件类型

MVP 推荐支持：

* `.md`
* `.txt`
* `.js`
* `.ts`
* `.jsx`
* `.tsx`
* `.vue`
* `.json`

不建议首版支持：

* pdf
* docx
* 图片 OCR

原因：首版重点不在复杂文件解析。

---

## 9.3 解析方案

### Markdown 解析

实现方式：

* 按 `#` / `##` / `###` 标题切分。
* 保留标题路径。
* 每个 section 作为 chunk。

### 代码解析

实现方式：

* 首版可以先基于简单规则切分：按文件为主、按导出/函数/组件名辅助切分。
* 例如：

  * `export function`
  * `export const`
  * `const Xxx = () =>`
  * `function Xxx()`
  * `export default`

### 为什么首版不强依赖 AST

1. AST 更准确，但实现量更大。
2. MVP 更看重“能检索到相关上下文”。
3. 后续可以再升级为 Babel/TS AST 方案。

---

## 9.4 切片策略建议

### Markdown 切片

按标题 + 段落：

* 每个 chunk 控制在 300~1200 字符左右。
* 太长可继续分段。

### 代码切片

优先两层：

1. 文件级 chunk。
2. 函数/组件级 chunk。

保底策略：

* 即使符号切分失败，也至少保留文件级 chunk，避免无法检索。

---

## 10. RAG 检索实现方案

## 10.1 首版检索目标

首版不是做高精度知识库，而是让系统能从项目上下文中找到“基本相关的文件和片段”。

---

## 10.2 检索流程

1. 从任务文本中抽取关键词。
2. 从 Planner 输出中补充关键词和目标模块。
3. 先按文件名、路径、symbol_name 做匹配。
4. 再按 chunk 内容做关键词评分。
5. 按得分排序，取 Top N。
6. 返回 chunk、文件路径、匹配原因。

---

## 10.3 检索打分建议

首版可采用简单规则分：

* 文件名命中：+5
* symbol_name 命中：+4
* 标题命中：+3
* 内容命中：按次数累计
* 路径包含关键模块名：+2

然后按总分倒序返回。

---

## 10.4 检索输出结构

```ts
interface RetrievalItem {
  chunkId: string
  fileId: string
  filePath: string
  chunkType: 'doc' | 'code'
  title?: string
  symbolName?: string
  content: string
  score: number
  matchedKeywords: string[]
}
```

---

## 10.5 第二阶段增强

后续可扩展：

* embedding 向量检索
* BM25
* rerank
* 项目摘要缓存

但首版不必引入。

---

## 11. Agent 技术实现方案

## 11.1 Agent 统一输入输出规范

每个 Agent 接收统一上下文对象：

```ts
interface WorkflowContext {
  taskId: string
  taskContent: string
  uploadedFiles: FileEntity[]
  plannerOutput?: PlannerOutput
  retrievalOutput?: RetrievalOutput
  analyzerOutput?: AnalyzerOutput
  generatorOutput?: GeneratorOutput
}
```

每个 Agent 返回结构化结果：

```ts
interface AgentResult<T> {
  success: boolean
  data: T
  summary: string
  warnings?: string[]
}
```

好处：

1. 节点之间传递清晰。
2. 方便落库。
3. 方便前端展示摘要。

---

## 11.2 Planner Agent

### 目标

根据用户任务生成一个执行计划，而不是直接给答案。

### 输入

* taskContent

### 输出

* taskType
* subtasks
* searchKeywords
* targetModules
* expectedOutputSections

### 实现方式

可采用 LLM + 结构化 prompt：

* 让模型识别任务属于“组件增强 / 文档生成 / 影响分析 / 改造方案”哪一类。
* 输出关键词列表。

### 降级策略

如果 LLM 不可用，可本地根据关键词简单判断任务类型。

---

## 11.3 Retriever Agent

### 目标

根据 Planner 结果从 RAG 中检索上下文。

### 输入

* taskContent
* plannerOutput.searchKeywords
* plannerOutput.targetModules

### 输出

* relatedFiles
* relatedChunks
* retrievalSummary

### 实现方式

直接调用 `searcher.search(query)`。

### 注意点

Retriever 不负责分析，只负责找材料。

---

## 11.4 Analyzer Agent

### 目标

把“找到的材料”转成“当前实现 + 影响范围 + 风险”的工程分析。

### 输入

* taskContent
* retrievalOutput

### 输出

* currentImplementation
* impactScope
* dependencies
* risks

### 实现方式

LLM 根据检索片段总结，但要强约束只能基于提供上下文进行分析。

### 关键要求

输出要结构化，不要一大段自然语言。

---

## 11.5 Generator Agent

### 目标

把分析结果转成可以被开发者使用的工程建议。

### 输入

* taskContent
* analyzerOutput

### 输出

* changeSuggestions
* implementationSteps
* readmeDraft
* prDraft

### 实现方式

LLM 根据分析结果生成建议，但要限定：

* 不直接生成完整修改代码（首版）
* 优先生成方案、步骤、文档草稿

---

## 11.6 Reviewer Agent

### 目标

检查 Generator 是否遗漏、矛盾、超出上下文依据。

### 输入

* generatorOutput
* retrievalOutput

### 输出

* inconsistencies
* missingPoints
* finalPolishedResult

### 实现方式

让 Reviewer 做“自检”和“保守修正”。

### 价值

这是区分“单轮问答”和“工作流产品”的关键点。

---

## 12. Workflow Orchestrator 实现方案

## 12.1 为什么自己写执行器

原因：

1. MVP 不需要上复杂框架。
2. 可以更清晰地控制节点状态。
3. 更容易结合前端可视化展示。
4. 面试中更能体现你对 Agent Workflow 的理解。

---

## 12.2 执行器职责

1. 创建任务。
2. 初始化节点记录。
3. 逐个执行 Agent。
4. 在每个节点前后记录状态、输入、输出、耗时。
5. 处理错误并标记失败节点。
6. 汇总最终结果。

---

## 12.3 节点执行流程

伪流程：

```text
create task
↓
run planner
↓
run retriever
↓
run analyzer
↓
run generator
↓
run reviewer
↓
save final result
↓
mark task done
```

---

## 12.4 状态设计

### 任务状态

* queued
* running
* done
* error

### 节点状态

* pending
* running
* success
* error
* skipped

---

## 12.5 编排核心伪代码

```ts
async function runWorkflow(taskId: string, taskContent: string) {
  const context = createInitialContext(taskId, taskContent)

  try {
    await updateTaskStatus(taskId, 'running')

    context.plannerOutput = await runNode('planner', context, plannerAgent)
    context.retrievalOutput = await runNode('retriever', context, retrieverAgent)
    context.analyzerOutput = await runNode('analyzer', context, analyzerAgent)
    context.generatorOutput = await runNode('generator', context, generatorAgent)
    const reviewOutput = await runNode('reviewer', context, reviewerAgent)

    await saveFinalResult(taskId, reviewOutput)
    await updateTaskStatus(taskId, 'done')
  } catch (error) {
    await updateTaskStatus(taskId, 'error')
    throw error
  }
}
```

---

## 12.6 节点运行器设计

`runNode()` 负责：

* 写入 `running`
* 调用 agent
* 记录 input_json / output_json
* 计算 duration
* 写入 success / error

这是整个工作流调度的核心复用函数。

---

## 13. LLM 模型适配层实现方案

## 13.1 模型客户端封装目标

统一封装模型调用，不让 Agent 直接依赖具体平台。

### 接口建议

```ts
interface LLMClient {
  chat(params: ChatParams): Promise<ChatResult>
}
```

### ChatParams

* model
* systemPrompt
* userPrompt
* temperature
* responseFormat

---

## 13.2 Prompt 管理策略

建议每个 Agent 单独维护 prompt builder：

* `buildPlannerPrompt()`
* `buildAnalyzerPrompt()`
* `buildGeneratorPrompt()`
* `buildReviewerPrompt()`

理由：

1. 便于单独调优。
2. 后续可切换不同模型。
3. 方便测试每个 Agent 的输出质量。

---

## 13.3 输出结构约束

建议尽量要求模型输出 JSON 或接近 JSON 的结构，再在后端解析。

原因：

1. 方便节点落库。
2. 方便前端展示。
3. 避免大段自然语言难以使用。

---

## 14. 接口设计方案

## 14.1 文件接口

### POST /files/upload

请求：multipart/form-data
返回：

* uploadedFiles
* failedFiles

### GET /files

返回：

* files[]

### DELETE /files/:id

返回：

* success

---

## 14.2 任务接口

### POST /tasks

请求：

```json
{
  "content": "为 Switch 组件新增 loading 与 disabled 联动能力"
}
```

返回：

```json
{
  "taskId": "xxx",
  "status": "queued"
}
```

### GET /tasks

返回历史任务列表。

### GET /tasks/:id

返回任务状态。

---

## 14.3 工作流接口

### GET /tasks/:id/workflow

返回节点列表：

* nodeName
* status
* duration
* summary

### GET /tasks/:id/result

返回结构化最终结果。

---

## 14.4 调试接口（可选）

### POST /retrieval/search

输入 query，返回检索结果，方便调试 RAG。

---

## 15. 错误处理与兜底方案

## 15.1 文件解析失败

处理：

* files.parse_status 标记 failed
* 返回失败原因
* 不影响其他文件解析

## 15.2 检索结果过少

处理：

* Retriever 输出 warning
* Analyzer/Generator 提示上下文不足

## 15.3 LLM 输出非结构化

处理：

* 做一层 JSON 清洗
* 清洗失败时记录 rawText
* 返回“解析失败但保留原始输出”

## 15.4 节点执行报错

处理：

* 节点状态标记 error
* 任务状态标记 error
* 返回错误信息到前端
* 保留已完成节点结果

---

## 16. 从头到尾的实现顺序

下面按真正开发顺序拆解。

## 第一阶段：搭建项目骨架

### 目标

把前后端目录、基础运行环境、数据库初始化先搭好。

### 要做的事

1. 初始化 monorepo 或前后端双目录。
2. 创建 client / server。
3. 前端初始化 React + TS + Vite。
4. 后端初始化 Express + TS。
5. 配置基础脚本。
6. 初始化 SQLite 与建表逻辑。
7. 定义公共 types。

### 交付物

* 项目可启动。
* 前后端可通信。
* 数据库可初始化。

---

## 第二阶段：完成文件上传与索引

### 目标

让系统具备“项目上下文输入能力”。

### 要做的事

1. 实现文件上传接口。
2. 保存文件到本地。
3. 保存文件元信息到数据库。
4. 读取文本内容。
5. 实现 Markdown 切片。
6. 实现代码切片。
7. 将切片写入 chunks 表。
8. 前端展示文件列表与解析状态。

### 交付物

* 上传文件后可看到文件列表。
* 数据库里存在对应 chunks。

---

## 第三阶段：完成任务创建与最小执行器

### 目标

先跑通一个最小的工作流闭环。

### 要做的事

1. 实现 `POST /tasks`。
2. 创建任务记录。
3. 编写 Workflow Orchestrator。
4. 先实现 Planner / Retriever / Generator 三个节点。
5. 节点状态落库。
6. 前端轮询任务状态。
7. 展示最小结果。

### 交付物

* 用户输入任务后，系统能返回初版结果。
* 页面可以看到节点执行过程。

---

## 第四阶段：补齐 Analyzer 与 Reviewer

### 目标

把链路从“能生成”变成“更像工程分析系统”。

### 要做的事

1. 增加 Analyzer Agent。
2. 增加 Reviewer Agent。
3. 调整最终结果结构。
4. 前端增加分析、风险、校验等卡片。
5. 节点详情支持展开查看。

### 交付物

* 完整五节点流程。
* 结果更结构化、更可信。

---

## 第五阶段：做前端可视化与历史记录

### 目标

提升展示效果与产品完成度。

### 要做的事

1. 历史任务接口与列表。
2. 工作流节点图或时间线。
3. 节点详情抽屉。
4. 结果区卡片化。
5. Loading、错误、空状态优化。

### 交付物

* 页面具备完整工作台体验。
* 可用于演示和截图。

---

## 第六阶段：做质量优化与工程收尾

### 目标

让项目能稳定展示、便于后续扩展。

### 要做的事

1. 增加 prompt 调优。
2. 增加检索调试接口。
3. 增加结果复制/导出。
4. 优化异常处理。
5. 准备固定演示数据。
6. 补 README 和架构图。

### 交付物

* MVP 可对外展示。
* 文档齐全。

---

## 17. 需求到实现的逐项映射

下面把 PRD 需求直接映射到技术实现。

### 需求 1：项目 / 文档上传

对应实现：

* Multer 文件上传
* files 表
* uploads 目录
* parser + chunker + indexer
* FilePanel 前端展示

### 需求 2：任务输入

对应实现：

* TaskInputPanel
* POST /tasks
* tasks 表
* taskStore

### 需求 3：多 Agent 工作流执行

对应实现：

* Workflow Orchestrator
* plannerAgent
* retrieverAgent
* analyzerAgent
* generatorAgent
* reviewerAgent
* workflow_nodes 表

### 需求 4：RAG 检索

对应实现：

* parser.ts
* chunker.ts
* searcher.ts
* chunks 表
* Retriever Agent

### 需求 5：结果输出

对应实现：

* task_results 表
* ResultPanel
* 各结果卡片组件

### 需求 6：执行过程可视化

对应实现：

* workflow_nodes 接口
* WorkflowPanel
* NodeDetailDrawer
* 节点状态流转

### 需求 7：历史任务记录

对应实现：

* tasks 表
* GET /tasks
* HistoryPanel

---

## 18. 后续代码生成顺序建议

为了后续让 AI 帮你逐步生成代码，建议后面按这个顺序继续往下拆：

1. 先生成数据库表结构与后端基础目录。
2. 再生成文件上传模块。
3. 再生成 parser / chunker / searcher。
4. 再生成 Workflow Orchestrator。
5. 再分别生成 5 个 Agent。
6. 再生成任务接口。
7. 再生成前端 Zustand store。
8. 再生成三栏工作台页面。
9. 再生成 WorkflowPanel 与 ResultPanel。
10. 最后统一联调与补异常处理。

---

## 19. 当前最推荐的开发原则

1. 先保证链路通，再做精度优化。
2. 先让 Agent 有结构，再追求“聪明”。
3. 先把检索做对，再提高检索复杂度。
4. 先让结果能展示，再做导出与高级能力。
5. 先做能讲清楚的系统，不做过度工程化系统。

---

## 20. 一句话收束

这套技术方案的核心不是“接了一个模型”，而是围绕前端工程任务，搭建了一条完整的可解释链路：**文件输入 → 工程切片 → 上下文检索 → Agent 编排 → 结构化输出 → 可视化展示**。后续所有代码生成和模块细化，都应围绕这条主链路逐步推进。
