// @ts-check
import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

/** Load `.env.local` into `process.env` for Playwright + `next start` (Supabase + admin password). */
function loadDotEnvLocal() {
  try {
    const p = path.join(root, ".env.local");
    if (!fs.existsSync(p)) return;
    const text = fs.readFileSync(p, "utf8");
    for (const line of text.split("\n")) {
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

/**
 * Autos Playwright uses `next start` (NODE_ENV=production). Ensure non-production Vercel tier so
 * payment bypass gates match local/staging expectations even when the parent shell sets
 * `VERCEL_ENV=production`.
 */
process.env.VERCEL_ENV = "preview";
process.env.AUTOS_ALLOW_TEST_PUBLISH_BYPASS = "true";
process.env.AUTOS_INTERNAL_PUBLISH_PAYMENT_BYPASS = "0";

const port = Number(process.env.AUTOS_E2E_PORT ?? "3022");
const baseURL = process.env.AUTOS_E2E_BASE ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: path.join(root, "e2e", "autos"),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  timeout: 120_000,
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    trace: "off",
  },
  webServer: {
    command: `node node_modules/next/dist/bin/next start -p ${port}`,
    cwd: root,
    url: `${baseURL}/clasificados/autos?lang=es`,
    /** Always start a fresh server so Autos runtime env (e.g. test publish bypass) is never stale-reused. */
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      NODE_ENV: "production",
      /**
       * `isAutosInternalPublishPaymentBypassEnabled()` blocks when `VERCEL_ENV === "production"`.
       * Force a non-production Vercel tier for local Playwright so the bypass can run even if the
       * parent shell inherited `VERCEL_ENV=production` from tooling/CI.
       */
      VERCEL_ENV: "preview",
      /** Phase 3: prove Autos-only test publish bypass (Stripe-free) on `next start`. */
      AUTOS_ALLOW_TEST_PUBLISH_BYPASS: "true",
      AUTOS_INTERNAL_PUBLISH_PAYMENT_BYPASS: "0",
    },
  },
});
