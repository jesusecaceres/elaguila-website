import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = __dirname;
const base = process.env.VIAJES_QA_BASE || "http://127.0.0.1:3103";

mkdirSync(outDir, { recursive: true });

async function shot(page, name, width, route) {
  await page.setViewportSize({ width, height: width <= 400 ? 844 : width <= 800 ? 1024 : 900 });
  await page.goto(`${base}${route}`, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(500);
  const path = join(outDir, name);
  await page.screenshot({ path, fullPage: true });
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 1;
  });
  console.log(`${overflow ? "FAIL_OVERFLOW" : "PASS"} ${name} ${route} ${width}`);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

// Discover live offer/provider from results
await page.goto(`${base}/clasificados/viajes/resultados?lang=es&sort=newest`, {
  waitUntil: "networkidle",
  timeout: 90_000,
});
const offerHref = await page.locator('a[href*="/clasificados/viajes/oferta/"]').first().getAttribute("href");
const providerHref = await page.locator('a[href*="/clasificados/viajes/negocio/"]').first().getAttribute("href").catch(() => null);
const offerPath = offerHref ? offerHref.split("?")[0] : null;
const providerPath = providerHref ? providerHref.split("?")[0] : null;
console.log(JSON.stringify({ offerPath, providerPath }, null, 2));

await shot(page, "landing-390.png", 390, "/clasificados/viajes?lang=es");
await shot(page, "landing-768.png", 768, "/clasificados/viajes?lang=es");
await shot(page, "landing-1440.png", 1440, "/clasificados/viajes?lang=es");

await shot(page, "results-default-390.png", 390, "/clasificados/viajes/resultados?lang=es");
await shot(page, "results-default-768.png", 768, "/clasificados/viajes/resultados?lang=es");
await shot(page, "results-default-1440.png", 1440, "/clasificados/viajes/resultados?lang=es");

await shot(page, "results-filtered-390.png", 390, "/clasificados/viajes/resultados?lang=es&budget=economico");
await shot(page, "results-filtered-1440.png", 1440, "/clasificados/viajes/resultados?lang=es&budget=economico");

await shot(page, "results-sorted-390.png", 390, "/clasificados/viajes/resultados?lang=es&sort=newest");
await shot(page, "results-sorted-1440.png", 1440, "/clasificados/viajes/resultados?lang=es&sort=newest");

await shot(page, "results-empty-390.png", 390, "/clasificados/viajes/resultados?lang=es&q=__no_match_empty_state_qa__");
await shot(page, "results-empty-1440.png", 1440, "/clasificados/viajes/resultados?lang=es&q=__no_match_empty_state_qa__");

if (offerPath) {
  await shot(page, "offer-detail-full-390.png", 390, `${offerPath}?lang=es`);
  await shot(page, "offer-detail-full-1440.png", 1440, `${offerPath}?lang=es`);
} else {
  console.log("SKIP offer-detail-full — no live offer");
}

// Minimal: empty-ish q that may still show a card; use second offer if available
const second = await page.locator('a[href*="/clasificados/viajes/oferta/"]').nth(1).getAttribute("href").catch(() => null);
if (second) {
  const p = second.split("?")[0];
  await shot(page, "offer-detail-minimal-390.png", 390, `${p}?lang=es`);
  await shot(page, "offer-detail-minimal-1440.png", 1440, `${p}?lang=es`);
} else if (offerPath) {
  await shot(page, "offer-detail-minimal-390.png", 390, `${offerPath}?lang=es`);
  await shot(page, "offer-detail-minimal-1440.png", 1440, `${offerPath}?lang=es`);
}

if (providerPath) {
  await shot(page, "provider-390.png", 390, `${providerPath}?lang=es`);
  await shot(page, "provider-1440.png", 1440, `${providerPath}?lang=es`);
} else {
  console.log("SKIP provider — no live provider link");
}

// Publishers (public routes — may redirect/gate)
await shot(page, "business-publisher-step1-390.png", 390, "/publicar/viajes/negocios?lang=es");
await shot(page, "business-publisher-review-1440.png", 1440, "/publicar/viajes/negocios?lang=es&step=5");
await shot(page, "private-publisher-step1-390.png", 390, "/publicar/viajes/privado?lang=es");
await shot(page, "private-publisher-review-1440.png", 1440, "/publicar/viajes/privado?lang=es&step=4");

await browser.close();
console.log("SCREENSHOTS_DONE");
