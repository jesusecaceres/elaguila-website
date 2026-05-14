// @ts-check
/**
 * Leonix read-only dashboard / admin / clasificados smoke tests.
 * Run after `npm run build`. Uses `next start` on a dedicated port (default 3036).
 *
 * @example
 *   npm run build
 *   npm run smoke:all
 *
 * Env:
 *   LEONIX_SMOKE_PORT — port (default 3036)
 *   LEONIX_SMOKE_BASE — full base URL (overrides port)
 *   LEONIX_SMOKE_REUSE — set to "0" to force a fresh server even locally
 */
import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

function loadDotEnvLocal() {
  try {
    const p = path.join(root, ".env.local");
    if (!fs.existsSync(p)) return;
    const text = fs.readFileSync(p, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const s = line.trim();
      if (!s || s.startsWith("#")) continue;
      const eq = s.indexOf("=");
      if (eq < 1) continue;
      const k = s.slice(0, eq).trim();
      let v = s.slice(eq + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    /* ignore */
  }
}
loadDotEnvLocal();

const port = Number(String(process.env.LEONIX_SMOKE_PORT ?? "3036").trim()) || 3036;
const base = (process.env.LEONIX_SMOKE_BASE ?? "").trim() || `http://127.0.0.1:${port}`;
const reuse =
  process.env.CI === "true" || process.env.CI === "1"
    ? false
    : String(process.env.LEONIX_SMOKE_REUSE ?? "1") !== "0";

export default defineConfig({
  testDir: path.join(root, "e2e"),
  testMatch: "**/leonix-dashboard-admin-smoke.spec.ts",
  timeout: 120_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: base,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npx next start -p ${port}`,
    cwd: root,
    url: `${base}/clasificados?lang=es`,
    reuseExistingServer: reuse,
    timeout: 120_000,
    env: {
      ...process.env,
      NODE_ENV: "production",
    },
  },
});
