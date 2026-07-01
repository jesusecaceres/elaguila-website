/**
 * STOP-THE-LINE-OFERTAS-EN-VENTA-HEADER-RESULTS-LOCATION-REAL-FIX screenshots.
 * Usage: node scripts/stop-the-line-ofertas-en-venta-screenshots.mjs [baseUrl]
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:3000";
const outDir = path.join(
  process.cwd(),
  "qa-final-screenshots",
  "stop-the-line-ofertas-en-venta-header-results-location-real-fix",
);

fs.mkdirSync(outDir, { recursive: true });

const shots = [
  { cat: "ofertas", kind: "desktop-landing-top", url: "/clasificados/ofertas-locales?lang=en", vp: { width: 1440, height: 900 }, drawer: false },
  { cat: "ofertas", kind: "desktop-results-top", url: "/clasificados/ofertas-locales/results?lang=en", vp: { width: 1440, height: 900 }, drawer: false },
  { cat: "ofertas", kind: "desktop-filters-open", url: "/clasificados/ofertas-locales/results?lang=en", vp: { width: 1440, height: 900 }, drawer: true },
  { cat: "ofertas", kind: "mobile-landing-top", url: "/clasificados/ofertas-locales?lang=es", vp: { width: 390, height: 844 }, drawer: false },
  { cat: "ofertas", kind: "mobile-results-top", url: "/clasificados/ofertas-locales/results?lang=es", vp: { width: 390, height: 844 }, drawer: false },
  { cat: "ofertas", kind: "mobile-filters-open", url: "/clasificados/ofertas-locales/results?lang=es", vp: { width: 390, height: 844 }, drawer: true },
  { cat: "en-venta", kind: "desktop-landing-top", url: "/clasificados/en-venta?lang=en", vp: { width: 1440, height: 900 }, drawer: false },
  { cat: "en-venta", kind: "desktop-results-top", url: "/clasificados/en-venta/results?lang=en", vp: { width: 1440, height: 900 }, drawer: false },
  { cat: "en-venta", kind: "desktop-filters-open", url: "/clasificados/en-venta/results?lang=en", vp: { width: 1440, height: 900 }, drawer: true },
  { cat: "en-venta", kind: "mobile-landing-top", url: "/clasificados/en-venta?lang=es", vp: { width: 390, height: 844 }, drawer: false },
  { cat: "en-venta", kind: "mobile-results-top", url: "/clasificados/en-venta/results?lang=es", vp: { width: 390, height: 844 }, drawer: false },
  { cat: "en-venta", kind: "mobile-filters-open", url: "/clasificados/en-venta/results?lang=es", vp: { width: 390, height: 844 }, drawer: true },
];

async function dismissCookieConsent(page) {
  const accept = page.getByRole("button", { name: /aceptar|accept/i }).first();
  if (await accept.count()) {
    try {
      await accept.click({ timeout: 3000 });
      await page.waitForTimeout(300);
    } catch {
      /* ignore */
    }
  }
}

const browser = await chromium.launch({ headless: true });
const saved = [];

for (const shot of shots) {
  const file = `${shot.cat}__${shot.kind}.png`;
  const context = await browser.newContext({ viewport: shot.vp });
  const page = await context.newPage();
  try {
    await page.goto(`${baseUrl}${shot.url}`, { waitUntil: "networkidle", timeout: 90000 });
    await page.waitForTimeout(900);
    await dismissCookieConsent(page);
    if (shot.drawer) {
      const btn = page.getByRole("button", { name: /^filtros$|^filters$/i }).first();
      if (await btn.count()) {
        await btn.click();
        await page.waitForTimeout(700);
      }
    }
    await page.screenshot({ path: path.join(outDir, file), fullPage: false });
    saved.push(file);
    console.log("ok", file);
  } catch (err) {
    console.error("fail", file, err instanceof Error ? err.message : err);
  }
  await context.close();
}

await browser.close();
console.log(JSON.stringify({ ok: true, count: saved.length, outDir, saved }));
