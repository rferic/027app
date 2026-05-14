import { defineConfig } from '@playwright/test'

const port = process.env.PORT ?? '3000'
const baseURL = `http://localhost:${port}`

export default defineConfig({
  testDir: './tests/e2e',
  use: {
    baseURL,
  },
  webServer: {
    command: 'pnpm dev',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
  },
})
