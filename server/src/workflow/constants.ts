// Workflow constants - 节点名称枚举与状态枚举
// 对应 docs/3-architecture.md 第 6 节约束：执行顺序不可写死

export enum WorkflowNodeName {
  PLANNER = 'planner',
  RETRIEVER = 'retriever',
  ANALYZER = 'analyzer',
  GENERATOR = 'generator',
  REVIEWER = 'reviewer',
}

// 固定执行顺序，不允许跳过，不允许并行
export const WORKFLOW_NODE_ORDER: WorkflowNodeName[] = [
  WorkflowNodeName.PLANNER,
  WorkflowNodeName.RETRIEVER,
  WorkflowNodeName.ANALYZER,
  WorkflowNodeName.GENERATOR,
  WorkflowNodeName.REVIEWER,
];

export const NODE_DISPLAY_NAMES: Record<WorkflowNodeName, string> = {
  [WorkflowNodeName.PLANNER]: '任务规划',
  [WorkflowNodeName.RETRIEVER]: '上下文检索',
  [WorkflowNodeName.ANALYZER]: '工程分析',
  [WorkflowNodeName.GENERATOR]: '方案生成',
  [WorkflowNodeName.REVIEWER]: '结果审核',
};
