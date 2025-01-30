/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import dotenv from 'dotenv';
import { loadEnv } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carrega as variáveis de ambiente do arquivo .env.test
dotenv.config({ path: '.env.test' });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['dotenv/config'],
    include: [
      'src/**/*.{spec,test}.ts',
      'test/**/*.e2e-spec.ts',
      'test/**/*.integration-spec.ts',
    ],
    exclude: ['node_modules/**/*'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'test/'],
    },
    env: loadEnv('test', process.cwd(), ''),
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
}); 