// @ts-check
import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

/** Load `.env.local` into `process.env` so Playwright + `next dev` see Supabase keys without exporting them in the shell. */
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

export default defineConfig({
  testDir: path.join(root, "e2e"),
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: process.env.EMPLEOS_E2E_BASE ?? "http://127.0.0.1:3021",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node node_modules/next/dist/bin/next start -p 3021",
    cwd: root,
    url: "http://127.0.0.1:3021/clasificados/empleos?lang=es",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      NODE_ENV: "production",
      /** Enforce live-only public catalog during runtime QA. */
      EMPLEOS_PUBLIC_LIVE_ONLY: "1",
      /** Ensure a publish results in publicly visible listings without requiring admin moderation. */
      EMPLEOS_REQUIRE_LISTING_REVIEW: "0",
    },
  },
});

