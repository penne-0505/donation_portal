declare namespace NodeJS {
  interface ProcessEnv {
    readonly npm_package_version?: string;
    readonly COOKIE_SIGN_KEY?: string;
  }
}

interface ProcessLike {
  env: NodeJS.ProcessEnv;
  cwd(): string;
}

declare const process: ProcessLike;

declare module 'node:test' {
  export type TestFn = (...args: unknown[]) => unknown;
  export interface MockCall {
    readonly arguments: unknown[];
  }
  export interface MockControl {
    callCount(): number;
    readonly calls: readonly MockCall[];
  }
  export interface MockMethod<TArgs extends unknown[] = unknown[], TResult = unknown> {
    (...args: TArgs): TResult;
    readonly mock: MockControl;
  }
  export interface MockModule {
    method<T extends object, K extends keyof T>(
      object: T,
      method: K,
      implementation: (...args: unknown[]) => unknown,
    ): MockMethod;
    restoreAll(): void;
  }
  export const mock: MockModule;
  export function test(name: string, fn: TestFn): void;
  export function describe(name: string, fn: TestFn): void;
  export function it(name: string, fn: TestFn): void;
  export function beforeEach(fn: TestFn): void;
  export function after(fn: TestFn): void;
  export function afterEach(fn: TestFn): void;
}

declare module 'node:assert/strict' {
  export function equal(actual: unknown, expected: unknown, message?: string): void;
  export function match(value: string, pattern: RegExp, message?: string): void;
  export function ok(value: unknown, message?: string): void;
  export function deepEqual(actual: unknown, expected: unknown, message?: string): void;
  export function rejects(
    fn: () => unknown | Promise<unknown>,
    expected?: unknown,
    message?: string,
  ): Promise<void>;
  const assert: {
    equal: typeof equal;
    match: typeof match;
    ok: typeof ok;
    deepEqual: typeof deepEqual;
    rejects: typeof rejects;
  };
  export default assert;
}

interface BufferLike {
  toString(encoding: 'base64' | 'binary' | 'utf8'): string;
}

interface BufferConstructorLike {
  from(data: string, encoding?: 'utf8' | 'binary' | 'base64'): BufferLike;
}

declare const Buffer: BufferConstructorLike;

declare module 'node:fs/promises' {
  export function readFile(path: string | URL, encoding: 'utf8'): Promise<string>;
}
