// Node Runner - 工作流节点执行器
// 负责节点状态管理、计时、输入输出记录
// 对应 docs/3-architecture.md 第 4.3 节设计

import { WorkflowNode, NodeStatus } from './types';
import { WorkflowNodeName, NODE_DISPLAY_NAMES } from './constants';

export interface NodeExecutor {
  (input: Record<string, unknown>): Promise<Record<string, unknown>>;
}

interface NodeConfig {
  nodeName: WorkflowNodeName;
  executor: NodeExecutor;
}

export async function runNode(
  config: NodeConfig,
  context: Record<string, unknown>
): Promise<WorkflowNode> {
  const { nodeName, executor } = config;
  const nodeNameStr = nodeName as string;
  const displayName = NODE_DISPLAY_NAMES[nodeName];

  console.log(`[NodeRunner] 开始执行节点: ${displayName} (${nodeNameStr})`);

  // 构建节点状态
  const node: WorkflowNode = {
    nodeName: nodeNameStr,
    status: NodeStatus.RUNNING,
    input: context,
    output: {},
    startedAt: new Date().toISOString(),
  };

  const startTime = Date.now();

  try {
    // 执行节点逻辑
    const result = await executor(context);

    // 执行成功
    node.status = NodeStatus.SUCCESS;
    node.output = result;
    node.finishedAt = new Date().toISOString();
    node.durationMs = Date.now() - startTime;

    console.log(
      `[NodeRunner] 节点执行完成: ${displayName}, 耗时: ${node.durationMs}ms`
    );
  } catch (error) {
    // 执行失败
    node.status = NodeStatus.ERROR;
    node.errorMessage =
      error instanceof Error ? error.message : String(error);
    node.finishedAt = new Date().toISOString();
    node.durationMs = Date.now() - startTime;

    console.error(
      `[NodeRunner] 节点执行失败: ${displayName}, 错误: ${node.errorMessage}`
    );
  }

  return node;
}

// 构建节点配置的工具函数（后续可扩展为动态配置）
export function createNodeConfig(
  nodeName: WorkflowNodeName,
  executor: NodeExecutor
): NodeConfig {
  return { nodeName, executor };
}