import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  outputDir: './agent-output/browser-results',
  workers: 1,
  timeout: 30000,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4326/Whipper-IdleRPG/',
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1365, height: 950 } } },
    { name: 'phone', use: { ...devices['Pixel 5'] } },
  ],
  webServer: {
    command: 'npm run preview -- --port 4326',
    url: 'http://127.0.0.1:4326/Whipper-IdleRPG/',
    reuseExistingServer: false,
    timeout: 30000,
  },
});
