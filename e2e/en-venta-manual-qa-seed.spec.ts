import fs from "node:fs";
import path from "node:path";

import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import {
  buildManualEnVentaDraft,
  EN_VENTA_MANUAL_DEPT_ROWS,
  type EnVentaManualDept,
  type ManualLane,
} from "./en-venta-manual-qa-sample-content";

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

const DRAFT_KEY_FREE = "en-venta-preview-draft-free";
const DRAFT_KEY_PRO = "en-venta-preview-draft-pro";
const DRAFT_META = "en-venta-preview-draft-meta";

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

async function seedEnVentaFormDraft(args: {
  page: import("@playwright/test").Page;
  plan: "free" | "pro";
  state: Record<string, unknown>;
}) {
  const key = args.plan === "free" ? DRAFT_KEY_FREE : DRAFT_KEY_PRO;
  const raw = JSON.stringify(args.state);
  await args.page.goto("/");
  await args.page.evaluate(
    ({ k, v, meta }) => {
      try {
        sessionStorage.setItem(k, v);
        sessionStorage.setItem("en-venta-preview-draft-meta", meta);
      } catch {
        /* ignore */
      }
    },
    {
      k: key,
      v: raw,
      meta: JSON.stringify({ plan: args.plan, updatedAt: Date.now() }),
    },
  );
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

type PublishedRow = {
  dept: EnVentaManualDept;
  lane: ManualLane;
  plan: "free" | "pro";
  id: string;
  title: string;
  markerToken: string;
  evSub: string;
  filterUrl: string;
  detailUrl: string;
};

async function publishOne(args: {
  page: import("@playwright/test").Page;
  baseURL: string;
  plan: "free" | "pro";
  state: Record<string, unknown>;
}): Promise<PublishedRow> {
  const row = EN_VENTA_MANUAL_DEPT_ROWS.find((r) => r.dept === (args.state.rama as EnVentaManualDept))!;
  const lane: ManualLane = args.state.seller_kind === "business" ? "negocio" : "privado";
  await seedEnVentaFormDraft({ page: args.page, plan: args.plan, state: args.state });

  const publishPath = args.plan === "free" ? "/clasificados/publicar/en-venta/free?lang=es" : "/clasificados/publicar/en-venta/pro?lang=es";
  await args.page.goto(publishPath);
  await dismissCookieConsentIfPresent(args.page);
  await expect(args.page.getByRole("button", { name: args.plan === "pro" ? /Publicar anuncio Pro/i : /Publicar anuncio/i })).toBeVisible({
    timeout: 60_000,
  });
  await expect(args.page.getByRole("button", { name: args.plan === "pro" ? /Publicar anuncio Pro/i : /Publicar anuncio/i })).toBeEnabled({
    timeout: 30_000,
  });

  await args.page.getByRole("button", { name: args.plan === "pro" ? /Publicar anuncio Pro/i : /Publicar anuncio/i }).click();
  const successPanel = args.page.getByTestId("ev-publish-success");
  const errorPanel = args.page.getByTestId("ev-publish-error");
  await Promise.race([
    successPanel.waitFor({ state: "visible", timeout: 120_000 }),
    errorPanel.waitFor({ state: "visible", timeout: 120_000 }),
  ]);
  if (await errorPanel.isVisible().catch(() => false)) {
    const txt = (await errorPanel.textContent().catch(() => ""))?.trim() || "unknown publish error";
    throw new Error(`Publish failed: ${txt}`);
  }

  const detail = args.page.getByTestId("ev-publish-success-detail");
  await Promise.all([
    args.page.waitForURL(/\/clasificados\/anuncio\/[0-9a-f-]{36}/i, { timeout: 90_000 }),
    detail.click(),
  ]);
  const detailUrl = args.page.url();
  const idMatch = /\/clasificados\/anuncio\/([0-9a-f-]{36})/i.exec(detailUrl);
  expect(idMatch?.[1]).toBeTruthy();
  const id = idMatch![1]!;
  const title = String(args.state.title ?? "");

  const browseQs = new URLSearchParams();
  browseQs.set("lang", "es");
  browseQs.set("evDept", row.dept);
  if (row.evSub) browseQs.set("evSub", row.evSub);
  browseQs.set("q", row.markerToken);
  browseQs.set("sort", "newest");
  const filterUrl = `${args.baseURL}/clasificados/en-venta/results?${browseQs.toString()}`;

  return {
    dept: row.dept,
    lane,
    plan: args.plan,
    id,
    title,
    markerToken: row.markerToken,
    evSub: row.evSub,
    filterUrl,
    detailUrl,
  };
}

test.describe.configure({ timeout: 1_800_000 });

test.describe("En Venta manual QA seed (persistent rows, real publish)", () => {
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

  test("seed 24 polished listings (12 dept × privado free + negocio pro) + verify + buyer inquiry", async ({ page, context }) => {
    test.skip(!url || !anon || !service);

    const baseURL = test.info().project.use.baseURL ?? "http://127.0.0.1:3016";
    const published: PublishedRow[] = [];

    await seedSupabaseSession({ page, context, supabaseUrl: url!, anonKey: anon!, email: SELLER_EMAIL, password: SELLER_PASSWORD });

    for (const row of EN_VENTA_MANUAL_DEPT_ROWS) {
      const privadoState = buildManualEnVentaDraft({
        row,
        lane: "privado",
        plan: "free",
        sellerEmail: SELLER_EMAIL,
      });
      published.push(await publishOne({ page, baseURL, plan: "free", state: privadoState }));

      const negocioState = buildManualEnVentaDraft({
        row,
        lane: "negocio",
        plan: "pro",
        sellerEmail: SELLER_EMAIL,
      });
      published.push(await publishOne({ page, baseURL, plan: "pro", state: negocioState }));
    }

    // Results + filters (each marker) — client loads from Supabase
    for (const p of published) {
      await page.goto(p.filterUrl);
      await dismissCookieConsentIfPresent(page);
      await expect(page.locator(`a[href*="/clasificados/anuncio/${p.id}"]`).first()).toBeVisible({ timeout: 120_000 });
    }

    // Public detail (marker in description)
    for (const p of published) {
      await page.goto(`${baseURL}/clasificados/anuncio/${encodeURIComponent(p.id)}?lang=es`);
      await dismissCookieConsentIfPresent(page);
      await expect(page.getByText(p.markerToken, { exact: false }).first()).toBeVisible({ timeout: 60_000 });
    }

    // Landing hub
    await page.goto(`${baseURL}/clasificados/en-venta?lang=es`);
    await dismissCookieConsentIfPresent(page);
    await expect(page.getByRole("heading", { name: /En Venta/i })).toBeVisible({ timeout: 60_000 });

    // Seller dashboard
    await seedSupabaseSession({ page, context, supabaseUrl: url!, anonKey: anon!, email: SELLER_EMAIL, password: SELLER_PASSWORD });
    await page.goto(`${baseURL}/dashboard/mis-anuncios?lang=es`);
    await dismissCookieConsentIfPresent(page);
    for (const p of published) {
      await expect(page.getByRole("heading", { name: p.title })).toBeVisible({ timeout: 90_000 });
    }

    // Buyer inquiry on first listing (electronicos privado)
    const inquiryTarget = published.find((x) => x.dept === "electronicos" && x.lane === "privado")!;
    await seedSupabaseSession({ page, context, supabaseUrl: url!, anonKey: anon!, email: BUYER_EMAIL, password: BUYER_PASSWORD });
    await page.goto(`${baseURL}/clasificados/anuncio/${encodeURIComponent(inquiryTarget.id)}?lang=es`);
    await dismissCookieConsentIfPresent(page);
    await page.getByRole("button", { name: /Correo \(Leonix\)/i }).click();
    const correoDialog = page.getByRole("dialog", { name: /Contactar por correo|Email contact/i });
    await expect(correoDialog).toBeVisible({ timeout: 25_000 });
    await correoDialog.getByPlaceholder(/Tu mensaje|Your message/i).fill(
      "Buenas tardes: confirmo disponibilidad del iPhone 13 mini, IMEI limpio y recibo. ¿Pueden entregar mañana en Civic Center entre 12:00 y 14:00? Gracias.",
    );
    const inqWait = page.waitForResponse(
      (r) => r.request().method() === "POST" && new URL(r.url()).pathname.replace(/\/+$/, "") === "/api/clasificados/en-venta/inquiry",
      { timeout: 90_000 },
    );
    await correoDialog.getByRole("button", { name: /Enviar por Leonix|Send via Leonix/i }).click();
    const inqResp = await inqWait;
    expect(inqResp.ok(), `inquiry failed ${inqResp.status()}`).toBeTruthy();
    await expect(correoDialog.getByText(/Mensaje enviado|Message sent/i).first()).toBeVisible({ timeout: 30_000 });

    // Admin workspace
    await page.goto(`${baseURL}/admin/login`);
    await page.locator('input[name="password"]').fill(ADMIN_SITE_PASSWORD);
    await page.getByRole("button", { name: /log in/i }).click();
    await page.waitForURL(/\/admin(\/|$)/, { timeout: 45_000 });
    await page.goto(`${baseURL}/admin/workspace/clasificados?category=en-venta`);
    for (const p of published) {
      await expect(page.locator("tr", { hasText: p.markerToken }).first()).toBeVisible({ timeout: 120_000 });
    }

    // Seller can see buyer thread (Leonix inquiry)
    await seedSupabaseSession({ page, context, supabaseUrl: url!, anonKey: anon!, email: SELLER_EMAIL, password: SELLER_PASSWORD });
    await page.goto(`${baseURL}/dashboard/mensajes?lang=es`);
    await dismissCookieConsentIfPresent(page);
    await expect(page.getByText(/confirmo disponibilidad del iPhone/i).first()).toBeVisible({ timeout: 90_000 });

    const outPath = path.join(process.cwd(), "e2e", "en-venta-manual-qa-seed-output.json");
    fs.writeFileSync(
      outPath,
      JSON.stringify(
        {
          createdAt: new Date().toISOString(),
          baseURL,
          published,
          inquiry: { listingId: inquiryTarget.id, buyerEmail: BUYER_EMAIL },
          note: "Rows intentionally not deleted — for manual visual QA.",
        },
        null,
        2,
      ),
      "utf8",
    );
    console.log(`[en-venta-manual-qa-seed] wrote ${outPath}`);
  });
});
