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

  // Build Pages Functions using wrangler instead of copying raw TypeScript files
  const sourceFunctionsDir = path.resolve('functions');
  const outputFunctionsDir = path.join(outputDir, 'functions');

  if (fs.existsSync(sourceFunctionsDir)) {
    console.log('[next-on-pages] Building Pages Functions with wrangler...');

    // Create a temporary directory for the build output
    const tempBuildDir = path.join(outputDir, '_functions-build');
    fs.mkdirSync(tempBuildDir, { recursive: true });

    // Run wrangler pages functions build with --outdir to get compiled JS
    const wranglerResult = spawnSync(
      resolveNpxCommand(),
      ['wrangler', 'pages', 'functions', 'build', './functions', '--outdir', tempBuildDir],
      { stdio: 'inherit' },
    );

    if (wranglerResult.status !== 0) {
      console.error('[next-on-pages] Wrangler Pages Functions build failed');
      process.exit(wranglerResult.status ?? 1);
    }

    // Copy the compiled worker to .open-next/functions/
    const compiledWorker = path.join(tempBuildDir, 'index.js');

    if (fs.existsSync(compiledWorker)) {
      fs.mkdirSync(outputFunctionsDir, { recursive: true });

      // Copy the compiled worker as _worker.js in the functions directory
      // Cloudflare Pages will use this as the functions worker
      fs.copyFileSync(compiledWorker, path.join(outputFunctionsDir, '_worker.js'));
      console.log('[next-on-pages] Copied compiled worker to .open-next/functions/_worker.js');
    } else {
      console.warn('[next-on-pages] Compiled worker not found');
    }

    // Clean up temp directory
    try {
      fs.rmSync(tempBuildDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`[next-on-pages] Failed to clean up temporary directory: ${error.message}`);
    }
  } else {
    console.warn('[next-on-pages] functions/ directory not found');
  }

  // Ensure _routes.json excludes API/OAuth routes from the Next.js worker so that
  // Cloudflare Pages Functions can handle them. Next on Pages emits `include: ["/*"]`
  // by default, which causes API リクエストが Next.js ワーカーへ誤ってルーティングされる。
  const routesPath = path.join(outputDir, '_routes.json');

  try {
    if (fs.existsSync(routesPath)) {
      const routes = JSON.parse(fs.readFileSync(routesPath, 'utf8'));
      const requiredExcludes = ['/api/*', '/oauth/*'];
      const existingExclude = Array.isArray(routes.exclude) ? routes.exclude : [];
      const missingPatterns = requiredExcludes.filter(
        (pattern) => !existingExclude.includes(pattern),
      );

      if (missingPatterns.length > 0) {
        routes.exclude = [...existingExclude, ...missingPatterns];
        fs.writeFileSync(routesPath, `${JSON.stringify(routes, null, 2)}\n`);
        console.log('[next-on-pages] _routes.json updated with API excludes', {
          routesPath,
          added: missingPatterns,
        });
      } else if (!Array.isArray(routes.exclude)) {
        // 既存の exclude が配列でなかった場合は、デフォルト値として再設定する。
        routes.exclude = existingExclude;
        fs.writeFileSync(routesPath, `${JSON.stringify(routes, null, 2)}\n`);
      }
    } else {
      console.warn(`[next-on-pages] _routes.json が見つかりません: ${routesPath}`);
    }
  } catch (error) {
    console.warn(`[next-on-pages] _routes.json の補正に失敗しました: ${error.message}`);
  }

  const metadataPath = path.join(outputDir, '_worker.js', 'metadata.json');
  const flags = (env.NEXT_ON_PAGES_COMPATIBILITY_FLAGS || defaultCompatibilityFlags)
    .split(',')
    .map((flag) => flag.trim())
    .filter(Boolean);

  const metadata = {
    compatibility_date: env.NEXT_ON_PAGES_COMPATIBILITY_DATE || defaultCompatibilityDate,
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
    console.warn(`[next-on-pages] _worker.js/metadata.json の生成に失敗しました: ${error.message}`);
  }
}

run();
