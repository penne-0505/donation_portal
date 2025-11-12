import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const currentFile = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(currentFile), '..');
const overrides = new Map([
  ['@/lib/ui/hooks/use-session', path.join(projectRoot, 'dist', 'tests', 'mocks', 'ui-hooks.js')],
  ['@/lib/ui/hooks/use-consent', path.join(projectRoot, 'dist', 'tests', 'mocks', 'ui-hooks.js')],
  ['@/lib/ui/hooks/use-checkout', path.join(projectRoot, 'dist', 'tests', 'mocks', 'ui-hooks.js')],
  ['@/lib/ui/hooks/use-donors', path.join(projectRoot, 'dist', 'tests', 'mocks', 'ui-hooks.js')],
  ['@/lib/ui/hooks/use-donation-flow', path.join(projectRoot, 'dist', 'tests', 'mocks', 'ui-hooks.js')],
  ['@/lib/ui/hooks/use-donor-directory', path.join(projectRoot, 'dist', 'tests', 'mocks', 'ui-hooks.js')],
  ['next/link', path.join(projectRoot, 'dist', 'tests', 'mocks', 'next-link.js')],
]);

export async function resolve(specifier, context, defaultResolve) {
  if (overrides.has(specifier)) {
    const overridePath = overrides.get(specifier);
    if (overridePath && fs.existsSync(overridePath)) {
      const url = pathToFileURL(overridePath).href;
      return defaultResolve(url, context, defaultResolve);
    }
  }

  if ((specifier.startsWith('./') || specifier.startsWith('../')) && context.parentURL) {
    const parentPath = fileURLToPath(context.parentURL);
    const parentDir = path.dirname(parentPath);
    const resolvedBase = path.resolve(parentDir, specifier);
    if (!path.extname(resolvedBase)) {
      const relativeCandidates = [
        `${resolvedBase}.js`,
        `${resolvedBase}.ts`,
        path.join(resolvedBase, 'index.js'),
        path.join(resolvedBase, 'index.ts'),
      ];
      for (const candidate of relativeCandidates) {
        if (fs.existsSync(candidate)) {
          const url = pathToFileURL(candidate).href;
          return defaultResolve(url, context, defaultResolve);
        }
      }
    }
  }

  if (specifier.startsWith('@/')) {
    const relative = specifier.slice(2);
    const candidates = [
      path.join(projectRoot, 'dist', `${relative}.js`),
      path.join(projectRoot, 'dist', relative, 'index.js'),
      path.join(projectRoot, `${relative}.ts`),
      path.join(projectRoot, `${relative}.js`),
      path.join(projectRoot, relative, 'index.ts'),
      path.join(projectRoot, relative, 'index.js'),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        const url = pathToFileURL(candidate).href;
        return defaultResolve(url, context, defaultResolve);
      }
    }
  }

  return defaultResolve(specifier, context, defaultResolve);
}
