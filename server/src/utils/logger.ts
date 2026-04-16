const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

type LogLevel = keyof typeof LOG_LEVELS;

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = 'INFO') {
    this.level = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.level];
  }

  private format(level: LogLevel, ...args: any[]): string {
    const timestamp = new Date().toISOString();
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg) : arg
    ).join(' ');
    return `[${timestamp}] [${level}] ${message}`;
  }

  debug(...args: any[]): void {
    if (this.shouldLog('DEBUG')) {
      console.log(this.format('DEBUG', ...args));
    }
  }

  info(...args: any[]): void {
    if (this.shouldLog('INFO')) {
      console.log(this.format('INFO', ...args));
    }
  }

  warn(...args: any[]): void {
    if (this.shouldLog('WARN')) {
      console.warn(this.format('WARN', ...args));
    }
  }

  error(...args: any[]): void {
    if (this.shouldLog('ERROR')) {
      console.error(this.format('ERROR', ...args));
    }
  }
}

export const logger = new Logger(process.env.LOG_LEVEL as LogLevel || 'INFO');
