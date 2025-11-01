#!/usr/bin/env node
const { spawnSync } = require('node:child_process');

function run(command, args, env = process.env) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (process.env.NEXT_ON_PAGES_BUILD === '1') {
  run('next', ['build']);
  process.exit(0);
}

const env = { ...process.env, NEXT_ON_PAGES_BUILD: '1' };
run('node', ['scripts/run-next-on-pages.cjs'], env);
