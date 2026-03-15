import js from '@eslint/js'
import reactPlugin from 'eslint-plugin-react'
import reactHooksPlugin from 'eslint-plugin-react-hooks'
import globals from 'globals'

export default [
  {
    ignores: ['dist/', 'node_modules/'],
  },
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...js.configs.recommended.rules,
      // Mark variables used in JSX as used (prevents false no-unused-vars)
      'react/jsx-uses-vars': 'error',
      // React 17+ automatic JSX transform — no need to import React
      'react/react-in-jsx-scope': 'off',
      ...reactHooksPlugin.configs.recommended.rules,
    },
  },
]
