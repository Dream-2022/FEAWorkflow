// Mock Generator Agent
// 基于 Analyzer 输出生成改动建议、实现步骤、文档草稿与 PR 描述
// 后续替换为真实生成时，将内部逻辑替换为 LLM 调用

import { GeneratorOutput } from '../types';
import { AgentResult } from '../types';

interface GeneratorInput {
  taskContent: string;
  currentImplementation: string;
  impactScope: string[];
  risks: string[];
}

export function runGenerator(input: GeneratorInput): AgentResult<GeneratorOutput> {
  const mockData: GeneratorOutput = {
    changeSuggestions: [
      '**建议 1 - 联动逻辑**：在 Switch 组件中，将 disabled 的计算改为 `const isDisabled = disabled || loading`，与 Button 组件保持一致',
      '**建议 2 - 类型扩展**：新增 `LoadingDisabledStrategy` 枚举类型，支持 "auto"（自动联动）、"independent"（独立控制）两种策略，默认采用 "auto"',
      '**建议 3 - 视觉反馈**：当 loading && !disabled 时，可在图标旁增加 tooltip 提示「加载中」',
      '**建议 4 - 向后兼容**：通过 Strategy 类型控制行为，确保存量项目使用 "independent" 策略时行为不变',
    ],
    implementationSteps: [
      'Step 1：在 `components/Switch/types.ts` 中新增 `LoadingDisabledStrategy` 枚举，并扩展 `SwitchProps` 接口',
      'Step 2：修改 `components/Switch/index.tsx`，实现基于策略的 disabled 计算逻辑',
      'Step 3：更新 `components/Switch/README.md`，补充 loading-disabled 联动行为的说明',
      'Step 4：在 `components/Switch/index.test.tsx` 中补充联动场景的单元测试（loading=true 时禁止点击、loading=false 时恢复正常）',
      'Step 5：本地验证，切换不同策略验证行为符合预期',
    ],
    docDraft: `# Switch 组件 — loading 与 disabled 联动能力

## 背景

本次更新为 Switch 组件新增 \`loading\` 与 \`disabled\` 状态的智能联动能力，使组件行为与 Button 组件保持一致，提升用户体验一致性。

## Props 变更

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| loading | \`boolean\` | \`false\` | 加载状态 |
| disabled | \`boolean\` | \`false\` | 禁用状态 |
| loadingDisabledStrategy | \`LoadingDisabledStrategy\` | \`'auto'\` | 联动策略 |

### LoadingDisabledStrategy 枚举

\`\`\`typescript
export enum LoadingDisabledStrategy {
  /** 加载时自动禁用交互，与 Button 行为一致 */
  Auto = 'auto',
  /** loading 与 disabled 独立控制，互不影响 */
  Independent = 'independent',
}
\`\`\`

## 使用示例

\`\`\`tsx
// 默认行为：loading 时自动禁用
<Switch loading={true} />

// 独立控制
<Switch loading={true} disabled={false} loadingDisabledStrategy="independent" />
\`\`\`
`,
    prDraft: `## PR: 为 Switch 组件新增 loading-disabled 联动能力

### 背景

当前 Switch 组件的 \`loading\` 和 \`disabled\` 属性相互独立，与 Button 组件行为不一致，影响用户体验。

### 改动说明

1. 新增 \`LoadingDisabledStrategy\` 类型，支持 "auto" / "independent" 两种策略
2. 默认采用 "auto" 策略：\`loading=true\` 时自动禁用点击，与 Button 保持一致
3. 向后兼容：存量代码通过 \`loadingDisabledStrategy="independent"\` 可保持原有行为

### 影响范围

- \`components/Switch/index.tsx\`
- \`components/Switch/types.ts\`
- \`components/Switch/README.md\`
- \`components/Switch/index.test.tsx\`

### 测试建议

- [ ] loading=true 时，点击 Switch 不触发 onChange
- [ ] loading=false 时，Switch 行为恢复正常
- [ ] 使用 independent 策略时，loading 与 disabled 互不影响
`,
  };

  return {
    success: true,
    data: mockData,
    summary: `生成完成：${mockData.changeSuggestions.length} 条改动建议、${mockData.implementationSteps.length} 步实施计划、README 草稿与 PR 描述各 1 份`,
    warnings: [],
  };
}
