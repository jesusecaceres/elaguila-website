import fs from "node:fs";
import path from "node:path";

import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import {
  buildManualNegociosDraft,
  buildManualPrivadoDraft,
  MANUAL_QA_MARKERS,
} from "./manual-qa-sample-content";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SELLER_EMAIL = process.env.SMOKE_SELLER_EMAIL ?? "smoke.seller@yourdomain.com";
const SELLER_PASSWORD = process.env.SMOKE_SELLER_PASSWORD ?? "LeonixSmoke!2026Seller";
const BUYER_EMAIL = process.env.SMOKE_BUYER_EMAIL ?? "smoke.buyer@yourdomain.com";
const BUYER_PASSWORD = process.env.SMOKE_BUYER_PASSWORD ?? "LeonixSmoke!2026Buyer";

const ADMIN_SITE_PASSWORD =
  process.env.ADMIN_PASSWORD ??
  process.env.SMOKE_ADMIN_SITE_PASSWORD ??
  process.env.SMOKE_ADMIN_PASSWORD ??
  "LeonixSmoke!2026Admin";

/** Must match `autosPrivadoDraftNamespace.ts` / `autosNegociosDraftNamespace.ts`. */
const AUTOS_PRIVADO_DRAFT_STORAGE_PREFIX = "autos-privado-draft-v1";
const AUTOS_NEGOCIOS_DRAFT_STORAGE_PREFIX = "autos-negocios-draft-v1";

function buildAutosPrivadoDraftLocalStorageKey(namespace: string): string {
  return `${AUTOS_PRIVADO_DRAFT_STORAGE_PREFIX}:${namespace}`;
}
function buildAutosNegociosDraftLocalStorageKey(namespace: string): string {
  return `${AUTOS_NEGOCIOS_DRAFT_STORAGE_PREFIX}:${namespace}`;
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
}) {
  const browserAnon = createClient(args.supabaseUrl, args.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: sess, error: sErr } = await browserAnon.auth.signInWithPassword({ email: args.email, password: args.password });
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

async function readSellerUserId(page: import("@playwright/test").Page, supabaseUrl: string): Promise<string> {
  const storageKey = authStorageKey(supabaseUrl);
  const uid = await page.evaluate((k) => {
    try {
      const raw = window.localStorage.getItem(k);
      if (!raw) return "";
      const s = JSON.parse(raw) as { user?: { id?: string } };
      return s?.user?.id ?? "";
    } catch {
      return "";
    }
  }, storageKey);
  return uid;
}

type PublishedAutos = {
  lane: "privado" | "negocios";
  id: string;
  title: string;
  filterProof: { fields: string; filterUrl: string; appeared: boolean };
};

async function seedDraftLocalStorage(args: {
  page: import("@playwright/test").Page;
  lane: "privado" | "negocios";
  userId: string;
  draftJson: string;
}) {
  const key =
    args.lane === "privado"
      ? buildAutosPrivadoDraftLocalStorageKey(`u:${args.userId}`)
      : buildAutosNegociosDraftLocalStorageKey(`u:${args.userId}`);
  await args.page.evaluate(
    ([k, v]) => {
      try {
        window.localStorage.setItem(k, v);
      } catch {
        /* ignore */
      }
    },
    [key, args.draftJson] as const,
  );
}

async function publishFromConfirmPage(page: import("@playwright/test").Page, lane: "privado" | "negocios") {
  const confirmPath = lane === "privado" ? "/publicar/autos/privado/confirm?lang=es" : "/publicar/autos/negocios/confirm?lang=es";
  const postCreate = page.waitForResponse((r) => {
    const method = r.request().method();
    if (method !== "POST" && method !== "PATCH") return false;
    if (r.status() !== 200) return false;
    const p = new URL(r.url()).pathname.replace(/\/+$/, "");
    if (p === "/api/clasificados/autos/listings") return method === "POST";
    return /^\/api\/clasificados\/autos\/listings\/[^/]+$/.test(p) && method === "PATCH";
  }, { timeout: 120_000 });
  await page.goto(confirmPath);
  await postCreate;

  await expect(page.getByRole("button", { name: /Continuar al pago/i })).toBeVisible({ timeout: 30_000 });

  const checks = page.getByRole("checkbox");
  await expect(checks).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    await checks.nth(i).check();
  }

  await expect(page.getByRole("button", { name: /Continuar al pago/i })).toBeEnabled({ timeout: 30_000 });

  const payWait = page.waitForURL(/\/clasificados\/autos\/pago\/exito\b/i, { timeout: 120_000 });
  await page.getByRole("button", { name: /Continuar al pago/i }).click();
  await payWait;

  const exitoUrl = page.url();
  const listingId = new URL(exitoUrl).searchParams.get("listing_id")?.trim();
  if (!listingId) throw new Error("missing_listing_id_on_exito");

  const origin = new URL(exitoUrl).origin;
  await page.goto(`${origin}/clasificados/autos/vehiculo/${encodeURIComponent(listingId)}?lang=es`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page).toHaveURL(new RegExp(`/clasificados/autos/vehiculo/${listingId}\\b`, "i"));

  return { id: listingId };
}

test.describe.configure({ timeout: 420_000 });

test.describe("Autos manual QA seed (persistent rows, no cleanup)", () => {
  test.beforeAll(async () => {
    test.skip(!url || !anon || !service, "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY");
    const admin = createClient(url!, service!, { auth: { persistSession: false, autoRefreshToken: false } });
    for (const [email, password] of [
      [SELLER_EMAIL, SELLER_PASSWORD],
      [BUYER_EMAIL, BUYER_PASSWORD],
    ] as const) {
      const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error && !String(error.message).toLowerCase().includes("already")) throw error;
    }
  });

  test("seed Privado + Negocios polished listings via confirm flow + verify surfaces (rows kept)", async ({ page, context }) => {
    test.skip(!url || !anon || !service);

    const baseURL = (test.info().project.use.baseURL ?? "http://127.0.0.1:3022").replace(/\/+$/, "");
    const published: PublishedAutos[] = [];

    await seedSupabaseSession({ page, context, supabaseUrl: url!, anonKey: anon!, email: SELLER_EMAIL, password: SELLER_PASSWORD });
    const uid = await readSellerUserId(page, url!);
    expect(uid.length).toBeGreaterThan(10);

    const privBundle = buildManualPrivadoDraft(baseURL);
    await seedDraftLocalStorage({
      page,
      lane: "privado",
      userId: uid,
      draftJson: JSON.stringify({ v: 1, vehicleTitleOverride: privBundle.vehicleTitleOverride, listing: privBundle.listing }),
    });
    const priv = await publishFromConfirmPage(page, "privado");
    const privTitle = String(privBundle.listing.vehicleTitle ?? "");
    published.push({
      lane: "privado",
      id: priv.id,
      title: privTitle,
      filterProof: {
        fields: "make=Honda, model=CR-V, seller=private, city=San+Jose, zip=95112, bodyStyle=SUV, q=marker",
        filterUrl: `${baseURL}/clasificados/autos/resultados?lang=es&make=Honda&model=CR-V&city=San+Jose&zip=95112&bodyStyle=SUV&seller=private&q=${encodeURIComponent(MANUAL_QA_MARKERS.privado)}`,
        appeared: true,
      },
    });

    await seedSupabaseSession({ page, context, supabaseUrl: url!, anonKey: anon!, email: SELLER_EMAIL, password: SELLER_PASSWORD });
    const negBundle = buildManualNegociosDraft(baseURL);
    await seedDraftLocalStorage({
      page,
      lane: "negocios",
      userId: uid,
      draftJson: JSON.stringify({ v: 1, vehicleTitleOverride: negBundle.vehicleTitleOverride, listing: negBundle.listing }),
    });
    const neg = await publishFromConfirmPage(page, "negocios");
    const negTitle = String(negBundle.listing.vehicleTitle ?? "");
    published.push({
      lane: "negocios",
      id: neg.id,
      title: negTitle,
      filterProof: {
        fields: "make=Lexus, seller=dealer, bodyStyle=SUV, q=marker",
        filterUrl: `${baseURL}/clasificados/autos/resultados?lang=es&make=Lexus&seller=dealer&bodyStyle=SUV&q=${encodeURIComponent(MANUAL_QA_MARKERS.negocios)}`,
        appeared: true,
      },
    });

    // Landing: both markers visible (private + dealer balance smoke)
    await page.goto(`${baseURL}/clasificados/autos?lang=es`);
    await expect(page.getByText(MANUAL_QA_MARKERS.privado, { exact: false }).first()).toBeVisible({ timeout: 90_000 });
    await expect(page.getByText(MANUAL_QA_MARKERS.negocios, { exact: false }).first()).toBeVisible({ timeout: 90_000 });
    await expect(page.getByText(/\bBoost\b/i)).toHaveCount(0);

    // Results + filters
    for (const p of published) {
      await page.goto(p.filterProof.filterUrl);
      try {
        await page.waitForResponse(
          (resp) => {
            if (resp.request().method() !== "GET") return false;
            try {
              return new URL(resp.url()).pathname.replace(/\/+$/, "") === "/api/clasificados/autos/public/listings";
            } catch {
              return false;
            }
          },
          { timeout: 45_000 },
        );
      } catch {
        /* ignore */
      }
      const marker = p.lane === "privado" ? MANUAL_QA_MARKERS.privado : MANUAL_QA_MARKERS.negocios;
      await expect(page.getByText(marker, { exact: false }).first()).toBeVisible({ timeout: 90_000 });
    }

    // Public detail + CTA smoke (seller session)
    await seedSupabaseSession({ page, context, supabaseUrl: url!, anonKey: anon!, email: SELLER_EMAIL, password: SELLER_PASSWORD });
    const negRow = published.find((x) => x.lane === "negocios")!;
    await page.goto(`${baseURL}/clasificados/autos/vehiculo/${encodeURIComponent(negRow.id)}?lang=es`);
    await expect(page.getByRole("heading", { name: new RegExp(MANUAL_QA_MARKERS.negocios.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.locator('a[href^="tel:"]').first()).toBeVisible();
    await expect(page.locator('a[href*="wa.me"]').first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Volver a resultados/i })).toBeVisible();
    await page.getByRole("link", { name: /Volver a resultados/i }).click();
    await expect(page).toHaveURL(/\/clasificados\/autos\/resultados/);

    const privRow = published.find((x) => x.lane === "privado")!;
    await page.goto(`${baseURL}/clasificados/autos/vehiculo/${encodeURIComponent(privRow.id)}?lang=es`);
    await expect(page.getByRole("heading", { name: new RegExp(MANUAL_QA_MARKERS.privado.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.locator('a[href^="mailto:"]').first()).toBeVisible();
    await expect(page.locator('a[href^="tel:"]').first()).toBeVisible();
    await expect(page.locator('a[href*="wa.me"]').first()).toBeVisible();
    await expect(page.getByTestId("ev-listing-report-open")).toBeVisible();

    // Seller dashboard
    await page.goto(`${baseURL}/dashboard/mis-anuncios?lang=es`);
    await expect(page.getByText("Autos Clasificados (Leonix)", { exact: false })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(MANUAL_QA_MARKERS.privado, { exact: false }).first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(MANUAL_QA_MARKERS.negocios, { exact: false }).first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("link", { name: /Ver público|View live/i }).first()).toBeVisible();

    // Buyer: report on dealer listing
    await seedSupabaseSession({ page, context, supabaseUrl: url!, anonKey: anon!, email: BUYER_EMAIL, password: BUYER_PASSWORD });
    await page.goto(`${baseURL}/clasificados/autos/vehiculo/${encodeURIComponent(negRow.id)}?lang=es`);
    await page.getByTestId("ev-listing-report-open").click();
    await page.locator("textarea").first().fill("MQA buyer report: verificación de moderación — lenguaje inapropiado de prueba (contenido de laboratorio, sin acusación real).");
    await page.getByRole("button", { name: /^Enviar$/i }).click();
    await expect(page.getByText(/Gracias.*reporte|Thank you.*report/i).first()).toBeVisible({ timeout: 45_000 });

    const adminSb = createClient(url!, service!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: reportRows, error: repErr } = await adminSb
      .from("listing_reports")
      .select("id,listing_id,reason")
      .eq("listing_id", negRow.id)
      .order("created_at", { ascending: false })
      .limit(1);
    expect(repErr).toBeNull();
    expect(reportRows?.length ?? 0).toBeGreaterThanOrEqual(1);

    // Admin workspace Autos + public preview popup
    await page.goto(`${baseURL}/admin/login`);
    await page.locator('input[name="password"]').fill(ADMIN_SITE_PASSWORD);
    await page.getByRole("button", { name: /log in/i }).click();
    await page.waitForURL(/\/admin(\/|$)/, { timeout: 45_000 });
    await page.goto(`${baseURL}/admin/workspace/clasificados/autos`);
    await expect(page.getByText("Autos — anuncios de pago", { exact: false })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(MANUAL_QA_MARKERS.negocios, { exact: false }).first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(MANUAL_QA_MARKERS.privado, { exact: false }).first()).toBeVisible({ timeout: 60_000 });

    const popupPromise = page.waitForEvent("popup");
    await page.locator("tr", { hasText: MANUAL_QA_MARKERS.negocios }).getByRole("link", { name: "Ver público" }).click();
    const popup = await popupPromise;
    await expect(popup).toHaveURL(new RegExp(`/clasificados/autos/vehiculo/${negRow.id}`));
    await popup.close();

    const outPath = path.join(process.cwd(), "e2e", "autos", "manual-qa-seed-output.json");
    fs.writeFileSync(
      outPath,
      JSON.stringify(
        {
          createdAt: new Date().toISOString(),
          baseURL,
          published,
          buyerInteraction: {
            lane: "negocios",
            listingId: negRow.id,
            action: "LeonixInlineListingReport → submitListingReportAction → listing_reports",
            reporterEmail: BUYER_EMAIL,
            listingReportsRow: reportRows?.[0] ?? null,
          },
          storageKeysDocumented: {
            privado: `${AUTOS_PRIVADO_DRAFT_STORAGE_PREFIX}:u:<uid>`,
            negocios: `${AUTOS_NEGOCIOS_DRAFT_STORAGE_PREFIX}:u:<uid>`,
          },
          note: "Rows intentionally not deleted — for manual visual QA. Publish path: /publicar/autos/{lane}/confirm + internal payment bypass (AUTOS_INTERNAL_PUBLISH_PAYMENT_BYPASS=1, non-production).",
        },
        null,
        2,
      ),
      "utf8",
    );
    console.log(`[autos-manual-qa-seed] wrote ${outPath}`);
  });
});
