// @ts-check
import { defineConfig, devices } from "@playwright/test";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.RESTAURANTES_E2E_PORT || "3017");

export default defineConfig({
  testDir: path.join(root, "e2e"),
  testMatch: "restaurantes-smoke.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: process.env.RESTAURANTES_E2E_BASE ?? `http://127.0.0.1:${port}`,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npx next start -p ${port}`,
    cwd: root,
    url: `http://127.0.0.1:${port}/clasificados/restaurantes`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ...process.env,
      NODE_ENV: "production",
    },
  },
});
