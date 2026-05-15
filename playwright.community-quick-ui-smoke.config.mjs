// @ts-check
/**
 * Full UI smoke: Clases + Comunidad quick (form → preview → publish → surfaces).
 * Prerequisite: `npm run build`. Uses `next start` on COMMUNITY_QUICK_UI_PORT (default 3012).
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

const port = Number(String(process.env.COMMUNITY_QUICK_UI_PORT ?? "3012").replace(/\D/g, "")) || 3012;
const base = (process.env.COMMUNITY_QUICK_UI_BASE ?? "").trim() || `http://127.0.0.1:${port}`;
const reuse =
  process.env.CI === "true" || process.env.CI === "1"
    ? false
    : String(process.env.COMMUNITY_QUICK_UI_REUSE ?? "1") !== "0";

export default defineConfig({
  testDir: path.join(root, "e2e/community"),
  testMatch: "**/community-quick-full-ui-smoke.spec.ts",
  timeout: 600_000,
  expect: { timeout: 45_000 },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
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
    url: `${base}/publicar/clases/quick?lang=es`,
    reuseExistingServer: reuse,
    timeout: 180_000,
    env: {
      ...process.env,
      NODE_ENV: "production",
    },
  },
});
