/**
 * JULY1-CLASIFICADOS-PUBLIC-BROWSING-FULL-BATTLEFIELD-RESCUE screenshots.
 * Usage: node scripts/july1-clasificados-public-browsing-full-battlefield-screenshots.mjs [baseUrl]
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:3000";
const outDir = path.join(
  process.cwd(),
  "qa-final-screenshots",
  "july1-clasificados-public-browsing-full-battlefield-rescue",
);

const categories = [
  {
    slug: "servicios",
    landing: "/clasificados/servicios?lang=es",
    results: "/clasificados/servicios/results?lang=es",
    filterEs: 'button:has-text("Filtros"), a:has-text("Filtros")',
    resultsFilterEs: '[data-testid="servicios-open-filters-drawer"], form button:has-text("Filtros")',
  },
  {
    slug: "ofertas-locales",
    landing: "/clasificados/ofertas-locales?lang=es",
    results: null,
    filterEs: 'button:has-text("Filtros")',
  },
  {
    slug: "en-venta-varios",
    landing: "/clasificados/en-venta?lang=es",
    results: "/clasificados/en-venta/results?lang=es",
    filterEs: 'button:has-text("Filtros")',
  },
  {
    slug: "rentas",
    landing: "/clasificados/rentas?lang=es",
    results: "/clasificados/rentas/results?lang=es",
    filterEs: 'button:has-text("Filtros")',
  },
  {
    slug: "bienes-raices",
    landing: "/clasificados/bienes-raices?lang=es",
    results: "/clasificados/bienes-raices/resultados?lang=es",
    filterEs: 'button:has-text("Filtros")',
  },
  {
    slug: "empleos",
    landing: "/clasificados/empleos?lang=es",
    results: "/clasificados/empleos/results?lang=es",
    filterEs: 'button:has-text("Filtros")',
  },
];

const viewports = [
  { tag: "desktop", width: 1440, height: 900 },
  { tag: "mobile", width: 390, height: 844 },
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

for (const cat of categories) {
  const routes = [
    { kind: "landing", url: cat.landing, drawer: false },
    { kind: "landing-filter-drawer", url: cat.landing, drawer: true },
  ];
  if (cat.results) {
    routes.push({ kind: "results", url: cat.results, drawer: false });
    routes.push({ kind: "results-filter-drawer", url: cat.results, drawer: true });
  }

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    for (const route of routes) {
      const file = `${cat.slug}__${route.kind}__${vp.tag}.png`;
      const filePath = path.join(outDir, file);
      try {
        await page.goto(`${baseUrl}${route.url}`, { waitUntil: "networkidle", timeout: 90000 });
        await page.waitForTimeout(800);
        await dismissCookieConsent(page);
        if (route.drawer) {
          const selector =
            route.kind.startsWith("results") && cat.resultsFilterEs ? cat.resultsFilterEs : cat.filterEs;
          const btn = page.locator(selector).first();
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
}

await browser.close();
console.log(JSON.stringify({ ok: true, count: shots.length, outDir, shots }));
