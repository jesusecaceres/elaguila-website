import { test, expect, type Locator, type Page } from "@playwright/test";

const NORCAL_RE = /NorCal/i;
const RAW_SOCIAL_RE = /https?:\/\/(www\.)?(facebook|instagram|tiktok|youtube|linkedin|twitter|x)\.com/i;

/** Known-broken Unsplash handshake used elsewhere in parity tests — must not appear on discovery cards. */
const UNSPLASH_BROKEN_HANDSHAKE = "images.unsplash.com/photo-1521791136064-7986c2920216";

async function assertNoNorCalOrRawSocial(page: Page) {
  await expect(page.locator("body")).not.toContainText(NORCAL_RE);
  await expect(page.locator("body")).not.toContainText(RAW_SOCIAL_RE);
}

/** Production-safe thumbnails: native img with real src, not blob:, and actually paints pixels. */
async function assertDiscoveryCardPhotoLoads(card: Locator) {
  const photo = card.getByTestId("community-discovery-card-photo");
  await expect(photo).toBeVisible({ timeout: 30_000 });
  const src = await photo.getAttribute("src");
  expect(src, "discovery card photo must have src").toBeTruthy();
  expect(src!.trim().length, "discovery card photo src must be non-empty").toBeGreaterThan(3);
  expect(src!.startsWith("blob:"), "public discovery cards must not use blob: URLs").toBe(false);
  expect(src, "avoid known-broken Unsplash placeholder on discovery cards").not.toContain(UNSPLASH_BROKEN_HANDSHAKE);
  await expect
    .poll(
      async () => {
        return photo.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0 && el.naturalHeight > 0);
      },
      { timeout: 20_000 },
    )
    .toBe(true);
}

test.describe("Clases y Comunidad discovery cards", () => {
  test("clases landing shows discovery recent section", async ({ page }) => {
    await page.goto("/clasificados/clases?lang=es");
    await expect(page.getByTestId("community-discovery-landing-recent")).toBeVisible({ timeout: 30_000 });
    await assertNoNorCalOrRawSocial(page);
    const cards = page.getByTestId("community-discovery-listing-card");
    const n = await cards.count();
    if (n > 0) {
      await expect(cards.first().locator(`a[href*="/clasificados/anuncio/"]`).first()).toBeVisible();
      await assertDiscoveryCardPhotoLoads(cards.first());
      await expect(cards.first().getByRole("link", { name: /Ver clase|View class/i })).toBeVisible();
    }
  });

  test("clases results shows discovery grid or empty state", async ({ page }) => {
    await page.goto("/clasificados/clases/resultados?lang=es");
    await assertNoNorCalOrRawSocial(page);
    const grid = page.getByTestId("community-discovery-results-grid");
    const empty = page.getByText(/No hay anuncios con estos filtros|No listings match these filters/i);
    await expect(grid.or(empty)).toBeVisible({ timeout: 30_000 });
    if (await grid.isVisible()) {
      const cards = page.getByTestId("community-discovery-listing-card");
      await expect(cards.first()).toBeVisible({ timeout: 30_000 });
      if ((await cards.count()) > 0) {
        await expect(cards.first().locator(`a[href*="/clasificados/anuncio/"]`).first()).toBeVisible();
        await assertDiscoveryCardPhotoLoads(cards.first());
      }
    }
  });

  test("comunidad landing shows discovery recent section", async ({ page }) => {
    await page.goto("/clasificados/comunidad?lang=es");
    await expect(page.getByTestId("community-discovery-landing-recent")).toBeVisible({ timeout: 30_000 });
    await assertNoNorCalOrRawSocial(page);
    const cards = page.getByTestId("community-discovery-listing-card");
    if ((await cards.count()) > 0) {
      await expect(cards.first().locator(`a[href*="/clasificados/anuncio/"]`).first()).toBeVisible();
      await assertDiscoveryCardPhotoLoads(cards.first());
      await expect(cards.first().getByRole("link", { name: /Ver evento|View event/i })).toBeVisible();
    }
  });

  test("comunidad results shows discovery grid or empty state", async ({ page }) => {
    await page.goto("/clasificados/comunidad/resultados?lang=es");
    await assertNoNorCalOrRawSocial(page);
    const grid = page.getByTestId("community-discovery-results-grid");
    const empty = page.getByText(/No hay anuncios con estos filtros|No listings match these filters/i);
    await expect(grid.or(empty)).toBeVisible({ timeout: 30_000 });
    if (await grid.isVisible()) {
      const cards = page.getByTestId("community-discovery-listing-card");
      if ((await cards.count()) > 0) {
        await expect(cards.first().locator(`a[href*="/clasificados/anuncio/"]`).first()).toBeVisible();
        await assertDiscoveryCardPhotoLoads(cards.first());
      }
    }
  });

  test("clases results search finds organizer text", async ({ page }) => {
    await page.goto("/clasificados/clases/resultados?lang=es&q=Academia");
    await assertNoNorCalOrRawSocial(page);
    const grid = page.getByTestId("community-discovery-results-grid");
    await expect(grid.or(page.getByText(/No hay anuncios con estos filtros|No listings match these filters/i))).toBeVisible({
      timeout: 30_000,
    });
    if (await grid.isVisible().catch(() => false)) {
      await expect(page.getByTestId("community-discovery-listing-card").first()).toContainText(/Academia|Leonix/i);
    }
  });
});
