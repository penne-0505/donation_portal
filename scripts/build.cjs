#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

function run(command, args, env = process.env) {
  console.log('[debug][build] spawn start', { command, args, envSnapshot: snapshotEnv(env) });
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env,
  });
  if (result.status !== 0) {
    console.error('[debug][build] spawn failed', {
      command,
      status: result.status,
      signal: result.signal,
      error: result.error?.message,
    });
    process.exit(result.status ?? 1);
  }
  console.log('[debug][build] spawn completed', { command, exitCode: result.status });
}

function snapshotEnv(env) {
  return {
    NODE_ENV: env.NODE_ENV,
    NEXT_ON_PAGES_BUILD: env.NEXT_ON_PAGES_BUILD,
    NEXT_ON_PAGES_COMPATIBILITY_DATE: env.NEXT_ON_PAGES_COMPATIBILITY_DATE,
    NEXT_ON_PAGES_COMPATIBILITY_FLAGS: env.NEXT_ON_PAGES_COMPATIBILITY_FLAGS,
  };
}

console.log('[debug][build] entry', snapshotEnv(process.env));

if (process.env.NEXT_ON_PAGES_BUILD === '1') {
  console.log('[debug][build] NEXT_ON_PAGES_BUILD detected, running next build');
  run('next', ['build']);
  process.exit(0);
}

const env = { ...process.env, NEXT_ON_PAGES_BUILD: '1' };
console.log('[debug][build] invoking run-next-on-pages with env', snapshotEnv(env));
run('node', ['scripts/run-next-on-pages.cjs'], env);
