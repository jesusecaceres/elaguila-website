/**
 * JULY1-RENTAS-BIENES brand/search canvas screenshot gate.
 * Usage: node scripts/july1-rentas-bienes-brand-screenshots.mjs [baseUrl]
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:3000";
const outDir = path.join(
  process.cwd(),
  "qa-final-screenshots",
  "july1-rentas-bienes-brand-search-canvas-rescue"
);

const routes = [
  { name: "rentas-landing-es-closed", url: "/clasificados/rentas?lang=es", drawer: false },
  { name: "rentas-landing-es-drawer", url: "/clasificados/rentas?lang=es", drawer: true, drawerSelector: 'button:has-text("Filtros")' },
  { name: "rentas-results-es-closed", url: "/clasificados/rentas/results?lang=es", drawer: false },
  { name: "rentas-results-es-drawer", url: "/clasificados/rentas/results?lang=es", drawer: true, drawerSelector: 'button:has-text("Filtros")' },
  { name: "bienes-landing-es-closed", url: "/clasificados/bienes-raices?lang=es", drawer: false },
  { name: "bienes-landing-es-drawer", url: "/clasificados/bienes-raices?lang=es", drawer: true, drawerSelector: 'button:has-text("Filtros")' },
  { name: "bienes-results-es-closed", url: "/clasificados/bienes-raices/resultados?lang=es", drawer: false },
  { name: "bienes-results-es-drawer", url: "/clasificados/bienes-raices/resultados?lang=es", drawer: true, drawerSelector: 'button:has-text("Filtros")' },
  { name: "rentas-landing-en-closed", url: "/clasificados/rentas?lang=en", drawer: false },
  { name: "rentas-results-en-closed", url: "/clasificados/rentas/results?lang=en", drawer: false },
  { name: "bienes-landing-en-closed", url: "/clasificados/bienes-raices?lang=en", drawer: false },
  { name: "bienes-results-en-closed", url: "/clasificados/bienes-raices/resultados?lang=en", drawer: false },
  { name: "rentas-landing-en-drawer", url: "/clasificados/rentas?lang=en", drawer: true, drawerSelector: 'button:has-text("Filters")' },
  { name: "rentas-results-en-drawer", url: "/clasificados/rentas/results?lang=en", drawer: true, drawerSelector: 'button:has-text("Filters")' },
  { name: "bienes-landing-en-drawer", url: "/clasificados/bienes-raices?lang=en", drawer: true, drawerSelector: 'button:has-text("Filters")' },
  { name: "bienes-results-en-drawer", url: "/clasificados/bienes-raices/resultados?lang=en", drawer: true, drawerSelector: 'button:has-text("Filters")' },
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
