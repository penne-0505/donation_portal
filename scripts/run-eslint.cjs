#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const path = require('node:path');

function resolveLocalBin(packageName, binRelativePath) {
  try {
    const packageJsonPath = require.resolve(`${packageName}/package.json`, {
      paths: [process.cwd()],
    });
    const packageRoot = path.dirname(packageJsonPath);
    return path.join(packageRoot, binRelativePath);
  } catch (_error) {
    return null;
  }
}

function resolveGlobalBin(packageName, binRelativePath) {
  const npmRoot = spawnSync('npm', ['root', '-g'], { encoding: 'utf8' });
  if (npmRoot.status !== 0) {
    throw new Error('Failed to resolve npm global root');
  }
  return path.join(npmRoot.stdout.trim(), packageName, binRelativePath);
}

function resolveBin(packageName, binRelativePath) {
  const localBin = resolveLocalBin(packageName, binRelativePath);
  if (localBin) {
    return localBin;
  }
  return resolveGlobalBin(packageName, binRelativePath);
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
    const eslintBin = resolveBin('eslint', 'bin/eslint.js');
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
    console.error('[lint] ESLint が見つかりませんでした。`npm install eslint` を実行してください。');
    console.error(`[lint] 詳細: ${error.message}`);
    process.exit(1);
  }
}

run();
