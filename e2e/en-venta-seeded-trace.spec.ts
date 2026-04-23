import { test, expect } from "@playwright/test";

/**
 * Proves persisted En Venta rows flow through public detail + results filters.
 * Uses gated server route `POST /api/clasificados/en-venta/dev-seed-listing` (service role),
 * enabled only when `EN_VENTA_DEV_PUBLISH=1` (set by Playwright webServer for local runs).
 *
 * This does not replace a full signed-in publish wizard proof; it proves the same post-persist
 * surfaces the publish pipeline targets.
 */
test.describe("En Venta seeded DB trace (dev API)", () => {
  test("detail + filtered results for a real listings row, then cleanup", async ({ page, request }) => {
    const post = await request.post("/api/clasificados/en-venta/dev-seed-listing", {
      data: { action: "create" },
    });
    const raw = await post.text();
    let body: { ok?: boolean; listingId?: string; marker?: string; error?: string };
    try {
      body = JSON.parse(raw) as typeof body;
    } catch {
      body = {};
    }

    if (post.status() === 404 && body.error === "disabled") {
      test.skip(true, "EN_VENTA_DEV_PUBLISH not enabled on server");
    }
    if (post.status() === 503) {
      test.skip(true, "Supabase service role not configured for dev-seed");
    }
    expect(post.ok(), `seed failed ${post.status()}: ${raw}`).toBeTruthy();
    expect(body.ok).toBeTruthy();
    const listingId = String(body.listingId ?? "");
    const marker = String(body.marker ?? "");
    expect(listingId.length).toBeGreaterThan(10);
    expect(marker).toMatch(/^EV_E2E_/);

    try {
      await page.goto(`/clasificados/anuncio/${encodeURIComponent(listingId)}?lang=es`);
      await expect(page.getByRole("heading", { name: new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") })).toBeVisible();

      const q = encodeURIComponent(marker);
      await page.goto(
        `/clasificados/en-venta/results?lang=es&evDept=electronicos&evSub=phones&q=${q}&sort=newest`
      );
      await expect(page.locator(`a[href*="/clasificados/anuncio/${listingId}"]`).first()).toBeVisible();

      /** Hub is editorial + CTAs; inventory lives on results — prove landing → results still finds the row. */
      await page.goto("/clasificados/en-venta?lang=es");
      await expect(page.getByRole("heading", { name: /En Venta/i })).toBeVisible();
      await page.getByRole("link", { name: /Ver todos los anuncios/i }).click();
      await expect(page).toHaveURL(/\/clasificados\/en-venta\/results/);
      await page.goto(`/clasificados/en-venta/results?lang=es&evDept=electronicos&evSub=phones&q=${q}&sort=newest`);
      await expect(page.locator(`a[href*="/clasificados/anuncio/${listingId}"]`).first()).toBeVisible();
    } finally {
      const del = await request.post("/api/clasificados/en-venta/dev-seed-listing", {
        data: { action: "delete", listingId },
      });
      expect(del.ok(), await del.text()).toBeTruthy();
    }
  });
});
