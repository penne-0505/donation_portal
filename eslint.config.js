const configs = [
  {
    ignores: ['dist/**', '.next/**', '.open-next/**', '.vercel/**', '_temp/**'],
  },
  {
    files: ['**/*.js', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': [
        'error',
        {
          args: 'none',
          ignoreRestSiblings: true,
          varsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      eqeqeq: ['error', 'smart'],
    },
  },
];

try {
  const tsPlugin = await import('@typescript-eslint/eslint-plugin');
  const tsParser = await import('@typescript-eslint/parser');

  configs.push({
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser.default,
      parserOptions: {
        project: ['./tsconfig.json', './tsconfig.ui.json'],
        tsconfigRootDir: process.cwd(),
        ecmaVersion: 2022,
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin.default,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  });
} catch (error) {
  console.warn('[lint] TypeScript ESLint プラグインが見つからなかったため、TS ファイルの lint をスキップします。');
  console.warn(`[lint] 詳細: ${error.message}`);
}

export default configs;
