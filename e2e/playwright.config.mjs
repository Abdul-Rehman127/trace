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
  // WebKit gets its own instance with --allow-http (see dev.mjs).
  webServer: [
    { command: `node ../dev.mjs --port ${PORT}`, url: `http://localhost:${PORT}/`, reuseExistingServer: false, stdout: 'ignore' },
    { command: `node ../dev.mjs --port ${PORT + 1} --allow-http`, url: `http://localhost:${PORT + 1}/`, reuseExistingServer: false, stdout: 'ignore' },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // WebKit: everything except the frame-time tests (they need Chromium's CPU throttling)
    // and the Trusted Types self-test (WebKit has no Trusted Types).
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], baseURL: `http://localhost:${PORT + 1}` },
      grepInvert: /@perf|@chromium-only/,
    },
  ],
});
