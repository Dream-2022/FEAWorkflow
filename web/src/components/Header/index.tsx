import { env } from '../../config/env';

export function Header() {
  return (
    <header className="header">
      <div className="header-content">
        <h1 className="header-title">{env.VITE_APP_NAME}</h1>
        <div className="header-status">
          <span className="status-dot"></span>
          <span>Ready</span>
        </div>
      </div>
    </header>
  );
}
