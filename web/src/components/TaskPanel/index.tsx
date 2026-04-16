import { useState } from 'react';
import { mockTask, mockWorkflowNodes } from '../../mock';

export function TaskPanel() {
  const [taskInput, setTaskInput] = useState('');

  return (
    <div className="panel task-panel">
      <div className="panel-header">
        <h2>任务执行</h2>
      </div>
      <div className="panel-content">
        <div className="task-input-section">
          <textarea
            className="task-input"
            placeholder="输入你的工程任务..."
            value={taskInput}
            onChange={(e) => setTaskInput(e.target.value)}
          />
          <button className="btn btn-primary btn-large">开始分析</button>
        </div>

        <div className="workflow-section">
          <h3>工作流节点</h3>
          <div className="workflow-nodes">
            {mockWorkflowNodes.map((node) => (
              <div key={node.id} className={`workflow-node ${node.status}`}>
                <span className="node-name">{node.nodeName}</span>
                <span className="node-status">{node.status}</span>
                {node.durationMs && (
                  <span className="node-duration">{node.durationMs}ms</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="current-task-section">
          <h3>当前任务</h3>
          <div className="task-info">
            <p>{mockTask.content}</p>
            <span className={`task-status ${mockTask.status}`}>{mockTask.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
