import { test, expect } from "@playwright/test";

/**
 * Sample listings (no DB) — validates Clases/Comunidad public rail hides sold + AI insights.
 * Run with: npm run verify:community-preview:e2e (build + next start on 3005) or dev on matching baseURL.
 */
test.describe("Community anuncio public polish (sample listings)", () => {
  test("clases sample detail hides mark-sold and AI insights", async ({ page }) => {
    await page.goto("/clasificados/anuncio/clases-personal-1?lang=es");
    await expect(page.getByRole("button", { name: "Marcar como vendido" })).toHaveCount(0);
    await expect(page.getByText("LEONIX AI Insights")).toHaveCount(0);
  });

  test("comunidad sample detail hides mark-sold and AI insights", async ({ page }) => {
    await page.goto("/clasificados/anuncio/comunidad-personal-1?lang=es");
    await expect(page.getByRole("button", { name: "Marcar como vendido" })).toHaveCount(0);
    await expect(page.getByText("LEONIX AI Insights")).toHaveCount(0);
  });
});
