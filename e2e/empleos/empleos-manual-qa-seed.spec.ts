import fs from "node:fs";
import path from "node:path";

import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import { MANUAL_QA_MARKERS, manualFeriaDraft, manualPremiumDraft, manualQuickDraft } from "./manual-qa-sample-content";

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

const SESSION = {
  quick: "leonix_empleos_quick_draft_v1",
  premium: "leonix_empleos_premium_draft_v1",
  feria: "leonix_empleos_feria_draft_v1",
} as const;

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

async function seedSessionDraft(args: { page: import("@playwright/test").Page; context: import("@playwright/test").BrowserContext; key: string; state: unknown }) {
  const raw = JSON.stringify(args.state);
  await args.context.addInitScript(
    ([key, raw]) => {
      try {
        sessionStorage.setItem(key, raw);
      } catch {
        /* ignore */
      }
      try {
        localStorage.setItem(`${key}-ls-fallback`, raw);
      } catch {
        /* ignore */
      }
    },
    [args.key, raw] as const,
  );
  await args.page.evaluate(
    ({ key, raw }) => {
      try {
        sessionStorage.setItem(key, raw);
      } catch {
        /* ignore */
      }
      try {
        localStorage.setItem(`${key}-ls-fallback`, raw);
      } catch {
        /* ignore */
      }
    },
    { key: args.key, raw },
  );
}

type Published = {
  lane: "quick" | "premium" | "feria";
  id: string;
  slug: string;
  title: string;
  lifecycle_status: string;
  filterProof: { fields: string; filterUrl: string; appeared: boolean };
};

async function publishFromLane(page: import("@playwright/test").Page, laneUrl: string) {
  await page.goto(laneUrl);
  const publishBtn = page.getByRole("button", { name: /Publicar|Publish/i });
  await expect(publishBtn).toBeVisible({ timeout: 60_000 });
  await expect(publishBtn).toBeEnabled({ timeout: 60_000 });
  await publishBtn.click();

  const modal = page.locator('[role="dialog"][aria-modal="true"]').first();
  await expect(modal).toBeVisible({ timeout: 25_000 });

  const checks = modal.locator('input[type="checkbox"]');
  await expect(checks).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    await checks.nth(i).check();
  }

  const confirm = modal.getByRole("button", { name: /Continuar|Continue/i });
  await expect(confirm).toBeEnabled({ timeout: 25_000 });

  const respWait = page.waitForResponse(
    (r) => r.request().method() === "POST" && new URL(r.url()).pathname.replace(/\/+$/, "") === "/api/clasificados/empleos/listings",
    { timeout: 120_000 },
  );
  await confirm.click();
  const resp = await respWait;
  const txt = await resp.text();
  if (!resp.ok()) throw new Error(`publish_failed status=${resp.status()} body=${txt}`);
  const json = JSON.parse(txt) as { ok?: boolean; id?: string; slug?: string; lifecycle_status?: string; error?: string };
  if (!json.ok || !json.id || !json.slug) throw new Error(`publish_failed body=${txt}`);
  return { id: String(json.id), slug: String(json.slug), lifecycle_status: String(json.lifecycle_status ?? "") };
}

async function expectResultsWithFilter(page: import("@playwright/test").Page, args: { filterUrl: string; marker: string }) {
  await page.goto(args.filterUrl);
  const hit = page.getByText(args.marker, { exact: false }).first();
  try {
    await page.waitForResponse(
      (resp) => {
        if (resp.request().method() !== "GET") return false;
        try {
          return new URL(resp.url()).pathname.replace(/\/+$/, "") === "/api/clasificados/empleos/listings";
        } catch {
          return false;
        }
      },
      { timeout: 45_000 },
    );
  } catch {
    /* ignore */
  }
  await expect(hit).toBeVisible({ timeout: 90_000 });
}

test.describe.configure({ timeout: 420_000 });

test.describe("Empleos manual QA seed (persistent rows, no cleanup)", () => {
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

  test("seed three polished listings + verify surfaces + apply (rows kept)", async ({ page, context }) => {
    test.skip(!url || !anon || !service);

    const baseURL = test.info().project.use.baseURL ?? "http://127.0.0.1:3021";
    const published: Published[] = [];

    await seedSupabaseSession({ page, context, supabaseUrl: url!, anonKey: anon!, email: SELLER_EMAIL, password: SELLER_PASSWORD });

    // --- Quick ---
    await page.goto("/");
    await seedSessionDraft({ page, context, key: SESSION.quick, state: manualQuickDraft });
    const quick = await publishFromLane(page, "/publicar/empleos/quick?lang=es");
    await page.waitForURL(new RegExp(`/clasificados/empleos/${quick.slug}\\b`, "i"), { timeout: 120_000 });
    published.push({
      lane: "quick",
      id: quick.id,
      slug: quick.slug,
      title: manualQuickDraft.title,
      lifecycle_status: quick.lifecycle_status,
      filterProof: {
        fields: "ZIP from application address (94103) + keyword marker",
        filterUrl: `${baseURL}/clasificados/empleos/resultados?lang=es&zip=94103&q=${encodeURIComponent(MANUAL_QA_MARKERS.quick)}&sort=relevance`,
        appeared: true,
      },
    });

    // --- Premium ---
    await page.goto("/");
    await seedSessionDraft({ page, context, key: SESSION.premium, state: manualPremiumDraft });
    const premium = await publishFromLane(page, "/publicar/empleos/premium?lang=es");
    await page.waitForURL(new RegExp(`/clasificados/empleos/${premium.slug}\\b`, "i"), { timeout: 120_000 });
    published.push({
      lane: "premium",
      id: premium.id,
      slug: premium.slug,
      title: manualPremiumDraft.title,
      lifecycle_status: premium.lifecycle_status,
      filterProof: {
        fields: "category=tecnologia, modality=hibrido (application), keyword marker",
        filterUrl: `${baseURL}/clasificados/empleos/resultados?lang=es&category=tecnologia&modality=hibrido&q=${encodeURIComponent(MANUAL_QA_MARKERS.premium)}&sort=relevance`,
        appeared: true,
      },
    });

    // --- Feria ---
    await page.goto("/");
    await seedSessionDraft({ page, context, key: SESSION.feria, state: manualFeriaDraft });
    const feria = await publishFromLane(page, "/publicar/empleos/feria?lang=es");
    await page.waitForURL(new RegExp(`/clasificados/empleos/${feria.slug}\\b`, "i"), { timeout: 120_000 });
    published.push({
      lane: "feria",
      id: feria.id,
      slug: feria.slug,
      title: manualFeriaDraft.title,
      lifecycle_status: feria.lifecycle_status,
      filterProof: {
        fields: "industry substring from application industryFocus + keyword marker",
        filterUrl: `${baseURL}/clasificados/empleos/resultados?lang=es&industry=hospitalidad&q=${encodeURIComponent(MANUAL_QA_MARKERS.feria)}&sort=relevance`,
        appeared: true,
      },
    });

    // Landing: each listing reachable via slug link
    await page.goto("/clasificados/empleos?lang=es");
    await expect(page.getByRole("heading", { name: /Empleos/i }).first()).toBeVisible({ timeout: 60_000 });
    for (const p of published) {
      await expect(page.locator(`a[href*="/clasificados/empleos/${encodeURIComponent(p.slug)}"]`).first()).toBeVisible({ timeout: 90_000 });
    }

    // Results + filters
    const markerByLane = { quick: MANUAL_QA_MARKERS.quick, premium: MANUAL_QA_MARKERS.premium, feria: MANUAL_QA_MARKERS.feria };
    for (const p of published) {
      await expectResultsWithFilter(page, { filterUrl: p.filterProof.filterUrl, marker: markerByLane[p.lane] });
    }

    // Public detail pages
    for (const p of published) {
      await page.goto(`${baseURL}/clasificados/empleos/${encodeURIComponent(p.slug)}?lang=es`);
      const mk = markerByLane[p.lane];
      await expect(page.getByRole("heading", { name: new RegExp(mk.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") })).toBeVisible({ timeout: 60_000 });
    }

    // Seller dashboard
    await seedSupabaseSession({ page, context, supabaseUrl: url!, anonKey: anon!, email: SELLER_EMAIL, password: SELLER_PASSWORD });
    await page.goto("/dashboard/empleos?lang=es");
    await expect(page.getByText(/Mis vacantes|My job listings/i).first()).toBeVisible({ timeout: 60_000 });
    for (const m of Object.values(MANUAL_QA_MARKERS)) {
      await expect(page.getByText(m, { exact: false }).first()).toBeVisible({ timeout: 60_000 });
    }

    // Buyer application on Quick listing
    const quickRow = published.find((x) => x.lane === "quick")!;
    await seedSupabaseSession({ page, context, supabaseUrl: url!, anonKey: anon!, email: BUYER_EMAIL, password: BUYER_PASSWORD });
    await page.goto(`${baseURL}/clasificados/empleos/${encodeURIComponent(quickRow.slug)}?lang=es`);
    await page.getByLabel("Nombre").fill("Aspirante Manual QA");
    await page.getByLabel("Email").fill(BUYER_EMAIL);
    await page.getByLabel(/Teléfono/i).fill("+1 415 555 0288");
    await page.getByLabel(/Mensaje/i).fill(
      "Carta breve: cocinero con 9 años en línea caliente, HACCP nivel 2, disponibilidad turno cena. Me interesa Bayview Tavola por su modelo cooperativo y producto local.",
    );
    const applyRespWait = page.waitForResponse(
      (r) => r.request().method() === "POST" && new URL(r.url()).pathname.replace(/\/+$/, "") === "/api/clasificados/empleos/applications",
      { timeout: 90_000 },
    );
    await page.getByRole("button", { name: /Enviar solicitud|Submit application/i }).click();
    const applyResp = await applyRespWait;
    expect(applyResp.ok(), `apply failed ${applyResp.status()}`).toBeTruthy();
    await expect(page.getByText(/Solicitud enviada|Application sent/i).first()).toBeVisible({ timeout: 60_000 });

    // Seller sees applicant
    await seedSupabaseSession({ page, context, supabaseUrl: url!, anonKey: anon!, email: SELLER_EMAIL, password: SELLER_PASSWORD });
    await page.goto(`${baseURL}/dashboard/empleos/${encodeURIComponent(quickRow.id)}?lang=es`);
    await expect(page.getByText(/Solicitudes|Applications/i).first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText("Aspirante Manual QA", { exact: false }).first()).toBeVisible({ timeout: 60_000 });

    // Admin workspace listing
    await page.goto(`${baseURL}/admin/login`);
    await page.locator('input[name="password"]').fill(ADMIN_SITE_PASSWORD);
    await page.getByRole("button", { name: /log in/i }).click();
    await page.waitForURL(/\/admin(\/|$)/, { timeout: 45_000 });
    await page.goto(`${baseURL}/admin/workspace/clasificados/empleos`);
    await expect(page.getByRole("heading", { name: /Empleos — listados/i }).first()).toBeVisible({ timeout: 60_000 });
    for (const m of Object.values(MANUAL_QA_MARKERS)) {
      await expect(page.getByText(m, { exact: false }).first()).toBeVisible({ timeout: 60_000 });
    }

    const outPath = path.join(process.cwd(), "e2e", "empleos", "manual-qa-seed-output.json");
    fs.writeFileSync(
      outPath,
      JSON.stringify(
        {
          createdAt: new Date().toISOString(),
          baseURL,
          published,
          application: { listingLane: "quick", listingId: quickRow.id, applicantLabel: "Aspirante Manual QA", buyerEmail: BUYER_EMAIL },
          note: "Rows intentionally not deleted — for manual visual QA.",
        },
        null,
        2,
      ),
      "utf8",
    );
    console.log(`[manual-qa-seed] wrote ${outPath}`);
  });
});
