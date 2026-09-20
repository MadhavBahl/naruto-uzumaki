import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PAGES_TEST_URL || 'http://127.0.0.1:4176/naruto-uzumaki/'

export default defineConfig({
  testDir: './tests/deployment',
  workers: 1,
  reporter: 'list',
  use: { baseURL, trace: 'retain-on-failure' },
  webServer: process.env.PAGES_TEST_URL ? undefined : {
    command: 'npm run preview -- --port 4176 --strictPort',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } },
  ],
})