// Mock Planner Agent
// 返回结构化 PlannerOutput，Mock 数据对应「Switch 组件增强」演示场景
// 后续替换为真实 Agent 时，只需修改本文件函数内部逻辑，接口签名不变

import { PlannerOutput } from '../types';
import { AgentResult } from '../types';

export function runPlanner(taskContent: string): AgentResult<PlannerOutput> {
  // Mock 输出：识别任务类型为组件增强，拆解子任务与检索关键词
  const mockData: PlannerOutput = {
    taskType: 'component_enhancement',
    subtasks: [
      '分析 Switch 组件现有 loading 和 disabled 状态实现',
      '梳理 loading 与 disabled 联动时的行为逻辑',
      '设计新增联动能力的技术方案',
      '更新组件文档与类型定义',
    ],
    searchKeywords: ['Switch', 'loading', 'disabled', 'Button', 'FormItem', 'props', 'useSwitch'],
    targetModules: [
      'components/Switch/index.tsx',
      'components/Switch/types.ts',
      'components/Switch/README.md',
      'components/Button/index.tsx',
    ],
    expectedOutputSections: [
      '涉及文件列表',
      '当前实现分析',
      '改动建议',
      '风险点',
      'README 更新草稿',
      '下一步建议',
    ],
  };

  return {
    success: true,
    data: mockData,
    summary: `任务已识别为「组件增强」，拆解为 4 个子任务，生成 ${mockData.searchKeywords.length} 个检索关键词，锁定 ${mockData.targetModules.length} 个目标模块`,
    warnings: [],
  };
}
