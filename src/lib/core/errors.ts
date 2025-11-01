export type ErrorCode =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'conflict'
  | 'unprocessable_entity'
  | 'too_many_requests'
  | 'internal';

export class HttpError extends Error {
  public readonly status: number;
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    options: { cause?: unknown; details?: Record<string, unknown> } = {},
  ) {
    super(message, options);
    this.status = status;
    this.code = code;
    this.details = options.details;
    this.name = 'HttpError';
  }
}

export function isHttpError(error: unknown): error is HttpError {
  return error instanceof HttpError;
}
