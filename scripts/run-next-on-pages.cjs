#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function removePreviousBuild(outputDir) {
  try {
    fs.rmSync(outputDir, { recursive: true, force: true });
  } catch (error) {
    console.warn(
      `[next-on-pages] 既存のビルド成果物 ${outputDir} の削除に失敗しました: ${error.message}`,
    );
  }
}

function resolveNpxCommand() {
  return process.platform === 'win32' ? 'npx.cmd' : 'npx';
}

function run() {
  const outputDir = path.resolve('.open-next');
  removePreviousBuild(outputDir);

  const defaultCompatibilityDate = '2025-10-30';
  const defaultCompatibilityFlags = 'nodejs_compat';

  const env = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV ?? 'production',
    NEXT_ON_PAGES_BUILD: process.env.NEXT_ON_PAGES_BUILD ?? '1',
    NEXT_ON_PAGES_COMPATIBILITY_DATE:
      process.env.NEXT_ON_PAGES_COMPATIBILITY_DATE ?? defaultCompatibilityDate,
    NEXT_ON_PAGES_COMPATIBILITY_FLAGS:
      process.env.NEXT_ON_PAGES_COMPATIBILITY_FLAGS ?? defaultCompatibilityFlags,
  };

  console.log('[debug][run-next-on-pages] build params', {
    outputDir,
    nodeEnv: env.NODE_ENV,
    nextOnPagesBuild: env.NEXT_ON_PAGES_BUILD,
    compatibilityDate: env.NEXT_ON_PAGES_COMPATIBILITY_DATE,
    compatibilityFlags: env.NEXT_ON_PAGES_COMPATIBILITY_FLAGS,
  });

  const result = spawnSync(
    resolveNpxCommand(),
    ['@cloudflare/next-on-pages', '--outdir', outputDir],
    { stdio: 'inherit', env },
  );

  if (result.status !== 0) {
    console.error('[debug][run-next-on-pages] build failed', {
      status: result.status,
      signal: result.signal,
      error: result.error?.message,
    });
    process.exit(result.status ?? 1);
  }

  console.log('[debug][run-next-on-pages] build succeeded');

  const staticDir = path.join(outputDir, 'static');
  try {
    if (fs.existsSync('public')) {
      fs.mkdirSync(staticDir, { recursive: true });
      fs.cpSync('public', staticDir, { recursive: true });
    }
  } catch (error) {
    console.warn(`[next-on-pages] public ディレクトリのコピーに失敗しました: ${error.message}`);
  }

  const outputFunctionsDir = path.join(outputDir, 'functions');
  const sourceFunctionsDir = path.resolve('functions');
  try {
    if (fs.existsSync(sourceFunctionsDir)) {
      fs.rmSync(outputFunctionsDir, { recursive: true, force: true });
      fs.mkdirSync(outputFunctionsDir, { recursive: true });
      fs.cpSync(sourceFunctionsDir, outputFunctionsDir, { recursive: true });
    }
  } catch (error) {
    console.warn(`[next-on-pages] 既存 Functions のコピーに失敗しました: ${error.message}`);
  }

  const routesPath = path.join(outputDir, '_routes.json');
  try {
    const raw = fs.readFileSync(routesPath, 'utf8');
    const routes = JSON.parse(raw);
    const additionalExcludes = ['/api/*', '/oauth/*', '/health'];
    const excludeSet = new Set([...(routes.exclude ?? []), ...additionalExcludes]);
    routes.exclude = Array.from(excludeSet);
    fs.writeFileSync(routesPath, JSON.stringify(routes));
  } catch (error) {
    console.warn(`[next-on-pages] _routes.json の更新に失敗しました: ${error.message}`);
  }

  const metadataPath = path.join(outputDir, '_worker.js', 'metadata.json');
  const flags = (env.NEXT_ON_PAGES_COMPATIBILITY_FLAGS || defaultCompatibilityFlags)
    .split(',')
    .map((flag) => flag.trim())
    .filter(Boolean);

  const metadata = {
    compatibility_date:
      env.NEXT_ON_PAGES_COMPATIBILITY_DATE || defaultCompatibilityDate,
    ...(flags.length > 0 ? { compatibility_flags: flags } : {}),
  };

  try {
    fs.mkdirSync(path.dirname(metadataPath), { recursive: true });
    fs.writeFileSync(metadataPath, `${JSON.stringify(metadata)}\n`);
    console.log('[debug][run-next-on-pages] metadata.json written', {
      metadataPath,
      metadata,
    });
  } catch (error) {
    console.warn(
      `[next-on-pages] _worker.js/metadata.json の生成に失敗しました: ${error.message}`,
    );
  }
}

run();
