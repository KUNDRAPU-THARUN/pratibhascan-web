import { defineConfig, devices } from '@playwright/test';

/**
 * PratibhaScan Web — Playwright Configuration
 * Company: KAARYAN LABS
 * Supports Desktop (1440px), Tablet (768px), and Mobile (375px) viewports
 * Configured to use installed local Chrome / Edge.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 45000,
  expect: {
    timeout: 10000,
  },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    channel: 'chrome',
  },
  projects: [
    {
      name: 'Desktop Chrome 1440px',
      use: {
        viewport: { width: 1440, height: 900 },
        channel: 'chrome',
      },
    },
    {
      name: 'Tablet 768px',
      use: {
        viewport: { width: 768, height: 1024 },
        channel: 'chrome',
      },
    },
    {
      name: 'Mobile 375px',
      use: {
        viewport: { width: 375, height: 667 },
        isMobile: true,
        channel: 'chrome',
      },
    },
  ],
  webServer: {
    command: 'npm run preview -- --port 5173',
    port: 5173,
    reuseExistingServer: true,
    timeout: 30000,
  },
});
