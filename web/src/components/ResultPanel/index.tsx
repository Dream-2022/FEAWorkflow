import { mockTaskResult } from '../../mock';

export function ResultPanel() {
  return (
    <div className="panel result-panel">
      <div className="panel-header">
        <h2>分析结果</h2>
      </div>
      <div className="panel-content">
        <div className="result-card">
          <h3>涉及文件</h3>
          <ul>
            {mockTaskResult.relatedFiles?.map((file, idx) => (
              <li key={idx}>{file}</li>
            ))}
          </ul>
        </div>

        <div className="result-card">
          <h3>当前实现分析</h3>
          <p>{mockTaskResult.analysis}</p>
        </div>

        <div className="result-card">
          <h3>推荐改动方案</h3>
          <ul>
            {mockTaskResult.suggestions?.map((suggestion, idx) => (
              <li key={idx}>{suggestion}</li>
            ))}
          </ul>
        </div>

        <div className="result-card">
          <h3>风险点</h3>
          <ul>
            {mockTaskResult.risks?.map((risk, idx) => (
              <li key={idx}>{risk}</li>
            ))}
          </ul>
        </div>

        <div className="result-card">
          <h3>文档草稿</h3>
          <pre>{mockTaskResult.docDraft}</pre>
        </div>
      </div>
    </div>
  );
}
