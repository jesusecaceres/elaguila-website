import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const SELLER_EMAIL = process.env.SMOKE_SELLER_EMAIL ?? "";
const SELLER_PASSWORD = process.env.SMOKE_SELLER_PASSWORD ?? "";
const BUYER_EMAIL = process.env.SMOKE_BUYER_EMAIL ?? "";
const BUYER_PASSWORD = process.env.SMOKE_BUYER_PASSWORD ?? "";

/** Must match `app/admin/login/submit/route.ts` (only `ADMIN_PASSWORD` is read there). */
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? process.env.SMOKE_ADMIN_SITE_PASSWORD ?? "";

const MUTATIONS = String(process.env.SMOKE_ALLOW_MUTATIONS ?? "").toLowerCase() === "true";

type Ck = { status: "PASS" | "FAIL" | "SKIP"; msg: string };
const checklist: Ck[] = [];

function ck(status: Ck["status"], msg: string) {
  checklist.push({ status, msg });
  // eslint-disable-next-line no-console
  console.log(`[leonix-smoke] ${status} ${msg}`);
}

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
}): Promise<boolean> {
  const browserAnon = createClient(args.supabaseUrl, args.anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: sess, error: sErr } = await browserAnon.auth.signInWithPassword({
    email: args.email,
    password: args.password,
  });
  if (sErr || !sess.session) return false;

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
  return true;
}

async function dismissCookieConsentIfPresent(page: import("@playwright/test").Page) {
  const consent = page.getByRole("dialog", { name: /Cookies y preferencias|Cookies & preferences/i });
  if (!(await consent.isVisible().catch(() => false))) return;
  const accept = consent.getByRole("button", { name: /Aceptar todo|Accept all/i });
  if (await accept.isVisible().catch(() => false)) {
    await accept.click();
  } else {
    await consent.getByRole("button", { name: /Rechazar lo no esencial|Reject non-essential/i }).click();
  }
  await expect(consent).toBeHidden({ timeout: 15_000 });
}

/** Raw PostgREST / schema-cache style errors should never appear to end users. */
async function assertNoRawDbError(page: import("@playwright/test").Page, label: string): Promise<boolean> {
  const body = await page.locator("body").innerText().catch(() => "");
  const bad = /PGRST\d+|PostgREST|schema cache|permission denied for relation|42703|42P01/i;
  if (bad.test(body)) {
    ck("FAIL", `${label}: raw DB / PostgREST style text in body`);
    return false;
  }
  ck("PASS", `${label}: no raw PostgREST/schema error text`);
  return true;
}

async function gotoHealth(page: import("@playwright/test").Page, path: string, label: string) {
  const res = await page.goto(path, { waitUntil: "domcontentloaded", timeout: 90_000 });
  if (!res || res.status() >= 500) {
    ck("FAIL", `${label}: HTTP ${res?.status() ?? "?"}`);
    return;
  }
  await dismissCookieConsentIfPresent(page);
  const h = page.getByRole("heading", { level: 1 }).first();
  const hasHeading = await h.isVisible().catch(() => false);
  const hasMain = await page.locator("main").first().isVisible().catch(() => false);
  if (!hasHeading && !hasMain) {
    ck("FAIL", `${label}: no h1 or main`);
  } else {
    ck("PASS", `${label}: shell visible`);
  }
  await assertNoRawDbError(page, label);
}

test.afterAll(async () => {
  // eslint-disable-next-line no-console
  console.log("\n========== LEONIX SMOKE CHECKLIST ==========\n");
  for (const row of checklist) {
    // eslint-disable-next-line no-console
    console.log(`${row.status.padEnd(4)} ${row.msg}`);
  }
  const fails = checklist.filter((c) => c.status === "FAIL").length;
  // eslint-disable-next-line no-console
  console.log("\n===========================================\n");
  if (fails > 0) {
    throw new Error(`Leonix smoke: ${fails} FAIL row(s) in checklist (see stdout above).`);
  }
});

test.describe.configure({ timeout: 120_000 });

test.describe("@smoke-auth", () => {
  test("seller login (Supabase)", async ({ page, context }) => {
    test.skip(!url || !anon, "SKIP: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY missing");
    test.skip(!SELLER_EMAIL || !SELLER_PASSWORD, "SKIP: SMOKE_SELLER_EMAIL / SMOKE_SELLER_PASSWORD missing");
    const ok = await seedSupabaseSession({
      page,
      context,
      supabaseUrl: url!,
      anonKey: anon!,
      email: SELLER_EMAIL,
      password: SELLER_PASSWORD,
    });
    if (!ok) {
      ck("SKIP", "auth: seller sign-in failed (wrong password or user missing — do not auto-create in smoke)");
      test.skip();
    }
    await page.goto("/dashboard?lang=es", { waitUntil: "domcontentloaded" });
    await assertNoRawDbError(page, "auth seller /dashboard");
    ck("PASS", "auth: seller session hydrated");
  });

  test("buyer login (Supabase)", async ({ page, context }) => {
    test.skip(!url || !anon, "SKIP: Supabase env missing");
    test.skip(!BUYER_EMAIL || !BUYER_PASSWORD, "SKIP: SMOKE_BUYER_EMAIL / SMOKE_BUYER_PASSWORD missing");
    const ok = await seedSupabaseSession({
      page,
      context,
      supabaseUrl: url!,
      anonKey: anon!,
      email: BUYER_EMAIL,
      password: BUYER_PASSWORD,
    });
    if (!ok) {
      ck("SKIP", "auth: buyer sign-in failed");
      test.skip();
    }
    await page.goto("/dashboard/guardados?lang=es", { waitUntil: "domcontentloaded" });
    await assertNoRawDbError(page, "auth buyer /dashboard/guardados");
    ck("PASS", "auth: buyer session hydrated");
  });

  test("admin site password cookie", async ({ page }) => {
    test.skip(!ADMIN_PASSWORD, "SKIP: ADMIN_PASSWORD missing (submit route only reads ADMIN_PASSWORD)");
    await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
    await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /log in/i }).click();
    await page.waitForURL(/\/admin/i, { timeout: 20_000 });
    expect(page.url()).not.toContain("error=1");
    ck("PASS", "auth: admin cookie session");
  });
});

test.describe("@smoke-guardados", () => {
  test("guardados page + save control presence (read-only)", async ({ page, context }) => {
    test.skip(!url || !anon || !BUYER_EMAIL || !BUYER_PASSWORD, "SKIP: buyer auth env incomplete");
    const ok = await seedSupabaseSession({
      page,
      context,
      supabaseUrl: url!,
      anonKey: anon!,
      email: BUYER_EMAIL,
      password: BUYER_PASSWORD,
    });
    test.skip(!ok, "SKIP: buyer login failed");

    await page.goto("/clasificados/en-venta/resultados?lang=es", { waitUntil: "domcontentloaded" });
    await dismissCookieConsentIfPresent(page);
    await assertNoRawDbError(page, "public en-venta resultados");

    const saveBtn = page.getByRole("button", { name: /^Guardar$|^Save$/i });
    const n = await saveBtn.count();
    if (n > 0) {
      ck("PASS", "guardados: save button present on results (read-only; not clicked)");
    } else {
      ck("SKIP", "guardados: no save button on results cards (empty catalog or different layout)");
    }

    await page.goto("/dashboard/guardados?lang=es", { waitUntil: "domcontentloaded" });
    await assertNoRawDbError(page, "dashboard guardados");
    const emptyOrList = await page.getByText(/Guardados|guardado|Aún no|No saved|empty/i).first().isVisible().catch(() => false);
    if (emptyOrList) ck("PASS", "guardados: page has list or empty copy");
    else ck("SKIP", "guardados: could not detect list heading — inspect manually");

    if (!MUTATIONS) {
      ck("SKIP", "guardados: save/unsave mutation skipped (SMOKE_ALLOW_MUTATIONS not true)");
    }
  });
});

test.describe("@smoke-owner", () => {
  test("mis-anuncios owner surface (read-only)", async ({ page, context }) => {
    test.skip(!url || !anon || !SELLER_EMAIL || !SELLER_PASSWORD, "SKIP: seller auth env incomplete");
    const ok = await seedSupabaseSession({
      page,
      context,
      supabaseUrl: url!,
      anonKey: anon!,
      email: SELLER_EMAIL,
      password: SELLER_PASSWORD,
    });
    test.skip(!ok, "SKIP: seller login failed");

    await page.goto("/dashboard/mis-anuncios?lang=es", { waitUntil: "domcontentloaded" });
    await dismissCookieConsentIfPresent(page);
    await assertNoRawDbError(page, "mis-anuncios");

    const hard = page.getByRole("button", { name: /Eliminar permanentemente|Borrar para siempre|Hard delete|Delete forever/i });
    const hardCount = await hard.count();
    if (hardCount > 0) {
      ck("FAIL", "mis-anuncios: hard-delete pattern button found");
      expect(hardCount).toBe(0);
    } else {
      ck("PASS", "mis-anuncios: no hard-delete button pattern");
    }

    const arch = page.getByRole("button", { name: /Archivar anuncio|Archive ad/i });
    const paus = page.getByRole("button", { name: /Pausar anuncio|Pause ad/i });
    const ac = await arch.count();
    const pc = await paus.count();
    if (ac + pc > 0) {
      ck("PASS", "mis-anuncios: Archivar / Pausar visible on at least one card");
    } else {
      ck("SKIP", "mis-anuncios: no inventory cards (empty state) — cannot assert Archivar/Pausar");
    }

    const leonix = page.getByText(/Leonix Ad ID|ID Leonix/i);
    if (await leonix.first().isVisible().catch(() => false)) {
      ck("PASS", "mis-anuncios: Leonix Ad ID copy visible somewhere");
    } else {
      ck("SKIP", "mis-anuncios: Leonix Ad ID not visible (no rows with id)");
    }

    if (!MUTATIONS) {
      ck("SKIP", "owner mutations: skipped (SMOKE_ALLOW_MUTATIONS not true)");
    }
  });
});

test.describe("@smoke-health", () => {
  test("dashboard vertical routes", async ({ page, context }) => {
    test.skip(!url || !anon || !SELLER_EMAIL || !SELLER_PASSWORD, "SKIP: seller auth incomplete");
    const ok = await seedSupabaseSession({
      page,
      context,
      supabaseUrl: url!,
      anonKey: anon!,
      email: SELLER_EMAIL,
      password: SELLER_PASSWORD,
    });
    test.skip(!ok, "SKIP: seller login failed");

    const paths = [
      ["/dashboard?lang=es", "dashboard home"],
      ["/dashboard/mis-anuncios?lang=es", "dashboard mis-anuncios"],
      ["/dashboard/guardados?lang=es", "dashboard guardados"],
      ["/dashboard/restaurantes?lang=es", "dashboard restaurantes"],
      ["/dashboard/servicios?lang=es", "dashboard servicios"],
      ["/dashboard/empleos?lang=es", "dashboard empleos"],
      ["/dashboard/viajes?lang=es", "dashboard viajes"],
      ["/dashboard/business-tools?lang=es", "dashboard business-tools"],
    ] as const;
    for (const [p, label] of paths) {
      await gotoHealth(page, p, label);
    }
  });

  test("dashboard: Clases / Comunidad coming soon on overview", async ({ page, context }) => {
    test.skip(!url || !anon || !SELLER_EMAIL || !SELLER_PASSWORD, "SKIP: seller auth incomplete");
    const ok = await seedSupabaseSession({
      page,
      context,
      supabaseUrl: url!,
      anonKey: anon!,
      email: SELLER_EMAIL,
      password: SELLER_PASSWORD,
    });
    test.skip(!ok, "SKIP: seller login failed");
    await page.goto("/dashboard?lang=es", { waitUntil: "domcontentloaded" });
    const soon = page.getByText(/Próximamente|Coming soon/i);
    const c = await soon.count();
    if (c >= 1) ck("PASS", "dashboard: at least one Próximamente / Coming soon (expected for Clases/Comunidad cards)");
    else ck("SKIP", "dashboard: no Próximamente copy found — verify Clases/Comunidad cards manually");
  });
});

test.describe("@smoke-admin", () => {
  test("admin clasificados queues + label sanity", async ({ page }) => {
    test.skip(!ADMIN_PASSWORD, "SKIP: ADMIN_PASSWORD missing");
    await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
    await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /log in/i }).click();
    await page.waitForURL(/\/admin/i, { timeout: 20_000 });

    await page.goto("/admin/workspace/clasificados?lang=es", { waitUntil: "domcontentloaded" });
    await assertNoRawDbError(page, "admin workspace clasificados hub");

    const queues = [
      "/admin/workspace/clasificados/en-venta?lang=es",
      "/admin/workspace/clasificados/rentas?lang=es",
      "/admin/workspace/clasificados/servicios?lang=es",
      "/admin/workspace/clasificados/empleos?lang=es",
      "/admin/workspace/clasificados/restaurantes?lang=es",
    ] as const;
    for (const q of queues) {
      await page.goto(q, { waitUntil: "domcontentloaded" });
      await assertNoRawDbError(page, `admin ${q}`);
      const unsuspendEn = await page.getByText("Unsuspend").count();
      if (unsuspendEn > 0) ck("FAIL", `${q}: English "Unsuspend" leaked to UI`);
      const rows = await page.locator("tbody tr").count();
      if (rows > 0) {
        const restaurar = page.getByRole("button", { name: /^Restaurar$/ });
        const suspender = page.getByRole("button", { name: /^Suspender$/ });
        const rep = page.getByRole("button", { name: /Republicar|Republish|Move to top|Subir al inicio/i });
        const rc = await restaurar.count();
        const sc = await suspender.count();
        const repc = await rep.count();
        if (rc + sc + repc > 0) {
          ck("PASS", `${q}: row action buttons present (${rc} Restaurar, ${sc} Suspender, ${repc} republish-family)`);
        } else {
          ck("SKIP", `${q}: rows exist but no expected action buttons — inspect layout`);
        }
        if (rc > 0) {
          const title = await restaurar.first().getAttribute("title");
          if (title && /Republicar|Republish/i.test(title) && !/No es Republicar|Not Republish/i.test(title)) {
            ck("FAIL", `${q}: Restaurar button title should clarify not Republish`);
          } else if (title && /No es Republicar|Not Republish/i.test(title)) {
            ck("PASS", `${q}: Restaurar title distinguishes from Republish`);
          }
        }
      } else {
        ck("SKIP", `${q}: empty table — row action label checks skipped`);
      }
    }
  });
});

test.describe("@smoke-public", () => {
  test("public clasificados category shells", async ({ page }) => {
    const paths = [
      ["/clasificados?lang=es", "hub"],
      ["/clasificados/en-venta?lang=es", "en-venta"],
      ["/clasificados/rentas?lang=es", "rentas"],
      ["/clasificados/bienes-raices?lang=es", "bienes-raices"],
      ["/clasificados/servicios?lang=es", "servicios"],
      ["/clasificados/autos?lang=es", "autos"],
      ["/clasificados/empleos?lang=es", "empleos"],
      ["/clasificados/restaurantes?lang=es", "restaurantes"],
      ["/clasificados/viajes?lang=es", "viajes"],
      ["/clasificados/clases?lang=es", "clases"],
      ["/clasificados/comunidad?lang=es", "comunidad"],
    ] as const;
    for (const [p, label] of paths) {
      await page.goto(p, { waitUntil: "domcontentloaded", timeout: 90_000 });
      await dismissCookieConsentIfPresent(page);
      await assertNoRawDbError(page, `public ${label}`);
      const cta = page.getByRole("link", { name: /Publicar|Anunciar|Buscar|Resultados|Ver más|Explore|Publish/i });
      if ((await cta.count()) > 0) ck("PASS", `public ${label}: primary link CTA exists`);
      else ck("SKIP", `public ${label}: no obvious CTA link — manual check`);
    }
  });
});
