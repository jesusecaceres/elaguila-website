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

const brPort = Number(String(process.env.BR_E2E_PORT ?? "3025").trim()) || 3025;
const brBase = (process.env.BR_E2E_BASE ?? "").trim() || `http://127.0.0.1:${brPort}`;

export default defineConfig({
  testDir: path.join(root, "e2e"),
  timeout: 300_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: brBase,
    trace: "off",
  },
  webServer: {
    command: `node node_modules/next/dist/bin/next start -p ${brPort}`,
    cwd: root,
    url: `${brBase}/clasificados/bienes-raices?lang=es`,
    /** Fresh server by default so client bundle/env matches the repo `.next` + `.env.local` (avoids a stray :3022 process). */
    reuseExistingServer: process.env.PW_BR_E2E_REUSE === "1",
    timeout: 120_000,
    env: {
      ...process.env,
      NODE_ENV: "production",
    },
  },
});
