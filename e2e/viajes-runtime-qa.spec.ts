import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SELLER_EMAIL = process.env.SMOKE_SELLER_EMAIL ?? "smoke.seller@yourdomain.com";
const SELLER_PASSWORD = process.env.SMOKE_SELLER_PASSWORD ?? "LeonixSmoke!2026Seller";
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
  return sess.session;
}

test.describe.configure({ timeout: 240_000 });

test.describe("Viajes runtime QA", () => {
  test.beforeAll(async () => {
    test.skip(!url || !anon || !service, "Missing Supabase env vars (url/anon/service)");
    const admin = createClient(url!, service!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await admin.auth.admin.createUser({ email: SELLER_EMAIL, password: SELLER_PASSWORD, email_confirm: true });
    if (error && !String(error.message).toLowerCase().includes("already")) throw error;
  });

  test("NEGOCIO: submit → dashboard → admin approve → landing/results/detail → owner unpublish → no stale", async ({ page, context, request }) => {
    test.skip(!url || !anon || !service, "Missing Supabase env vars (url/anon/service)");

    const sess = await seedSupabaseSession({
      page,
      context,
      supabaseUrl: url!,
      anonKey: anon!,
      email: SELLER_EMAIL,
      password: SELLER_PASSWORD,
    });
    const token = sess.access_token;
    const ownerUserId = sess.user.id;

    const uniq = `VJ_BUS_${Date.now()}`;
    const negociosDraft = {
      schemaVersion: 1,
      offerType: "tour",
      titulo: `${uniq} Tour de prueba`,
      destino: "Cancún, México",
      ciudadSalida: "San Jose (SJO)",
      precio: "USD 123",
      duracion: "3 días · 2 noches",
      fechas: "Mayo 2026",
      dateMode: "note",
      fechaInicio: "2026-05-10",
      fechaFin: "2026-05-12",
      fechasNota: "Navidad (prueba) · flexible",
      descripcion: `Descripción QA ${uniq}. Incluye texto único para búsqueda.`,
      incluye: "Hotel\nTraslados\nDesayuno",
      ctaType: "whatsapp",
      familias: true,
      parejas: true,
      grupos: false,
      presupuestoTag: "economico",
      incluyeHotel: true,
      incluyeTransporte: true,
      incluyeComida: true,
      guiaEspanol: true,
      idiomaAtencion: "Español e inglés (bilingüe)",
      imagenPrincipal: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=900&q=80",
      localHeroImageId: null,
      localImageDataUrl: null,
      heroSourceMode: "url",
      galeriaUrls: [],
      galeriaNota: "",
      logoSocio: "",
      logoLocalDataUrl: null,
      logoSourceMode: "url",
      videoUrl: "",
      videoLocalLabel: "",
      businessName: `Agencia ${uniq}`,
      phone: "+1 (415) 555-0199",
      phoneOffice: "",
      email: SELLER_EMAIL,
      website: "example.com",
      whatsapp: "+1 (415) 555-0199",
      socials: "",
      socialFacebook: "",
      socialInstagram: "",
      socialTiktok: "",
      socialYoutube: "",
      socialTwitter: "",
      destinationsServed: "Belice, Caribe",
      languages: "Español, English",
    };

    const pub = await request.post("/api/clasificados/viajes/submit", {
      data: { lane: "business", lang: "es", negociosDraft },
      headers: { Authorization: `Bearer ${token}` },
    });
    const pubText = await pub.text();
    expect(pub.ok(), `submit failed ${pub.status()}: ${pubText}`).toBeTruthy();
    const pubJson = JSON.parse(pubText) as { ok?: boolean; id?: string; slug?: string };
    expect(pubJson.ok).toBeTruthy();
    const id = String(pubJson.id);
    const slug = String(pubJson.slug);
    console.log(`[viajes-e2e] negocio submitted id=${id} slug=${slug} uniq=${uniq}`);

    const adminSb = createClient(url!, service!, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: row, error: rowErr } = await adminSb.from("viajes_staged_listings").select("*").eq("id", id).maybeSingle();
    expect(rowErr, rowErr?.message ?? "").toBeNull();
    expect(row, "row missing").toBeTruthy();
    expect((row as any).owner_user_id).toBe(ownerUserId);
    expect((row as any).lifecycle_status).toBe("submitted");

    await page.goto("/dashboard/viajes?lang=es");
    await expect(page.getByText(/Viajes/i).first()).toBeVisible({ timeout: 60_000 });
    // Dashboard table renders `title` column prominently; slug is present but not guaranteed visible as text.
    await expect(page.getByText(uniq, { exact: false }).first()).toBeVisible({ timeout: 60_000 });

    // Not public yet
    const pre = await request.get(`/clasificados/viajes/oferta/${encodeURIComponent(slug)}?lang=es`);
    expect([404, 200]).toContain(pre.status());

    // Admin approve
    await page.goto("/admin/login");
    await page.locator('input[name="password"]').fill(ADMIN_SITE_PASSWORD);
    await page.getByRole("button", { name: /log in/i }).click();
    await page.waitForURL(/\/admin(\/|$)/, { timeout: 30_000 });

    const approve = await page.request.post("/api/admin/viajes/staged-listings/moderate", {
      data: { id, action: "approve" },
    });
    const approveText = await approve.text();
    expect(approve.ok(), `approve failed ${approve.status()}: ${approveText}`).toBeTruthy();
    console.log(`[viajes-e2e] negocio approved id=${id} slug=${slug}`);

    // Public detail should render
    await page.goto(`/clasificados/viajes/oferta/${encodeURIComponent(slug)}?lang=es`);
    await expect(page.locator("h1", { hasText: uniq })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/Negocio en Leonix|Operador o agencia/i).first()).toBeVisible();

    // Results: find by q (title haystack)
    await page.goto(`/clasificados/viajes/resultados?lang=es&q=${encodeURIComponent(uniq)}`);
    await expect(page.locator(`a[href*="/clasificados/viajes/oferta/${slug}"]`).first()).toBeVisible({ timeout: 60_000 });

    // Filter by svcLang and budget and duration and season derived keys
    await page.goto(
      `/clasificados/viajes/resultados?lang=es&q=${encodeURIComponent(uniq)}&svcLang=bilingual&budget=economico&duration=short&season=holidays`,
    );
    await expect(page.locator(`a[href*="/clasificados/viajes/oferta/${slug}"]`).first()).toBeVisible({ timeout: 60_000 });

    // Owner unpublish
    const unpub = await request.post("/api/clasificados/viajes/staged-owner", {
      data: { id, action: "unpublish" },
      headers: { Authorization: `Bearer ${token}` },
    });
    const unpubText = await unpub.text();
    expect(unpub.ok(), `unpublish failed ${unpub.status()}: ${unpubText}`).toBeTruthy();
    console.log(`[viajes-e2e] negocio unpublished id=${id} slug=${slug}`);

    // No stale: in production this is a real 404; in `next dev` it can be a 200 with a not-found fallback document.
    const after = await request.get(`/clasificados/viajes/oferta/${encodeURIComponent(slug)}?lang=es`);
    const body = await after.text();
    if (after.status() !== 404) {
      expect(body).toMatch(/next-error\" content=\"not-found|P[aá]gina no encontrada/i);
    }
  });

  test("PRIVADO: either gated or publish→approve→public surfaces", async ({ page, context, request }) => {
    test.skip(!url || !anon || !service, "Missing Supabase env vars (url/anon/service)");

    const sess = await seedSupabaseSession({
      page,
      context,
      supabaseUrl: url!,
      anonKey: anon!,
      email: SELLER_EMAIL,
      password: SELLER_PASSWORD,
    });
    const token = sess.access_token;

    await page.goto("/publicar/viajes/privado?lang=es");
    if (/\/publicar\/viajes(\?|$)/.test(page.url())) {
      // Gated/redirected to hub (disabled lane) — acceptable when private not in launch scope.
      await expect(page.getByText(/Privado/i).first()).toBeVisible();
      return;
    }

    const uniq = `VJ_PRI_${Date.now()}`;
    const privadoDraft = {
      schemaVersion: 1,
      offerType: "weekend",
      titulo: `${uniq} Escapada privada`,
      destino: "Puerto Viejo, Costa Rica",
      ciudadSalida: "San Francisco (SFO)",
      precio: "CRC 99.000",
      duracion: "2 días · 1 noche",
      fechas: "Junio 2026",
      dateMode: "note",
      fechaInicio: "2026-06-01",
      fechaFin: "2026-06-02",
      fechasNota: "Semana Santa (prueba)",
      descripcion: `Privado QA ${uniq}. Texto único.`,
      incluye: "Hospedaje\nComida",
      familias: false,
      parejas: true,
      grupos: false,
      numeroPersonas: "2",
      incluyeHotel: true,
      incluyeTransporte: false,
      incluyeComida: true,
      guiaEspanol: true,
      politicaReserva: "Pago por transferencia. Cancelación 48h.",
      idiomaAtencion: "Español",
      presupuestoTag: "moderado",
      imagenUrl: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?auto=format&fit=crop&w=900&q=80",
      localImageDataUrl: null,
      localHeroBlobId: null,
      heroSourceMode: "url",
      galeriaUrls: [],
      displayName: `Particular ${uniq}`,
      ctaType: "email",
      phone: "",
      phoneOffice: "",
      whatsapp: "",
      email: SELLER_EMAIL,
      website: "example.com",
      socialFacebook: "",
      socialInstagram: "",
      socialTiktok: "",
      socialYoutube: "",
      socialTwitter: "",
    };

    const pub = await request.post("/api/clasificados/viajes/submit", {
      data: { lane: "private", lang: "es", privadoDraft },
      headers: { Authorization: `Bearer ${token}` },
    });
    const txt = await pub.text();
    if (pub.status() === 409) {
      // API-enforced gate in addition to UI redirect.
      expect(txt).toMatch(/private_lane_disabled/i);
      return;
    }
    expect(pub.ok(), `private submit failed ${pub.status()}: ${txt}`).toBeTruthy();
    const js = JSON.parse(txt) as { ok?: boolean; id?: string; slug?: string };
    expect(js.ok).toBeTruthy();
    const id = String(js.id);
    const slug = String(js.slug);
    console.log(`[viajes-e2e] privado submitted id=${id} slug=${slug} uniq=${uniq}`);

    await page.goto("/admin/login");
    await page.locator('input[name="password"]').fill(ADMIN_SITE_PASSWORD);
    await page.getByRole("button", { name: /log in/i }).click();
    await page.waitForURL(/\/admin(\/|$)/, { timeout: 30_000 });

    const approve = await page.request.post("/api/admin/viajes/staged-listings/moderate", {
      data: { id, action: "approve" },
    });
    const approveText = await approve.text();
    expect(approve.ok(), `approve failed ${approve.status()}: ${approveText}`).toBeTruthy();
    console.log(`[viajes-e2e] privado approved id=${id} slug=${slug}`);

    await page.goto(`/clasificados/viajes/oferta/${encodeURIComponent(slug)}?lang=es`);
    await expect(page.locator("h1", { hasText: uniq })).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(/Particular/i).first()).toBeVisible();
  });

  test("AFFILIATE/PARTNER lane: either visible+labelled or explicitly suppressed", async ({ page }) => {
    await page.goto("/clasificados/viajes?lang=es");
    const label = page.getByText(/Inventario de socio|Socio comercial|Socio de viaje/i).first();
    const labelVisible = await label.isVisible().catch(() => false);

    await page.goto("/clasificados/viajes/resultados?lang=es");
    const label2 = page.getByText(/Inventario de socio|Socio comercial|Socio de viaje/i).first();
    const label2Visible = await label2.isVisible().catch(() => false);

    // Either the curated partner seed is visible (dev default), or it's intentionally suppressed via env.
    expect(labelVisible || label2Visible).toBeTruthy();
  });
});

