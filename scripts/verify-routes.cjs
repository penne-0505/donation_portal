#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const REQUIRED_EXCLUDE_PATTERNS = ['/api/*', '/oauth/*'];

function fail(reason, extra = {}) {
  console.error('[verify-routes] ❌ 検証に失敗しました', { reason, ...extra });
  process.exitCode = 1;
}

function main() {
  const outputDir = path.resolve('.open-next');
  const routesPath = path.join(outputDir, '_routes.json');
  const functionsWorkerPath = path.join(outputDir, 'functions', '_worker.js');

  console.log('[verify-routes] チェック開始', { outputDir });

  if (!fs.existsSync(outputDir)) {
    fail('.open-next ディレクトリが存在しません。`npm run build` または `npm run ui:build` の実行結果を確認してください。');
    return;
  }

  let routes;
  try {
    const raw = fs.readFileSync(routesPath, 'utf8');
    routes = JSON.parse(raw);
  } catch (error) {
    fail('_routes.json の読み込みに失敗しました', { routesPath, error: error.message });
    return;
  }

  const exclude = Array.isArray(routes.exclude)
    ? routes.exclude.filter((value) => typeof value === 'string')
    : [];

  const missingPatterns = REQUIRED_EXCLUDE_PATTERNS.filter((pattern) => !exclude.includes(pattern));

  if (missingPatterns.length > 0) {
    fail('_routes.json の exclude に必須パターンが不足しています', {
      routesPath,
      missingPatterns,
      currentExclude: exclude,
      hint: 'scripts/run-next-on-pages.cjs の補正処理が実行されているか確認してください。',
    });
  }

  if (!fs.existsSync(functionsWorkerPath)) {
    fail('Pages Functions のビルド成果物が見つかりません', {
      functionsWorkerPath,
      hint: 'wrangler build が成功しているか確認してください。',
    });
  }

  if (process.exitCode && process.exitCode !== 0) {
    console.error('[verify-routes] チェック失敗です。上記の項目を解消してください。');
    return;
  }

  console.log('[verify-routes] ✅ すべての必須項目を確認しました', {
    routesPath,
    exclude,
    functionsWorkerPath,
    required: REQUIRED_EXCLUDE_PATTERNS,
  });
}

main();
