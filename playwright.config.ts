import { defineConfig, devices } from '@playwright/test'

const productionUrl = process.env.LK_PRODUCTION_URL
if (productionUrl && new URL(productionUrl).protocol !== 'https:') {
  throw new Error('LK_PRODUCTION_URL must use HTTPS')
}

export default defineConfig({
  testDir: './tests',
  testMatch: /.spec.ts$/,
  timeout: 45_000,
  expect: { timeout: 9_000 },
  workers: 1,
  grep: productionUrl ? /@multiplayer/ : undefined,
  use: {
    ...devices['Desktop Chrome'],
    channel: 'chrome',
    baseURL: productionUrl ? new URL(productionUrl).origin : 'http://127.0.0.1:5174',
    trace: productionUrl ? 'off' : 'retain-on-failure',
  },
  webServer: productionUrl ? undefined : [
    { command: 'node tests/room-server.mjs', url: 'http://127.0.0.1:4410/health', timeout: 30000 },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5174 --strictPort',
      url: 'http://127.0.0.1:5174',
      env: { VITE_SUPABASE_URL: 'http://127.0.0.1:4410', VITE_SUPABASE_PUBLISHABLE_KEY: 'browser-fixture' },
      timeout: 30000,
    },
  ],
})
