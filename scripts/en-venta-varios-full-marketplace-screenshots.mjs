/**
 * STOP-THE-LINE-EN-VENTA-VARIOS-FULL-MARKETPLACE-APPLICATION-TO-PUBLIC-WIRE screenshots.
 * Usage: node scripts/en-venta-varios-full-marketplace-screenshots.mjs [baseUrl]
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.argv[2] ?? "http://127.0.0.1:3000";
const outDir = path.join(
  process.cwd(),
  "qa-final-screenshots",
  "en-venta-varios-full-marketplace-application-to-public-wire",
);

fs.mkdirSync(outDir, { recursive: true });

const shots = [
  {
    kind: "desktop-landing-top-closed",
    url: "/clasificados/en-venta?lang=en",
    vp: { width: 1440, height: 900 },
    drawer: false,
  },
  {
    kind: "desktop-landing-filters-open",
    url: "/clasificados/en-venta?lang=en",
    vp: { width: 1440, height: 900 },
    drawer: true,
  },
  {
    kind: "desktop-results-top-closed",
    url: "/clasificados/en-venta/results?lang=en",
    vp: { width: 1440, height: 900 },
    drawer: false,
  },
  {
    kind: "desktop-results-filters-open",
    url: "/clasificados/en-venta/results?lang=en",
    vp: { width: 1440, height: 900 },
    drawer: true,
  },
  {
    kind: "desktop-results-location-filter",
    url: "/clasificados/en-venta/results?lang=en&city=San%20Jose&state=CA&zip=95116&country=United%20States",
    vp: { width: 1440, height: 900 },
    drawer: false,
  },
  {
    kind: "mobile-390-landing-top-closed",
    url: "/clasificados/en-venta?lang=es",
    vp: { width: 390, height: 844 },
    drawer: false,
  },
  {
    kind: "mobile-390-landing-filters-open",
    url: "/clasificados/en-venta?lang=es",
    vp: { width: 390, height: 844 },
    drawer: true,
  },
  {
    kind: "mobile-390-results-top-closed",
    url: "/clasificados/en-venta/results?lang=es",
    vp: { width: 390, height: 844 },
    drawer: false,
  },
  {
    kind: "mobile-390-results-filters-open",
    url: "/clasificados/en-venta/results?lang=es",
    vp: { width: 390, height: 844 },
    drawer: true,
  },
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
  const file = `${shot.kind}.png`;
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
