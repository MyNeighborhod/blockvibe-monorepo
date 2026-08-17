import { defineConfig, devices } from "@playwright/test"

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import "dotenv/config"

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000"
const isLocal = baseURL.includes("localhost") || baseURL.includes("127.0.0.1")

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60000,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Run tests sequentially to prevent database conflicts and next dev compile bottlenecks. */
  workers: 1,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [["html", { open: "never" }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
  webServer:
    isLocal && !process.env.NO_WEBSERVER
      ? {
          command: "pnpm dev",
          reuseExistingServer: true,
          url: "http://localhost:3000",
          env: {
            EMAIL_SERVICE_URL: "",
            EMAIL_LAMBDA_FUNCTION_NAME: "",
          },
        }
      : undefined,
})
