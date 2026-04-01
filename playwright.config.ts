import { defineConfig, devices } from "@playwright/test";

const defaultBaseURL = "http://localhost:3100";
const baseURL = process.env.E2E_BASE_URL ?? defaultBaseURL;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run build && npx next start -H localhost -p 3100",
        env: {
          ...process.env,
          NEXT_PUBLIC_SITE_URL: defaultBaseURL,
          SCRAPER_BASE_URL: defaultBaseURL,
          SCRAPER_AUTO_SYNC_ENABLED: "false",
          SCRAPER_BOOT_SYNC_ENABLED: "false",
        },
        url: `${baseURL}/login`,
        reuseExistingServer: false,
        timeout: 180 * 1000,
      },
});
