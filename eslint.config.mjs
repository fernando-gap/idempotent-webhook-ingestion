// @ts-check

import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import tsdoc from "eslint-plugin-tsdoc";

export default defineConfig(
  {
    ignores: [
      "dist/**",
      "coverage/**",
      "node_modules/**",
      "vitest.config.js"
    ],
  },
  {

  files: ['**/*.{js,ts}'],
  extends: [js.configs.recommended, tseslint.configs.strict, tseslint.configs.stylistic],

  plugins: {
    tsdoc,
  },

  rules: {
    "no-undef": "off",
    "tsdoc/syntax": "warn",
  },
});