import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SELLER_EMAIL = process.env.SMOKE_SELLER_EMAIL ?? "smoke.seller@yourdomain.com";
const SELLER_PASSWORD = process.env.SMOKE_SELLER_PASSWORD ?? "LeonixSmoke!2026Seller";
const BUYER_EMAIL = process.env.SMOKE_BUYER_EMAIL ?? "smoke.buyer@yourdomain.com";
const BUYER_PASSWORD = process.env.SMOKE_BUYER_PASSWORD ?? "LeonixSmoke!2026Buyer";
const ADMIN_PASSWORD =
  process.env.ADMIN_PASSWORD ?? process.env.SMOKE_ADMIN_SITE_PASSWORD ?? process.env.SMOKE_ADMIN_PASSWORD ?? "";

test.describe.configure({ mode: "serial" });

const createdIds: string[] = [];

function authStorageKey(supabaseUrl: string): string {
  const ref = new URL(supabaseUrl).hostname.split(".")[0];
  return `sb-${ref}-auth-token`;
}

async function seedSupabaseSession(args: {
  page: import("@playwright/test").Page;
  context: import("@playwright/test").BrowserContext;
  supabaseUrl: string;
  anonKey: string;
  email: string;
  password: string;
}) {
  const browserAnon = createClient(args.supabaseUrl, args.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: sess, error: sErr } = await browserAnon.auth.signInWithPassword({
    email: args.email,
    password: args.password,
  });
  if (sErr || !sess.session) throw new Error(sErr?.message ?? "signInWithPassword failed");

  const storageKey = authStorageKey(args.supabaseUrl);
  /** Same shape as `e2e/empleos/empleos-manual-qa-seed.spec.ts` — Supabase JS expects the raw session JSON. */
  const persisted = JSON.stringify(sess.session);
  await args.context.addInitScript(
    ([k, v]) => {
      try {
        localStorage.setItem(k, v);
      } catch {
        /* ignore */
      }
    },
    [storageKey, persisted] as const,
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
    { k: storageKey, v: persisted },
  );
}

async function sellerAccessToken(): Promise<string> {
  if (!url || !anon) throw new Error("missing supabase url/anon");
  const c = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await c.auth.signInWithPassword({ email: SELLER_EMAIL, password: SELLER_PASSWORD });
  if (error || !data.session?.access_token) throw new Error(error?.message ?? "no seller session");
  return data.session.access_token;
}

async function createAndActivate(
  request: import("@playwright/test").APIRequestContext,
  token: string,
  lane: "privado" | "negocios",
  listing: Record<string, unknown>,
): Promise<string> {
  const cr = await request.post("/api/clasificados/autos/listings", {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    data: { listing, lane, lang: "es" },
  });
  expect(cr.ok(), await cr.text()).toBeTruthy();
  const cj = (await cr.json()) as { ok?: boolean; id?: string };
  expect(cj.ok).toBe(true);
  expect(cj.id).toBeTruthy();
  const id = cj.id as string;

  const ck = await request.post("/api/clasificados/autos/checkout", {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    data: { listingId: id, lang: "es" },
  });
  expect(ck.ok(), await ck.text()).toBeTruthy();
  const kj = (await ck.json()) as { ok?: boolean; internalBypass?: boolean };
  expect(kj.ok).toBe(true);
  expect(kj.internalBypass).toBe(true);
  return id;
}

test.describe("Autos go-live runtime (production server + internal payment bypass)", () => {
  test.skip(!url || !anon, "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  test.skip(!ADMIN_PASSWORD, "Set ADMIN_PASSWORD in .env.local for admin UI proof");

  test("closure: API + landing + results + filters + detail + CTAs + dashboard + admin + gating + buyer", async ({
    page,
    context,
    request,
  }) => {
    const token = await sellerAccessToken();
    const suffix = `${Date.now()}`;

    const privTitle = `E2E-AUTOS-GO-LIVE-PRIV-${suffix}`;
    const negTitle = `E2E-AUTOS-GO-LIVE-NEG-${suffix}`;

    const privListing = {
      vehicleTitle: privTitle,
      stockNumber: `STK-PRIV-${suffix}`,
      year: 2019,
      make: "Honda",
      model: "Accord",
      condition: "used",
      price: 17999,
      mileage: 50000,
      city: "San Jose",
      state: "CA",
      zip: "95112",
      bodyStyle: "Sedan",
      transmission: "Automatic",
      drivetrain: "FWD",
      fuelType: "Gasoline",
      description: `E2E private smoke ${suffix}`,
      dealerName: "Private E2E Seller",
      dealerPhoneOffice: "4085550111",
      dealerEmail: "autos-e2e-priv@example.com",
      dealerWhatsapp: "+14085550111",
      privadoSiteMessageEnabled: true,
      heroImages: ["/logo.png"],
    };

    const negListing = {
      vehicleTitle: negTitle,
      stockNumber: `STK-NEG-${suffix}`,
      year: 2022,
      make: "Toyota",
      model: "RAV4",
      condition: "used",
      price: 32999,
      mileage: 12000,
      city: "San Jose",
      state: "CA",
      zip: "95112",
      bodyStyle: "SUV",
      transmission: "Automatic",
      drivetrain: "AWD",
      fuelType: "Gasoline",
      description: `E2E dealer smoke ${suffix}`,
      dealerName: "Dealer E2E QA",
      dealerPhoneOffice: "4085550222",
      dealerWhatsapp: "+14085550222",
      dealerAddress: "2 Market St, San Jose, CA",
      heroImages: ["/logo.png"],
    };

    const privId = await createAndActivate(request, token, "privado", privListing);
    const negId = await createAndActivate(request, token, "negocios", negListing);
    createdIds.push(privId, negId);

    const draftCr = await request.post("/api/clasificados/autos/listings", {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      data: {
        listing: { ...privListing, vehicleTitle: `E2E-AUTOS-DRAFT-ONLY-${suffix}`, make: "Acura", model: "TLX" },
        lane: "privado",
        lang: "es",
      },
    });
    expect(draftCr.ok()).toBeTruthy();
    const draftJ = (await draftCr.json()) as { ok?: boolean; id?: string };
    expect(draftJ.ok).toBe(true);
    const draftId = draftJ.id as string;
    createdIds.push(draftId);

    const pub = await request.get("/api/clasificados/autos/public/listings");
    expect(pub.ok()).toBeTruthy();
    const pubJ = (await pub.json()) as { ok?: boolean; listings?: { id: string }[] };
    expect(pubJ.ok).toBe(true);
    const pubIds = (pubJ.listings ?? []).map((l) => l.id);
    expect(pubIds).toContain(privId);
    expect(pubIds).toContain(negId);
    expect(pubIds).not.toContain(draftId);

    const detNeg = await request.get(`/api/clasificados/autos/public/listings/${encodeURIComponent(negId)}?lang=es`);
    expect(detNeg.ok()).toBeTruthy();

    const landingListings = page.waitForResponse(
      (res) =>
        res.url().includes("/api/clasificados/autos/public/listings") &&
        res.request().method() === "GET" &&
        res.status() === 200,
    );
    await page.goto("/clasificados/autos?lang=es");
    await landingListings;
    await expect(page.getByText(privTitle, { exact: true }).first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(negTitle, { exact: true }).first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/\bBoost\b/i)).toHaveCount(0);

    await page.goto(
      `/clasificados/autos/resultados?lang=es&make=Honda&model=Accord&city=San+Jose&zip=95112&bodyStyle=Sedan&seller=private`,
    );
    await expect(page.getByText(privTitle, { exact: true }).first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(negTitle, { exact: true })).toHaveCount(0);

    await page.goto(`/clasificados/autos/resultados?lang=es&make=Toyota&seller=dealer&bodyStyle=SUV`);
    await expect(page.getByText(negTitle, { exact: true }).first()).toBeVisible({ timeout: 60_000 });

    await page.goto(`/clasificados/autos/resultados?lang=es&q=${encodeURIComponent("E2E-AUTOS-GO-LIVE")}`);
    await expect(page.getByText(negTitle, { exact: true }).first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(privTitle, { exact: true }).first()).toBeVisible({ timeout: 60_000 });

    await page.goto(`/clasificados/autos/vehiculo/${encodeURIComponent(negId)}?lang=es`);
    await expect(page.getByRole("heading", { name: negTitle })).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('a[href^="tel:"]').first()).toBeVisible();
    await expect(page.locator('a[href*="wa.me"]').first()).toBeVisible();
    await expect(page.getByText(/\bBoost\b/i)).toHaveCount(0);

    const privApi = await request.get(`/api/clasificados/autos/public/listings/${encodeURIComponent(privId)}?lang=es`);
    expect(privApi.ok()).toBeTruthy();
    const privApiJson = (await privApi.json()) as { listing?: { stockNumber?: string; price?: number } };
    expect(privApiJson.listing?.stockNumber).toBe(`STK-PRIV-${suffix}`);

    await page.goto(`/clasificados/autos/vehiculo/${encodeURIComponent(privId)}?lang=es`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText(/No encontramos|could not find/i)).toHaveCount(0);
    const privLiveJson = await page.evaluate(async (id) => {
      const r = await fetch(`/api/clasificados/autos/public/listings/${encodeURIComponent(id)}?lang=es`);
      return { status: r.status, json: (await r.json()) as { ok?: boolean; listing?: { stockNumber?: string } } };
    }, privId);
    expect(privLiveJson.status).toBe(200);
    expect(privLiveJson.json.ok).toBe(true);
    expect(privLiveJson.json.listing?.stockNumber).toBe(`STK-PRIV-${suffix}`);
    const privMailto = page.locator('a[href^="mailto:"]').first();
    await expect(privMailto).toBeVisible({ timeout: 60_000 });
    await expect(privMailto).toHaveAttribute("href", /autos-e2e-priv/i);
    await expect(page.getByTestId("ev-listing-report-open")).toBeVisible();
    await page.getByRole("link", { name: /Volver a resultados|Back to results/i }).click();
    await expect(page).toHaveURL(/\/clasificados\/autos\/resultados/);

    await seedSupabaseSession({ page, context, supabaseUrl: url!, anonKey: anon!, email: SELLER_EMAIL, password: SELLER_PASSWORD });
    await page.goto("/dashboard/mis-anuncios?lang=es");
    await expect(page.getByText("Autos Clasificados (Leonix)", { exact: false })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(privTitle, { exact: true }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Ver público|View live/i }).first()).toBeVisible();

    await page.goto("/admin/login");
    await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /log in/i }).click();
    await page.waitForURL(/\/admin(\/|$)/, { timeout: 30_000 });
    await page.goto("/admin/workspace/clasificados/autos");
    await expect(page.getByText("Autos — anuncios de pago", { exact: false })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(negTitle, { exact: true }).first()).toBeVisible();

    const popupPromise = page.waitForEvent("popup");
    await page.locator("tr", { hasText: negTitle }).getByRole("link", { name: "Ver público" }).click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(new RegExp(`/clasificados/autos/vehiculo/${negId}`));
    await popup.close();

    const unpub = await request.post(`/api/clasificados/autos/listings/${encodeURIComponent(privId)}/unpublish`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(unpub.ok()).toBeTruthy();
    const after = await request.get("/api/clasificados/autos/public/listings");
    const afterJ = (await after.json()) as { listings?: { id: string }[] };
    expect((afterJ.listings ?? []).map((l) => l.id)).not.toContain(privId);
    const det404 = await request.get(`/api/clasificados/autos/public/listings/${encodeURIComponent(privId)}?lang=es`);
    expect(det404.status()).toBe(404);

    await seedSupabaseSession({ page, context, supabaseUrl: url!, anonKey: anon!, email: BUYER_EMAIL, password: BUYER_PASSWORD });
    await page.goto(`/clasificados/autos/vehiculo/${encodeURIComponent(negId)}?lang=es`);
    await expect(page.getByTestId("ev-listing-report-open")).toBeVisible();
    await expect(page.getByText(/\bBoost\b/i)).toHaveCount(0);
  });
});

test.afterAll(async () => {
  if (!url || !service || createdIds.length === 0) return;
  const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  await admin.from("autos_classifieds_listings").delete().in("id", [...new Set(createdIds)]);
});
