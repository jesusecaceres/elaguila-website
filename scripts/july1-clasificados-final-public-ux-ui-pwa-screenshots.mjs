/**
 * JULY1-CLASIFICADOS-FINAL-PUBLIC-UX-UI-PWA-BATTLEFIELD-RESCUE screenshots.
 * Usage: node scripts/july1-clasificados-final-public-ux-ui-pwa-screenshots.mjs [baseUrl]
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:3000";
const outDir = path.join(
  process.cwd(),
  "qa-final-screenshots",
  "july1-clasificados-final-public-ux-ui-pwa-battlefield-rescue",
);

const primaryCategories = [
  {
    slug: "en-venta",
    landing: "/clasificados/en-venta?lang=es",
    results: "/clasificados/en-venta/results?lang=es",
    filterEs: 'button:has-text("Filtros")',
  },
  {
    slug: "ofertas-locales",
    landing: "/clasificados/ofertas-locales?lang=es",
    results: null,
    filterEs: 'button:has-text("Filtros")',
  },
  {
    slug: "rentas",
    landing: "/clasificados/rentas?lang=es",
    results: "/clasificados/rentas/results?lang=es",
    filterEs: 'button:has-text("Filtros")',
    resultsFilterEs:
      '[aria-label="Buscar rentas"] button:has-text("Filtros"), form button:has-text("Filtros")',
  },
  {
    slug: "bienes-raices",
    landing: "/clasificados/bienes-raices?lang=es",
    results: "/clasificados/bienes-raices/resultados?lang=es",
    filterEs: 'button:has-text("Filtros")',
  },
  {
    slug: "servicios",
    landing: "/clasificados/servicios?lang=es",
    results: "/clasificados/servicios/results?lang=es",
    filterEs: 'a:has-text("Filtros"), button:has-text("Filtros")',
    resultsFilterEs: '[data-testid="servicios-open-filters-drawer"]',
  },
  {
    slug: "empleos",
    landing: "/clasificados/empleos?lang=es",
    results: "/clasificados/empleos/results?lang=es",
    filterEs: 'button:has-text("Filtros")',
  },
];

const secondaryCategories = [
  { slug: "autos", url: "/clasificados/autos?lang=es", filterEs: 'button:has-text("Filtros")' },
  { slug: "restaurantes", url: "/clasificados/restaurantes?lang=es", filterEs: 'button:has-text("Filtros")' },
  { slug: "comunidad", url: "/clasificados/comunidad?lang=es", filterEs: 'button:has-text("Filtros")' },
  { slug: "clases", url: "/clasificados/clases?lang=es", filterEs: 'button:has-text("Filtros")' },
  { slug: "viajes", url: "/clasificados/viajes?lang=es", filterEs: 'button:has-text("Filtros")' },
  {
    slug: "mascotas-y-perdidos",
    url: "/clasificados/mascotas-y-perdidos?lang=es",
    filterEs: 'button:has-text("Filtros")',
  },
  { slug: "busco", url: "/clasificados/busco?lang=es", filterEs: 'button:has-text("Filtros")' },
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

async function openDrawer(page, selector) {
  const btn = page.locator(selector).first();
  if (!(await btn.count())) return false;
  await btn.scrollIntoViewIfNeeded();
  await btn.click({ force: true });
  await page.waitForTimeout(700);
  return true;
}

const browser = await chromium.launch({ headless: true });
const shots = [];

for (const cat of primaryCategories) {
  const routes = [
    { kind: "landing-closed", url: cat.landing, drawer: false },
    { kind: "landing-drawer", url: cat.landing, drawer: true },
  ];
  if (cat.results) {
    routes.push({ kind: "results-closed", url: cat.results, drawer: false });
    routes.push({ kind: "results-drawer", url: cat.results, drawer: true });
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
          await openDrawer(page, selector);
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

for (const cat of secondaryCategories) {
  for (const vp of viewports) {
    const file = `${cat.slug}__landing-top__${vp.tag}.png`;
    const filePath = path.join(outDir, file);
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    try {
      await page.goto(`${baseUrl}${cat.url}`, { waitUntil: "networkidle", timeout: 90000 });
      await page.waitForTimeout(800);
      await dismissCookieConsent(page);
      await page.screenshot({ path: filePath, fullPage: false });
      shots.push(file);
      console.log("ok", file);
    } catch (err) {
      console.error("fail", file, err instanceof Error ? err.message : err);
    }
    await context.close();
  }
}

await browser.close();
console.log(JSON.stringify({ ok: true, count: shots.length, outDir, shots }));
