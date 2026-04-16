import { mockFiles } from '../../mock';

export function FilePanel() {
  return (
    <div className="panel file-panel">
      <div className="panel-header">
        <h2>项目文件</h2>
        <button className="btn btn-primary">上传文件</button>
      </div>
      <div className="panel-content">
        <div className="file-list">
          {mockFiles.map((file) => (
            <div key={file.id} className="file-item">
              <span className="file-name">{file.name}</span>
              <span className={`file-status ${file.parseStatus}`}>{file.parseStatus}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
