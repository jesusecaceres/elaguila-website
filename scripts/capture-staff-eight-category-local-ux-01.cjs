/**
 * LOCAL-ONLY Gate 9 screenshots. Not a deployed Preview.
 *
 * NODE_PATH=/workspace/node_modules node scripts/capture-staff-eight-category-local-ux-01.cjs
 * Requires `next dev` on 127.0.0.1:3000.
 */
const { chromium } = require("playwright");
const fs = require("node:fs");
const path = require("node:path");

const OUT = "/opt/cursor/artifacts";
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { name: "390", width: 390, height: 844 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 900 },
];

async function dismissCookie(page) {
  for (const label of ["Aceptar todo", "Accept all", "Aceptar", "Accept"]) {
    const btn = page.getByRole("button", { name: label });
    if (await btn.count()) {
      await btn.first().click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(300);
      return;
    }
  }
}

async function measurePreviewClearance(page) {
  return page.evaluate(() => {
    const nav = document.querySelector("[data-navbar-root]");
    const heading = document.querySelector("[data-prospect-preview-heading]");
    const shell = document.querySelector("[data-prospect-preview-clears-navbar]");
    const navBox = nav ? nav.getBoundingClientRect() : null;
    const headingBox = heading ? heading.getBoundingClientRect() : null;
    const overflow = document.documentElement.scrollWidth - window.innerWidth;
    const headingClearsNav =
      !navBox || !headingBox ? false : headingBox.top >= navBox.bottom - 0.5;
    return {
      overflow,
      headingClearsNav,
      navBottom: navBox ? Math.round(navBox.bottom) : null,
      headingTop: headingBox ? Math.round(headingBox.top) : null,
      hasShell: !!shell,
    };
  });
}

async function shot(page, name) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function main() {
  const browser = await chromium.launch({
    executablePath: "/usr/local/bin/google-chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const results = [];
  let failed = 0;
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
    for (const [route, slug, kind] of [
      ["/vista-previa/servicios", "vista_previa_servicios", "preview"],
      ["/vista-previa/servicios?lang=en", "vista_previa_servicios_en", "preview"],
      ["/clasificados/comida-local", "comida_local", "public"],
      ["/clasificados/comida-local?lang=en", "comida_local_en", "public"],
      ["/admin/workspace/quick-sales", "quick_sales_cockpit", "admin"],
      ["/admin/login", "admin_login", "admin"],
    ]) {
      const url = `http://127.0.0.1:3000${route}`;
      const res = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      await page.waitForTimeout(700);
      await dismissCookie(page);
      const name = `gate9_local_v3_${slug}_${vp.name}`;
      const file = await shot(page, name);
      const metrics =
        kind === "preview"
          ? await measurePreviewClearance(page)
          : await page.evaluate(() => ({
              overflow: document.documentElement.scrollWidth - window.innerWidth,
              headingClearsNav: true,
              navBottom: null,
              headingTop: null,
              hasShell: false,
            }));
      const okOverflow = metrics.overflow <= 0;
      const okHeading = kind !== "preview" || metrics.headingClearsNav === true;
      if (!okOverflow || !okHeading) failed += 1;
      results.push({
        name,
        file,
        status: res?.status() ?? 0,
        overflow: metrics.overflow,
        headingClearsNav: metrics.headingClearsNav,
        navBottom: metrics.navBottom,
        headingTop: metrics.headingTop,
        title: await page.title(),
        url: page.url(),
        ok: okOverflow && okHeading,
      });
      console.log(
        `${name} status=${res?.status()} overflow=${metrics.overflow} headingClearsNav=${metrics.headingClearsNav} navBottom=${metrics.navBottom} headingTop=${metrics.headingTop}`,
      );
    }
    await page.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(OUT, "gate9_local_ux_receipts_v3.json"), JSON.stringify(results, null, 2));
  console.log("WROTE", results.length, "screenshots; failed=", failed);
  if (failed) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
