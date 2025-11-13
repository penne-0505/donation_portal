#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    ...options,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function removeDist() {
  const distPath = path.resolve('dist');

  try {
    fs.rmSync(distPath, { recursive: true, force: true });
  } catch (error) {
    console.warn(`[test] Failed to remove dist directory: ${error.message}`);
  }
}

function buildTypescriptProject() {
  run(process.execPath, ['scripts/run-tsc.cjs', '--project', 'tsconfig.json']);
}

function runNodeTests({ coverage = false } = {}) {
  const loaderPath = path.resolve('scripts/alias-loader.mjs');
  const setupModule = path.resolve('dist/tests/setup/test-environment.js');
  const testPattern = 'dist/tests/**/*.test.js';

  const args = [
    '--experimental-global-webcrypto',
    '--loader',
    loaderPath,
    '--import',
    setupModule,
    '--test',
  ];

  if (coverage) {
    args.push('--experimental-test-coverage');
  }

  args.push(testPattern);

  run(process.execPath, args);
}

function main() {
  const coverage = process.argv.includes('--coverage');

  removeDist();
  buildTypescriptProject();
  runNodeTests({ coverage });
}

main();
