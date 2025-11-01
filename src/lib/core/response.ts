import { HttpError, type ErrorCode, isHttpError } from './errors.js';

const DEFAULT_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
} as const;

export interface ErrorBody {
  readonly error: {
    readonly code: ErrorCode;
    readonly message: string;
  };
}

export function jsonResponse<T>(body: T, status = 200, init?: ResponseInit): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { ...DEFAULT_HEADERS, ...(init?.headers ?? {}) },
  });
}

export function noContent(init?: ResponseInit): Response {
  return new Response(null, {
    status: 204,
    headers: { 'cache-control': 'no-store', ...(init?.headers ?? {}) },
  });
}

export function errorResponse(status: number, code: ErrorCode, message: string): Response {
  const body: ErrorBody = {
    error: {
      code,
      message,
    },
  };
  return jsonResponse(body, status);
}

export function toErrorResponse(
  error: unknown,
  fallbackMessage = 'internal error occurred',
): Response {
  if (isHttpError(error)) {
    return errorResponse(error.status, error.code, error.message);
  }
  if (error instanceof Error) {
    return errorResponse(500, 'internal', fallbackMessage);
  }
  return errorResponse(500, 'internal', fallbackMessage);
}

export function httpError(
  status: number,
  code: ErrorCode,
  message: string,
  options: { cause?: unknown; details?: Record<string, unknown> } = {},
): HttpError {
  return new HttpError(status, code, message, options);
}
