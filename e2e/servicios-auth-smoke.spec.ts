import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import * as fs from "node:fs";
import * as path from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SELLER_EMAIL = process.env.SMOKE_SELLER_EMAIL ?? "smoke.seller@yourdomain.com";
const SELLER_PASSWORD = process.env.SMOKE_SELLER_PASSWORD ?? "LeonixSmoke!2026Seller";
const BUYER_EMAIL = process.env.SMOKE_BUYER_EMAIL ?? "smoke.buyer@yourdomain.com";
const BUYER_PASSWORD = process.env.SMOKE_BUYER_PASSWORD ?? "LeonixSmoke!2026Buyer";
/** Admin workspace uses `/admin/login` shared password cookie, not Supabase. */
const ADMIN_SITE_PASSWORD = process.env.ADMIN_PASSWORD ?? process.env.SMOKE_ADMIN_SITE_PASSWORD;

function authStorageKey(supabaseUrl: string): string {
  const ref = new URL(supabaseUrl).hostname.split(".")[0];
  return `sb-${ref}-auth-token`;
}

async function seedSupabaseSession(
  page: import("@playwright/test").Page,
  context: import("@playwright/test").BrowserContext,
  supabaseUrl: string,
  anonKey: string,
  email: string,
  password: string,
) {
  const browserAnon = createClient(supabaseUrl, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: sess, error: sErr } = await browserAnon.auth.signInWithPassword({ email, password });
  if (sErr || !sess.session) {
    throw new Error(sErr?.message ?? "signInWithPassword failed");
  }
  const storageKey = authStorageKey(supabaseUrl);
  const persisted = JSON.stringify(sess.session);
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
  await page.goto("/");
  await page.evaluate(
    ({ k, v }) => {
      try {
        localStorage.setItem(k, v);
      } catch {
        /* ignore */
      }
    },
    { k: storageKey, v: persisted },
  );
  return sess;
}

async function publishServiciosWithBearer(
  request: import("@playwright/test").APIRequestContext,
  token: string,
  businessName: string,
): Promise<{ slug: string }> {
  const fixturePath = path.join(process.cwd(), "scripts", "fixtures", "servicios-smoke-publish-state.json");
  const state = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as Record<string, unknown>;
  state.businessName = businessName;
  const pub = await request.post("/api/clasificados/servicios/publish", {
    data: { state, lang: "es" },
    headers: { Authorization: `Bearer ${token}` },
  });
  const pubText = await pub.text();
  expect(pub.ok(), `publish failed ${pub.status()}: ${pubText}`).toBeTruthy();
  const json = JSON.parse(pubText) as { ok?: boolean; slug?: string };
  expect(json.ok).toBeTruthy();
  return { slug: String(json.slug) };
}

test.describe.configure({ mode: "serial" });
test.describe.configure({ timeout: 120_000 });

test.describe("Servicios authenticated smoke", () => {
  test.beforeAll(async () => {
    if (!url || !service) return;
    const admin = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    async function ensureUser(email: string, password: string) {
      const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error && !String(error.message).toLowerCase().includes("already")) {
        throw error;
      }
    }
    await ensureUser(SELLER_EMAIL, SELLER_PASSWORD);
    await ensureUser(BUYER_EMAIL, BUYER_PASSWORD);
  });

  test("seller: bearer publish → dashboard table row + public detail", async ({ page, context, request }) => {
    test.skip(!url || !anon || !service, "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY");

    await seedSupabaseSession(page, context, url!, anon!, SELLER_EMAIL, SELLER_PASSWORD);

    const sb = createClient(url!, anon!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: sess } = await sb.auth.signInWithPassword({ email: SELLER_EMAIL, password: SELLER_PASSWORD });
    if (!sess.session) throw new Error("no session for API");
    const token = sess.session.access_token;

    const marker = `SellerDash ${Date.now()}`;
    const { slug } = await publishServiciosWithBearer(request, token, marker);

    await page.goto("/dashboard/servicios?lang=es");
    await expect(page.getByText(/Mis vitrinas Servicios|My Servicios showcases/i).first()).toBeVisible({ timeout: 60_000 });
    const row = page.locator("table tbody tr").filter({ hasText: slug });
    await expect(row.first()).toBeVisible({ timeout: 30_000 });
    await expect(row.first()).toContainText(marker);

    await page.goto(`/clasificados/servicios/${encodeURIComponent(slug)}?lang=es`);
    const esc = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await expect(page).toHaveTitle(new RegExp(esc));
  });

  test("landing: newest published row appears in Recientes strip (exact slug link)", async ({ page, request }) => {
    test.skip(!url || !anon || !service, "Set Supabase env");

    const sb = createClient(url!, anon!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: sess } = await sb.auth.signInWithPassword({ email: SELLER_EMAIL, password: SELLER_PASSWORD });
    if (!sess.session) throw new Error("no session for API");
    const { slug } = await publishServiciosWithBearer(request, sess.session.access_token, `LandingStrip ${Date.now()}`);

    await page.goto("/clasificados/servicios?lang=es");
    const recent = page.locator("section[aria-labelledby=\"servicios-recientes-heading\"]");
    await expect(recent.locator(`[data-servicios-recent-slug="${slug}"]`).first()).toBeVisible({ timeout: 45_000 });
  });

  test("results + application-backed filters: exact slug link", async ({ page, request }) => {
    test.skip(!url || !anon || !service, "Set Supabase env");

    const sb = createClient(url!, anon!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: sess } = await sb.auth.signInWithPassword({ email: SELLER_EMAIL, password: SELLER_PASSWORD });
    if (!sess.session) throw new Error("no session for API");
    const marker = `FilterProof ${Date.now()}`;
    const { slug } = await publishServiciosWithBearer(request, sess.session.access_token, marker);

    /** Match smoke fixture discovery (no emergency quick-fact / weekend hours in default JSON). */
    const filterQs =
      "legal=1&langEs=1&msg=1&svcMulti=1&offer=1&vint=1&q=" + encodeURIComponent(marker.split(" ")[0] ?? "FilterProof");
    await page.goto(`/clasificados/servicios/resultados?lang=es&${filterQs}`);
    await expect(page.locator(`a[href*="/clasificados/servicios/${slug}"]`).first()).toBeVisible({ timeout: 30_000 });
  });

  test("admin workspace: exact published slug row in operaciones table", async ({ page, request }) => {
    test.skip(!url || !anon || !service, "Set Supabase env");
    test.skip(!ADMIN_SITE_PASSWORD, "Set ADMIN_PASSWORD for /admin/login");

    const sb = createClient(url!, anon!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: sess } = await sb.auth.signInWithPassword({ email: SELLER_EMAIL, password: SELLER_PASSWORD });
    if (!sess.session) throw new Error("no session for API");
    const marker = `AdminRow ${Date.now()}`;
    const { slug } = await publishServiciosWithBearer(request, sess.session.access_token, marker);

    await page.goto("/admin/login");
    await page.locator('input[name="password"]').fill(ADMIN_SITE_PASSWORD!);
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL(/\/admin(\/|$)/, { timeout: 20_000 });

    await page.goto("/admin/workspace/clasificados/servicios");
    await expect(page.getByText("servicios_public_listings (operaciones)")).toBeVisible({ timeout: 25_000 });
    const row = page.locator("table tbody tr").filter({ hasText: slug });
    await expect(row.first()).toBeVisible({ timeout: 25_000 });
    await expect(row.first()).toContainText(marker);
  });

  test("buyer: inquiry success + lead row persisted (service role verify)", async ({ page, context, request }) => {
    test.skip(!url || !anon || !service, "Set Supabase env (incl. SUPABASE_SERVICE_ROLE_KEY for lead row assert)");

    const sb = createClient(url!, anon!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: sellerSess } = await sb.auth.signInWithPassword({ email: SELLER_EMAIL, password: SELLER_PASSWORD });
    if (!sellerSess.session) throw new Error("no seller session");
    const marker = `InquiryProof ${Date.now()}`;
    const { slug } = await publishServiciosWithBearer(request, sellerSess.session.access_token, marker);

    await seedSupabaseSession(page, context, url!, anon!, BUYER_EMAIL, BUYER_PASSWORD);
    await page.goto(`/clasificados/servicios/${encodeURIComponent(slug)}?lang=es`);
    const esc = marker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await expect(page).toHaveTitle(new RegExp(esc));

    const inquiry = page.locator("section").filter({ hasText: /Solicitar cotización|Request a quote/i });
    await inquiry.getByLabel("Tu nombre").fill("Smoke Buyer");
    await inquiry.getByLabel("Correo").fill(BUYER_EMAIL);
    await inquiry.getByLabel("¿Qué necesitas?").fill("Necesito una cotización para una reparación pequeña, gracias.");
    await inquiry.getByRole("button", { name: "Enviar" }).click();

    await expect(page.getByText("Enviado — el proveedor responderá por correo.", { exact: true })).toBeVisible({
      timeout: 25_000,
    });

    const adminSb = createClient(url!, service!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: leads, error } = await adminSb
      .from("servicios_public_leads")
      .select("id")
      .eq("listing_slug", slug)
      .order("created_at", { ascending: false })
      .limit(1);
    expect(error, error?.message).toBeNull();
    expect(leads?.length ?? 0, "expected servicios_public_leads row for listing_slug").toBeGreaterThan(0);
  });

  test("status gating: pause removes listing from public results discovery", async ({ page, request }) => {
    test.skip(!url || !anon || !service, "Set Supabase env");

    const sb = createClient(url!, anon!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: sess } = await sb.auth.signInWithPassword({ email: SELLER_EMAIL, password: SELLER_PASSWORD });
    if (!sess.session) throw new Error("no session for API");
    const token = sess.session.access_token;

    const marker = `PauseGate ${Date.now()}`;
    const { slug } = await publishServiciosWithBearer(request, token, marker);
    const qToken = marker.split(" ")[0] ?? "PauseGate";

    await page.goto(`/clasificados/servicios/resultados?lang=es&q=${encodeURIComponent(qToken)}`);
    await expect(page.locator(`a[href*="/clasificados/servicios/${slug}"]`).first()).toBeVisible({ timeout: 25_000 });

    const pause = await request.post("/api/clasificados/servicios/manage", {
      data: { slug, action: "pause" },
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(pause.ok(), await pause.text()).toBeTruthy();

    await page.goto(`/clasificados/servicios/resultados?lang=es&q=${encodeURIComponent(qToken)}`);
    await expect(page.locator(`a[href*="/clasificados/servicios/${slug}"]`)).toHaveCount(0);

    await page.goto(`/clasificados/servicios/${encodeURIComponent(slug)}?lang=es`);
    await expect(page.getByText(/en pausa|paused/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
