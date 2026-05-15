import { test, expect } from "@playwright/test";

const NORCAL_RE = /NorCal/i;
const RAW_SOCIAL_RE = /https?:\/\/(www\.)?(facebook|instagram|tiktok|youtube|linkedin|twitter|x)\.com/i;

async function assertNoNorCalOrRawSocial(page: import("@playwright/test").Page) {
  await expect(page.locator("body")).not.toContainText(NORCAL_RE);
  await expect(page.locator("body")).not.toContainText(RAW_SOCIAL_RE);
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
      await expect(cards.first().locator("img").first()).toBeVisible();
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
      if ((await cards.count()) > 0) {
        await expect(cards.first().locator(`a[href*="/clasificados/anuncio/"]`).first()).toBeVisible();
        await expect(cards.first().locator("img").first()).toBeVisible();
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
      await expect(cards.first().locator("img").first()).toBeVisible();
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
