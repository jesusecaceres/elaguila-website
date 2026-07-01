/**
 * Lightweight categories filter/search PWA full wire screenshots.
 * Usage: node scripts/lightweight-categories-full-wire-screenshots.mjs [baseUrl]
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:3000";
const outDir = path.join(
  process.cwd(),
  "qa-final-screenshots",
  "lightweight-categories-application-fields-filters-search-pwa-full-wire",
);

const categories = [
  {
    slug: "empleos",
    landing: "/clasificados/empleos?lang=es",
    results: "/clasificados/empleos/results?lang=es",
  },
  {
    slug: "comunidad",
    landing: "/clasificados/comunidad?lang=es",
    results: "/clasificados/comunidad/results?lang=es",
  },
  {
    slug: "clases",
    landing: "/clasificados/clases?lang=es",
    results: "/clasificados/clases/results?lang=es",
  },
  {
    slug: "busco",
    landing: "/clasificados/busco?lang=es",
    results: "/clasificados/busco/results?lang=es",
  },
  {
    slug: "mascotas-y-perdidos",
    landing: "/clasificados/mascotas-y-perdidos?lang=es",
    results: "/clasificados/mascotas-y-perdidos/results?lang=es",
  },
];

const viewports = [
  { tag: "desktop", width: 1440, height: 900 },
  { tag: "mobile-390", width: 390, height: 844 },
];

const filterSelector = 'button:has-text("Filtros"), button:has-text("Filters")';

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

async function openDrawer(page) {
  const btn = page.locator(filterSelector).first();
  if (!(await btn.count())) return false;
  await btn.scrollIntoViewIfNeeded();
  await btn.click({ force: true });
  await page.waitForTimeout(700);
  return true;
}

const browser = await chromium.launch({ headless: true });
const shots = [];

for (const cat of categories) {
  const routes = [
    { kind: "landing-closed", url: cat.landing, drawer: false },
    { kind: "landing-filters-open", url: cat.landing, drawer: true },
    { kind: "results-closed", url: cat.results, drawer: false },
    { kind: "results-filters-open", url: cat.results, drawer: true },
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    for (const route of routes) {
      const file = `${cat.slug}__${route.kind}__${vp.tag}.png`;
      const filePath = path.join(outDir, file);
      try {
        await page.goto(`${baseUrl}${route.url}`, { waitUntil: "domcontentloaded", timeout: 120000 });
        await page.waitForTimeout(1500);
        await dismissCookieConsent(page);
        if (route.drawer) await openDrawer(page);
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
