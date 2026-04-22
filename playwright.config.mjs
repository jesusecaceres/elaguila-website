// @ts-check
import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: path.join(root, "e2e"),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: process.env.SERVICIOS_E2E_BASE ?? "http://127.0.0.1:3016",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npx next start -p 3016",
    cwd: root,
    url: "http://127.0.0.1:3016/clasificados/servicios",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      NODE_ENV: "production",
      SERVICIOS_DEV_PUBLISH: "1",
    },
  },
});
