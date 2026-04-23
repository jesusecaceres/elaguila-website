import { test, expect } from "@playwright/test";

test.describe("En Venta browser smoke (no live publish credentials required)", () => {
  test.describe.configure({ timeout: 90_000 });

  test("landing → results → publish hub → free application shell", async ({ page }) => {
    await page.goto("/clasificados/en-venta?lang=es");
    await expect(page.getByRole("heading", { name: /En Venta/i })).toBeVisible();

    await page.getByRole("link", { name: /Ver todos los anuncios/i }).click();
    await expect(page).toHaveURL(/\/clasificados\/en-venta\/results/);
    await expect(page.getByRole("heading", { name: /En Venta/i })).toBeVisible();

    await page.goto("/clasificados/publicar/en-venta?lang=es");
    await expect(page.getByRole("heading", { name: /elige tu plan|pick your lane/i })).toBeVisible();

    await Promise.all([
      page.waitForURL(/\/clasificados\/publicar\/en-venta\/free/, { timeout: 60_000 }),
      page.getByRole("link", { name: /Gratis/i }).first().click(),
    ]);
    await expect(page.getByTestId("ev-free-publish-root")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Publicar — En Venta \(Gratis\)/i })).toBeVisible();

    await expect(page.getByRole("button", { name: /Publicar anuncio/i })).toBeDisabled();
  });

  test("results tolerates filter params without 5xx", async ({ page }) => {
    const r = await page.goto(
      "/clasificados/en-venta/results?lang=es&evDept=electronicos&sort=newest&pickup=1&free=1",
      { waitUntil: "domcontentloaded", timeout: 60_000 }
    );
    expect(r?.ok(), `results HTTP ${r?.status()}`).toBeTruthy();
    await expect(page.getByRole("heading", { name: /En Venta/i })).toBeVisible();
  });
});
