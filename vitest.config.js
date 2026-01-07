import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.js';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test-utils/setup.js'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/test-utils/',
          '**/*.test.{js,jsx}',
          '**/*.spec.{js,jsx}',
          '**/main.jsx',
          'vite.config.js',
          'vitest.config.js',
          'playwright.config.js',
          'tailwind.config.js',
          'postcss.config.js',
          'eslint.config.js',
        ],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        },
      },
      include: ['**/*.{test,spec}.{js,jsx}'],
      exclude: ['node_modules', 'dist', 'e2e'],
      // Timeout settings
      testTimeout: 10000,
      hookTimeout: 10000,
    },
  })
);
