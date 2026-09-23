import { chromium } from "playwright";

const slug = "vj-bus-1785891474965-tour-de-prueba";
const uniq = "VJ_BUS_1785891474965";

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

await page.goto(`http://127.0.0.1:3103/clasificados/viajes/resultados?lang=es&q=${encodeURIComponent(uniq)}`, {
  waitUntil: "domcontentloaded",
  timeout: 60_000,
});
await page.waitForTimeout(1500);

const locator = page.locator(`a[href*="/clasificados/viajes/oferta/${slug}"]`);
const count = await locator.count();
const visible = count ? await locator.first().isVisible().catch(() => false) : false;
const box = count ? await locator.first().boundingBox().catch(() => null) : null;
const url = page.url();
const emptyVisible = await page.getByText(/Sin resultados|No results/i).first().isVisible().catch(() => false);

console.log(
  JSON.stringify(
    {
      url,
      count,
      visible,
      box,
      emptyVisible,
      htmlHasSlug: (await page.content()).includes(slug),
    },
    null,
    2,
  ),
);

await browser.close();
