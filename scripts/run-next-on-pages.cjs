#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function removePreviousBuild(outputDir) {
  try {
    fs.rmSync(outputDir, { recursive: true, force: true });
  } catch (error) {
    console.warn(`[next-on-pages] 既存のビルド成果物 ${outputDir} の削除に失敗しました: ${error.message}`);
  }
}

function resolveNpxCommand() {
  return process.platform === 'win32' ? 'npx.cmd' : 'npx';
}

function run() {
  const outputDir = path.resolve('.open-next');
  removePreviousBuild(outputDir);

  const env = {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV ?? 'production',
  };

  const result = spawnSync(
    resolveNpxCommand(),
    ['@cloudflare/next-on-pages', '--outdir', outputDir],
    { stdio: 'inherit', env },
  );

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }

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
  const targetFunctionsDir = path.resolve('functions', 'new');
  try {
    if (fs.existsSync(targetFunctionsDir)) {
      fs.rmSync(targetFunctionsDir, { recursive: true, force: true });
    }
    if (fs.existsSync(outputFunctionsDir)) {
      fs.cpSync(outputFunctionsDir, targetFunctionsDir, { recursive: true });
    }
  } catch (error) {
    console.warn(`[next-on-pages] Next.js 関数の同期に失敗しました: ${error.message}`);
  }
}

run();
