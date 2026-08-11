'use strict';

const js = require('@eslint/js');
const globals = require('globals');
const { defineConfig } = require('eslint/config');

module.exports = defineConfig([
  {
    name: 'project/ignores',
    ignores: [
      'build/**',
      'build_wasm/**',
      'build_test/**',
      'bin/**',
      'coverage/**',
      'docs/ipv6-parse.js',
      '**/*.min.js'
    ]
  },
  js.configs.recommended,
  {
    name: 'project/javascript',
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    rules: {
      indent: ['error', 2],
      'linebreak-style': ['error', 'unix'],
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'comma-dangle': ['error', 'never'],
      'arrow-spacing': ['error', { before: true, after: true }],
      'keyword-spacing': ['error', { before: true, after: true }],
      'space-before-blocks': ['error', 'always'],
      'space-before-function-paren': ['error', {
        anonymous: 'always',
        named: 'never',
        asyncArrow: 'always'
      }],
      'space-in-parens': ['error', 'never'],
      'space-infix-ops': 'error',
      'prefer-const': 'error',
      'no-var': 'error'
    }
  }
]);
