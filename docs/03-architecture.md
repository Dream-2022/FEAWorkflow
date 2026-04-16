# Frontend Agent Workflow 系统架构设计

## 1. 文档概述

本文档从工程实现角度，详细阐述 Frontend Agent Workflow 平台的系统分层、模块职责、核心数据流与完整执行链路，为后续代码开发提供架构级指导。

### 1.1 设计原则

1. **分层清晰**：各层职责单一，边界明确，便于独立演进
2. **可观测**：每个节点的输入、输出、状态、耗时可追溯
3. **可替换**：模型、检索、存储等核心模块支持平滑替换
4. **工程导向**：所有设计围绕前端工程任务场景，避免过度泛化

---

## 2. 系统分层架构

系统采用**五层垂直分层架构**，从上到下依次为：

```
┌─────────────────────────────────────────────────────────────┐
│                    前端展示层 (Presentation Layer)            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ FilePanel│  │TaskInput │  │ Workflow │  │  Result  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      接口层 (API Layer)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Files   │  │  Tasks   │  │ Workflow  │  │ Retrieval │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   工作流编排层 (Orchestration Layer)          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Workflow Orchestrator                     │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │  │
│  │  │ Planner │ │Retriever│ │Analyzer │ │Generator│   │  │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │  │
│  │                    ┌─────────┐                         │  │
│  │                    │Reviewer │                         │  │
│  │                    └─────────┘                         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  RAG 与上下文层 (Context Layer)               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  Parser  │  │ Chunker  │  │ Indexer  │  │ Searcher │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                      存储层 (Storage Layer)                    │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  files   │  │  chunks  │  │  tasks   │  │ workflow  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│  ┌──────────┐                                              │  │
│  │  results │                                              │  │
│  └──────────┘                                              │  │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. 各层职责详解

### 3.1 前端展示层

**职责**：用户交互入口与结果可视化

| 模块             | 职责                               | 关键数据结构       |
| ---------------- | ---------------------------------- | ------------------ |
| FilePanel        | 文件上传、文件列表、解析状态展示   | File[]             |
| TaskInputPanel   | 任务文本输入、执行按钮             | TaskContent        |
| WorkflowPanel    | Agent 节点状态、执行进度、耗时展示 | WorkflowNode[]     |
| ResultPanel      | 结构化结果卡片展示                 | TaskResult         |
| HistoryPanel     | 历史任务列表与切换                 | TaskSummary[]      |
| NodeDetailDrawer | 节点输入/输出详情抽屉              | WorkflowNodeDetail |

**状态管理**：Zustand 按职责拆分三个 Store

- `useFileStore`：文件列表、上传状态
- `useTaskStore`：当前任务、工作流节点、最终结果
- `useUIStore`：UI 状态（选中节点、标签页等）

---

### 3.2 接口层

**职责**：HTTP 接口定义、参数校验、统一响应封装

| 接口           | 方法   | 路径                  | 输入                | 输出               |
| -------------- | ------ | --------------------- | ------------------- | ------------------ |
| 上传文件       | POST   | `/files/upload`       | multipart/form-data | UploadResponse     |
| 获取文件列表   | GET    | `/files`              | -                   | File[]             |
| 删除文件       | DELETE | `/files/:id`          | -                   | SuccessResponse    |
| 创建任务       | POST   | `/tasks`              | TaskCreateRequest   | TaskCreateResponse |
| 获取任务列表   | GET    | `/tasks`              | -                   | TaskSummary[]      |
| 获取任务详情   | GET    | `/tasks/:id`          | -                   | TaskDetail         |
| 获取工作流节点 | GET    | `/tasks/:id/workflow` | -                   | WorkflowNode[]     |
| 获取最终结果   | GET    | `/tasks/:id/result`   | -                   | TaskResult         |
| 调试检索       | POST   | `/retrieval/search`   | SearchQuery         | RetrievalItem[]    |

**统一响应格式**：

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
```

---

### 3.3 工作流编排层

**职责**：Agent 节点调度、状态流转、错误处理、数据落库

#### 3.3.1 Workflow Orchestrator

核心编排器，负责完整任务生命周期管理：

```
┌─────────────────────────────────────────────────────────┐
│                    runWorkflow()                          │
│  1. createInitialContext()                                │
│  2. updateTaskStatus(running)                             │
│  3. ┌─────────────────────────────────────────────────┐ │
│     │           runNode('planner')                    │ │
│     │  - write running status                         │ │
│     │  - invoke agent                                  │ │
│     │  - record input/output/duration                 │ │
│     │  - write success/error status                   │ │
│     └─────────────────────────────────────────────────┘ │
│  4. ┌─────────────────────────────────────────────────┐ │
│     │           runNode('retriever')                  │ │
│     └─────────────────────────────────────────────────┘ │
│  5. ┌─────────────────────────────────────────────────┐ │
│     │           runNode('analyzer')                   │ │
│     └─────────────────────────────────────────────────┘ │
│  6. ┌─────────────────────────────────────────────────┐ │
│     │           runNode('generator')                  │ │
│     └─────────────────────────────────────────────────┘ │
│  7. ┌─────────────────────────────────────────────────┐ │
│     │           runNode('reviewer')                   │ │
│     └─────────────────────────────────────────────────┘ │
│  8. saveFinalResult()                                    │
│  9. updateTaskStatus(done)                               │
└─────────────────────────────────────────────────────────┘
```

#### 3.3.2 Agent 统一规范

每个 Agent 遵循统一输入输出契约：

```typescript
interface WorkflowContext {
  taskId: string;
  taskContent: string;
  uploadedFiles: FileEntity[];
  plannerOutput?: PlannerOutput;
  retrievalOutput?: RetrievalOutput;
  analyzerOutput?: AnalyzerOutput;
  generatorOutput?: GeneratorOutput;
}

interface AgentResult<T> {
  success: boolean;
  data: T;
  summary: string;
  warnings?: string[];
}

interface Agent<TInput, TOutput> {
  (context: WorkflowContext): Promise<AgentResult<TOutput>>;
}
```

#### 3.3.3 各 Agent 职责

| Agent     | 输入                              | 输出                                                             | 核心职责                |
| --------- | --------------------------------- | ---------------------------------------------------------------- | ----------------------- |
| Planner   | taskContent                       | { taskType, subtasks, searchKeywords, targetModules }            | 任务拆解与检索方向规划  |
| Retriever | taskContent + plannerOutput       | { relatedFiles, relatedChunks, retrievalSummary }                | 从 RAG 中检索相关上下文 |
| Analyzer  | taskContent + retrievalOutput     | { currentImplementation, impactScope, dependencies, risks }      | 工程分析与影响评估      |
| Generator | taskContent + analyzerOutput      | { changeSuggestions, implementationSteps, readmeDraft, prDraft } | 方案生成与文档草稿      |
| Reviewer  | generatorOutput + retrievalOutput | { inconsistencies, missingPoints, finalPolishedResult }          | 自检审核与结果校准      |

---

### 3.4 RAG 与上下文层

**职责**：文件解析、内容切片、索引构建、相关检索

#### 3.4.1 Parser

解析不同类型文件内容：

| 文件类型      | 解析方式                | 输出                                       |
| ------------- | ----------------------- | ------------------------------------------ |
| Markdown      | 按标题层级解析          | { titlePath: string[], content: string }[] |
| JS/TS/JSX/TSX | 读取全文 + 简单符号识别 | { content: string, symbols: string[] }     |
| Vue           | 读取 template + script  | { template: string, script: string }       |

#### 3.4.2 Chunker

将解析结果切分为可检索的 Chunk：

**Markdown 切片规则**：

- 按 `#` / `##` / `###` 切分
- 每个 Chunk 控制在 300~1200 字符
- 保留标题路径

**代码切片规则**：

- 优先按函数/组件切分（`export function`, `const Xxx = () =>`, `function Xxx()` 等）
- 保底按文件切分
- 每个 Chunk 记录 symbolName

#### 3.4.3 Indexer

将 Chunk 写入索引（SQLite chunks 表）

#### 3.4.4 Searcher

根据查询检索相关 Chunk，采用**关键词打分策略**：

| 匹配项                   | 分值  |
| ------------------------ | ----- |
| 文件名完全匹配           | +5    |
| symbolName 匹配          | +4    |
| 标题匹配                 | +3    |
| 内容关键词命中（按次数） | +1/次 |
| 路径包含关键模块名       | +2    |

按总分倒序取 Top N 返回。

---

### 3.5 存储层

**职责**：数据持久化，使用 SQLite 本地存储

#### 3.5.1 数据表设计

**files 表**：存储上传文件元信息

```sql
CREATE TABLE files (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  ext TEXT,
  mime_type TEXT,
  size INTEGER,
  content TEXT,
  parse_status TEXT NOT NULL DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**chunks 表**：存储切片索引

```sql
CREATE TABLE chunks (
  id TEXT PRIMARY KEY,
  file_id TEXT NOT NULL,
  file_path TEXT NOT NULL,
  chunk_type TEXT NOT NULL,
  title TEXT,
  symbol_name TEXT,
  language TEXT,
  content TEXT NOT NULL,
  summary TEXT,
  keywords TEXT,
  order_index INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (file_id) REFERENCES files(id)
);
```

**tasks 表**：存储任务记录

```sql
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  started_at DATETIME,
  finished_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**workflow_nodes 表**：存储工作流节点执行记录

```sql
CREATE TABLE workflow_nodes (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  node_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  input_json TEXT,
  output_json TEXT,
  started_at DATETIME,
  finished_at DATETIME,
  duration_ms INTEGER,
  error_message TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);
```

**task_results 表**：存储最终结构化结果

```sql
CREATE TABLE task_results (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL UNIQUE,
  related_files_json TEXT,
  analysis_json TEXT,
  suggestions_json TEXT,
  risks_json TEXT,
  doc_draft TEXT,
  next_steps_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);
```

---

## 4. 核心数据流

### 4.1 文件上传数据流

```
用户选择文件
    ↓
前端 FormData 上传
    ↓
POST /files/upload
    ↓
Multer 接收文件 → 保存到 /uploads 目录
    ↓
识别文件类型 → 读取文本内容
    ↓
写入 files 表（parse_status = 'parsing'）
    ↓
触发 Parser → 触发 Chunker
    ↓
写入 chunks 表
    ↓
更新 files.parse_status = 'success' / 'failed'
    ↓
返回上传结果给前端
    ↓
前端刷新文件列表
```

### 4.2 任务执行数据流

```
用户输入任务 → 点击执行
    ↓
前端 POST /tasks
    ↓
后端创建 tasks 记录（status = 'queued'）
    ↓
返回 taskId 给前端
    ↓
前端启动轮询：GET /tasks/:id, /workflow, /result
    ↓
后端启动 Workflow Orchestrator
    ↓
┌─────────────────────────────────────────┐
│  执行 Planner Node                      │
│  - 记录 input_json                      │
│  - 调用 LLM                             │
│  - 记录 output_json + duration          │
│  - 更新 node status = 'success'         │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  执行 Retriever Node                    │
│  - 调用 Searcher 检索                   │
│  - 记录检索结果                         │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  执行 Analyzer Node                     │
│  - 基于检索结果做工程分析               │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  执行 Generator Node                    │
│  - 生成方案与文档草稿                   │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  执行 Reviewer Node                     │
│  - 自检与结果校准                       │
└─────────────────────────────────────────┘
    ↓
写入 task_results 表
    ↓
更新 tasks.status = 'done'
    ↓
前端轮询获取到最终结果 → 展示
```

### 4.3 历史任务查看数据流

```
用户点击历史任务
    ↓
前端 GET /tasks/:id
    ↓
前端 GET /tasks/:id/workflow
    ↓
前端 GET /tasks/:id/result
    ↓
回填 useTaskStore
    ↓
更新页面展示
```

---

## 5. 一次完整任务执行链路详解

以「**为 Switch 组件新增 loading 与 disabled 联动能力**」为例，展示完整执行链路。

### 5.1 前置条件

用户已上传：

- `src/components/Switch/index.tsx`
- `src/components/Switch/README.md`
- `src/components/Button/index.tsx`（参考组件）

### 5.2 链路步骤

#### Step 1：用户发起任务

**输入**：

```
任务内容：为 Switch 组件新增 loading 与 disabled 联动能力，分析涉及文件并生成改动建议与 README 更新说明。
```

**后端动作**：

- 创建 task 记录，status = 'queued'
- 返回 taskId 给前端
- 启动 Orchestrator

---

#### Step 2：Planner Agent 执行

**输入**：

```typescript
{
  taskContent: "为 Switch 组件新增 loading 与 disabled 联动能力...";
}
```

**LLM Prompt**（示例）：

```
你是一个前端工程任务规划师。请分析以下任务，输出结构化执行计划。

任务：{{taskContent}}

请按 JSON 格式输出：
{
  "taskType": "component_enhancement",
  "subtasks": [
    "查找 Switch 组件当前实现",
    "分析 loading 与 disabled 状态联动逻辑",
    "参考其他组件（如 Button）的实现",
    "生成改动方案",
    "更新 README 文档"
  ],
  "searchKeywords": ["Switch", "loading", "disabled", "Button", "component"],
  "targetModules": ["src/components/Switch", "src/components/Button"],
  "expectedOutputSections": ["relatedFiles", "analysis", "suggestions", "risks", "docDraft"]
}
```

**输出**：

```typescript
{
  taskType: "component_enhancement",
  subtasks: [...],
  searchKeywords: ["Switch", "loading", "disabled", "Button"],
  targetModules: ["src/components/Switch"],
  expectedOutputSections: [...]
}
```

**落库**：workflow_nodes 表记录 planner 节点的 input_json、output_json、duration_ms

---

#### Step 3：Retriever Agent 执行

**输入**：

```typescript
{
  taskContent: "...",
  plannerOutput: {
    searchKeywords: ["Switch", "loading", "disabled", "Button"],
    targetModules: ["src/components/Switch"]
  }
}
```

**检索过程**：

1. 从 plannerOutput 提取关键词
2. 查询 chunks 表，按打分规则排序
3. 取 Top 10 相关 Chunk

**检索结果示例**：
| chunkId | filePath | chunkType | content 摘要 | score |
|---------|----------|-----------|--------------|-------|
| c1 | Switch/index.tsx | code | const Switch = ({ disabled, ... }) => { ... } | 9 |
| c2 | Switch/README.md | doc | ## Props - disabled: boolean | 7 |
| c3 | Button/index.tsx | code | const Button = ({ loading, disabled, ... }) => { ... } | 6 |

**输出**：

```typescript
{
  relatedFiles: [
    "src/components/Switch/index.tsx",
    "src/components/Switch/README.md",
    "src/components/Button/index.tsx"
  ],
  relatedChunks: [
    { chunkId: "c1", filePath: "...", content: "...", score: 9 },
    ...
  ],
  retrievalSummary: "找到 Switch 组件实现、文档，以及 Button 组件参考实现"
}
```

**落库**：workflow_nodes 表记录 retriever 节点

---

#### Step 4：Analyzer Agent 执行

**输入**：

```typescript
{
  taskContent: "...",
  retrievalOutput: { relatedFiles, relatedChunks, ... }
}
```

**LLM 分析**：基于检索到的代码片段，分析：

- 当前 Switch 组件已有 disabled prop，但无 loading
- Button 组件已有 loading 与 disabled 联动逻辑（loading=true 时自动 disabled）
- 影响范围：Switch 组件自身、可能的测试文件

**输出**：

```typescript
{
  currentImplementation: "Switch 组件当前支持 disabled prop，通过 CSS 控制样式，但未实现 loading 状态",
  impactScope: ["src/components/Switch/index.tsx", "src/components/Switch/README.md"],
  dependencies: [],
  risks: [
    "需确保 loading 状态不破坏现有 disabled 逻辑",
    "需考虑样式兼容性"
  ]
}
```

**落库**：workflow_nodes 表记录 analyzer 节点

---

#### Step 5：Generator Agent 执行

**输入**：

```typescript
{
  taskContent: "...",
  analyzerOutput: { currentImplementation, impactScope, ... }
}
```

**LLM 生成**：

- 改动建议：新增 loading prop，loading=true 时自动设置 disabled
- 实现步骤：修改 Props 类型 → 添加状态逻辑 → 更新样式 → 更新文档
- README 草稿：新增 loading prop 说明

**输出**：

```typescript
{
  changeSuggestions: [
    "新增 loading?: boolean prop",
    "loading 为 true 时强制 disabled 为 true",
    "添加 loading 状态样式"
  ],
  implementationSteps: [...],
  readmeDraft: "## Props\n- loading?: boolean - 是否显示加载状态...",
  prDraft: "feat: Switch 组件新增 loading 与 disabled 联动能力..."
}
```

**落库**：workflow_nodes 表记录 generator 节点

---

#### Step 6：Reviewer Agent 执行

**输入**：

```typescript
{
  generatorOutput: { ... },
  retrievalOutput: { ... }
}
```

**LLM 自检**：

- 检查生成内容是否与检索上下文一致
- 检查是否有遗漏（如测试文件未提及）
- 做保守修正

**输出**：

```typescript
{
  inconsistencies: [],
  missingPoints: [
    "建议补充测试文件改动说明"
  ],
  finalPolishedResult: {
    // 整合后的最终结果
  }
}
```

**落库**：workflow_nodes 表记录 reviewer 节点

---

#### Step 7：保存最终结果

将 finalPolishedResult 写入 task_results 表，更新 tasks.status = 'done'

---

#### Step 8：前端展示

前端轮询获取到最终结果，在 ResultPanel 展示：

- 涉及文件列表卡片
- 当前实现分析卡片
- 推荐改动方案卡片
- 风险点卡片
- README 草稿卡片（支持复制）

---

## 6. 目录结构映射

### 6.1 后端目录结构

```
server/
├── src/
│   ├── app.ts                          # Express 入口
│   ├── routes/                         # 接口层
│   │   ├── files.ts
│   │   ├── tasks.ts
│   │   └── retrieval.ts
│   ├── controllers/                    # Controller 层
│   │   ├── fileController.ts
│   │   ├── taskController.ts
│   │   └── retrievalController.ts
│   ├── services/                       # Service 层
│   │   ├── fileService.ts
│   │   ├── taskService.ts
│   │   └── resultService.ts
│   ├── workflow/                       # 工作流编排层
│   │   ├── orchestrator.ts
│   │   ├── types.ts
│   │   └── nodeRunner.ts
│   ├── agents/                         # Agent 层
│   │   ├── plannerAgent.ts
│   │   ├── retrieverAgent.ts
│   │   ├── analyzerAgent.ts
│   │   ├── generatorAgent.ts
│   │   └── reviewerAgent.ts
│   ├── rag/                            # RAG 与上下文层
│   │   ├── parser.ts
│   │   ├── chunker.ts
│   │   ├── indexer.ts
│   │   ├── searcher.ts
│   │   └── types.ts
│   ├── models/                         # LLM 适配层
│   │   ├── llmClient.ts
│   │   ├── promptBuilder.ts
│   │   └── schemas.ts
│   ├── storage/                        # 存储层
│   │   ├── db.ts
│   │   └── repositories/
│   │       ├── fileRepo.ts
│   │       ├── chunkRepo.ts
│   │       ├── taskRepo.ts
│   │       ├── workflowRepo.ts
│   │       └── resultRepo.ts
│   ├── utils/
│   │   ├── logger.ts
│   │   ├── fileType.ts
│   │   └── time.ts
│   └── constants/
│       └── workflow.ts
├── uploads/                            # 上传文件存储目录
└── data/
    └── db.sqlite                       # SQLite 数据库文件
```

### 6.2 前端目录结构

```
client/
├── src/
│   ├── main.tsx                        # 入口
│   ├── App.tsx
│   ├── pages/
│   │   └── WorkbenchPage.tsx           # 工作台主页面
│   ├── components/
│   │   ├── FilePanel/
│   │   │   ├── FileUploader.tsx
│   │   │   ├── FileList.tsx
│   │   │   └── index.tsx
│   │   ├── TaskInputPanel/
│   │   │   └── index.tsx
│   │   ├── WorkflowPanel/
│   │   │   ├── WorkflowNode.tsx
│   │   │   ├── NodeDetailDrawer.tsx
│   │   │   └── index.tsx
│   │   ├── ResultPanel/
│   │   │   ├── RelatedFilesCard.tsx
│   │   │   ├── AnalysisCard.tsx
│   │   │   ├── SuggestionsCard.tsx
│   │   │   ├── RisksCard.tsx
│   │   │   ├── DocDraftCard.tsx
│   │   │   └── index.tsx
│   │   └── HistoryPanel/
│   │       └── index.tsx
│   ├── stores/                         # Zustand Store
│   │   ├── useFileStore.ts
│   │   ├── useTaskStore.ts
│   │   └── useUIStore.ts
│   ├── services/                       # API 调用
│   │   ├── fileApi.ts
│   │   ├── taskApi.ts
│   │   └── workflowApi.ts
│   ├── types/                          # TypeScript 类型定义
│   │   ├── file.ts
│   │   ├── task.ts
│   │   ├── workflow.ts
│   │   └── result.ts
│   └── utils/
└── ...
```

---

## 7. 关键设计决策记录

| 决策项       | 选择           | 原因                                      |
| ------------ | -------------- | ----------------------------------------- |
| 数据库       | SQLite         | MVP 轻量、无需额外服务、便于本地开发      |
| 前端状态管理 | Zustand        | 轻量、适合多区域状态、避免 Redux 过度设计 |
| RAG 检索     | 关键词打分     | 首版先保证可用，后续可升级向量检索        |
| 工作流执行器 | 自研           | 便于理解与讲解、可灵活控制状态流转        |
| Agent 通信   | 上下文对象传递 | 节点间数据清晰、便于落库与追溯            |
| 前端布局     | 三栏工作台     | 符合工程工具用户习惯、信息密度高          |

---

## 8. 扩展点预留

| 模块                  | 预留扩展方向                                 |
| --------------------- | -------------------------------------------- |
| LLM Client            | 支持多模型切换（OpenAI / Claude / 本地模型） |
| RAG Searcher          | 支持 embedding 向量检索、BM25、rerank        |
| Workflow Orchestrator | 支持分支/条件节点、多轮续跑                  |
| Storage               | 支持 PostgreSQL、向量数据库                  |
| Frontend              | 支持任务模板、导出 Markdown/JSON、项目空间   |

---

## 9. 总结

本架构设计围绕「**前端工程提效 Agent Workflow 平台**」场景，通过**五层垂直分层**实现了职责清晰的系统架构：

1. **前端展示层**：三栏工作台，交互友好
2. **接口层**：RESTful API，统一响应
3. **工作流编排层**：自研 Orchestrator，可观测、可追溯
4. **RAG 与上下文层**：文件解析 → 切片 → 索引 → 检索
5. **存储层**：SQLite 本地存储，表设计支持完整链路

核心数据流覆盖**文件上传**、**任务执行**、**历史查看**三大场景，完整执行链路展示了从用户输入到结构化输出的全流程，为后续代码开发提供了明确的架构指导。
