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
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    /* ignore */
  }
}
loadDotEnvLocal();

process.env.VERCEL_ENV = "preview";

const port = Number(process.env.AUTOS_RECOVERY_28_PORT ?? "3028");
const baseURL = process.env.AUTOS_RECOVERY_28_BASE ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: path.join(root, "e2e", "autos"),
  testMatch: "autos-a5-recovery-28-child-editor-hydration-field-mapping.spec.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  timeout: 300_000,
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    trace: "off",
  },
  webServer: {
    command: `node node_modules/next/dist/bin/next start -p ${port}`,
    cwd: root,
    url: `${baseURL}/publicar/autos/negocios?lang=es`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      NODE_ENV: "production",
      VERCEL_ENV: "preview",
    },
  },
});
