// @ts-check
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
    for (const line of text.split("\n")) {
      const s = line.trim();
      if (!s || s.startsWith("#")) continue;
      const eq = s.indexOf("=");
      if (eq < 1) continue;
      const k = s.slice(0, eq).trim();
      let v = s.slice(eq + 1).trim();
      if ((v.startsWith("\"") && v.endsWith("\"")) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    /* ignore */
  }
}
loadDotEnvLocal();

const rentasStartPort = String(process.env.RENTAS_E2E_PORT ?? "3018").replace(/\D/g, "") || "3018";
const rentasStartBase = process.env.RENTAS_E2E_BASE ?? `http://127.0.0.1:${rentasStartPort}`;

export default defineConfig({
  testDir: path.join(root, "e2e"),
  timeout: 900_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: rentasStartBase,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `node node_modules/next/dist/bin/next start -p ${rentasStartPort}`,
    cwd: root,
    url: `${rentasStartBase}/clasificados/rentas?lang=es`,
    /** Always restart so `next start` matches the latest `.next` (local reuse caused stale HTML vs. new admin/test ids). */
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      ...process.env,
      NODE_ENV: "production",
    },
  },
});

