import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SELLER_EMAIL = process.env.SMOKE_SELLER_EMAIL ?? "smoke.seller@yourdomain.com";
const SELLER_PASSWORD = process.env.SMOKE_SELLER_PASSWORD ?? "LeonixSmoke!2026Seller";
const BUYER_EMAIL = process.env.SMOKE_BUYER_EMAIL ?? "smoke.buyer@yourdomain.com";
const BUYER_PASSWORD = process.env.SMOKE_BUYER_PASSWORD ?? "LeonixSmoke!2026Buyer";

/** Admin workspace uses `/admin/login` shared password cookie (not Supabase). */
const ADMIN_SITE_PASSWORD =
  process.env.ADMIN_PASSWORD ??
  process.env.SMOKE_ADMIN_SITE_PASSWORD ??
  process.env.SMOKE_ADMIN_PASSWORD ??
  "LeonixSmoke!2026Admin";

function authStorageKey(supabaseUrl: string): string {
  const ref = new URL(supabaseUrl).hostname.split(".")[0];
  return `sb-${ref}-auth-token`;
}

/** Matches dev-seed `ownerUserId` — real `auth.users.id` for FK-safe inquiries. */
async function resolveSellerOwnerIdForDevSeed(): Promise<string> {
  const sb = createClient(url!, anon!, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.auth.signInWithPassword({
    email: SELLER_EMAIL,
    password: SELLER_PASSWORD,
  });
  if (error || !data.user?.id) throw new Error(error?.message ?? "seller signInWithPassword failed");
  return data.user.id;
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
  const persisted = JSON.stringify(sess.session);
  await args.context.addInitScript(
    ([k, v]) => {
      try {
        localStorage.setItem(k, v);
      } catch {
        /* ignore */
      }
    },
    [storageKey, persisted] as const
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
    { k: storageKey, v: persisted }
  );
}

function byLabelInput(page: import("@playwright/test").Page, labelText: string) {
  return page.locator("label", { hasText: labelText }).first().locator("..").locator("input,textarea,select").first();
}

function sectionByH2(page: import("@playwright/test").Page, title: RegExp) {
  const h = page.getByRole("heading", { name: title });
  return page.locator("section", { has: h }).first();
}

function enVentaCityAutocompleteInput(page: import("@playwright/test").Page) {
  // CityAutocomplete in En Venta publish uses a `<div>` label, not a `<label>`.
  return page.locator('input[placeholder*="San José"], input[placeholder*="San Jose"]').first();
}

async function dismissCookieConsentIfPresent(page: import("@playwright/test").Page) {
  const consent = page.getByRole("dialog", { name: /Cookies y preferencias|Cookies & preferences/i });
  if (!(await consent.isVisible().catch(() => false))) return;
  const accept = consent.getByRole("button", { name: /Aceptar todo|Accept all/i });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
  } else {
    // fallback: reject non-essential
    await consent.getByRole("button", { name: /Rechazar lo no esencial|Reject non-essential/i }).click();
  }
  await expect(consent).toBeHidden({ timeout: 15_000 });
}

test.describe.configure({ timeout: 180_000 });

test.describe("En Venta auth finish-line smoke", () => {
  test.beforeAll(async () => {
    test.skip(!url || !anon || !service, "Missing Supabase env vars (url/anon/service)");
    const admin = createClient(url!, service!, { auth: { persistSession: false, autoRefreshToken: false } });
    async function ensureUser(email: string, password: string) {
      const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error && !String(error.message).toLowerCase().includes("already")) throw error;
    }
    await ensureUser(SELLER_EMAIL, SELLER_PASSWORD);
    await ensureUser(BUYER_EMAIL, BUYER_PASSWORD);
  });

  test("seller: publish (free) → detail → filtered results → dashboard → admin queue", async ({ page, context }) => {
    test.skip(!url || !anon, "Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");

    await seedSupabaseSession({
      page,
      context,
      supabaseUrl: url!,
      anonKey: anon!,
      email: SELLER_EMAIL,
      password: SELLER_PASSWORD,
    });

    const uniq = `EV_AUTH_${Date.now()}`;
    const title = `${uniq} iPhone 13`;
    const city = "San Francisco";
    const zip = "94102";

    await page.goto("/clasificados/publicar/en-venta/free?lang=es");
    await expect(page.getByTestId("ev-free-publish-root")).toBeVisible();

    // Category selection
    const cat = sectionByH2(page, /Categoría y artículo/i);
    const selects = cat.locator("select");
    await expect(selects.nth(0)).toBeVisible();
    await selects.nth(0).selectOption("electronicos");
    await expect(selects.nth(0)).toHaveValue("electronicos", { timeout: 15_000 });
    await expect(selects.nth(1)).toBeEnabled({ timeout: 15_000 });
    await selects.nth(1).selectOption("phones");
    await selects.nth(2).selectOption("phone");
    await selects.nth(3).selectOption("good");

    // Basic info
    await byLabelInput(page, "Título del anuncio").fill(title);
    await page.locator('input[aria-label="Monto"]').fill("199");
    await page.locator('input[aria-label="Monto"]').press("Tab");
    await byLabelInput(page, "Cantidad").fill("1");
    await byLabelInput(page, "Marca").fill("Apple");
    await byLabelInput(page, "Modelo").fill("A2633");
    await byLabelInput(page, "Descripción").fill(`Smoke publish test. ${uniq}. Incluye caja y cargador.`);

    // Location
    await enVentaCityAutocompleteInput(page).fill(city);
    await enVentaCityAutocompleteInput(page).press("Tab");
    await byLabelInput(page, "ZIP").fill(zip);

    // Fulfillment
    await page.getByLabel("Recogida local").check();
    await page.getByLabel("Punto de encuentro").check();
    await page.getByLabel("Entrega local").check();
    await page.getByLabel("Envío disponible").check();
    const fulfill = sectionByH2(page, /Entrega y envío|Fulfillment/i);
    const notes = fulfill.locator("textarea");
    await expect(notes.nth(0)).toBeVisible();
    await notes.nth(0).fill("Recogida en lugar público (cerca de downtown).");
    await notes.nth(1).fill("Estación de tren (zona pública).");
    await notes.nth(2).fill("Entrega local por $10 dentro de 5 millas.");
    await notes.nth(3).fill("Envío con tracking; pago por adelantado.");

    // Seller/contact
    await byLabelInput(page, "Tipo de vendedor").selectOption("individual");
    await byLabelInput(page, "Nombre para mostrar").fill("Smoke Seller");
    await byLabelInput(page, "Teléfono").fill("(415) 555-0199");
    await byLabelInput(page, "Correo").fill(SELLER_EMAIL);
    await byLabelInput(page, "WhatsApp").fill("(415) 555-0199");
    await byLabelInput(page, "Método de contacto preferido").selectOption("email");

    // Confirmations (required)
    await page.getByLabel(/Confirmo que la información del artículo/i).check();
    await page.getByLabel(/Confirmo que las fotos muestran el artículo real/i).check();
    await page.getByLabel(/Confirmo que mi anuncio respeta las reglas/i).check();

    // Publish
    await page.getByRole("button", { name: /Publicar anuncio/i }).click();
    const successPanel = page.getByTestId("ev-publish-success");
    const errorPanel = page.getByTestId("ev-publish-error");
    await Promise.race([
      successPanel.waitFor({ state: "visible", timeout: 90_000 }),
      errorPanel.waitFor({ state: "visible", timeout: 90_000 }),
    ]);
    if (await errorPanel.isVisible().catch(() => false)) {
      const txt = (await errorPanel.textContent().catch(() => ""))?.trim() || "unknown publish error";
      throw new Error(`Publish failed: ${txt}`);
    }

    const detail = page.getByTestId("ev-publish-success-detail");
    await Promise.all([
      page.waitForURL(/\/clasificados\/anuncio\/[0-9a-f-]{36}/i, { timeout: 60_000 }),
      detail.click(),
    ]);
    const detailUrl = page.url();
    const idMatch = /\/clasificados\/anuncio\/([0-9a-f-]{36})/i.exec(detailUrl);
    expect(idMatch?.[1]).toBeTruthy();
    const listingId = idMatch![1]!;

    // Detail reflects core fields
    await expect(page.getByRole("heading", { name: new RegExp(uniq, "i") })).toBeVisible({ timeout: 25_000 });
    await expect(page.getByText(city, { exact: false }).first()).toBeVisible();

    // Results discovery under matching filters + q
    await page.goto(`/clasificados/en-venta/results?lang=es&evDept=electronicos&evSub=phones&q=${encodeURIComponent(uniq)}&sort=newest`);
    await expect(page.locator(`a[href*="/clasificados/anuncio/${listingId}"]`).first()).toBeVisible({ timeout: 25_000 });

    // Seller dashboard shows listing (avoid matching hidden <option> text in filter dropdowns)
    await page.goto("/dashboard/mis-anuncios?lang=es");
    await expect(page.getByRole("heading", { name: title })).toBeVisible({ timeout: 60_000 });

    // Admin queue shows listing (shared password cookie gate)
    await page.goto("/admin/login");
    await page.locator('input[name="password"]').fill(ADMIN_SITE_PASSWORD);
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL(/\/admin(\/|$)/, { timeout: 20_000 });
    await page.goto("/admin/workspace/clasificados?category=en-venta");
    await expect(page.locator("tr", { hasText: uniq }).first()).toBeVisible({ timeout: 60_000 });
  });

  test("buyer: inquiry CTA on published En Venta listing", async ({ page, context, request }) => {
    test.setTimeout(120_000);
    test.skip(!url || !anon || !service, "Missing Supabase env vars (url/anon/service)");

    // Create a real row via dev-seed (service role) so buyer can message a seller reliably.
    const ownerUserId = await resolveSellerOwnerIdForDevSeed();
    const post = await request.post("/api/clasificados/en-venta/dev-seed-listing", {
      data: { action: "create", ownerUserId },
    });
    const raw = await post.text();
    expect(post.ok(), `seed failed ${post.status()}: ${raw}`).toBeTruthy();
    const body = JSON.parse(raw) as { ok?: boolean; listingId?: string; marker?: string };
    expect(body.ok).toBeTruthy();
    const listingId = String(body.listingId ?? "");
    const marker = String(body.marker ?? "");

    /** Same contract as `EnVentaCorreoModal` — proves `messages` insert + buyer JWT (avoids client session hydration flakes). */
    const buyerNode = createClient(url!, anon!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: buyerAuth, error: buyerErr } = await buyerNode.auth.signInWithPassword({
      email: BUYER_EMAIL,
      password: BUYER_PASSWORD,
    });
    expect(buyerErr, buyerErr?.message).toBeNull();
    const access = buyerAuth.session?.access_token;
    expect(access).toBeTruthy();
    const inq = await request.post("/api/clasificados/en-venta/inquiry", {
      headers: {
        Authorization: `Bearer ${access}`,
        "Content-Type": "application/json",
      },
      data: {
        listingId,
        message: `E2E buyer inquiry (API) ${Date.now()}`,
      },
    });
    const inqRaw = await inq.text();
    expect(inq.ok(), `inquiry API failed ${inq.status()}: ${inqRaw}`).toBeTruthy();

    await seedSupabaseSession({
      page,
      context,
      supabaseUrl: url!,
      anonKey: anon!,
      email: BUYER_EMAIL,
      password: BUYER_PASSWORD,
    });

    try {
      await page.goto(`/clasificados/anuncio/${encodeURIComponent(listingId)}?lang=es`);
      await dismissCookieConsentIfPresent(page);
      await expect(page.getByRole("heading", { name: new RegExp(marker, "i") })).toBeVisible({ timeout: 25_000 });

      await page.getByRole("button", { name: /Correo \(Leonix\)/i }).click();
      const correoDialog = page.getByRole("dialog", { name: /Contactar por correo|Email contact/i });
      await expect(correoDialog).toBeVisible({ timeout: 15_000 });
    } finally {
      await request.post("/api/clasificados/en-venta/dev-seed-listing", { data: { action: "delete", listingId } });
    }
  });
});

