declare namespace NodeJS {
  interface ProcessEnv {
    readonly npm_package_version?: string;
  }
}

declare const process: {
  env: NodeJS.ProcessEnv;
};

declare module 'node:test' {
  export type TestFn = (...args: unknown[]) => unknown;
  export function describe(name: string, fn: TestFn): void;
  export function it(name: string, fn: TestFn): void;
}

declare module 'node:assert/strict' {
  export function equal(actual: unknown, expected: unknown, message?: string): void;
  export function match(value: string, pattern: RegExp, message?: string): void;
  export function ok(value: unknown, message?: string): void;
  const assert: {
    equal: typeof equal;
    match: typeof match;
    ok: typeof ok;
  };
  export default assert;
}
