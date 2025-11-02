#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const path = require('node:path');

function resolveLocalWranglerBin() {
  try {
    const packageJsonPath = require.resolve('wrangler/package.json', {
      paths: [process.cwd()],
    });
    const packageRoot = path.dirname(packageJsonPath);
    return path.join(packageRoot, 'bin', 'wrangler.js');
  } catch (_error) {
    return null;
  }
}

function resolveGlobalWranglerBin() {
  const npmRoot = spawnSync('npm', ['root', '-g'], { encoding: 'utf8' });
  if (npmRoot.status !== 0) {
    throw new Error('Failed to resolve npm global root');
  }
  return path.join(npmRoot.stdout.trim(), 'wrangler', 'bin', 'wrangler.js');
}

function resolveWranglerBin() {
  const local = resolveLocalWranglerBin();
  if (local) {
    console.log('[debug][wrangler-build] resolved local wrangler', { local });
    return local;
  }
  console.log('[debug][wrangler-build] resolving global wrangler');
  return resolveGlobalWranglerBin();
}

function run() {
  try {
    const wranglerBin = resolveWranglerBin();
    console.log('[debug][wrangler-build] executing wrangler pages functions build', {
      wranglerBin,
    });
    const result = spawnSync('node', [wranglerBin, 'pages', 'functions', 'build', './functions'], {
      stdio: 'inherit',
    });
    console.log('[debug][wrangler-build] wrangler exited', {
      status: result.status,
      signal: result.signal,
      error: result.error?.message,
    });
    process.exit(result.status ?? 1);
  } catch (error) {
    console.warn('[build] Wrangler が見つかりませんでした。`npm install wrangler` を実行してください。');
    console.warn(`[build] 詳細: ${error.message}`);
    process.exit(0);
  }
}

run();
