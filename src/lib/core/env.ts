export type EnvSource = unknown;

function readRawValue(source: EnvSource, key: string): string | undefined {
  if (!source || typeof source !== 'object') {
    return undefined;
  }

  const value = (source as Record<string, unknown>)[key];
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

export function readEnv(key: string, ...sources: EnvSource[]): string | undefined {
  for (const source of sources) {
    const value = readRawValue(source, key);
    if (typeof value === 'string') {
      return value;
    }
  }
  return undefined;
}

export function requireEnv(key: string, ...sources: EnvSource[]): string {
  const value = readEnv(key, ...sources);
  if (!value) {
    throw new Error(`${key} is not configured`);
  }
  return value;
}
