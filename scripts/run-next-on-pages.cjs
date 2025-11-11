#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROUTE_EXCLUDE_PATTERNS = ['/_next/static/*'];

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

function ensureRoutesManifest(routesPath, requiredExcludes, { label } = {}) {
  const manifestLabel = label ?? routesPath;

  try {
    if (!fs.existsSync(routesPath)) {
      console.warn(`[next-on-pages] ${manifestLabel} が見つかりません: ${routesPath}`);
      return;
    }

    const routes = JSON.parse(fs.readFileSync(routesPath, 'utf8'));
    let updated = false;

    if (routes.exclude === undefined) {
      routes.exclude = [];
      updated = true;
    } else if (!Array.isArray(routes.exclude)) {
      routes.exclude = [routes.exclude].filter(
        (pattern) => typeof pattern === 'string' && pattern.length > 0,
      );
      updated = true;
    }

    const existingExcludes = new Set(
      Array.isArray(routes.exclude)
        ? routes.exclude.filter((pattern) => typeof pattern === 'string')
        : [],
    );

    for (const pattern of requiredExcludes) {
      if (!existingExcludes.has(pattern)) {
        routes.exclude.push(pattern);
        existingExcludes.add(pattern);
        updated = true;
      }
    }

    if (updated) {
      fs.writeFileSync(routesPath, `${JSON.stringify(routes, null, 2)}\n`);
      console.log(`[next-on-pages] ${manifestLabel} exclude を更新しました`, {
        routesPath,
        exclude: routes.exclude,
      });
    }
  } catch (error) {
    console.warn(`[next-on-pages] ${manifestLabel} の補正に失敗しました: ${error.message}`);
  }
}

function removeExcludedPatterns(routesPath, forbiddenPatterns, { label } = {}) {
  const manifestLabel = label ?? routesPath;

  try {
    if (!fs.existsSync(routesPath)) {
      console.warn(`[next-on-pages] ${manifestLabel} が見つかりません: ${routesPath}`);
      return;
    }

    const routes = JSON.parse(fs.readFileSync(routesPath, 'utf8'));

    if (!Array.isArray(routes.exclude) || routes.exclude.length === 0) {
      return;
    }

    const excludeSet = new Set(forbiddenPatterns);
    const filteredExclude = routes.exclude.filter(
      (pattern) => typeof pattern === 'string' && !excludeSet.has(pattern),
    );

    if (filteredExclude.length !== routes.exclude.length) {
      routes.exclude = filteredExclude;
      fs.writeFileSync(routesPath, `${JSON.stringify(routes, null, 2)}\n`);
      console.log(`[next-on-pages] ${manifestLabel} exclude から禁止パターンを除去しました`, {
        routesPath,
        removed: forbiddenPatterns,
      });
    }
  } catch (error) {
    console.warn(`[next-on-pages] ${manifestLabel} の補正（禁止パターン除去）に失敗しました: ${error.message}`);
  }
}

function removeAdvancedModeWorker(outputDir) {
  const workerDir = path.join(outputDir, '_worker.js');

  if (!fs.existsSync(workerDir)) {
    console.log('[next-on-pages] Advanced mode worker not found, skipping removal', {
      workerDir,
    });
    return;
  }

  try {
    fs.rmSync(workerDir, { recursive: true, force: true });
    console.log('[next-on-pages] Removed _worker.js to disable Advanced mode', { workerDir });
  } catch (error) {
    console.warn('[next-on-pages] Failed to remove _worker.js directory', {
      workerDir,
      error: error.message,
    });
  }
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
    const tempRoutesPath = path.join(tempBuildDir, '_routes.json');
    fs.mkdirSync(tempBuildDir, { recursive: true });

    // Run wrangler pages functions build with --outdir to get compiled JS
    const wranglerResult = spawnSync(
      resolveNpxCommand(),
      [
        'wrangler',
        'pages',
        'functions',
        'build',
        './functions',
        '--outdir',
        tempBuildDir,
        '--output-routes-path',
        tempRoutesPath,
      ],
      { stdio: 'inherit' },
    );

    if (wranglerResult.status !== 0) {
      console.error('[next-on-pages] Wrangler Pages Functions build failed');
      process.exit(wranglerResult.status ?? 1);
    }

    // Copy the compiled worker to .open-next/functions/
    const compiledWorker = path.join(tempBuildDir, 'index.js');
    const compiledRoutes = tempRoutesPath;
    const copiedArtifacts = [];
    const missingArtifacts = [];

    fs.mkdirSync(outputFunctionsDir, { recursive: true });

    if (fs.existsSync(compiledWorker)) {
      const destination = path.join(outputFunctionsDir, '_worker.js');
      fs.copyFileSync(compiledWorker, destination);
      copiedArtifacts.push(destination);
      console.log('[next-on-pages] Copied compiled worker to .open-next/functions/_worker.js');
    } else {
      missingArtifacts.push({ type: 'worker', path: compiledWorker, stage: 'wrangler-output' });
      console.warn('[next-on-pages] Compiled worker not found');
    }

    if (fs.existsSync(compiledRoutes)) {
      const destination = path.join(outputFunctionsDir, '_routes.json');
      fs.copyFileSync(compiledRoutes, destination);
      copiedArtifacts.push(destination);
      console.log('[next-on-pages] Copied routes manifest to .open-next/functions/_routes.json');
    } else {
      missingArtifacts.push({ type: 'routes', path: compiledRoutes, stage: 'wrangler-output' });
      console.warn('[next-on-pages] Routes manifest not found in wrangler build output');
    }

    const requiredOutputs = [
      { type: 'worker', path: path.join(outputFunctionsDir, '_worker.js'), stage: 'functions-artifact' },
      { type: 'routes', path: path.join(outputFunctionsDir, '_routes.json'), stage: 'functions-artifact' },
    ];

    for (const artifact of requiredOutputs) {
      if (!fs.existsSync(artifact.path)) {
        missingArtifacts.push(artifact);
      }
    }

    // Clean up temp directory
    try {
      fs.rmSync(tempBuildDir, { recursive: true, force: true });
    } catch (error) {
      console.warn(`[next-on-pages] Failed to clean up temporary directory: ${error.message}`);
    }

    if (missingArtifacts.length > 0) {
      console.error('[next-on-pages] Pages Functions build artifacts are incomplete', {
        missingArtifacts,
        hint: 'wrangler pages functions build should output index.js and _routes.json',
      });
      process.exit(1);
    }

    removeExcludedPatterns(path.join(outputFunctionsDir, '_routes.json'), ['/api/*', '/oauth/*'], {
      label: 'functions/_routes.json',
    });

    console.log('[next-on-pages] Pages Functions artifacts prepared', {
      artifacts: copiedArtifacts,
    });
  } else {
    console.warn('[next-on-pages] functions/ directory not found');
  }

  removeAdvancedModeWorker(outputDir);

  const routesPath = path.join(outputDir, '_routes.json');
  removeExcludedPatterns(routesPath, ['/api/*', '/oauth/*'], { label: '_routes.json' });
  ensureRoutesManifest(routesPath, ROUTE_EXCLUDE_PATTERNS, { label: '_routes.json' });
}

run();
