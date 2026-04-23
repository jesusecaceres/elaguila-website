import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SMOKE_SELLER_EMAIL = process.env.SMOKE_SELLER_EMAIL ?? "smoke.seller@yourdomain.com";
const SMOKE_SELLER_PASSWORD = process.env.SMOKE_SELLER_PASSWORD ?? "LeonixSmoke!2026Seller";

async function smokeSellerOwnerIdForSeed(): Promise<string> {
  if (!url || !anon) throw new Error("missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const sb = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.auth.signInWithPassword({
    email: SMOKE_SELLER_EMAIL,
    password: SMOKE_SELLER_PASSWORD,
  });
  if (error || !data.user?.id) throw new Error(error?.message ?? "smoke seller signInWithPassword failed");
  return data.user.id;
}

/**
 * Proves persisted En Venta rows flow through public detail + results filters.
 * Uses gated server route `POST /api/clasificados/en-venta/dev-seed-listing` (service role),
 * enabled only when `EN_VENTA_DEV_PUBLISH=1` (set by Playwright webServer for local runs).
 *
 * This does not replace a full signed-in publish wizard proof; it proves the same post-persist
 * surfaces the publish pipeline targets.
 */
test.describe("En Venta seeded DB trace (dev API)", () => {
  test.describe.configure({ timeout: 120_000 });

  test.beforeAll(async () => {
    if (!url || !service) return;
    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await admin.auth.admin.createUser({
      email: SMOKE_SELLER_EMAIL,
      password: SMOKE_SELLER_PASSWORD,
      email_confirm: true,
    });
    if (error && !String(error.message).toLowerCase().includes("already")) throw error;
  });

  test("detail + filtered results for a real listings row, then cleanup", async ({ page, request }) => {
    const ownerUserId = await smokeSellerOwnerIdForSeed();
    const post = await request.post("/api/clasificados/en-venta/dev-seed-listing", {
      data: { action: "create", ownerUserId },
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
