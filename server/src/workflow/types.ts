// Workflow types - 定义所有工作流相关的类型
// 对应 docs/3-architecture.md 第 4.3、4.4 节

// ==========================================
// Agent 输入输出类型
// ==========================================

export interface PlannerOutput {
  taskType: 'component_enhancement' | 'documentation' | 'impact_analysis' | 'refactoring';
  subtasks: string[];
  searchKeywords: string[];
  targetModules: string[];
  expectedOutputSections: string[];
}

export interface RetrievalOutput {
  relatedFiles: string[];
  relatedChunks: Array<{
    filePath: string;
    content: string;
    score: number;
  }>;
  retrievalSummary: string;
}

export interface AnalyzerOutput {
  currentImplementation: string;
  impactScope: string[];
  dependencies: string[];
  risks: string[];
}

export interface GeneratorOutput {
  changeSuggestions: string[];
  implementationSteps: string[];
  docDraft: string;
  prDraft: string;
}

export interface ReviewerOutput {
  inconsistencies: string[];
  missingPoints: string[];
  finalPolishedResult: {
    relatedFiles: string[];
    analysis: string;
    suggestions: string[];
    risks: string[];
    docDraft: string;
    nextSteps: string[];
  };
}

// Agent 统一包装
export interface AgentResult<T> {
  success: boolean;
  data: T;
  summary: string;
  warnings?: string[];
}

// ==========================================
// Workflow Context
// ==========================================

export interface WorkflowContext {
  taskId: string;
  taskContent: string;
  plannerOutput?: PlannerOutput;
  retrievalOutput?: RetrievalOutput;
  analyzerOutput?: AnalyzerOutput;
  generatorOutput?: GeneratorOutput;
}

// ==========================================
// 节点执行状态
// ==========================================

export enum NodeStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
  SKIPPED = 'skipped',
}

export enum TaskStatus {
  QUEUED = 'queued',
  RUNNING = 'running',
  DONE = 'done',
  ERROR = 'error',
}

export interface WorkflowNode {
  nodeName: string;
  status: NodeStatus;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  errorMessage?: string;
}

// ==========================================
// 接口响应结构
// ==========================================

export interface TaskInfo {
  id: string;
  content: string;
  status: TaskStatus;
}

export interface WorkflowRunResponse {
  task: TaskInfo;
  currentStep: string;
  nodeStates: WorkflowNode[];
  relatedFiles: string[];
  summary: string;
  analysis: {
    currentImplementation: string;
    impactScope: string[];
    risks: string[];
  };
}