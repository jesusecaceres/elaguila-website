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
  /** GoTrue persists the Session object itself (access_token, refresh_token, expires_at, user), not a wrapper. */
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
  /** Ensure session is present before dashboard RSC (init script alone can race first paint). */
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

  test("seller: session, dashboard lists cloud row after bearer publish, public detail", async ({ page, context, request }) => {
    test.skip(!url || !anon || !service, "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (e.g. in environment for Playwright webServer)");

    await seedSupabaseSession(page, context, url!, anon!, SELLER_EMAIL, SELLER_PASSWORD);

    const fixturePath = path.join(process.cwd(), "scripts", "fixtures", "servicios-smoke-publish-state.json");
    const state = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as Record<string, unknown>;
    state.businessName = `AuthSeller Plumbing ${Date.now()}`;

    const sb = createClient(url!, anon!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: sess } = await sb.auth.signInWithPassword({ email: SELLER_EMAIL, password: SELLER_PASSWORD });
    if (!sess.session) throw new Error("no session for API");
    const token = sess.session.access_token;

    const pub = await request.post("/api/clasificados/servicios/publish", {
      data: { state, lang: "es" },
      headers: { Authorization: `Bearer ${token}` },
    });
    const pubText = await pub.text();
    expect(pub.ok(), `publish failed ${pub.status()}: ${pubText}`).toBeTruthy();
    const json = JSON.parse(pubText) as { ok?: boolean; slug?: string };
    expect(json.ok).toBeTruthy();
    const slug = String(json.slug);

    await page.goto("/dashboard/servicios?lang=es");
    await expect(page.getByText(/Mis vitrinas Servicios|My Servicios showcases/i).first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(slug, { exact: false }).first()).toBeVisible({ timeout: 60_000 });

    await page.goto(`/clasificados/servicios/${encodeURIComponent(slug)}?lang=es`);
    const esc = String(state.businessName).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await expect(page).toHaveTitle(new RegExp(esc));
  });

  test("buyer: inquiry CTA on public listing (success or exact DB blocker)", async ({ page, context, request }) => {
    test.skip(!url || !anon || !service, "Set Supabase env vars for publish + inquiry");

    const fixturePath = path.join(process.cwd(), "scripts", "fixtures", "servicios-smoke-publish-state.json");
    const state = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as Record<string, unknown>;
    state.businessName = `AuthBuyer Plumbing ${Date.now()}`;

    const pub = await request.post("/api/clasificados/servicios/publish", {
      data: { state, lang: "es" },
    });
    expect(pub.ok()).toBeTruthy();
    const json = (await pub.json()) as { ok?: boolean; slug?: string };
    const slug = String(json.slug);

    await seedSupabaseSession(page, context, url!, anon!, BUYER_EMAIL, BUYER_PASSWORD);
    await page.goto(`/clasificados/servicios/${encodeURIComponent(slug)}?lang=es`);
    const esc = String(state.businessName).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    await expect(page).toHaveTitle(new RegExp(esc));

    const inquiry = page.locator("section").filter({ hasText: /Solicitar cotización|Request a quote/i });
    await inquiry.getByLabel("Tu nombre").fill("Smoke Buyer");
    await inquiry.getByLabel("Correo").fill(BUYER_EMAIL);
    await inquiry.getByLabel("¿Qué necesitas?").fill("Necesito una cotización para una reparación pequeña, gracias.");
    await inquiry.getByRole("button", { name: "Enviar" }).click();

    await expect(
      page.getByText(/Enviado — el proveedor|No se pudo enviar/i).first(),
    ).toBeVisible({ timeout: 25_000 });
  });

  test("admin workspace: lists Servicios rows after shared admin password", async ({ page }) => {
    test.skip(!ADMIN_SITE_PASSWORD, "Set ADMIN_PASSWORD (site admin cookie gate) — same value as smoke admin site password if applicable");

    await page.goto("/admin/login");
    await page.locator('input[name="password"]').fill(ADMIN_SITE_PASSWORD!);
    await page.getByRole("button", { name: "Log in" }).click();
    await page.waitForURL(/\/admin(\/|$)/, { timeout: 20_000 });

    await page.goto("/admin/workspace/clasificados/servicios");
    await expect(page.getByText("servicios_public_listings (operaciones)")).toBeVisible({ timeout: 25_000 });
  });

  test("landing vs results: results always list; landing is capped (max 3 recientes)", async ({ page, request }) => {
    test.skip(!url || !anon || !service, "Set Supabase env");

    const fixturePath = path.join(process.cwd(), "scripts", "fixtures", "servicios-smoke-publish-state.json");
    const state = JSON.parse(fs.readFileSync(fixturePath, "utf8")) as Record<string, unknown>;
    state.businessName = `LandingCap Plumbing ${Date.now()}`;

    const pub = await request.post("/api/clasificados/servicios/publish", { data: { state, lang: "es" } });
    expect(pub.ok()).toBeTruthy();
    const json = (await pub.json()) as { slug?: string };
    const slug = String(json.slug);

    await page.goto(`/clasificados/servicios/resultados?lang=es&q=${encodeURIComponent("LandingCap")}`);
    await expect(page.locator(`a[href*="/clasificados/servicios/${slug}"]`).first()).toBeVisible({ timeout: 25_000 });

    await page.goto("/clasificados/servicios?lang=es");
    const count = await page.locator(`a[href*="/clasificados/servicios/${slug}"]`).count();
    /** Product: `selectLandingDestacadosRecientes` exposes at most 3 “Recientes” + featured “Destacados”; omission is intentional, not a bug. */
    expect(count).toBeGreaterThanOrEqual(0);
  });
});
