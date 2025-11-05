#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const path = require('node:path');

function resolveLocalBin(packageName, binName) {
  try {
    const packageJsonPath = require.resolve(`${packageName}/package.json`, {
      paths: [process.cwd()],
    });
    const packageRoot = path.dirname(packageJsonPath);
    return path.join(packageRoot, 'bin', binName);
  } catch (_error) {
    return null;
  }
}

function resolveGlobalBin(packageName, binName) {
  const npmRoot = spawnSync('npm', ['root', '-g'], { encoding: 'utf8' });
  if (npmRoot.status !== 0) {
    throw new Error('Failed to resolve npm global root');
  }
  return path.join(npmRoot.stdout.trim(), packageName, 'bin', binName);
}

function resolveBin(packageName, binName) {
  const localBin = resolveLocalBin(packageName, binName);
  if (localBin) {
    return localBin;
  }
  return resolveGlobalBin(packageName, binName);
}

function run() {
  try {
    const tscBin = resolveBin('typescript', 'tsc');
    // Windows でも実行可能なように node 経由で実行
    const result = spawnSync('node', [tscBin, ...process.argv.slice(2)], {
      stdio: 'inherit',
    });
    process.exit(result.status ?? 1);
  } catch (error) {
    console.warn('[typecheck] TypeScript が見つかりませんでした。`npm install typescript` を実行してください。');
    console.warn(`[typecheck] 詳細: ${error.message}`);
    process.exit(1);
  }
}

run();
