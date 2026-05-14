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

const port = String(process.env.COMMUNITY_PREVIEW_E2E_PORT ?? "3005").replace(/\D/g, "") || "3005";
const base = process.env.COMMUNITY_PREVIEW_E2E_BASE ?? `http://127.0.0.1:${port}`;

/**
 * Preview publish-bar E2E against production `next start` (avoids broken `next dev` .next vendor-chunk races).
 *
 * Prerequisite: `npm run build` (or use `npm run verify:community-preview:e2e` which runs build first).
 */
export default defineConfig({
  testDir: path.join(root, "e2e/community"),
  timeout: 120_000,
  forbidOnly: !!process.env.CI,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    ...devices["Desktop Chrome"],
    baseURL: base,
    trace: "retain-on-failure",
  },
  webServer: {
    command: `node node_modules/next/dist/bin/next start -p ${port}`,
    cwd: root,
    url: `${base}/publicar/clases/quick/preview`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      ...process.env,
      NODE_ENV: "production",
    },
  },
});
