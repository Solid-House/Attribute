import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

const commonRules = {
  'no-unused-vars': 'off',
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_'
    }
  ]
}

export default tseslint.config(
  {
    ignores: ['build/**', 'node_modules/**', 'out/**', 'out-test/**', 'release/**']
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['electron.vite.config.ts', 'src/main/**/*.ts', 'src/preload/**/*.ts', 'src/inject/**/*.ts'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.es2024,
        ...globals.node
      }
    },
    rules: commonRules
  },
  {
    files: ['src/renderer/src/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2024
      }
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...commonRules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': 'warn'
    }
  },
  {
    files: ['test/**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node
      }
    },
    rules: {
      ...commonRules,
      '@typescript-eslint/no-require-imports': 'off'
    }
  },
  {
    // The injected overlay runs inside the untyped target page's main world,
    // reaching for page-context window globals that have no ambient types.
    // `any` is legitimate here; it stays an error everywhere else.
    files: ['src/inject/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off'
    }
  }
)
