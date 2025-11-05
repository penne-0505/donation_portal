#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
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
    return local;
  }
  return resolveGlobalWranglerBin();
}

function run() {
  try {
    const wranglerBin = resolveWranglerBin();
    const defaultStaticDir = './public';
    const buildOutputDir = '.open-next';
    const buildHasPrerender = ensureBuildArtifacts(buildOutputDir);
    const builtStaticDir = buildHasPrerender ? buildOutputDir : defaultStaticDir;
    const result = spawnSync(
      'node',
      [wranglerBin, 'pages', 'dev', builtStaticDir, '--local', 'true', '--port', '8788'],
      {
        stdio: 'inherit',
      },
    );
    // SIGINT/SIGTERM による正常な終了は成功扱いにする
    if (result.signal === 'SIGINT' || result.signal === 'SIGTERM') {
      process.exit(0);
    }
    process.exit(result.status ?? 1);
  } catch (error) {
    console.warn(
      '[dev] Wrangler が見つかりませんでした。`npm install wrangler` を実行してください。',
    );
    console.warn(`[dev] 詳細: ${error.message}`);
    process.exit(1);
  }
}

function ensureBuildArtifacts(buildOutputDir) {
  const indexHtmlPath = path.join(buildOutputDir, 'index.html');
  if (fs.existsSync(indexHtmlPath)) {
    return true;
  }

  console.log('[dev] .open-next が存在しないため `npm run ui:build` を実行します');
  const buildResult = spawnSync('npm', ['run', 'ui:build'], {
    stdio: 'inherit',
    env: { ...process.env, NEXT_ON_PAGES_BUILD: '1' },
  });

  if (buildResult.status !== 0) {
    console.error('[dev] `npm run ui:build` が失敗しました');
    process.exit(buildResult.status ?? 1);
  }

  if (!fs.existsSync(indexHtmlPath)) {
    console.warn('[dev] `npm run ui:build` 実行後も .open-next/index.html が見つかりません');
    return false;
  }

  console.log('[dev] .open-next を再生成しました');
  return true;
}

run();
