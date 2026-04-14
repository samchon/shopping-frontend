import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PORT ?? "3000");
const baseURL = `http://127.0.0.1:${port}`;
const readmeScreenshots = process.env.README_SCREENSHOTS === "true";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: {
    timeout: 10_000,
  },
  outputDir: ".artifacts/test-results",
  reporter: [["list"], ["html", { open: "never", outputFolder: ".artifacts/playwright-report" }]],
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    headless: true,
    viewport: { width: 1440, height: 900 },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: `pnpm exec next start --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: readmeScreenshots
      ? {
          ...process.env,
          PORT: String(port),
          NEXT_PUBLIC_SHOPPING_API_SIMULATE: "false",
          SHOPPING_API_SIMULATE: "false",
        }
      : {
          ...process.env,
          PORT: String(port),
          NEXT_PUBLIC_SHOPPING_API_SIMULATE: "true",
          SHOPPING_API_SIMULATE: "true",
        },
  },
});
