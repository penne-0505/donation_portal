#!/usr/bin/env node
const { spawnSync } = require('node:child_process');
const path = require('node:path');

function resolveWranglerBin() {
  const npmRoot = spawnSync('npm', ['root', '-g'], { encoding: 'utf8' });
  if (npmRoot.status !== 0) {
    throw new Error('Failed to resolve npm global root');
  }
  return path.join(npmRoot.stdout.trim(), 'wrangler', 'bin', 'wrangler.js');
}

function run() {
  try {
    const wranglerBin = resolveWranglerBin();
    const result = spawnSync(
      'node',
      [
        wranglerBin,
        'pages',
        'dev',
        './public',
        '--local',
        'true',
        '--port',
        '8788',
        '--kv',
        'DONATION_PORTAL_SESSIONS',
      ],
      {
        stdio: 'inherit',
      },
    );
    process.exit(result.status ?? 1);
  } catch (error) {
    console.warn('[dev] Wrangler が見つかりませんでした。`npm install wrangler` を実行してください。');
    console.warn(`[dev] 詳細: ${error.message}`);
    process.exit(0);
  }
}

run();
