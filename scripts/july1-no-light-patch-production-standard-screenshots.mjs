/**
 * JULY1-NO-LIGHT-PATCH-PRODUCTION-STANDARD-ENFORCEMENT screenshots.
 * Usage: node scripts/july1-no-light-patch-production-standard-screenshots.mjs [baseUrl]
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:3000";
const outDir = path.join(
  process.cwd(),
  "qa-final-screenshots",
  "july1-no-light-patch-production-standard-enforcement",
);

fs.mkdirSync(outDir, { recursive: true });

const categories = [
  {
    slug: "ofertas-locales",
    landing: "/clasificados/ofertas-locales?lang=es",
    extra: [
      {
        kind: "browse-all-deals",
        setup: async (page) => {
          await page.getByRole("button", { name: /explorar todas|browse all/i }).click();
          await page.waitForTimeout(600);
        },
      },
    ],
  },
  { slug: "servicios", landing: "/clasificados/servicios?lang=es", results: "/clasificados/servicios/results?lang=es" },
  { slug: "en-venta-varios", landing: "/clasificados/en-venta?lang=es", results: "/clasificados/en-venta/results?lang=es" },
  { slug: "rentas", landing: "/clasificados/rentas?lang=es", results: "/clasificados/rentas/results?lang=es" },
  { slug: "bienes-raices", landing: "/clasificados/bienes-raices?lang=es", results: "/clasificados/bienes-raices/resultados?lang=es" },
  { slug: "empleos", landing: "/clasificados/empleos?lang=es", results: "/clasificados/empleos/results?lang=es" },
];

const viewports = [
  { tag: "desktop", width: 1440, height: 900 },
  { tag: "mobile", width: 390, height: 844 },
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

    const routes = [{ kind: "landing-closed", url: cat.landing, drawer: false }];
    if (cat.results) routes.push({ kind: "results-closed", url: cat.results, drawer: false });
    routes.push({ kind: "landing-filters-open", url: cat.landing, drawer: true });
    if (cat.results) routes.push({ kind: "results-filters-open", url: cat.results, drawer: true });

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
        console.log("ok", file);
      } catch (err) {
        console.error("fail", file, err instanceof Error ? err.message : err);
      }
    }

    if (cat.extra) {
      for (const extra of cat.extra) {
        const file = `${cat.slug}__${extra.kind}__${vp.tag}.png`;
        try {
          await page.goto(`${baseUrl}${cat.landing}`, { waitUntil: "networkidle", timeout: 90000 });
          await page.waitForTimeout(800);
          await dismissCookieConsent(page);
          await extra.setup(page);
          await page.screenshot({ path: path.join(outDir, file), fullPage: false });
          shots.push(file);
          console.log("ok", file);
        } catch (err) {
          console.error("fail", file, err instanceof Error ? err.message : err);
        }
      }
    }

    await context.close();
  }
}

await browser.close();
console.log(JSON.stringify({ ok: true, count: shots.length, outDir, shots }));
