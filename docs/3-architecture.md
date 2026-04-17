# Frontend Agent Workflow 系统架构设计

## 1. 文档目标

本文档定义 Frontend Agent Workflow 平台的架构蓝图，为后续代码开发提供可直接执行的工程依据。面向读者为开发工程师，重点说明「怎么做」，不重复 PRD 中已定义的产品需求。

---

## 2. 系统目标

### 2.1 技术目标

将「上传项目文件 → 任务规划 → 上下文检索 → 工程分析 → 方案生成 → 结果自检 → 结构化输出」形成完整闭环，每个节点的输入、输出、状态、耗时可追溯、可复用。

### 2.2 架构约束

| 约束项 | 要求 |
|--------|------|
| 链路完整性 | MVP 阶段必须打通文件上传到结果展示的完整链路 |
| 可解释性 | 每个 Agent 节点必须有独立输入输出，支持落库和前端展示 |
| 模块可替换 | 模型调用层、检索层、存储层均需定义清晰接口，支持后续平滑替换 |
| 轻量优先 | 不引入重型框架，自研工作流编排器，SQLite 存储 |

---

## 3. 系统分层

采用五层垂直分层，自上而下为调用依赖关系：

```
┌────────────────────────────────────────────────────┐
│                  前端展示层                          │
│  React + Zustand + Tailwind                        │
│  三栏工作台：FilePanel / WorkflowPanel / ResultPanel │
└────────────────────────────┬───────────────────────┘
                             │ HTTP
┌────────────────────────────▼───────────────────────┐
│                    接口层                            │
│  Express Routes + Controller + 统一响应封装          │
│  POST /files/upload  GET /tasks/:id/workflow  等    │
└────────────────────────────┬───────────────────────┘
                             │ 调用
┌────────────────────────────▼───────────────────────┐
│               工作流编排层                            │
│  Workflow Orchestrator → 5 个 Agent 节点顺序执行     │
│  Planner → Retriever → Analyzer → Generator → Reviewer│
└────────────────────────────┬───────────────────────┘
                             │ 调用
┌────────────────────────────▼───────────────────────┐
│               RAG 与上下文层                          │
│  Parser → Chunker → Indexer → Searcher              │
└────────────────────────────┬───────────────────────┘
                             │ 读写
┌────────────────────────────▼───────────────────────┐
│                    存储层                            │
│  SQLite: files / chunks / tasks / workflow_nodes /    │
│         task_results                                 │
└────────────────────────────────────────────────────┘
```

---

## 4. 模块职责与边界

### 4.1 前端展示层

**职责**：用户交互、状态展示、数据驱动 UI 更新。

按职责拆分为三个独立 Zustand Store，边界清晰：

```
useFileStore     → 文件列表、上传进度、解析状态
useTaskStore     → 任务内容、工作流节点状态、最终结果
useUIStore       → 选中节点、展开抽屉、侧栏折叠等 UI 状态
```

前端组件不直接调用后端 Agent 或 RAG 模块，仅通过 HTTP 接口获取数据。所有状态变更通过 Store 驱动 UI 重渲染。

### 4.2 接口层（Server Routes）

**职责**：接收 HTTP 请求、参数校验、调用 Service 层、返回统一格式响应。

```
POST /files/upload      → 接收文件，触发解析与切片
GET  /files             → 返回文件列表
DELETE /files/:id       → 删除文件及关联 chunks
POST /tasks             → 创建任务，触发工作流，返回 taskId
GET  /tasks             → 返回历史任务列表
GET  /tasks/:id         → 返回任务详情与状态
GET  /tasks/:id/workflow → 返回节点执行记录
GET  /tasks/:id/result  → 返回最终结构化结果
POST /retrieval/search  → 调试用，测试检索结果
```

所有接口返回统一包装：

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

### 4.3 工作流编排层

**职责**：控制 Agent 节点执行顺序，管理任务生命周期，写入节点状态。

核心由 `orchestrator.ts` 和 `nodeRunner.ts` 两个文件组成：

- **orchestrator.ts**：任务入口函数 `runWorkflow(taskId, taskContent)`，负责上下文初始化、节点顺序调用、最终结果落库。
- **nodeRunner.ts**：通用节点执行函数 `runNode(nodeName, agent)`，每个节点复用同一套流程：写入 running → 调用 Agent → 记录 input_json / output_json / duration_ms → 写入 success / error。

**节点执行顺序固定**：

```
planner → retriever → analyzer → generator → reviewer
```

不允许节点间并行，不允许跳过节点。后续扩展可在 nodeRunner 中增加条件判断。

### 4.4 Agent 层

**职责**：每个 Agent 负责单一业务环节，输入输出均为 TypeScript 类型定义的结构化对象。

| Agent     | 入口文件                | 核心输入              | 核心输出                                          |
|-----------|------------------------|-----------------------|---------------------------------------------------|
| Planner   | `agents/plannerAgent.ts`  | taskContent           | taskType / subtasks / searchKeywords / targetModules |
| Retriever | `agents/retrieverAgent.ts` | taskContent + plannerOutput | relatedFiles / relatedChunks / retrievalSummary |
| Analyzer  | `agents/analyzerAgent.ts`  | taskContent + retrievalOutput | currentImplementation / impactScope / risks |
| Generator | `agents/generatorAgent.ts`  | taskContent + analyzerOutput | changeSuggestions / implementationSteps / docDraft |
| Reviewer  | `agents/reviewerAgent.ts`   | generatorOutput + retrievalOutput | inconsistencies / missingPoints / finalPolishedResult |

每个 Agent 调用 `LLMClient.chat()`，通过各自独立的 `promptBuilder.ts` 构建 Prompt。Agent 禁止直接读写数据库，所有数据通过 orchestrator 传递。

### 4.5 RAG 与上下文层

**职责**：将上传文件转换为可检索的 Chunk，为 Retriever Agent 提供上下文数据。

Pipeline 顺序：`Parser` → `Chunker` → `Indexer` → `Searcher`

- **Parser**（`rag/parser.ts`）：按文件类型分发解析逻辑，Markdown 按标题层级提取，代码文件读取全文。
- **Chunker**（`rag/chunker.ts`）：Markdown 按 `#` 标题切分（300~1200 字符/块），代码按函数/组件级符号切分（保底文件级），每个 Chunk 记录来源路径和符号名。
- **Indexer**（`rag/indexer.ts`）：将 Chunk 写入 SQLite chunks 表。
- **Searcher**（`rag/searcher.ts`）：接收关键词，返回打分排序后的 Top N Chunk。评分规则：文件名命中+5、symbolName+4、标题+3、内容命中按次数+1、路径含模块名+2。

### 4.6 存储层

**职责**：所有持久化操作经 Repository 层完成，业务代码不直接操作数据库。

```
storage/
  db.ts                  → 数据库连接初始化，建表语句
  repositories/
    fileRepo.ts          → files 表 CRUD
    chunkRepo.ts         → chunks 表 CRUD，关键词搜索
    taskRepo.ts          → tasks 表 CRUD
    workflowRepo.ts      → workflow_nodes 表 CRUD
    resultRepo.ts        → task_results 表 CRUD
```

Repository 层只做数据存取，不含业务逻辑。

---

## 5. 核心数据流

### 5.1 文件上传与索引

```
前端: 选择文件 → FormData POST /files/upload
  ↓
后端: Multer 接收 → 保存至 uploads/ 目录
  ↓
识别文件类型（ext / mime_type）
  ↓
读取文本内容（txt / md / ts / js 等）
  ↓
fileRepo.insert()  → 写入 files 表，parse_status = 'parsing'
  ↓
Parser.parse() → Chunker.chunk() → Indexer.index()
  ↓
更新 files.parse_status = 'success' / 'failed'
  ↓
返回上传结果，前端刷新文件列表
```

### 5.2 任务执行与轮询

```
前端: 输入任务文本 → POST /tasks { content }
  ↓
taskRepo.create() → tasks 表写入，status = 'queued'，返回 taskId
  ↓
前端记录 taskId，启动定时轮询（每 2s）：
    GET /tasks/:id           → status
    GET /tasks/:id/workflow  → nodes[]
    GET /tasks/:id/result    → 最终结果（若已生成）
  ↓
后端同步启动 runWorkflow()：
  ↓
taskRepo.updateStatus('running')
  ↓
nodeRunner('planner')    → plannerAgent.run() → workflowRepo.insertNode() → workflowRepo.updateNode()
  ↓
nodeRunner('retriever')  → retrieverAgent.run()
  ↓
nodeRunner('analyzer')  → analyzerAgent.run()
  ↓
nodeRunner('generator') → generatorAgent.run()
  ↓
nodeRunner('reviewer')  → reviewerAgent.run()
  ↓
resultRepo.save(reviewOutput.finalPolishedResult)
  ↓
taskRepo.updateStatus('done')
  ↓
前端轮询获取到 result → 停止轮询 → 渲染 ResultPanel
```

### 5.3 历史任务回填

```
前端: 点击历史任务
  ↓
GET /tasks/:id → 获取任务基本信息与状态
GET /tasks/:id/workflow → 获取全部节点记录
GET /tasks/:id/result  → 获取最终结果
  ↓
useTaskStore.setCurrentTask(taskId)
useTaskStore.setWorkflowNodes(nodes)
useTaskStore.setFinalResult(result)
  ↓
UI 更新，展示节点状态与结果
```

---

## 6. 完整任务执行链路

以「为 Switch 组件新增 loading 与 disabled 联动能力」为例。

**前置**：用户已上传 `Switch/index.tsx`、`Switch/README.md`、`Button/index.tsx`，chunks 表已有对应切片记录。

### Step 1：创建任务

```
前端 POST /tasks { content: "为 Switch 组件新增 loading 与 disabled 联动能力..." }
后端: taskRepo.create() → 返回 { taskId: "t_001", status: "queued" }
前端: 记录 taskId，显示任务卡片，启动轮询
```

### Step 2：Planner Agent

```
输入 context = { taskId: "t_001", taskContent: "..." }
调用 LLM，PromptBuilder.buildPlannerPrompt(taskContent)
LLM 输出 JSON（taskType: "component_enhancement", searchKeywords: ["Switch", "loading", "disabled", "Button"], ...）
落库: workflow_nodes { node_name: "planner", status: "success", input_json, output_json, duration_ms }
更新 context.plannerOutput
```

### Step 3：Retriever Agent

```
输入 context = { ..., plannerOutput: { searchKeywords: [...], targetModules: [...] } }
调用 Searcher.search({ keywords: ["Switch", "loading", "disabled", "Button"], topN: 10 })
Searcher 查询 chunks 表，按打分排序返回检索结果
落库: workflow_nodes { node_name: "retriever", status: "success", output_json }
更新 context.retrievalOutput
```

### Step 4：Analyzer Agent

```
输入 context = { ..., retrievalOutput: { relatedFiles: [...], relatedChunks: [...] } }
调用 LLM，PromptBuilder.buildAnalyzerPrompt(taskContent, retrievalOutput)
LLM 分析当前实现、影响范围、依赖、风险
落库: workflow_nodes { node_name: "analyzer", status: "success", output_json }
更新 context.analyzerOutput
```

### Step 5：Generator Agent

```
输入 context = { ..., analyzerOutput: { currentImplementation, impactScope, risks } }
调用 LLM，PromptBuilder.buildGeneratorPrompt(taskContent, analyzerOutput)
LLM 生成改动建议、实现步骤、README 草稿、PR 描述
落库: workflow_nodes { node_name: "generator", status: "success", output_json }
更新 context.generatorOutput
```

### Step 6：Reviewer Agent

```
输入 context = { ..., generatorOutput, retrievalOutput }
调用 LLM，PromptBuilder.buildReviewerPrompt(generatorOutput, retrievalOutput)
LLM 检查不一致项、遗漏点，输出 finalPolishedResult
落库: workflow_nodes { node_name: "reviewer", status: "success", output_json }
```

### Step 7：保存结果

```
resultRepo.save({
  taskId: "t_001",
  relatedFilesJson: analyzerOutput.impactScope,
  analysisJson: analyzerOutput.currentImplementation,
  suggestionsJson: generatorOutput.changeSuggestions,
  risksJson: analyzerOutput.risks,
  docDraft: generatorOutput.readmeDraft,
  nextStepsJson: generatorOutput.implementationSteps
})
taskRepo.updateStatus('done')
```

### Step 8：前端展示

前端停止轮询，渲染 5 个结果卡片：涉及文件 / 当前实现 / 改动建议 / 风险点 / README 草稿。

---

## 7. 关键设计原则

### 7.1 节点间数据传递规范

所有 Agent 输出均为 TypeScript 类型定义的结构化对象，禁止返回纯字符串或无 Schema 的 JSON。好处：

1. 落库字段明确，前端展示可直接映射字段
2. Reviewer 可针对具体字段做一致性检查
3. 后续替换模型或改写 Prompt 不影响数据流

### 7.2 错误处理策略

节点级别错误不影响已执行节点结果：

- 单个节点 `runNode()` 抛出异常 → 标记该节点 `status = 'error'` → 标记任务 `status = 'error'` → 返回错误信息
- 前端展示已成功节点（可查看）和失败节点（显示 errorMessage）
- chunks 表支持删除文件时级联清理（`ON DELETE CASCADE`）

### 7.3 LLM 调用约束

- 所有 Agent 经由统一 `LLMClient` 封装，不直接使用 OpenAI SDK 或其他模型 SDK
- Prompt 按 Agent 独立维护（`agents/prompts/planner.ts` 等），便于调优
- LLM 输出统一要求 JSON 格式，后端做 `JSON.parse()` 解析；解析失败时降级记录 `rawText`，不影响主流程

### 7.4 检索保底策略

若 RAG 检索结果为空：

- Retriever 返回空列表，并附加 `warnings: ["上下文不足"]`
- Analyzer / Generator 在 Prompt 中附带此警告，输出时明确说明「基于任务文本，未找到高相关上下文」
- Reviewer 检查 Generator 输出是否有明显幻觉，要求 Generator 保守输出

---

## 8. 目录结构映射

### 8.1 后端

```
server/src/
├── app.ts                              # Express 入口，中间件配置
├── routes/                             # 接口层：路由定义
│   ├── files.ts
│   ├── tasks.ts
│   └── retrieval.ts
├── controllers/                       # 接口层：参数校验，调用 service
│   ├── fileController.ts
│   ├── taskController.ts
│   └── retrievalController.ts
├── services/                          # 业务逻辑组织层
│   ├── fileService.ts                 # 文件上传 + 解析 + 切片编排
│   ├── taskService.ts                 # 任务创建 + 触发工作流
│   └── resultService.ts               # 结果查询与格式化
├── workflow/                          # 工作流编排层
│   ├── orchestrator.ts                 # runWorkflow() 任务入口
│   ├── nodeRunner.ts                  # runNode() 节点执行器
│   └── types.ts                       # WorkflowContext / AgentResult 等类型
├── agents/                            # Agent 层：每个 Agent 独立文件
│   ├── plannerAgent.ts
│   ├── retrieverAgent.ts
│   ├── analyzerAgent.ts
│   ├── generatorAgent.ts
│   ├── reviewerAgent.ts
│   └── prompts/                       # Prompt 模板按 Agent 拆分
│       ├── planner.ts
│       ├── analyzer.ts
│       ├── generator.ts
│       └── reviewer.ts
├── rag/                               # RAG 与上下文层
│   ├── parser.ts                      # 按文件类型分发解析
│   ├── chunker.ts                     # 切片逻辑
│   ├── indexer.ts                     # 写入 chunks 表
│   ├── searcher.ts                    # 关键词检索 + 打分
│   └── types.ts                       # RetrievalItem / Chunk 等类型
├── models/                            # LLM 适配层
│   ├── llmClient.ts                   # 统一 chat() 接口，屏蔽模型细节
│   └── schemas.ts                     # 各 Agent 输出 Schema 定义
├── storage/                           # 存储层
│   ├── db.ts                          # SQLite 连接初始化，建表
│   └── repositories/
│       ├── fileRepo.ts
│       ├── chunkRepo.ts
│       ├── taskRepo.ts
│       ├── workflowRepo.ts
│       └── resultRepo.ts
├── utils/
│   ├── logger.ts                      # 结构化日志
│   └── time.ts                        # 时间格式化 / duration 计算
└── constants/
    └── workflow.ts                    # 节点名称枚举 / 状态枚举
```

### 8.2 前端

```
client/src/
├── pages/
│   └── WorkbenchPage.tsx              # 三栏布局容器
├── components/
│   ├── FilePanel/
│   │   ├── FileUploader.tsx            # 上传按钮 + 进度
│   │   ├── FileList.tsx               # 文件列表 + 删除
│   │   └── index.tsx
│   ├── TaskInputPanel/
│   │   └── index.tsx                  # 任务输入框 + 执行按钮
│   ├── WorkflowPanel/
│   │   ├── WorkflowTimeline.tsx       # 节点时间线展示
│   │   ├── WorkflowNode.tsx           # 单个节点状态组件
│   │   ├── NodeDetailDrawer.tsx       # 节点详情抽屉
│   │   └── index.tsx
│   ├── ResultPanel/
│   │   ├── RelatedFilesCard.tsx
│   │   ├── AnalysisCard.tsx
│   │   ├── SuggestionsCard.tsx
│   │   ├── RisksCard.tsx
│   │   ├── DocDraftCard.tsx           # 支持一键复制
│   │   └── index.tsx
│   └── HistoryPanel/
│       ├── TaskHistoryList.tsx
│       └── index.tsx
├── stores/                            # Zustand Store
│   ├── useFileStore.ts
│   ├── useTaskStore.ts
│   └── useUIStore.ts
├── services/                          # API 调用层
│   ├── fileApi.ts
│   ├── taskApi.ts
│   └── workflowApi.ts
├── types/                              # 与后端共享的 TS 类型
│   ├── file.ts
│   ├── task.ts
│   ├── workflow.ts
│   └── result.ts
└── utils/
    └── polling.ts                      # 轮询工具函数
```

---

## 9. 数据库设计要点

SQLite 数据库文件位于 `server/data/db.sqlite`，MVP 阶段不使用 ORM，直接用 `better-sqlite3` 封装的原始 SQL。

### 9.1 表关系

```
files ──< chunks          （文件删除时级联删除 chunks）
tasks ──< workflow_nodes  （任务删除时级联删除节点）
tasks ──< task_results    （task_id 一对一）
```

### 9.2 索引策略

- `chunks`: 在 `(file_id)` 上建索引，在 `(content)` 上建 FTS 备选
- `workflow_nodes`: 在 `(task_id)` 上建索引
- `tasks`: 在 `(status)` 上建索引（便于后台任务查询 running 状态）

---

## 10. 扩展点与演进路线

| 阶段 | 扩展内容 | 影响范围 |
|------|---------|---------|
| MVP | 关键词检索 + 简单切片 | rag/searcher.ts, rag/chunker.ts |
| V2 | embedding 向量检索 | rag/searcher.ts 替换为向量引擎，models/ 增加 embeddingClient |
| V2 | 多轮任务续跑 | storage/ 增加 sessions 表，orchestrator.ts 增加上下文拼接 |
| V2 | 分支节点 / 条件跳过 | nodeRunner.ts 增加条件判断，workflow_nodes 增加 condition 字段 |
| V2 | 结果导出 | 前端增加 exportService，支持 Markdown / JSON / PR 格式下载 |

---

## 11. 总结

本架构以「五层分层 + 固定节点顺序 + Repository 模式」为核心约束，确保：

- **开发对齐**：每层职责单一，新增 Agent 或替换模型不影响其他层
- **调试友好**：节点 input/output 均落库，前端可完整回放执行过程
- **演进可控**：扩展点均有明确定义，不因短期需求破坏架构边界
