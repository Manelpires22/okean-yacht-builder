import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'Mobile Portrait',
      use: { 
        ...devices['iPhone SE'],
        viewport: { width: 375, height: 667 }
      },
    },
    {
      name: 'Tablet Portrait',
      use: { 
        viewport: { width: 768, height: 1024 }
      },
    },
    {
      name: 'Tablet Landscape',
      use: { 
        viewport: { width: 1024, height: 768 }
      },
    },
    {
      name: 'Desktop',
      use: { 
        viewport: { width: 1280, height: 720 }
      },
    },
    {
      name: 'Desktop Wide',
      use: { 
        viewport: { width: 1920, height: 1080 }
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
  },
});
