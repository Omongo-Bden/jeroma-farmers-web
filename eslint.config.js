import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': ['warn', {
        varsIgnorePattern: '^(_|React$)',
        argsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^(e|err)$'
      }],
      'react-hooks/set-state-in-effect': 'off'
    }
  },
  {
    files: ['netlify/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node
      },
      parserOptions: {
        sourceType: 'commonjs'
      }
    }
  }
])
