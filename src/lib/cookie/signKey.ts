export interface CookieKeySource {
  readonly COOKIE_SIGN_KEY?: string;
}

function readFromSource(source: CookieKeySource | undefined): string | undefined {
  if (typeof source === 'undefined') {
    return undefined;
  }

  const value = source.COOKIE_SIGN_KEY;
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

export function getCookieSignKey(source?: CookieKeySource): string {
  const fromSource = readFromSource(source);
  if (fromSource) {
    return fromSource;
  }

  const fromProcess = readFromSource(process.env);
  if (fromProcess) {
    return fromProcess;
  }

  throw new Error('COOKIE_SIGN_KEY is not configured. Set it in your environment variables.');
}
