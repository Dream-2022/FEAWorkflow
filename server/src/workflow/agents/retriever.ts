// Mock Retriever Agent
// 根据 Planner 输出的关键词检索相关文件与代码片段
// 后续替换为真实检索时，只需将 mockData 替换为 Searcher.search() 的真实调用结果

import { RetrievalOutput } from '../types';
import { AgentResult } from '../types';

interface RetrieverInput {
  taskContent: string;
  searchKeywords: string[];
  targetModules: string[];
}

export function runRetriever(input: RetrieverInput): AgentResult<RetrievalOutput> {
  const mockChunks = [
    {
      filePath: 'components/Switch/index.tsx',
      content:
        'const Switch: React.FC<SwitchProps> = ({\n  loading,\n  disabled,\n  checked,\n  onChange,\n  ...rest\n}) => {\n  // 当前仅处理 disabled，loading 未与 disabled 产生联动\n  return (\n    <button disabled={disabled} onClick={onChange} ...>\n      {loading && <Spin />}\n    </button>\n  );\n};',
      score: 9,
    },
    {
      filePath: 'components/Switch/types.ts',
      content:
        'export interface SwitchProps {\n  loading?: boolean;\n  disabled?: boolean;\n  checked?: boolean;\n  onChange?: (checked: boolean) => void;\n  size?: "small" | "default";\n}',
      score: 8,
    },
    {
      filePath: 'components/Switch/README.md',
      content:
        '## Switch 组件\n\n### Props\n\n| 属性 | 说明 | 类型 | 默认值 |\n|------|------|------|--------|\n| loading | 加载状态 | `boolean` | `false` |\n| disabled | 禁用状态 | `boolean` | `false` |\n\n> 注意：当前版本 loading 与 disabled 相互独立，未做联动处理。',
      score: 7,
    },
    {
      filePath: 'components/Button/index.tsx',
      content:
        'const Button: React.FC<ButtonProps> = ({\n  loading,\n  disabled,\n  children,\n  ...rest\n}) => {\n  // Button 已实现 loading 与 disabled 联动：loading 时自动禁用点击\n  return (\n    <button disabled={disabled || loading} ...>\n      {loading && <Spinner />}\n      {children}\n    </button>\n  );\n};',
      score: 6,
    },
  ];

  const mockData: RetrievalOutput = {
    relatedFiles: input.targetModules,
    relatedChunks: mockChunks,
    retrievalSummary: `基于 ${input.searchKeywords.length} 个关键词，检索到 ${input.targetModules.length} 个相关文件和 ${mockChunks.length} 个代码片段。最高得分 ${mockChunks[0].score} 分（Switch/index.tsx），最低得分 ${mockChunks[mockChunks.length - 1].score} 分。`,
  };

  return {
    success: true,
    data: mockData,
    summary: `检索完成，找到 ${mockData.relatedFiles.length} 个相关文件和 ${mockData.relatedChunks.length} 个相关片段`,
    warnings: mockChunks.length === 0 ? ['上下文不足，请注意分析结果可能存在局限性'] : [],
  };
}
