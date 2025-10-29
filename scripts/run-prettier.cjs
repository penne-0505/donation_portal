#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const path = require('node:path');

function resolveGlobalBin(packageName, binRelativePath) {
  const npmRoot = spawnSync('npm', ['root', '-g'], { encoding: 'utf8' });
  if (npmRoot.status !== 0) {
    throw new Error('Failed to resolve npm global root');
  }
  return path.join(npmRoot.stdout.trim(), packageName, binRelativePath);
}

function run() {
  try {
    const prettierBin = resolveGlobalBin('prettier', 'bin/prettier.cjs');
    const result = spawnSync('node', [prettierBin, ...process.argv.slice(2)], {
      stdio: 'inherit',
    });
    process.exit(result.status ?? 1);
  } catch (error) {
    console.warn('[format] Prettier が見つかりませんでした。`npm install prettier` を実行してください。');
    console.warn(`[format] 詳細: ${error.message}`);
    process.exit(0);
  }
}

run();
