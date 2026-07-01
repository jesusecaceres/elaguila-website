/**
 * STOP-THE-LINE-RENTAS-BIENES-APPLICATION-FIELDS-FILTERS-SEARCH-BUYER-UX-FULL-WIRE screenshots.
 * Usage: node scripts/rentas-bienes-application-fields-filters-search-buyer-ux-full-wire-screenshots.mjs [baseUrl]
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:3012";
const outDir = path.join(
  process.cwd(),
  "qa-final-screenshots",
  "rentas-bienes-application-fields-filters-search-buyer-ux-full-wire"
);

const routes = [
  { name: "rentas-landing-desktop-closed", url: "/clasificados/rentas?lang=en", drawer: false, viewport: "desktop" },
  { name: "rentas-landing-desktop-drawer", url: "/clasificados/rentas?lang=en", drawer: true, drawerSelector: 'button:has-text("Filters")', viewport: "desktop" },
  { name: "rentas-results-desktop-closed", url: "/clasificados/rentas/results?lang=en", drawer: false, viewport: "desktop" },
  { name: "rentas-results-desktop-drawer", url: "/clasificados/rentas/results?lang=en", drawer: true, drawerSelector: 'button:has-text("Filters")', viewport: "desktop" },
  {
    name: "rentas-results-desktop-filtered",
    url: "/clasificados/rentas/results?lang=en&city=San%20Jose&state=CA&zip=95116",
    drawer: false,
    viewport: "desktop",
  },
  { name: "rentas-landing-mobile-closed", url: "/clasificados/rentas?lang=en", drawer: false, viewport: "mobile" },
  { name: "rentas-landing-mobile-drawer", url: "/clasificados/rentas?lang=en", drawer: true, drawerSelector: 'button:has-text("Filters")', viewport: "mobile" },
  { name: "rentas-results-mobile-closed", url: "/clasificados/rentas/results?lang=en", drawer: false, viewport: "mobile" },
  { name: "rentas-results-mobile-drawer", url: "/clasificados/rentas/results?lang=en", drawer: true, drawerSelector: 'button:has-text("Filters")', viewport: "mobile" },
  { name: "bienes-landing-desktop-closed", url: "/clasificados/bienes-raices?lang=en", drawer: false, viewport: "desktop" },
  { name: "bienes-landing-desktop-drawer", url: "/clasificados/bienes-raices?lang=en", drawer: true, drawerSelector: 'button:has-text("Filters")', viewport: "desktop" },
  { name: "bienes-results-desktop-closed", url: "/clasificados/bienes-raices/resultados?lang=en", drawer: false, viewport: "desktop" },
  { name: "bienes-results-desktop-drawer", url: "/clasificados/bienes-raices/resultados?lang=en", drawer: true, drawerSelector: 'button:has-text("Filters")', viewport: "desktop" },
  {
    name: "bienes-results-desktop-filtered",
    url: "/clasificados/bienes-raices/resultados?lang=en&city=San%20Jose&state=CA&operationType=venta",
    drawer: false,
    viewport: "desktop",
  },
  { name: "bienes-landing-mobile-closed", url: "/clasificados/bienes-raices?lang=en", drawer: false, viewport: "mobile" },
  { name: "bienes-landing-mobile-drawer", url: "/clasificados/bienes-raices?lang=en", drawer: true, drawerSelector: 'button:has-text("Filters")', viewport: "mobile" },
  { name: "bienes-results-mobile-closed", url: "/clasificados/bienes-raices/resultados?lang=en", drawer: false, viewport: "mobile" },
  { name: "bienes-results-mobile-drawer", url: "/clasificados/bienes-raices/resultados?lang=en", drawer: true, drawerSelector: 'button:has-text("Filters")', viewport: "mobile" },
];

const viewports = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

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

for (const vpKey of ["desktop", "mobile"]) {
  const vp = viewports[vpKey];
  const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
  const page = await context.newPage();
  for (const route of routes.filter((r) => r.viewport === vpKey)) {
    const file = `${route.name}.png`;
    const filePath = path.join(outDir, file);
    try {
      await page.goto(`${baseUrl}${route.url}`, { waitUntil: "networkidle", timeout: 90000 });
      await page.waitForTimeout(900);
      await dismissCookieConsent(page);
      if (route.drawer && route.drawerSelector) {
        const btn = page.locator(route.drawerSelector).first();
        if (await btn.count()) {
          await btn.click();
          await page.waitForTimeout(600);
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
