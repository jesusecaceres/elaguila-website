import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { mergeRestauranteDraft } from "@/app/clasificados/restaurantes/application/createEmptyRestauranteDraft";
import type { RestauranteDaySchedule } from "@/app/clasificados/restaurantes/application/restauranteListingApplicationModel";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const smokeSellerEmail = process.env.SMOKE_SELLER_EMAIL ?? "smoke.seller@yourdomain.com";
const smokeSellerPassword = process.env.SMOKE_SELLER_PASSWORD ?? "LeonixSmoke!2026Seller";
const adminSharedPassword = process.env.ADMIN_PASSWORD ?? process.env.SMOKE_ADMIN_PASSWORD ?? "LeonixSmoke!2026Admin";
const baseUrlForCookies = process.env.RESTAURANTES_E2E_BASE ?? "http://127.0.0.1:3017";

function authStorageKey(supabaseUrl: string): string {
  const ref = new URL(supabaseUrl).hostname.split(".")[0];
  return `sb-${ref}-auth-token`;
}

async function seedSupabaseBrowserSession(args: {
  page: import("@playwright/test").Page;
  context: import("@playwright/test").BrowserContext;
  supabaseUrl: string;
  sessionJson: string;
}) {
  const storageKey = authStorageKey(args.supabaseUrl);
  await args.context.addInitScript(
    ([k, v]) => {
      try {
        localStorage.setItem(k, v);
      } catch {
        /* ignore */
      }
    },
    [storageKey, args.sessionJson] as const,
  );
  await args.page.goto("/");
  await args.page.evaluate(
    ({ k, v }) => {
      try {
        localStorage.setItem(k, v);
      } catch {
        /* ignore */
      }
    },
    { k: storageKey, v: args.sessionJson },
  );
}

function openDay(): RestauranteDaySchedule {
  return { closed: false, openTime: "09:00", closeTime: "17:00" };
}

function buildPublishDraft(suffix: string) {
  const hero =
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=70";
  return mergeRestauranteDraft({
    draftListingId: `rx-e2e-publish-${suffix}`,
    businessName: `Leonix Smoke Rest ${suffix}`,
    businessType: "sit_down",
    primaryCuisine: "mexican",
    shortSummary: "Playwright publish smoke — real DB row.",
    cityCanonical: "San Francisco",
    zipCode: "94103",
    neighborhood: "Mission",
    serviceModes: ["dine_in"],
    heroImage: hero,
    phoneNumber: "+14155550199",
    monday: openDay(),
    tuesday: openDay(),
    wednesday: openDay(),
    thursday: openDay(),
    friday: openDay(),
    saturday: openDay(),
    sunday: openDay(),
  });
}

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

    const persisted = JSON.stringify(sess.session);
    await seedSupabaseBrowserSession({ page, context, supabaseUrl: url!, sessionJson: persisted });

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

test.describe.serial("Restaurantes end-to-end publish + admin (production build)", () => {
  const suffix = `${Date.now()}`;
  const draft = buildPublishDraft(suffix);
  let ownerId = "";
  let slug = "";
  let listingId = "";

  test.beforeAll(async () => {
    test.skip(!url || !anon || !service, "Requires NEXT_PUBLIC_SUPABASE_URL, ANON, SERVICE_ROLE_KEY");

    const browserAnon = createClient(url!, anon!);
    const { data: sess, error: sErr } = await browserAnon.auth.signInWithPassword({
      email: smokeSellerEmail,
      password: smokeSellerPassword,
    });
    if (sErr || !sess.user?.id) throw sErr ?? new Error("no seller user");
    ownerId = sess.user.id;
  });

  test.afterAll(async () => {
    if (!url || !service || !listingId) return;
    const admin = createClient(url!, service!, { auth: { persistSession: false, autoRefreshToken: false } });
    await admin.from("restaurantes_public_listings").delete().eq("id", listingId);
  });

  test("1–11 publish → discover → detail → dashboard → admin → suspend → unsuspend → republish (no duplicate)", async ({
    page,
    context,
    request,
  }) => {
    test.skip(!url || !anon || !service, "Requires NEXT_PUBLIC_SUPABASE_URL, ANON, SERVICE_ROLE_KEY");

    const browserAnon = createClient(url!, anon!);
    const { data: sess, error: sErr } = await browserAnon.auth.signInWithPassword({
      email: smokeSellerEmail,
      password: smokeSellerPassword,
    });
    if (sErr || !sess.session) throw sErr ?? new Error("no session");

    const persisted = JSON.stringify(sess.session);
    await seedSupabaseBrowserSession({ page, context, supabaseUrl: url!, sessionJson: persisted });

    const pub = await request.post("/api/clasificados/restaurantes/publish", {
      data: { draft, owner_user_id: ownerId, plan: "free", lang: "es" },
      headers: { "Content-Type": "application/json" },
    });
    const pubBody = await pub.text();
    expect(pub.status(), pubBody).toBe(200);
    const pubJson = (await pub.json()) as { ok?: boolean; slug?: string; resultsUrl?: string };
    expect(pubJson.ok).toBe(true);
    slug = String(pubJson.slug);
    expect(slug.length).toBeGreaterThan(0);
    const resultsUrlFromApi = pubJson.resultsUrl;
    expect(resultsUrlFromApi).toBeTruthy();

    const admin = createClient(url!, service!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: row, error: rErr } = await admin
      .from("restaurantes_public_listings")
      .select("id")
      .eq("draft_listing_id", draft.draftListingId)
      .maybeSingle();
    if (rErr || !row?.id) throw rErr ?? new Error("listing row not found after publish");
    listingId = row.id;

    await page.goto(`/clasificados/restaurantes/resultados?lang=es&q=${encodeURIComponent(draft.businessName)}&city=San+Francisco`);
    await expect(page.getByText(draft.businessName, { exact: true })).toBeVisible({ timeout: 20_000 });

    await page.goto(String(resultsUrlFromApi));
    await expect(page.getByText(draft.businessName, { exact: true })).toBeVisible({ timeout: 20_000 });

    await page.goto("/clasificados/restaurantes?lang=es");
    await expect(
      page.getByLabel(/Restaurantes recientes/i).getByText(draft.businessName, { exact: true }),
    ).toBeVisible({ timeout: 20_000 });

    await page.goto(`/clasificados/restaurantes/${encodeURIComponent(slug)}?lang=es`);
    await expect(
      page.locator("h1", { hasText: draft.businessName }).filter({ visible: true }).first(),
    ).toBeVisible({ timeout: 20_000 });
    const call = page.getByRole("link", { name: /llamar/i }).first();
    await expect(call).toBeVisible();
    const href = await call.getAttribute("href");
    expect(href ?? "").toMatch(/^tel:/i);

    await page.goto("/dashboard/restaurantes?lang=es");
    await expect(page.getByText(draft.businessName, { exact: true })).toBeVisible({ timeout: 20_000 });

    await page.goto("/admin/login");
    await page.locator('input[name="password"]').fill(adminSharedPassword);
    await page.getByRole("button", { name: /log in/i }).click();
    await page.waitForURL(/\/admin(\/|$)/);

    await page.goto("/admin/workspace/clasificados/restaurantes");
    await expect(page.getByText(draft.businessName)).toBeVisible({ timeout: 20_000 });

    const adminRow = page.locator("tr").filter({ has: page.getByRole("cell", { name: slug, exact: true }) });
    const suspendRespPromise = page.waitForResponse(
      (resp) =>
        resp.request().method() === "PATCH" &&
        resp.url().includes(`/api/admin/restaurantes/listings/${encodeURIComponent(listingId)}`),
    );
    await adminRow.getByRole("button", { name: "Suspender" }).click();
    const suspendResp = await suspendRespPromise;
    expect(suspendResp.ok(), `HTTP ${suspendResp.status()}`).toBeTruthy();

    const { data: suspendedRow, error: sRowErr } = await admin
      .from("restaurantes_public_listings")
      .select("status")
      .eq("id", listingId)
      .maybeSingle();
    if (sRowErr) throw sRowErr;
    expect(suspendedRow?.status).toBe("suspended");

    await page.goto(`/clasificados/restaurantes/${encodeURIComponent(slug)}?lang=es`);
    await expect(page.getByText(/Página no encontrada|Page not found/i)).toBeVisible();

    const suspendedApi = await request.get(`/clasificados/restaurantes/${encodeURIComponent(slug)}?lang=es`);
    const suspendedApiBody = await suspendedApi.text();
    expect(suspendedApi.status() === 404 || suspendedApi.status() === 200, `HTTP ${suspendedApi.status()}`).toBeTruthy();
    if (suspendedApi.status() === 200) {
      expect(suspendedApiBody).toMatch(/Página no encontrada|Page not found/i);
    }

    await page.goto("/admin/workspace/clasificados/restaurantes");
    const adminRow2 = page.locator("tr").filter({ has: page.getByRole("cell", { name: slug, exact: true }) });
    const unsuspendRespPromise = page.waitForResponse(
      (resp) =>
        resp.request().method() === "PATCH" &&
        resp.url().includes(`/api/admin/restaurantes/listings/${encodeURIComponent(listingId)}`),
    );
    await adminRow2.getByRole("button", { name: "Republicar (activo)" }).click();
    const unsuspendResp = await unsuspendRespPromise;
    expect(unsuspendResp.ok(), `HTTP ${unsuspendResp.status()}`).toBeTruthy();

    const { data: liveRow, error: lRowErr } = await admin
      .from("restaurantes_public_listings")
      .select("status")
      .eq("id", listingId)
      .maybeSingle();
    if (lRowErr) throw lRowErr;
    expect(liveRow?.status).toBe("published");

    await page.goto(`/clasificados/restaurantes/${encodeURIComponent(slug)}?lang=es`);
    await expect(page.getByText(/Página no encontrada|Page not found/i)).toHaveCount(0);

    const liveApi = await request.get(`/clasificados/restaurantes/${encodeURIComponent(slug)}?lang=es`);
    const liveApiBody = await liveApi.text();
    expect(liveApi.status(), liveApiBody.slice(0, 500)).toBe(200);
    expect(liveApiBody).toMatch(/tel:/i);
    await expect(
      page.locator("h1", { hasText: draft.businessName }).filter({ visible: true }).first(),
    ).toBeVisible({ timeout: 20_000 });

    const draftRepublish = mergeRestauranteDraft({
      ...draft,
      shortSummary: "Republish smoke — same draft_listing_id.",
    });
    const pub2 = await request.post("/api/clasificados/restaurantes/publish", {
      data: { draft: draftRepublish, owner_user_id: ownerId, plan: "free", lang: "es" },
      headers: { "Content-Type": "application/json" },
    });
    const pub2Body = await pub2.text();
    expect(pub2.status(), pub2Body).toBe(200);
    const pub2Json = (await pub2.json()) as { slug?: string };
    expect(pub2Json.slug).toBe(slug);

    const { data: rows, error: cErr } = await admin
      .from("restaurantes_public_listings")
      .select("id")
      .eq("draft_listing_id", draft.draftListingId);
    if (cErr) throw cErr;
    expect((rows ?? []).length).toBe(1);
  });

  test("12 live path: no Demo explícito on landing/results after publish", async ({ page }) => {
    await page.goto("/clasificados/restaurantes?lang=es");
    await expect(page.getByText("Demo explícito")).toHaveCount(0);
    await page.goto("/clasificados/restaurantes/resultados?lang=es");
    await expect(page.getByText("Demo explícito")).toHaveCount(0);
  });
});
