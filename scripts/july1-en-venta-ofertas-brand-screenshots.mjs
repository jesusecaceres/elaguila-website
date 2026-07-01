/**
 * JULY1-EN-VENTA-OFERTAS brand/search canvas screenshot gate.
 * Usage: node scripts/july1-en-venta-ofertas-brand-screenshots.mjs [baseUrl]
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:3000";
const outDir = path.join(
  process.cwd(),
  "qa-final-screenshots",
  "july1-en-venta-ofertas-brand-search-canvas-rescue"
);

const routes = [
  { name: "en-venta-landing-es-closed", url: "/clasificados/en-venta?lang=es", drawer: false },
  { name: "en-venta-landing-es-drawer", url: "/clasificados/en-venta?lang=es", drawer: true, drawerSelector: 'button:has-text("Filtros")' },
  { name: "en-venta-results-es-closed", url: "/clasificados/en-venta/results?lang=es", drawer: false },
  { name: "en-venta-results-es-drawer", url: "/clasificados/en-venta/results?lang=es", drawer: true, drawerSelector: 'button:has-text("Filtros")' },
  { name: "en-venta-landing-en-closed", url: "/clasificados/en-venta?lang=en", drawer: false },
  { name: "en-venta-results-en-closed", url: "/clasificados/en-venta/results?lang=en", drawer: false },
  { name: "ofertas-landing-es-closed", url: "/clasificados/ofertas-locales?lang=es", drawer: false },
  { name: "ofertas-landing-es-drawer", url: "/clasificados/ofertas-locales?lang=es", drawer: true, drawerSelector: 'button:has-text("Filtros")' },
  { name: "ofertas-landing-en-closed", url: "/clasificados/ofertas-locales?lang=en", drawer: false },
  { name: "ofertas-landing-en-drawer", url: "/clasificados/ofertas-locales?lang=en", drawer: true, drawerSelector: 'button:has-text("Filters")' },
];

const viewports = [
  { tag: "desktop-1440", width: 1440, height: 900 },
  { tag: "mobile-390", width: 390, height: 844 },
];

fs.mkdirSync(outDir, { recursive: true });

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
const shots = [];

for (const vp of viewports) {
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();
  for (const route of routes) {
    const file = `${route.name}__${vp.tag}.png`;
    const filePath = path.join(outDir, file);
    try {
      await page.goto(`${baseUrl}${route.url}`, { waitUntil: "networkidle", timeout: 60000 });
      await page.waitForTimeout(800);
      await dismissCookieConsent(page);
      if (route.drawer && route.drawerSelector) {
        const btn = page.locator(route.drawerSelector).first();
        if (await btn.count()) {
          await btn.click();
          await page.waitForTimeout(500);
        }
      }
      await page.screenshot({ path: filePath, fullPage: false });
      shots.push(file);
      console.log("ok", file);
    } catch (err) {
      console.error("fail", file, err instanceof Error ? err.message : err);
    }
  }
  await context.close();
}

await browser.close();
console.log(JSON.stringify({ ok: true, count: shots.length, outDir, shots }));
