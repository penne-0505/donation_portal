export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(message: string, fields?: Record<string, unknown>): void;
  info(message: string, fields?: Record<string, unknown>): void;
  warn(message: string, fields?: Record<string, unknown>): void;
  error(message: string, fields?: Record<string, unknown>): void;
}

function write(level: LogLevel, scope: string, message: string, fields?: Record<string, unknown>) {
  const payload = {
    level,
    scope,
    message,
    timestamp: new Date().toISOString(),
    ...(fields ?? {}),
  };
  const serialized = JSON.stringify(payload);
  switch (level) {
    case 'debug':
    case 'info':
      console.log(serialized);
      break;
    case 'warn':
      console.warn(serialized);
      break;
    case 'error':
      console.error(serialized);
      break;
    default:
      console.log(serialized);
  }
}

export function createLogger(scope: string, baseFields: Record<string, unknown> = {}): Logger {
  const log = (level: LogLevel) => (message: string, fields?: Record<string, unknown>) =>
    write(level, scope, message, { ...baseFields, ...(fields ?? {}) });

  return {
    debug: log('debug'),
    info: log('info'),
    warn: log('warn'),
    error: log('error'),
  };
}
