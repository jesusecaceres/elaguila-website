// @ts-check
/**
 * Viajes runtime QA — expects an already-running production server (Phase B :3103).
 * Does not spawn a second build/webServer.
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

const baseURL = process.env.VIAJES_E2E_BASE ?? process.env.SERVICIOS_E2E_BASE ?? "http://127.0.0.1:3103";

export default defineConfig({
  testDir: path.join(root, "e2e"),
  testMatch: /viajes-runtime-qa\.spec\.ts$/,
  timeout: 1_800_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    trace: "retain-on-failure",
  },
});
