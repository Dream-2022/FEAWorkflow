# Frontend Agent Workflow 开发任务清单

## Phase 1: 项目骨架搭建 (MVP 必做)

### 后端骨架

- [ ] 初始化 server 目录结构
- [ ] 配置 TypeScript + Express 基础环境
- [ ] 创建数据库初始化脚本与表结构定义
- [ ] 实现 db.ts 数据库连接与 Repository 基础类
- [ ] 创建统一 API 响应格式中间件
- [ ] 配置 CORS 与基础错误处理
- [ ] 创建 logger.ts 日志工具

### 前端骨架

- [ ] 初始化 web 目录结构
- [ ] 配置 React + TypeScript + Vite 基础环境
- [ ] 配置 Tailwind CSS
- [ ] 创建三栏布局基础组件
- [ ] 配置 Zustand Store 基础结构
- [ ] 创建 API 服务基础封装
- [ ] 配置路由（如需要）

---

## Phase 2: 文件上传与解析 (MVP 必做)

### 后端 - 文件上传

- [ ] 实现 FileRepository（CRUD）
- [ ] 配置 Multer 中间件
- [ ] 实现 POST /files/upload 接口
- [ ] 实现文件保存到 uploads 目录
- [ ] 实现文件元信息写入数据库
- [ ] 实现 GET /files 接口
- [ ] 实现 DELETE /files/:id 接口

### 后端 - 文件解析与切片

- [ ] 实现 fileType.ts 文件类型识别工具
- [ ] 实现 Markdown 解析器
- [ ] 实现 Markdown 切片器
- [ ] 实现 JS/TS/JSX/TSX 简单解析器
- [ ] 实现代码切片器
- [ ] 实现 ChunkRepository（CRUD）
- [ ] 实现切片写入 chunks 表
- [ ] 文件上传后自动触发解析与切片

### 前端 - 文件管理

- [ ] 实现 FileUploader 组件
- [ ] 实现 FileList 组件
- [ ] 实现 useFileStore
- [ ] 实现文件上传 API 调用
- [ ] 实现文件列表展示
- [ ] 实现删除文件功能
- [ ] 显示文件解析状态

---

## Phase 3: RAG 检索模块 (MVP 必做)

### 后端 - 检索

- [ ] 实现关键词提取工具
- [ ] 实现 searcher.ts 检索器
- [ ] 实现关键词打分逻辑
- [ ] 实现 POST /retrieval/search 调试接口
- [ ] 定义 RetrievalItem 类型

### 后端 - Agent 基础

- [ ] 实现 llmClient.ts LLM 客户端封装
- [ ] 实现 promptBuilder.ts Prompt 构建器基础
- [ ] 定义 WorkflowContext 类型
- [ ] 定义 AgentResult 类型

---

## Phase 4: 工作流编排器 (MVP 必做)

### 后端 - 编排器基础

- [ ] 实现 TaskRepository（CRUD）
- [ ] 实现 WorkflowNodeRepository（CRUD）
- [ ] 实现 nodeRunner.ts 节点运行器
- [ ] 实现 orchestrator.ts 工作流编排器框架
- [ ] 实现节点状态记录与落库
- [ ] 实现任务状态更新

### 后端 - Agent 实现

- [ ] 实现 Planner Agent
- [ ] 实现 Retriever Agent
- [ ] 实现 Analyzer Agent
- [ ] 实现 Generator Agent
- [ ] 实现 Reviewer Agent

### 后端 - 任务接口

- [ ] 实现 POST /tasks 创建任务接口
- [ ] 实现 GET /tasks 获取任务列表接口
- [ ] 实现 GET /tasks/:id 获取任务详情接口
- [ ] 实现 GET /tasks/:id/workflow 获取工作流节点接口
- [ ] 实现 ResultRepository（CRUD）
- [ ] 实现 GET /tasks/:id/result 获取最终结果接口
- [ ] 实现保存最终结果到 task_results 表

---

## Phase 5: 前端任务执行与可视化 (MVP 必做)

### 前端 - 任务输入

- [ ] 实现 TaskInputPanel 组件
- [ ] 实现任务输入与执行按钮
- [ ] 实现创建任务 API 调用

### 前端 - 状态管理

- [ ] 实现 useTaskStore
- [ ] 实现当前任务状态管理
- [ ] 实现工作流节点状态管理
- [ ] 实现最终结果状态管理

### 前端 - 工作流可视化

- [ ] 实现 WorkflowPanel 组件
- [ ] 实现 WorkflowNode 组件
- [ ] 实现节点状态展示（pending/running/success/error）
- [ ] 实现节点耗时展示
- [ ] 实现轮询任务状态
- [ ] 实现 NodeDetailDrawer 节点详情抽屉
- [ ] 实现节点输入/输出摘要展示

### 前端 - 结果展示

- [ ] 实现 ResultPanel 组件
- [ ] 实现 RelatedFilesCard 组件
- [ ] 实现 AnalysisCard 组件
- [ ] 实现 SuggestionsCard 组件
- [ ] 实现 RisksCard 组件
- [ ] 实现 DocDraftCard 组件
- [ ] 实现文档草稿复制功能

### 前端 - 历史任务

- [ ] 实现 HistoryPanel 组件
- [ ] 实现历史任务列表展示
- [ ] 实现切换查看历史任务
- [ ] 实现 useUIStore UI 状态管理

---

## Phase 6: 质量优化与收尾 (MVP 必做)

### 错误处理与兜底

- [ ] 实现文件解析失败处理
- [ ] 实现检索结果为空的提示
- [ ] 实现 LLM 输出解析失败处理
- [ ] 实现节点执行错误处理
- [ ] 实现前端错误提示
- [ ] 实现 Loading 状态
- [ ] 实现空状态展示

### 工程化

- [ ] 配置 ESLint + Prettier
- [ ] 配置环境变量（API Key 等）
- [ ] 完善 README 文档
- [ ] 添加 .gitignore
- [ ] 准备固定演示数据

---

## 后续增强 (非 MVP)

### RAG 增强

- [ ] 实现基于 AST 的代码解析
- [ ] 实现 embedding 向量检索
- [ ] 实现 BM25 检索
- [ ] 实现 rerank 重排序
- [ ] 实现项目摘要缓存

### 工作流增强

- [ ] 支持任务模板
- [ ] 支持多轮任务续跑
- [ ] 支持分支/条件节点
- [ ] 支持自定义工作流

### 导出功能

- [ ] 支持导出 Markdown
- [ ] 支持导出 JSON
- [ ] 支持导出 PR 描述
- [ ] 支持生成 diff 草稿

### 项目级功能

- [ ] 实现项目空间概念
- [ ] 实现项目级记忆
- [ ] 支持 Git 仓库拉取
- [ ] 支持团队协作（预留）

### 多模型支持

- [ ] 支持 Claude
- [ ] 支持本地模型
- [ ] 支持多模型切换
- [ ] 支持模型对比

### UI 增强

- [ ] 集成 React Flow 可视化
- [ ] 支持深色模式
- [ ] 支持快捷键
- [ ] 支持自定义布局
