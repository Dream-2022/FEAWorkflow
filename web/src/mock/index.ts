import type { FileItem, TaskItem, WorkflowNode, TaskResult } from '../types';

export const mockFiles: FileItem[] = [
  {
    id: '1',
    name: 'Switch.tsx',
    path: 'src/components/Switch/index.tsx',
    type: 'tsx',
    size: 2048,
    parseStatus: 'success',
    uploadedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'README.md',
    path: 'src/components/Switch/README.md',
    type: 'md',
    size: 1024,
    parseStatus: 'success',
    uploadedAt: new Date().toISOString(),
  },
];

export const mockTask: TaskItem = {
  id: 'task-1',
  content: '为 Switch 组件新增 loading 与 disabled 联动能力',
  status: 'running',
  createdAt: new Date().toISOString(),
  startedAt: new Date().toISOString(),
};

export const mockWorkflowNodes: WorkflowNode[] = [
  {
    id: 'node-1',
    taskId: 'task-1',
    nodeName: 'Planner',
    status: 'success',
    startedAt: new Date().toISOString(),
    finishedAt: new Date().toISOString(),
    durationMs: 1500,
  },
  {
    id: 'node-2',
    taskId: 'task-1',
    nodeName: 'Retriever',
    status: 'running',
    startedAt: new Date().toISOString(),
  },
  {
    id: 'node-3',
    taskId: 'task-1',
    nodeName: 'Analyzer',
    status: 'pending',
  },
  {
    id: 'node-4',
    taskId: 'task-1',
    nodeName: 'Generator',
    status: 'pending',
  },
  {
    id: 'node-5',
    taskId: 'task-1',
    nodeName: 'Reviewer',
    status: 'pending',
  },
];

export const mockTaskResult: TaskResult = {
  relatedFiles: ['src/components/Switch/index.tsx', 'src/components/Switch/README.md'],
  analysis: 'Switch 组件当前支持 disabled prop，但未实现 loading 状态',
  suggestions: [
    '新增 loading?: boolean prop',
    'loading 为 true 时强制 disabled 为 true',
    '添加 loading 状态样式',
  ],
  risks: [
    '需确保 loading 状态不破坏现有 disabled 逻辑',
    '需考虑样式兼容性',
  ],
  docDraft: '## Props\n- loading?: boolean - 是否显示加载状态...',
  nextSteps: ['修改 Props 类型', '添加状态逻辑', '更新样式', '更新文档'],
};
