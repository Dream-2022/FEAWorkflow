export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface HealthCheckResponse {
  status: 'ok';
  timestamp: string;
  uptime: number;
}

export interface FileItem {
  id: string;
  name: string;
  path: string;
  type: string;
  size: number;
  parseStatus: 'pending' | 'success' | 'failed';
  uploadedAt: string;
}

export interface TaskItem {
  id: string;
  content: string;
  status: 'queued' | 'running' | 'done' | 'error';
  createdAt: string;
  startedAt?: string;
  finishedAt?: string;
}

export interface WorkflowNode {
  id: string;
  taskId: string;
  nodeName: string;
  status: 'pending' | 'running' | 'success' | 'error' | 'skipped';
  inputJson?: string;
  outputJson?: string;
  startedAt?: string;
  finishedAt?: string;
  durationMs?: number;
  errorMessage?: string;
}

export interface TaskResult {
  relatedFiles?: string[];
  analysis?: string;
  suggestions?: string[];
  risks?: string[];
  docDraft?: string;
  nextSteps?: string[];
}
