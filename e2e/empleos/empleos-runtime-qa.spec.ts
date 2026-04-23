import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SELLER_EMAIL = process.env.SMOKE_SELLER_EMAIL ?? "smoke.seller@yourdomain.com";
const SELLER_PASSWORD = process.env.SMOKE_SELLER_PASSWORD ?? "LeonixSmoke!2026Seller";
const BUYER_EMAIL = process.env.SMOKE_BUYER_EMAIL ?? "smoke.buyer@yourdomain.com";
const BUYER_PASSWORD = process.env.SMOKE_BUYER_PASSWORD ?? "LeonixSmoke!2026Buyer";

/** Admin workspace uses `/admin/login` shared password cookie gate (not Supabase). */
const ADMIN_SITE_PASSWORD =
  process.env.ADMIN_PASSWORD ??
  process.env.SMOKE_ADMIN_SITE_PASSWORD ??
  process.env.SMOKE_ADMIN_PASSWORD ??
  "LeonixSmoke!2026Admin";

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

function nowTag(): string {
  return String(Date.now());
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1200&q=70";

type Published = { lane: "quick" | "premium" | "feria"; id: string; slug: string; title: string; url: string };

async function expectResultsFindsTitle(page: import("@playwright/test").Page, args: { q: string; title: string; tries?: number }) {
  await page.goto(`/clasificados/empleos/resultados?lang=es&q=${encodeURIComponent(args.q)}&sort=relevance`);
  try {
    const loc = await page.evaluate(() => ({ href: window.location.href, q: new URLSearchParams(window.location.search).get("q") }));
    console.log("[empleos-runtime-qa] results location", JSON.stringify(loc));
  } catch {
    /* ignore */
  }
  const hit = page.getByText(args.title, { exact: false }).first();
  if (await hit.isVisible().catch(() => false)) return;

  // Allow the client live-catalog refresh (`/api/clasificados/empleos/listings`) + React re-render.
  try {
    const r = await page.waitForResponse(
      (r) => r.request().method() === "GET" && /\/api\/clasificados\/empleos\/listings\b/i.test(r.url()),
      { timeout: 30_000 },
    );
    let contains = null as null | boolean;
    try {
      const j = (await r.json()) as { ok?: boolean; jobs?: Array<{ title?: string }> };
      contains = Array.isArray(j.jobs) ? j.jobs.some((x) => String(x?.title ?? "").includes(args.title)) : false;
      console.log(
        "[empleos-runtime-qa] client catalog fetch",
        JSON.stringify({ status: r.status(), ok: r.ok(), jobsCount: Array.isArray(j.jobs) ? j.jobs.length : null, containsTitle: contains }),
      );
    } catch {
      console.log("[empleos-runtime-qa] client catalog fetch", JSON.stringify({ status: r.status(), ok: r.ok(), parse: "failed" }));
    }
  } catch {
    /* ignore */
  }
  try {
    await expect(hit).toBeVisible({ timeout: 90_000 });
  } catch (e) {
    const matchesLine = (await page.locator("main").getByText(/Se encontr|opening found/i).first().textContent().catch(() => "")) ?? "";
    const emptyTitle = (await page.getByText(/No encontramos vacantes|No openings match/i).first().textContent().catch(() => "")) ?? "";
    const sample = ((await page.locator("main").innerText().catch(() => "")) ?? "").slice(0, 600);
    console.log("[empleos-runtime-qa] results debug", JSON.stringify({ matchesLine, emptyTitle, sample }, null, 2));
    throw e;
  }
}

async function assertCatalogApiIncludesTitle(page: import("@playwright/test").Page, title: string) {
  const res = await page.request.get("/api/clasificados/empleos/listings");
  const txt = await res.text();
  if (!res.ok()) throw new Error(`catalog_api_failed status=${res.status()} body=${txt.slice(0, 400)}`);
  const json = JSON.parse(txt) as { ok?: boolean; jobs?: Array<{ title?: string }> };
  if (!json.ok || !Array.isArray(json.jobs)) throw new Error(`catalog_api_bad_body ${txt.slice(0, 400)}`);
  const hit = json.jobs.some((j) => String(j?.title ?? "").includes(title));
  if (!hit) throw new Error(`catalog_api_missing_title title="${title}" jobsCount=${json.jobs.length}`);
}

async function publishFromLane(page: import("@playwright/test").Page, laneUrl: string) {
  await page.goto(laneUrl);
  const publishBtn = page.getByRole("button", { name: /Publicar|Publish/i });
  await expect(publishBtn).toBeVisible({ timeout: 60_000 });
  await expect(publishBtn).toBeEnabled({ timeout: 60_000 });
  await publishBtn.click();

  // Modal uses `role="dialog"` without an accessible name; match by role + aria-modal.
  const modal = page.locator('[role="dialog"][aria-modal="true"]').first();
  await expect(modal).toBeVisible({ timeout: 25_000 });

  // 3 mandatory checkboxes
  const checks = modal.locator('input[type="checkbox"]');
  await expect(checks).toHaveCount(3);
  for (let i = 0; i < 3; i++) {
    await checks.nth(i).check();
  }

  const confirm = modal.getByRole("button", { name: /Continuar|Continue/i });
  await expect(confirm).toBeEnabled({ timeout: 25_000 });

  const respWait = page.waitForResponse(
    (r) => r.request().method() === "POST" && /\/api\/clasificados\/empleos\/listings\b/i.test(r.url()),
    { timeout: 60_000 },
  );
  await confirm.click();
  const resp = await respWait;
  const txt = await resp.text();
  if (!resp.ok()) throw new Error(`publish_failed status=${resp.status()} body=${txt}`);
  const json = JSON.parse(txt) as { ok?: boolean; id?: string; slug?: string; lifecycle_status?: string; error?: string };
  if (!json.ok || !json.id || !json.slug) throw new Error(`publish_failed body=${txt}`);
  return { id: String(json.id), slug: String(json.slug), lifecycle_status: String(json.lifecycle_status ?? "") };
}

test.describe.configure({ timeout: 300_000 });

test.describe("Empleos runtime QA (publish → live browse → apply → dashboards)", () => {
  test.beforeAll(async () => {
    test.skip(!url || !anon || !service, "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY");
    const admin = createClient(url!, service!, { auth: { persistSession: false, autoRefreshToken: false } });
    async function ensureUser(email: string, password: string) {
      const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error && !String(error.message).toLowerCase().includes("already")) throw error;
    }
    await ensureUser(SELLER_EMAIL, SELLER_PASSWORD);
    await ensureUser(BUYER_EMAIL, BUYER_PASSWORD);
  });

  test("quick + premium + feria publish, live discovery, buyer apply, seller dashboard, admin moderation view", async ({ page, context }) => {
    test.skip(!url || !anon || !service);

    const adminDb = createClient(url!, service!, { auth: { persistSession: false, autoRefreshToken: false } });
    const createdIds: string[] = [];
    const published: Published[] = [];
    let appliedOk: boolean | null = null;
    let appliedStatus: number | null = null;
    let appliedBody: string | null = null;

    try {
      // SELLER session
      await seedSupabaseSession({ page, context, supabaseUrl: url!, anonKey: anon!, email: SELLER_EMAIL, password: SELLER_PASSWORD });

      // 1) QUICK publish (session-seeded draft)
      const tagQ = `QA_EMPLEOS_QUICK_${nowTag()}`;
      const quickTitle = `Cocinero QA ${tagQ}`;
      const quickDraft = {
        title: quickTitle,
        businessName: "Cocina Leonix QA",
        categorySlug: "oficina",
        experienceLevel: "mid",
        city: "NorCal",
        state: "CA",
        jobType: "tiempo-completo",
        schedule: "Lunes a viernes",
        pay: "$22/hr",
        description: `Vacante QA (quick). ${tagQ}.`,
        benefits: ["Comida incluida", "Horario estable"],
        screenerQuestions: ["¿Cuándo puedes iniciar?"],
        images: [{ id: `img_${tagQ}`, url: FALLBACK_IMG, alt: "Foto de prueba", isMain: true }],
        logoUrl: "",
        phone: "5555550199",
        whatsapp: "",
        email: SELLER_EMAIL,
        website: "",
        primaryCta: "email",
        addressLine1: "123 Market St",
        addressCity: "NorCal",
        addressState: "CA",
        addressZip: "94102",
        videoObjectUrl: null,
        videoFileName: "",
        videoUrl: "",
      };
      await page.goto("/");
      await seedSessionDraft({ page, context, key: "leonix_empleos_quick_draft_v1", state: quickDraft });
      const quickRes = await publishFromLane(page, "/publicar/empleos/quick?lang=es");
      createdIds.push(quickRes.id);
      await page.waitForURL(new RegExp(`/clasificados/empleos/${quickRes.slug}\\b`, "i"), { timeout: 60_000 });
      await expect(page.getByRole("heading", { name: new RegExp(tagQ, "i") })).toBeVisible({ timeout: 60_000 });
      published.push({ lane: "quick", id: quickRes.id, slug: quickRes.slug, title: quickTitle, url: page.url() });

      // 2) PREMIUM publish (session-seeded draft)
      const tagP = `QA_EMPLEOS_PREMIUM_${nowTag()}`;
      const premiumTitle = `Sales Manager QA ${tagP}`;
      const premiumDraft = {
        title: premiumTitle,
        companyName: "Leonix QA Inc",
        categorySlug: "oficina",
        experienceLevel: "mid",
        workModality: "hibrido",
        scheduleLabel: "Tiempo completo",
        city: "NorCal",
        state: "CA",
        salaryPrimary: "$75k–$95k",
        salarySecondary: "",
        jobType: "tiempo-completo",
        featured: true,
        premium: true,
        gallery: [{ id: `img_${tagP}`, url: FALLBACK_IMG, alt: "Hero de prueba", isMain: true }],
        logoUrl: "",
        applyLabel: "Aplicar",
        websiteUrl: "https://example.com/apply",
        whatsapp: "",
        email: SELLER_EMAIL,
        primaryCta: "website",
        screenerQuestions: ["¿Tienes experiencia en ventas B2B?"],
        introduction: `Vacante QA (premium). ${tagP}.`,
        responsibilities: ["Prospección", "Seguimiento"],
        requirements: ["Inglés básico", "2+ años"],
        offers: ["Bonos", "Seguro"],
        companyOverview: "Empresa de prueba para QA.",
        employerRating: "4.6",
        employerAddress: "NorCal, CA 94102",
        reviewCount: "23",
        videoObjectUrl: null,
        videoFileName: "",
        videoUrl: "",
      };
      await page.goto("/");
      await seedSessionDraft({ page, context, key: "leonix_empleos_premium_draft_v1", state: premiumDraft });
      const premRes = await publishFromLane(page, "/publicar/empleos/premium?lang=es");
      createdIds.push(premRes.id);
      await page.waitForURL(new RegExp(`/clasificados/empleos/${premRes.slug}\\b`, "i"), { timeout: 60_000 });
      await expect(page.getByRole("heading", { name: new RegExp(tagP, "i") })).toBeVisible({ timeout: 60_000 });
      published.push({ lane: "premium", id: premRes.id, slug: premRes.slug, title: premiumTitle, url: page.url() });

      // 3) FERIA publish (session-seeded draft)
      const tagF = `QA_EMPLEOS_FERIA_${nowTag()}`;
      const feriaTitle = `Feria de empleo QA ${tagF}`;
      const feriaDraft = {
        title: feriaTitle,
        flyerImageUrl: FALLBACK_IMG,
        flyerAlt: "Flyer QA",
        dateLine: "Sábado 10:00 AM",
        timeLine: "10:00–14:00",
        venue: "Centro comunitario",
        city: "NorCal",
        state: "CA",
        organizer: "Leonix QA Org",
        organizerUrl: "https://example.com",
        modality: "presencial",
        freeEntry: true,
        bilingual: true,
        industryFocus: "Servicios",
        detailsBullets: ["Trae CV", "Entrevistas en sitio"],
        secondaryDetails: ["Estacionamiento disponible"],
        ctaIntro: "Regístrate y llega temprano.",
        contactLink: "https://example.com/register",
        contactPhone: "",
        contactEmail: SELLER_EMAIL,
        ctaLabel: "Registrarme",
      };
      await page.goto("/");
      await seedSessionDraft({ page, context, key: "leonix_empleos_feria_draft_v1", state: feriaDraft });
      const feriaRes = await publishFromLane(page, "/publicar/empleos/feria?lang=es");
      createdIds.push(feriaRes.id);
      await page.waitForURL(new RegExp(`/clasificados/empleos/${feriaRes.slug}\\b`, "i"), { timeout: 60_000 });
      await expect(page.getByRole("heading", { name: new RegExp(tagF, "i") })).toBeVisible({ timeout: 60_000 });
      published.push({ lane: "feria", id: feriaRes.id, slug: feriaRes.slug, title: feriaTitle, url: page.url() });

      // 4) Landing/results: live-only policy (no sample catalog leakage) + discovery via q/zip
      await page.goto("/clasificados/empleos?lang=es");
      await expect(page.getByRole("heading", { name: /Empleos/i }).first()).toBeVisible({ timeout: 60_000 });
      await expect(page.getByText("Ejecutivo de ventas B2B", { exact: false })).toHaveCount(0);

      await assertCatalogApiIncludesTitle(page, quickTitle);

      for (const p of published) {
        const { data: dbRow, error: dbErr } = await adminDb
          .from("empleos_public_listings")
          .select("id, slug, title, lifecycle_status, published_at")
          .eq("id", p.id)
          .maybeSingle();
        if (dbErr || !dbRow) throw new Error(`db_missing_after_publish lane=${p.lane} id=${p.id} err=${dbErr?.message ?? "no_row"}`);
        if (String((dbRow as { lifecycle_status?: string }).lifecycle_status) !== "published") {
          throw new Error(`db_not_published lane=${p.lane} id=${p.id} status=${String((dbRow as { lifecycle_status?: string }).lifecycle_status)}`);
        }
        console.log("[empleos-runtime-qa] db row", JSON.stringify(dbRow));

        const q = p.title.split(" ").slice(-1)[0] ?? p.title;
        await expectResultsFindsTitle(page, { q, title: p.title, tries: 14 });
        await expect(page.locator(`a[href*="/clasificados/empleos/${encodeURIComponent(p.slug)}"]`).first()).toBeVisible({ timeout: 60_000 });
      }
      // zip filter should find at least the quick listing (postal_code=94102)
      await page.goto("/clasificados/empleos/resultados?lang=es&zip=94102");
      await expect(page.getByText(quickTitle, { exact: false }).first()).toBeVisible({ timeout: 60_000 });

      // 5) Public detail renders for each published row
      for (const p of published) {
        await page.goto(p.url);
        await expect(page.getByRole("heading", { name: new RegExp(p.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")) })).toBeVisible({
          timeout: 60_000,
        });
      }

      // 6) BUYER apply (internal apply form) on quick listing
      await seedSupabaseSession({ page, context, supabaseUrl: url!, anonKey: anon!, email: BUYER_EMAIL, password: BUYER_PASSWORD });
      const applyTarget = published.find((x) => x.lane === "quick")!;
      await page.goto(applyTarget.url);

      await page.getByLabel("Nombre").fill("Smoke Buyer");
      await page.getByLabel("Email").fill(BUYER_EMAIL);
      await page.getByLabel(/Teléfono/i).fill("5555550299");
      await page.getByLabel(/Mensaje/i).fill(`Solicitud QA buyer ${nowTag()}`);

      const applyRespWait = page.waitForResponse(
        (r) => r.request().method() === "POST" && /\/api\/clasificados\/empleos\/applications\b/i.test(r.url()),
        { timeout: 60_000 },
      );
      await page.getByRole("button", { name: /Enviar solicitud|Submit application/i }).click();
      const applyResp = await applyRespWait;
      appliedStatus = applyResp.status();
      appliedBody = await applyResp.text();
      appliedOk = applyResp.ok();
      expect(appliedOk, `apply failed status=${appliedStatus} body=${appliedBody}`).toBeTruthy();
      await expect(page.getByText(/Solicitud enviada|Application sent/i).first()).toBeVisible({ timeout: 60_000 });

      // 7) SELLER dashboard shows listings + manage page shows applications
      await seedSupabaseSession({ page, context, supabaseUrl: url!, anonKey: anon!, email: SELLER_EMAIL, password: SELLER_PASSWORD });
      await page.goto("/dashboard/empleos?lang=es");
      await expect(page.getByText(/Mis vacantes|My job listings/i).first()).toBeVisible({ timeout: 60_000 });
      await expect(page.getByText(tagQ, { exact: false }).first()).toBeVisible({ timeout: 60_000 });
      await page.goto(`/dashboard/empleos/${encodeURIComponent(applyTarget.id)}?lang=es`);
      await expect(page.getByText(/Solicitudes|Applications/i).first()).toBeVisible({ timeout: 60_000 });
      await expect(page.getByText("Smoke Buyer", { exact: false }).first()).toBeVisible({ timeout: 60_000 });

      // 8) ADMIN moderation view shows created listing (cookie gate)
      await page.goto("/admin/login");
      await page.locator('input[name="password"]').fill(ADMIN_SITE_PASSWORD);
      await page.getByRole("button", { name: /log in/i }).click();
      await page.waitForURL(/\/admin(\/|$)/, { timeout: 30_000 });
      await page.goto("/admin/workspace/clasificados/empleos");
      await expect(page.getByRole("heading", { name: /Empleos — listados/i }).first()).toBeVisible({ timeout: 60_000 });
      await expect(page.getByText(tagQ, { exact: false }).first()).toBeVisible({ timeout: 60_000 });

      // 9) STATUS GATING: seller pauses listing → public detail not found → republish
      await seedSupabaseSession({ page, context, supabaseUrl: url!, anonKey: anon!, email: SELLER_EMAIL, password: SELLER_PASSWORD });
      await page.goto(`/dashboard/empleos/${encodeURIComponent(applyTarget.id)}?lang=es`);
      await page.getByRole("button", { name: /Pause/i }).click();
      await page.waitForTimeout(1500);
      await page.goto(applyTarget.url);
      await expect(page.getByText(/404|no encontrado|not found/i).first()).toBeVisible({ timeout: 60_000 });
      await page.goto(`/dashboard/empleos/${encodeURIComponent(applyTarget.id)}?lang=es`);
      await page.getByRole("button", { name: /Publish/i }).click();
      await page.waitForTimeout(1500);
      await page.goto(applyTarget.url);
      await expect(page.getByRole("heading", { name: new RegExp(tagQ, "i") })).toBeVisible({ timeout: 60_000 });

      console.log(
        "[empleos-runtime-qa] RESULTS",
        JSON.stringify({ published: published.map((p) => ({ lane: p.lane, id: p.id, slug: p.slug })), appliedOk, appliedStatus }, null, 2),
      );
    } finally {
      if (createdIds.length) {
        await adminDb.from("empleos_job_applications").delete().in("listing_id", createdIds);
        await adminDb.from("empleos_public_listings").delete().in("id", createdIds);
      }
    }
  });
});

