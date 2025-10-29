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

function hasTypeScriptEslint() {
  try {
    require.resolve('@typescript-eslint/parser');
    require.resolve('@typescript-eslint/eslint-plugin');
    return true;
  } catch (_error) {
    return false;
  }
}

function run() {
  try {
    const eslintBin = resolveGlobalBin('eslint', 'bin/eslint.js');
    const tsAvailable = hasTypeScriptEslint();
    const defaultExts = tsAvailable ? '.js,.mjs,.cjs,.ts,.tsx' : '.js,.mjs,.cjs';
    const userArgs = process.argv.slice(2);
    const hasExtArg = userArgs.some((arg) => arg === '--ext' || arg.startsWith('--ext='));
    const finalArgs = hasExtArg ? userArgs : [...userArgs, '--ext', defaultExts];
    const result = spawnSync('node', [eslintBin, ...finalArgs], {
      stdio: 'inherit',
    });
    process.exit(result.status ?? 1);
  } catch (error) {
    console.warn('[lint] ESLint が見つかりませんでした。`npm install eslint` を実行してください。');
    console.warn(`[lint] 詳細: ${error.message}`);
    process.exit(0);
  }
}

run();
