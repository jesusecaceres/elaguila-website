import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const smokeSellerEmail = process.env.SMOKE_SELLER_EMAIL ?? "smoke.seller@yourdomain.com";
const smokeSellerPassword = process.env.SMOKE_SELLER_PASSWORD ?? "LeonixSmoke!2026Seller";
const adminSharedPassword = process.env.ADMIN_PASSWORD ?? process.env.SMOKE_ADMIN_PASSWORD ?? "LeonixSmoke!2026Admin";
const baseUrlForCookies = process.env.RESTAURANTES_E2E_BASE ?? "http://127.0.0.1:3017";

test.describe("Restaurantes smoke (production build)", () => {
  test("landing → results → publish (no demo explícito banner)", async ({ page }) => {
    await page.goto("/clasificados/restaurantes?lang=es");
    await expect(page.locator("h1").first()).toContainText(/restaurantes/i);
    await expect(page.getByText("Demo explícito")).toHaveCount(0);

    await page.goto("/clasificados/restaurantes/resultados?lang=es");
    await expect(page.locator("h1").first()).toContainText(/restaurantes/i);
    await expect(page.getByText("Demo explícito")).toHaveCount(0);

    await page.goto("/publicar/restaurantes?lang=es&plan=free");
    await expect(page.getByRole("heading", { name: /Publicar restaurante/i })).toBeVisible();
  });

  test("publish API rejects empty body (no fake success)", async ({ request }) => {
    const res = await request.post("/api/clasificados/restaurantes/publish", {
      data: {},
      headers: { "Content-Type": "application/json" },
    });
    expect(res.status()).toBe(400);
    const j = (await res.json()) as { error?: string };
    expect(j.error).toBe("missing_draft");
  });

  test("signed-in seller can open dashboard route (session via SMOKE_SELLER creds)", async ({ page, context }) => {
    test.skip(!url || !anon, "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");

    const browserAnon = createClient(url!, anon!);
    const { data: sess, error: sErr } = await browserAnon.auth.signInWithPassword({
      email: smokeSellerEmail,
      password: smokeSellerPassword,
    });
    if (sErr || !sess.session) throw sErr ?? new Error("no session");

    const ref = new URL(url!).hostname.split(".")[0];
    const storageKey = `sb-${ref}-auth-token`;
    const persisted = JSON.stringify({
      currentSession: sess.session,
      expiresAt: sess.session.expires_at,
    });
    await context.addInitScript(
      ([k, v]) => {
        try {
          localStorage.setItem(k, v);
        } catch {
          /* ignore */
        }
      },
      [storageKey, persisted] as const,
    );

    await page.goto("/dashboard/restaurantes?lang=es");
    await expect(page.getByText(/Mis restaurantes|restaurantes/i).first()).toBeVisible({ timeout: 25_000 });
  });

  test("admin shared-password login works (ADMIN_PASSWORD / SMOKE_ADMIN_PASSWORD)", async ({ page }) => {
    await page.goto("/admin/login");
    await page.locator('input[name="password"]').fill(adminSharedPassword);
    await page.getByRole("button", { name: /log in/i }).click();
    await page.waitForURL(/\/admin(\/|$)/);
    await expect(page).toHaveURL(/\/admin(\/|$)/);
  });

  test("admin can open Restaurantes workspace with leonix_admin cookie", async ({ page, context }) => {
    await context.addCookies([
      {
        name: "leonix_admin",
        value: "1",
        url: baseUrlForCookies,
        httpOnly: true,
        sameSite: "Lax",
      },
    ]);
    await page.goto("/admin/workspace/clasificados/restaurantes");
    await expect(page.getByRole("heading").first()).toBeVisible();
  });
});
