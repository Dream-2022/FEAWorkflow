// Mock Reviewer Agent
// 对 Generator 输出的完整性、一致性、遗漏点做最终检查
// 后续替换为真实 Reviewer 时，将内部逻辑替换为 LLM 调用

import { ReviewerOutput } from '../types';
import { AgentResult } from '../types';

interface ReviewerInput {
  generatorOutput: {
    changeSuggestions: string[];
    implementationSteps: string[];
    docDraft: string;
    prDraft: string;
  };
  retrievalOutput: {
    relatedFiles: string[];
    relatedChunks: Array<{ filePath: string; content: string; score: number }>;
  };
}

export function runReviewer(input: ReviewerInput): AgentResult<ReviewerOutput> {
  const mockData: ReviewerOutput = {
    inconsistencies: [
      'Generator 输出中的 README 草稿缺少对 "independent" 策略的向后兼容说明',
    ],
    missingPoints: [
      '建议补充：loading 与 disabled 联动后，对无障碍访问（a11y）的影响评估',
      '建议补充：组件是否需要暴露 onLoadingChange 等状态回调',
    ],
    finalPolishedResult: {
      relatedFiles: input.retrievalOutput.relatedFiles,
      analysis:
        'Switch 组件当前独立处理 loading 和 disabled 两个 props，存在行为不一致风险。新增 LoadingDisabledStrategy 枚举支持两种策略：auto 模式使 loading 时自动禁用（推荐默认），independent 模式保持原有独立控制行为，确保向后兼容。影响范围涉及 4 个文件，依赖已有 Spin 组件和 classnames 库，无新增外部依赖。',
      suggestions: [
        '**建议 1 - 联动逻辑**：在 Switch 组件中，将 disabled 的计算改为 `const isDisabled = disabled || loading`，与 Button 组件保持一致',
        '**建议 2 - 类型扩展**：新增 `LoadingDisabledStrategy` 枚举类型，支持 "auto"（自动联动）、"independent"（独立控制）两种策略，默认采用 "auto"',
        '**建议 3 - 视觉反馈**：当 loading && !disabled 时，可在图标旁增加 tooltip 提示「加载中」',
        '**建议 4 - 向后兼容**：通过 Strategy 类型控制行为，确保存量项目使用 "independent" 策略时行为不变',
        '**建议 5 - 无障碍评估**：评估 loading 状态对屏幕阅读器的影响，考虑增加 aria-busy 属性',
      ],
      risks: [
        '风险 1：联动逻辑可能导致现有依赖 loading 独立显示的业务场景受影响，需评估兼容性',
        '风险 2：修改 disabled 计算逻辑可能影响受控模式（checked 属性）的交互',
        '风险 3：需确保 TypeScript 类型兼容现有使用方式',
        '风险 4：需评估无障碍场景下 loading 状态的信息传递',
      ],
      docDraft:
        input.generatorOutput.docDraft +
        '\n\n---\n\n## 向后兼容\n\n通过 `loadingDisabledStrategy` 属性控制行为，默认 "auto"。存量项目可设置 `loadingDisabledStrategy="independent"` 保持原有行为不变。\n\n## 无障碍说明\n\n当 `loading=true` 时，组件自动添加 `aria-busy="true"` 属性，通知屏幕阅读器当前状态。',
      nextSteps: [
        'Step 1：在 `components/Switch/types.ts` 中新增 `LoadingDisabledStrategy` 枚举，并扩展 `SwitchProps` 接口',
        'Step 2：修改 `components/Switch/index.tsx`，实现基于策略的 disabled 计算逻辑，并添加 aria-busy',
        'Step 3：更新 `components/Switch/README.md`，补充 loading-disabled 联动行为的说明',
        'Step 4：在 `components/Switch/index.test.tsx` 中补充联动场景的单元测试',
        'Step 5：本地验证，切换不同策略验证行为符合预期',
        'Step 6：提交代码并通过 CI 测试',
      ],
    },
  };

  return {
    success: true,
    data: mockData,
    summary: `审核完成：发现 ${mockData.inconsistencies.length} 处不一致、${mockData.missingPoints.length} 项遗漏点，已在最终结果中修正并补充`,
    warnings: [],
  };
}
