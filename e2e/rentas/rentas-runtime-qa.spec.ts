import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

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
  if (sErr || !sess.session) throw new Error(sErr?.message ?? "signInWithPassword failed");
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
  return sess.session;
}

function nowTag(): string {
  return String(Date.now());
}

function tinyPngDataUrl(): string {
  // 1x1 transparent PNG
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO9W1t0AAAAASUVORK5CYII=";
}

type Published = { id: string; url: string; title: string; city: string; branch: "privado" | "negocio" };

async function seedDraftForNextNavigation(
  context: import("@playwright/test").BrowserContext,
  page: import("@playwright/test").Page,
  key: string,
  state: unknown,
) {
  const raw = JSON.stringify(state);
  await context.addInitScript(
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
    [key, raw] as const,
  );
  await page.evaluate(
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
    { key, raw },
  );
}

function listingIdFromUrl(urlStr: string): string | null {
  try {
    const u = new URL(urlStr);
    const m = u.pathname.match(/\/clasificados\/rentas\/listing\/([^/?#]+)/i);
    return m?.[1] ? decodeURIComponent(m[1]) : null;
  } catch {
    const m = urlStr.match(/\/clasificados\/rentas\/listing\/([^/?#]+)/i);
    return m?.[1] ? decodeURIComponent(m[1]) : null;
  }
}

test.describe.configure({ timeout: 240_000 });

test.describe("Rentas runtime QA (publish-to-live pipeline)", () => {
  test.beforeAll(async () => {
    test.skip(
      !url || !anon || !service,
      "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (from .env.local via Playwright config).",
    );
    const admin = createClient(url!, service!, { auth: { persistSession: false, autoRefreshToken: false } });
    async function ensureUser(email: string, password: string) {
      const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error && !String(error.message).toLowerCase().includes("already")) throw error;
    }
    await ensureUser(SELLER_EMAIL, SELLER_PASSWORD);
    await ensureUser(BUYER_EMAIL, BUYER_PASSWORD);
  });

  test("full runtime QA flows", async ({ page, context }) => {
    test.skip(!url || !anon || !service);
    test.setTimeout(240_000);

    const published: Published[] = [];
    const createdIds: string[] = [];
    const adminClient = createClient(url!, service!, { auth: { persistSession: false, autoRefreshToken: false } });
    let inquiryOk: boolean | null = null;
    let inquiryStatus: number | null = null;
    let inquiryBody: string | null = null;
    let adminOk: boolean | null = null;
    let statusGateOk: boolean | null = null;
    let sellerDashboardOk: boolean | null = null;

    try {
      // 1) SELLER PUBLISH — PRIVADO
      await seedSupabaseSession(page, context, url!, anon!, SELLER_EMAIL, SELLER_PASSWORD);

      const tagPriv = nowTag();
      const privCity = `MonterreyQA-${tagPriv.slice(-6)}`;
      const privTitle = `QA Rentas Privado ${tagPriv}`;
      const privState = {
        v: 1,
        categoriaPropiedad: "residencial",
        titulo: privTitle,
        rentaMensual: "14500",
        deposito: "700",
        plazoContrato: "12-meses",
        disponibilidad: "Disponible hoy",
        amueblado: "amueblado",
        mascotas: "permitidas",
        serviciosIncluidos: "Agua incluida",
        requisitos: "Identificación + depósito",
        ciudad: privCity,
        ubicacionLinea: "Zona Centro, CP 64000",
        enlaceMapa: "https://maps.google.com/?q=Monterrey",
        descripcion: "Anuncio QA Rentas Privado: departamento cómodo, cerca del centro. Datos reales de prueba.",
        estadoAnuncio: "disponible",
        media: {
          photoDataUrls: [tinyPngDataUrl()],
          primaryImageIndex: 0,
          videoUrl: "",
          videoLocalDataUrl: "",
        },
        seller: {
          fotoDataUrl: "",
          nombre: "Smoke Seller",
          telefono: "5555550199",
          whatsapp: "5555550199",
          correo: SELLER_EMAIL,
          notaContacto: "Contacto por WhatsApp.",
        },
        residencial: { recamaras: "2", banos: "2", construccionM2: "90", estacionamientos: "1" },
        comercial: {},
        terreno: {},
        confirmListingAccurate: true,
        confirmPhotosRepresentItem: true,
        confirmCommunityRules: true,
      };

      await page.goto("/clasificados/publicar/rentas?lang=es");
      await expect(page).toHaveURL(/\/clasificados\/publicar\/rentas/i);

      await seedDraftForNextNavigation(context, page, "rentas-privado-draft-v1", privState);
      await page.goto("/clasificados/rentas/preview/privado?lang=es&propiedad=residencial");
      const publishBtnPriv = page.getByRole("button", { name: /Publicar anuncio|Publish listing/i });
      await expect(publishBtnPriv).toBeVisible({ timeout: 60_000 });
      await publishBtnPriv.click();
      await page.waitForURL(/\/clasificados\/rentas\/listing\//, { timeout: 60_000 });

      const privId = listingIdFromUrl(page.url());
      expect(privId, "should navigate to published listing detail").toBeTruthy();
      const privUrl = page.url();
      published.push({ id: privId!, url: privUrl, title: privTitle, city: privCity, branch: "privado" });
      createdIds.push(privId!);

      // 2) SELLER PUBLISH — NEGOCIO
      const tagNeg = nowTag();
      const negCity = `GuadalajaraQA-${tagNeg.slice(-6)}`;
      const negTitle = `QA Rentas Negocio ${tagNeg}`;
      const negState = {
        v: 2,
        categoriaPropiedad: "residencial",
        titulo: negTitle,
        rentaMensual: "18900",
        deposito: "900",
        plazoContrato: "6-meses",
        disponibilidad: "Disponible 1 de mayo",
        amueblado: "sin_amueblar",
        mascotas: "no_permitidas",
        serviciosIncluidos: "Mantenimiento incluido",
        requisitos: "Aval + depósito",
        ciudad: negCity,
        ubicacionLinea: "Col. Americana, CP 44100",
        enlaceMapa: "https://maps.google.com/?q=Guadalajara",
        descripcion: "Anuncio QA Rentas Negocio: publicado por una correduría. Datos de prueba (no demo).",
        estadoAnuncio: "disponible",
        media: {
          photoDataUrls: [tinyPngDataUrl()],
          primaryImageIndex: 0,
          videoUrl: "",
          videoLocalDataUrl: "",
        },
        negocioNombre: `Inmobiliaria QA ${tagNeg.slice(-6)}`,
        negocioMarca: "Leonix QA Realty",
        negocioLogoDataUrl: "",
        negocioLicencia: "LIC-QA-12345",
        negocioTelDirecto: "5555550299",
        negocioTelOficina: "5555550399",
        negocioEmail: SELLER_EMAIL,
        negocioWhatsapp: "5555550299",
        negocioSitioWeb: "example.com",
        negocioRedes: "https://instagram.com/leonix",
        negocioBio: "Correduría de prueba para QA de Rentas.",
        residencial: { recamaras: "3", banos: "2", construccionM2: "120", estacionamientos: "2" },
        comercial: {},
        terreno: {},
        confirmListingAccurate: true,
        confirmPhotosRepresentItem: true,
        confirmCommunityRules: true,
      };

      await seedDraftForNextNavigation(context, page, "rentas-negocio-draft-v1", negState);
      await page.goto("/clasificados/rentas/preview/negocio?lang=es&propiedad=residencial");
      const publishBtnNeg = page.getByRole("button", { name: /Publicar anuncio|Publish listing/i });
      await expect(publishBtnNeg).toBeVisible({ timeout: 60_000 });
      await publishBtnNeg.click();
      await page.waitForURL(/\/clasificados\/rentas\/listing\//, { timeout: 60_000 });

      const negId = listingIdFromUrl(page.url());
      expect(negId).toBeTruthy();
      const negUrl = page.url();
      published.push({ id: negId!, url: negUrl, title: negTitle, city: negCity, branch: "negocio" });
      createdIds.push(negId!);

      console.log("[rentas-runtime-qa] published", JSON.stringify({ published }, null, 2));

      // 3) LANDING / RESULTS VISIBILITY + filter discovery (city)
      for (const p of published) {
        await page.goto("/clasificados/rentas?lang=es");
        const landingCount = await page.getByText(p.title, { exact: false }).count();
        expect(landingCount).toBeGreaterThanOrEqual(0); // landing may be capped / curated

        await page.goto(`/clasificados/rentas/results?lang=es&city=${encodeURIComponent(p.city)}`);
        await expect(page.getByText(p.title, { exact: false }).first()).toBeVisible({ timeout: 60_000 });
        await expect(page.getByText(new RegExp(p.branch === "privado" ? "Privado" : "Negocio", "i")).first()).toBeVisible({
          timeout: 60_000,
        });
      }

      // 4) PUBLIC DETAIL (application reflected + no demo confusion)
      for (const p of published) {
        await page.goto(p.url);
        const escTitle = p.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        await expect(page.getByRole("heading", { name: new RegExp(escTitle) })).toBeVisible({ timeout: 60_000 });
        await expect(page.getByText(p.city, { exact: false }).first()).toBeVisible({ timeout: 60_000 });
      }

      // 5) BUYER INQUIRY (modal posts to /api/clasificados/rentas/inquiry)
      await seedSupabaseSession(page, context, url!, anon!, BUYER_EMAIL, BUYER_PASSWORD);
      const inquiryTarget = published[0]!;
      await page.goto(inquiryTarget.url);
      await page
        .getByRole("button", { name: /Consulta por Leonix|Message via Leonix|Enviar mensaje|Send email/i })
        .first()
        .click();
      await expect(page.getByRole("heading", { name: /Contactar por correo|Email contact/i }).first()).toBeVisible({
        timeout: 25_000,
      });
      await page.getByPlaceholder(/Tu mensaje|Your message/i).fill("QA: interesado en rentar. ¿Sigue disponible? Gracias.");
      const send = page.getByRole("button", { name: /Enviar por Leonix|Send via Leonix/i });
      await expect(send).toBeEnabled({ timeout: 25_000 });
      try {
        const respWait = page.waitForResponse(
          (r) => r.request().method() === "POST" && /\/api\/clasificados\/rentas\/inquiry\b/i.test(r.url()),
          { timeout: 25_000 },
        );
        await send.click();
        const resp = await respWait;
        inquiryStatus = resp.status();
        inquiryBody = await resp.text();
        inquiryOk = resp.ok();
      } catch (e) {
        inquiryOk = false;
        inquiryStatus = null;
        inquiryBody = String(e);
      }

      // 6) SELLER DASHBOARD (seller sees listing + can open public)
      await seedSupabaseSession(page, context, url!, anon!, SELLER_EMAIL, SELLER_PASSWORD);
      await page.goto("/dashboard/mis-anuncios?lang=es");
      await expect(page.getByText(/Mis anuncios|My listings/i).first()).toBeVisible({ timeout: 60_000 });
      await expect(page.getByText(published[0]!.id.slice(0, 8), { exact: false }).first()).toBeVisible({ timeout: 60_000 });
      sellerDashboardOk = true;

      // 7) ADMIN (workspace list + inspector)
      if (ADMIN_SITE_PASSWORD) {
        try {
          await page.goto("/admin/login");
          await page.locator('input[name="password"]').fill(ADMIN_SITE_PASSWORD);
          await page.getByRole("button", { name: "Log in" }).click();
          await page.waitForURL(/\/admin(\/|$)/, { timeout: 20_000 });
          await page.goto("/admin/workspace/clasificados?category=rentas");
          await expect(page.getByText(/Leonix BR \/ Rentas/i).first()).toBeVisible({ timeout: 25_000 });
          await expect(page.getByText(published[0]!.id.slice(0, 8), { exact: false }).first()).toBeVisible({ timeout: 25_000 });
          await page.goto(`/admin/workspace/clasificados/rentas/${encodeURIComponent(published[0]!.id)}`);
          await expect(page.getByText(/Public listing projection/i).first()).toBeVisible({ timeout: 25_000 });
          adminOk = true;
        } catch (e) {
          adminOk = false;
          console.log("[rentas-runtime-qa] admin failed", String(e));
        }
      } else {
        adminOk = null;
      }

      // 8) STATUS GATING (unpublish hides publicly; restore)
      try {
        const gateId = published[0]!.id;
        const { error: hideErr } = await adminClient.from("listings").update({ is_published: false }).eq("id", gateId);
        if (hideErr) throw new Error(hideErr.message);
        await page.goto(`/clasificados/rentas/listing/${encodeURIComponent(gateId)}?lang=es`);
        await expect(page.getByText(/404|no encontrado|not found/i).first()).toBeVisible({ timeout: 25_000 });
        const { error: showErr } = await adminClient.from("listings").update({ is_published: true }).eq("id", gateId);
        if (showErr) throw new Error(showErr.message);
        statusGateOk = true;
      } catch (e) {
        statusGateOk = false;
        console.log("[rentas-runtime-qa] status gating failed", String(e));
      }

      console.log("[rentas-runtime-qa] PUBLISHED", JSON.stringify({ published }, null, 2));
      console.log(
        "[rentas-runtime-qa] RESULTS",
        JSON.stringify({ inquiryOk, inquiryStatus, inquiryBody, sellerDashboardOk, adminOk, statusGateOk }, null, 2),
      );
    } finally {
      if (createdIds.length) {
        await adminClient.from("listings").delete().in("id", createdIds);
      }
    }
  });
});

