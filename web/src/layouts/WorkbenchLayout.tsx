import { Header } from '../components/Header';
import { FilePanel } from '../components/FilePanel';
import { TaskPanel } from '../components/TaskPanel';
import { ResultPanel } from '../components/ResultPanel';

export function WorkbenchLayout() {
  return (
    <div className="workbench-layout">
      <Header />
      <div className="workbench-main">
        <div className="panel-column left-column">
          <FilePanel />
        </div>
        <div className="panel-column middle-column">
          <TaskPanel />
        </div>
        <div className="panel-column right-column">
          <ResultPanel />
        </div>
      </div>
    </div>
  );
}
