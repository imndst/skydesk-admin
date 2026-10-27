import { defineConfig, devices } from '@playwright/test'

const PORT = 3198
// Optional: use a locally installed Chromium instead of `npx playwright install` (e.g. CHROMIUM_PATH=/usr/bin/chromium)
const launchOptions = process.env.CHROMIUM_PATH
  ? { executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox', '--no-zygote', '--disable-dev-shm-usage'] }
  : {}
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: 'retain-on-failure', screenshot: 'only-on-failure', locale: 'fa-IR', browserName: 'chromium', launchOptions },
  webServer: {
    command: 'node .output/server/index.mjs',
    url: `http://127.0.0.1:${PORT}/api/health`,
    reuseExistingServer: false,
    timeout: 60_000,
    env: { NODE_ENV: 'production', PORT: String(PORT), NITRO_PORT: String(PORT), HOST: '127.0.0.1', NITRO_HOST: '127.0.0.1', DATABASE_FILE: `./data/e2e-${Date.now()}.db`, SESSION_SECRET: 'e'.repeat(48), INSECURE_COOKIES: '1', SKYDESK_QUIET: '1', RATE_LIMIT_MAX: '5000' }
  },
  projects: [
    { name: 'desktop-1440', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'laptop-1024', use: { viewport: { width: 1024, height: 768 } } },
    { name: 'tablet-768', use: { viewport: { width: 768, height: 1024 } } },
    { name: 'mobile-390', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
    { name: 'mobile-360', use: { ...devices['Pixel 7'], browserName: 'chromium', viewport: { width: 360, height: 740 } } }
  ]
})
