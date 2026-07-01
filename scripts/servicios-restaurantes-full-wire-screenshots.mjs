/**
 * Servicios + Restaurantes application-fields-filters-search local business UX screenshots.
 * Usage: node scripts/servicios-restaurantes-full-wire-screenshots.mjs [baseUrl]
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:3000";
const outDir = path.join(
  process.cwd(),
  "qa-final-screenshots",
  "servicios-restaurantes-application-fields-filters-search-local-business-ux-full-wire",
);

fs.mkdirSync(outDir, { recursive: true });

const categories = [
  {
    slug: "servicios",
    landing: "/clasificados/servicios?lang=en",
    results: "/clasificados/servicios/results?lang=en&group=home_trade&city=San%20Jos%C3%A9&state=CA",
    resultsFilter: "/clasificados/servicios/results?lang=en&licensed=1&city=San%20Jose&state=CA&zip=95116",
  },
  {
    slug: "restaurantes",
    landing: "/clasificados/restaurantes?lang=en",
    results: "/clasificados/restaurantes/results?lang=en&cuisine=seafood&city=San%20Jose&state=CA",
    resultsFilter: "/clasificados/restaurantes/results?lang=en&cuisine=mexican&city=San%20Jose&state=CA&zip=95116&open=1",
  },
];

const viewports = [
  { tag: "desktop", width: 1440, height: 900 },
  { tag: "mobile-390", width: 390, height: 844 },
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
const shots = [];

for (const cat of categories) {
  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();

    const routes = [
      { kind: "landing-closed", url: cat.landing, drawer: false },
      { kind: "landing-filters-open", url: cat.landing, drawer: true },
      { kind: "results-closed", url: cat.results, drawer: false },
      { kind: "results-filters-open", url: cat.results, drawer: true },
    ];
    if (vp.tag === "desktop") {
      routes.push({ kind: "results-active-filter", url: cat.resultsFilter, drawer: false });
    }

    for (const route of routes) {
      const file = `${cat.slug}__${route.kind}__${vp.tag}.png`;
      try {
        await page.goto(`${baseUrl}${route.url}`, { waitUntil: "networkidle", timeout: 90000 });
        await page.waitForTimeout(800);
        await dismissCookieConsent(page);
        if (route.drawer) {
          const btn = page.getByRole("button", { name: /^filtros$|^filters$/i }).first();
          if (await btn.count()) {
            await btn.click();
            await page.waitForTimeout(600);
          }
        }
        await page.screenshot({ path: path.join(outDir, file), fullPage: false });
        shots.push(file);
      } catch (err) {
        console.error(`FAIL ${file}:`, err.message);
      }
    }
    await context.close();
  }
}

await browser.close();
console.log(`Saved ${shots.length} screenshots to ${outDir}`);
for (const s of shots) console.log(`  ${s}`);
