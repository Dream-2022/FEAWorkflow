// Workflow Orchestrator - 工作流编排器
// 负责按固定顺序执行 5 个 Agent 节点，收集状态，构建最终响应
// 对应 docs/3-architecture.md 第 4.3 节设计

import { v4 as uuidv4 } from 'uuid';
import {
  WorkflowContext,
  WorkflowNode,
  WorkflowRunResponse,
  TaskInfo,
  NodeStatus,
  TaskStatus,
} from './types';
import { WorkflowNodeName } from './constants';
import { runNode } from './nodeRunner';

// Agent 导入
import { runPlanner } from './agents/planner';
import { runRetriever } from './agents/retriever';
import { runAnalyzer } from './agents/analyzer';
import { runGenerator } from './agents/generator';
import { runReviewer } from './agents/reviewer';

// 执行延迟工具（模拟真实 Agent 调用耗时）
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================
// 主入口：运行完整工作流
// ============================================================

/**
 * 运行完整工作流
 * @param taskContent 用户输入的任务描述
 * @returns WorkflowRunResponse 结构化响应
 */
export async function runWorkflow(
  taskContent: string
): Promise<WorkflowRunResponse> {
  const taskId = `task_${uuidv4().slice(0, 8)}`;
  const startTime = Date.now();

  // 初始化任务信息
  const taskInfo: TaskInfo = {
    id: taskId,
    content: taskContent,
    status: TaskStatus.RUNNING,
  };

  // 初始化工作流上下文（节点间数据传递载体）
  const context: WorkflowContext = {
    taskId,
    taskContent,
  };

  // 节点执行结果列表
  const nodeStates: WorkflowNode[] = [];

  console.log(`[Orchestrator] 工作流启动, taskId: ${taskId}`);
  console.log(`[Orchestrator] 任务内容: ${taskContent}`);

  try {
    // ===== 节点 1: Planner =====
    {
      const node = await runNode(
        { nodeName: WorkflowNodeName.PLANNER, executor: plannerExecutor },
        context as unknown as Record<string, unknown>
      );
      nodeStates.push(node);
      if (node.status === NodeStatus.ERROR) throw new Error(`Planner 节点执行失败: ${node.errorMessage}`);
      context.plannerOutput = node.output as unknown as typeof context.plannerOutput;
      await delay(100);
    }

    // ===== 节点 2: Retriever =====
    {
      const node = await runNode(
        { nodeName: WorkflowNodeName.RETRIEVER, executor: retrieverExecutor },
        context as unknown as Record<string, unknown>
      );
      nodeStates.push(node);
      if (node.status === NodeStatus.ERROR) throw new Error(`Retriever 节点执行失败: ${node.errorMessage}`);
      context.retrievalOutput = node.output as unknown as typeof context.retrievalOutput;
      await delay(100);
    }

    // ===== 节点 3: Analyzer =====
    {
      const node = await runNode(
        { nodeName: WorkflowNodeName.ANALYZER, executor: analyzerExecutor },
        context as unknown as Record<string, unknown>
      );
      nodeStates.push(node);
      if (node.status === NodeStatus.ERROR) throw new Error(`Analyzer 节点执行失败: ${node.errorMessage}`);
      context.analyzerOutput = node.output as unknown as typeof context.analyzerOutput;
      await delay(100);
    }

    // ===== 节点 4: Generator =====
    {
      const node = await runNode(
        { nodeName: WorkflowNodeName.GENERATOR, executor: generatorExecutor },
        context as unknown as Record<string, unknown>
      );
      nodeStates.push(node);
      if (node.status === NodeStatus.ERROR) throw new Error(`Generator 节点执行失败: ${node.errorMessage}`);
      context.generatorOutput = node.output as unknown as typeof context.generatorOutput;
      await delay(100);
    }

    // ===== 节点 5: Reviewer =====
    {
      const node = await runNode(
        { nodeName: WorkflowNodeName.REVIEWER, executor: reviewerExecutor },
        context as unknown as Record<string, unknown>
      );
      nodeStates.push(node);
      if (node.status === NodeStatus.ERROR) throw new Error(`Reviewer 节点执行失败: ${node.errorMessage}`);
      await delay(100);
    }

    // 任务完成
    taskInfo.status = TaskStatus.DONE;

    const totalDuration = Date.now() - startTime;
    console.log(`[Orchestrator] 工作流完成, taskId: ${taskId}, 总耗时: ${totalDuration}ms`);

  } catch (err) {
    taskInfo.status = TaskStatus.ERROR;
    console.error(`[Orchestrator] 工作流异常中断, taskId: ${taskId}`, err);
  }

  // 从 Reviewer 节点输出中提取最终结果
  const reviewerNode = nodeStates.find((n) => n.nodeName === WorkflowNodeName.REVIEWER);
  const reviewerOutput = reviewerNode?.output as {
    finalPolishedResult: {
      analysis: string;
      impactScope: string[];
      risks: string[];
      relatedFiles: string[];
      suggestions: string[];
      docDraft: string;
      nextSteps: string[];
    };
  } | undefined;

  const relatedFiles = reviewerOutput?.finalPolishedResult?.relatedFiles ?? [];
  const summary = reviewerOutput?.finalPolishedResult?.docDraft
    ? `已完成从任务规划到结果审核的完整工作流，分析 ${relatedFiles.length} 个相关文件，生成改动建议与文档草稿`
    : '工作流执行中';

  return buildResponse(taskInfo, nodeStates, relatedFiles, summary, reviewerOutput?.finalPolishedResult);
}

// ============================================================
// 各节点执行器（Mock Agent 包装）
// 后续替换为真实 Agent 时，只需修改对应 executor 函数
// ============================================================

const plannerExecutor = async (
  input: Record<string, unknown>
): Promise<Record<string, unknown>> => {
  const ctx = input as unknown as WorkflowContext;
  const result = runPlanner(ctx.taskContent);
  return result.data as unknown as Record<string, unknown>;
};

const retrieverExecutor = async (
  input: Record<string, unknown>
): Promise<Record<string, unknown>> => {
  const ctx = input as unknown as WorkflowContext;
  if (!ctx.plannerOutput) throw new Error('缺少 Planner 输出');
  const result = runRetriever({
    taskContent: ctx.taskContent,
    searchKeywords: ctx.plannerOutput.searchKeywords,
    targetModules: ctx.plannerOutput.targetModules,
  });
  return result.data as unknown as Record<string, unknown>;
};

const analyzerExecutor = async (
  input: Record<string, unknown>
): Promise<Record<string, unknown>> => {
  const ctx = input as unknown as WorkflowContext;
  if (!ctx.retrievalOutput) throw new Error('缺少 Retriever 输出');
  const result = runAnalyzer({
    taskContent: ctx.taskContent,
    relatedFiles: ctx.retrievalOutput.relatedFiles,
    relatedChunks: ctx.retrievalOutput.relatedChunks,
  });
  return result.data as unknown as Record<string, unknown>;
};

const generatorExecutor = async (
  input: Record<string, unknown>
): Promise<Record<string, unknown>> => {
  const ctx = input as unknown as WorkflowContext;
  if (!ctx.analyzerOutput) throw new Error('缺少 Analyzer 输出');
  const result = runGenerator({
    taskContent: ctx.taskContent,
    currentImplementation: ctx.analyzerOutput.currentImplementation,
    impactScope: ctx.analyzerOutput.impactScope,
    risks: ctx.analyzerOutput.risks,
  });
  return result.data as unknown as Record<string, unknown>;
};

const reviewerExecutor = async (
  input: Record<string, unknown>
): Promise<Record<string, unknown>> => {
  const ctx = input as unknown as WorkflowContext;
  if (!ctx.generatorOutput || !ctx.retrievalOutput) throw new Error('缺少 Generator 或 Retriever 输出');
  const result = runReviewer({
    generatorOutput: ctx.generatorOutput,
    retrievalOutput: ctx.retrievalOutput,
  });
  return result.data as unknown as Record<string, unknown>;
};

// ============================================================
// 响应构建
// ============================================================

interface FinalResult {
  analysis: string;
  impactScope: string[];
  risks: string[];
  relatedFiles: string[];
  suggestions: string[];
  docDraft: string;
  nextSteps: string[];
}

function buildResponse(
  task: TaskInfo,
  nodeStates: WorkflowNode[],
  relatedFiles: string[],
  summary: string,
  finalResult?: FinalResult
): WorkflowRunResponse {
  const currentStep =
    nodeStates.length > 0
      ? nodeStates[nodeStates.length - 1].nodeName
      : WorkflowNodeName.PLANNER;

  return {
    task,
    currentStep,
    nodeStates,
    relatedFiles,
    summary,
    analysis: {
      currentImplementation: finalResult?.analysis ?? '',
      impactScope: finalResult?.impactScope ?? [],
      risks: finalResult?.risks ?? [],
    },
  };
}
