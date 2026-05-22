import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './test-ui',
  timeout: 30000,
  use: {
    headless: true
  },
  projects: [
    {
      name: 'electron',
      testMatch: /.*\.ts/,
      use: {
        channel: 'electron'
      }
    }
  ]
})
