import { defineConfig, devices } from '@playwright/test';

const PORT = 8799;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL: `http://localhost:${PORT}`,
  },
  // Serves dist/ through dev.mjs so the real _headers (CSP included) apply.
  webServer: {
    command: `node ../dev.mjs --port ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: false,
    stdout: 'ignore',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
});
