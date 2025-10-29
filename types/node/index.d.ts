declare namespace NodeJS {
  interface ProcessEnv {
    readonly npm_package_version?: string;
    readonly COOKIE_SIGN_KEY?: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};

declare module 'node:test' {
  export type TestFn = (...args: unknown[]) => unknown;
  export function describe(name: string, fn: TestFn): void;
  export function it(name: string, fn: TestFn): void;
  export function beforeEach(fn: TestFn): void;
  export function after(fn: TestFn): void;
}

declare module 'node:assert/strict' {
  export function equal(actual: unknown, expected: unknown, message?: string): void;
  export function match(value: string, pattern: RegExp, message?: string): void;
  export function ok(value: unknown, message?: string): void;
  export function rejects(
    fn: () => unknown | Promise<unknown>,
    expected?: unknown,
    message?: string,
  ): Promise<void>;
  const assert: {
    equal: typeof equal;
    match: typeof match;
    ok: typeof ok;
    rejects: typeof rejects;
  };
  export default assert;
}

declare const Buffer: {
  from(data: string, encoding: 'binary' | 'base64'): {
    toString(encoding: 'base64' | 'binary'): string;
  };
};
