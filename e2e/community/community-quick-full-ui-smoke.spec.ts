import fs from "fs";
import path from "path";

import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

import { COMMUNITY_SESSION_KEYS } from "../../app/(site)/publicar/community/shared/constants/communitySessionKeys";
import { COMMUNITY_PUBLISH_COPY } from "../../app/(site)/publicar/community/shared/copy/communityPublishCopy";

const REPO_ROOT = process.cwd();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const SELLER_EMAIL = (process.env.SMOKE_SELLER_EMAIL ?? "").trim();
const SELLER_PASSWORD = (process.env.SMOKE_SELLER_PASSWORD ?? "").trim();

const ADMIN_SITE_PASSWORD = (
  process.env.ADMIN_PASSWORD ??
  process.env.SMOKE_ADMIN_SITE_PASSWORD ??
  process.env.SMOKE_ADMIN_PASSWORD ??
  ""
).trim();

const IMAGE_FIXTURE = path.join(REPO_ROOT, "public", "logo.png");

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
    [storageKey, persisted] as const,
  );
  await args.page.goto("/", { waitUntil: "domcontentloaded" });
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

async function fillNorCalCity(page: import("@playwright/test").Page) {
  const combo = page.getByPlaceholder(/Ej\. San|San José|San Jose/i).first();
  await combo.fill("San Jose");
  await page.keyboard.press("Enter");
}

async function uploadFlyerImage(page: import("@playwright/test").Page, sectionHeading: RegExp) {
  const section = page.locator("section", { has: page.getByRole("heading", { name: sectionHeading }) });
  const fileInput = section.locator('input[type="file"]').first();
  await expect(fileInput).toBeAttached({ timeout: 30_000 });
  await fileInput.setInputFiles(IMAGE_FIXTURE);
}

/** CTA card: phone/WhatsApp/email/website inputs (avoids collision with primary-action radios also labeled “Teléfono”). */
function primaryContactSection(page: import("@playwright/test").Page) {
  return page.locator("section", { has: page.getByRole("heading", { name: /5\. Contacto \/ CTA/i }) });
}

async function fillPrimaryContactCta(
  page: import("@playwright/test").Page,
  vals: { phone: string; whatsapp: string; email: string; website: string },
) {
  const sec = primaryContactSection(page);
  await sec.locator('input[type="tel"]').nth(0).fill(vals.phone);
  await sec.locator('input[type="tel"]').nth(1).fill(vals.whatsapp);
  await sec.locator('input[type="email"]').fill(vals.email);
  await sec.locator("div.grid").locator('input[type="text"]').first().fill(vals.website);
}

async function setMondaySchedule(page: import("@playwright/test").Page) {
  const lunesRow = page.locator("div", { has: page.getByText("Lunes", { exact: true }) }).filter({ has: page.locator('input[type="checkbox"]') }).first();
  const closedCb = lunesRow.locator('input[type="checkbox"]').first();
  if (await closedCb.isChecked()) {
    await closedCb.click();
  }
  const times = lunesRow.locator('input[type="time"]');
  await times.nth(0).fill("10:00");
  await times.nth(1).fill("11:00");
}

async function confirmPublishCheckboxes(page: import("@playwright/test").Page) {
  await page.getByRole("checkbox", { name: /Confirmo que la información de la clase es veraz/i }).check();
  await page.getByRole("checkbox", { name: /Confirmo que las imágenes o archivos representan la clase/i }).check();
  await page.getByRole("checkbox", { name: /Confirmo que mi anuncio respeta las reglas/i }).check();
}

async function confirmComunidadCheckboxes(page: import("@playwright/test").Page) {
  await page.getByRole("checkbox", { name: /Confirmo que la información del evento es veraz/i }).check();
  await page.getByRole("checkbox", { name: /Confirmo que las imágenes o archivos representan el evento/i }).check();
  await page.getByRole("checkbox", { name: /Confirmo que mi anuncio respeta las reglas/i }).check();
}

async function adminLogin(page: import("@playwright/test").Page) {
  await page.goto("/admin/login", { waitUntil: "domcontentloaded" });
  await page.locator('input[name="password"]').fill(ADMIN_SITE_PASSWORD);
  await page.getByRole("button", { name: "Log in" }).click();
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 30_000 });
}

test.describe.configure({ mode: "serial", timeout: 600_000 });

test.describe("Community quick — full UI smoke (Clases + Comunidad)", () => {
  test.beforeAll(async () => {
    if (!SELLER_EMAIL || !SELLER_PASSWORD) return;
    if (!SUPABASE_URL || !SUPABASE_ANON || !SERVICE_ROLE) return;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false, autoRefreshToken: false } });
    const { error } = await admin.auth.admin.createUser({
      email: SELLER_EMAIL,
      password: SELLER_PASSWORD,
      email_confirm: true,
    });
    if (error && !String(error.message).toLowerCase().includes("already")) {
      throw error;
    }
  });

  test("gates 0–6: env, UI publish, surfaces, negatives, contract + build", async ({ page, context }) => {
    test.skip(!SELLER_EMAIL || !SELLER_PASSWORD, "Set SMOKE_SELLER_EMAIL and SMOKE_SELLER_PASSWORD in .env.local");
    test.skip(!SUPABASE_URL || !SUPABASE_ANON, "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY");
    test.skip(!SERVICE_ROLE, "Set SUPABASE_SERVICE_ROLE_KEY for smoke user provisioning");
    test.skip(!ADMIN_SITE_PASSWORD, "Set ADMIN_PASSWORD or SMOKE_ADMIN_SITE_PASSWORD or SMOKE_ADMIN_PASSWORD");

    const stamp = Date.now();
    const clasesTitle = `Smoke Clase Boxeo ${stamp}`;
    const comunidadTitle = `Smoke Evento Comunitario ${stamp}`;

    // —— Gate 0: routes (no auth) + seller session + dashboard + admin routes ——
    await page.goto("/publicar/clases/quick?lang=es", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /Clase rápida/i })).toBeVisible();
    await page.goto("/publicar/comunidad/quick?lang=es", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /Evento comunitario rápido/i })).toBeVisible();

    await seedSupabaseSession({
      page,
      context,
      supabaseUrl: SUPABASE_URL,
      anonKey: SUPABASE_ANON,
      email: SELLER_EMAIL,
      password: SELLER_PASSWORD,
    });

    await page.goto("/dashboard/mis-anuncios?lang=es", { waitUntil: "networkidle" });
    await dismissCookieConsentIfPresent(page);
    await expect(page.getByRole("heading", { name: /Mis anuncios|My listings/i })).toBeVisible({ timeout: 60_000 });

    await adminLogin(page);
    await page.goto("/admin/workspace/clasificados/clases?q=smoke", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /Clases — listados/i })).toBeVisible();
    await page.goto("/admin/workspace/clasificados/comunidad?q=smoke", { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { name: /Comunidad — listados/i })).toBeVisible();

    await seedSupabaseSession({
      page,
      context,
      supabaseUrl: SUPABASE_URL,
      anonKey: SUPABASE_ANON,
      email: SELLER_EMAIL,
      password: SELLER_PASSWORD,
    });

    // —— Gate 1: Clases UI publish ——
    await page.goto("/publicar/clases/quick?lang=es", { waitUntil: "networkidle" });
    await dismissCookieConsentIfPresent(page);
    await expect(page.getByRole("heading", { name: /Clase rápida/i })).toBeVisible();

    await page.getByLabel(/Título de la clase/i).fill(clasesTitle);
    await page.getByLabel(/Organizador, instructor o negocio/i).fill("Leonix Smoke Fitness");
    await page.getByLabel(/Tipo \/ categoría de la clase/i).selectOption("boxeo");
    await page.getByLabel(/Descripción corta/i).fill(
      "Clase comunitaria de prueba creada por smoke test para verificar publicación real.",
    );
    await page.getByLabel(/¿Para quién es la clase\?/i).selectOption("jovenes");
    await page.getByLabel(/Nivel/i).selectOption("principiante");
    await page.getByLabel(/¿Requiere registro\?/i).selectOption("no");
    await page.getByLabel(/Qué deben llevar o saber/i).fill("Ropa cómoda y agua");

    await page.getByRole("radio", { name: /Clase gratis/i }).check();

    await page.getByRole("radio", { name: /^Presencial$/i }).check();

    await setMondaySchedule(page);

    await page.locator("section", { has: page.getByRole("heading", { name: /4\. Imagen/i }) }).scrollIntoViewIfNeeded();
    await uploadFlyerImage(page, /4\. Imagen/i);

    await page.locator("section", { has: page.getByRole("heading", { name: /5\. Contacto \/ CTA/i }) }).scrollIntoViewIfNeeded();
    await fillPrimaryContactCta(page, {
      phone: "4085551234",
      whatsapp: "4085551234",
      email: "smoke-clases-ui@example.test",
      website: "www.leonixsmoke.example",
    });

    await page.locator("section", { has: page.getByRole("heading", { name: /6\. Ubicación/i }) }).scrollIntoViewIfNeeded();
    await fillNorCalCity(page);
    await page.getByLabel(/Código postal/i).fill("95116");
    await page.getByLabel(/Nombre del lugar/i).fill("Centro Comunitario");
    await page.getByLabel(/^Dirección$/i).fill("123 Calle Principal, Suite 1");

    await page.locator("#community-publish-confirm").scrollIntoViewIfNeeded();
    await confirmPublishCheckboxes(page);

    await page.getByRole("button", { name: "Vista previa" }).click();
    await expect(page).toHaveURL(/\/publicar\/clases\/quick\/preview/);
    await expect(page.getByRole("heading", { name: new RegExp(clasesTitle, "i") })).toBeVisible();
    await expect(page.getByText("Leonix Smoke Fitness")).toBeVisible();
    await expect(page.getByRole("link", { name: "Volver a editar" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Publicar anuncio" })).toBeVisible();

    await page.getByRole("button", { name: "Publicar anuncio" }).click();
    await expect(page.getByRole("button", { name: "Publicando…" })).toBeVisible({ timeout: 5000 }).catch(() => {});
    await page.waitForURL(/\/clasificados\/anuncio\/[a-f0-9-]{36}\?lang=es/i, { timeout: 120_000 });
    const clasesUrl = page.url();
    const clasesIdMatch = clasesUrl.match(/anuncio\/([a-f0-9-]{36})/i);
    expect(clasesIdMatch?.[1]).toBeTruthy();
    const clasesId = clasesIdMatch![1];

    await expect(page.getByTestId("community-anuncio-hero")).toBeVisible();
    await expect(page.locator(`img[src*="blob:"], img[src^="http"], img[src^="/"]`).first()).toBeVisible();
    await expect(page.getByText("NorCal")).toHaveCount(0);
    const bodyText = await page.locator("body").innerText();
    expect(bodyText).not.toMatch(/\{\s*"Leonix:/);
    expect(bodyText.toLowerCase()).not.toContain("https://www.facebook.com");

    // —— Gate 2: Clases surfaces ——
    await page.goto("/clasificados/clases?lang=es", { waitUntil: "networkidle" });
    await expect(page.getByText(clasesTitle).first()).toBeVisible({ timeout: 60_000 });

    await page.goto(`/clasificados/clases/resultados?lang=es&q=${encodeURIComponent(clasesTitle)}`, {
      waitUntil: "networkidle",
    });
    await expect(page.getByText(clasesTitle).first()).toBeVisible({ timeout: 60_000 });

    await seedSupabaseSession({
      page,
      context,
      supabaseUrl: SUPABASE_URL,
      anonKey: SUPABASE_ANON,
      email: SELLER_EMAIL,
      password: SELLER_PASSWORD,
    });
    await page.goto("/dashboard/mis-anuncios?lang=es", { waitUntil: "networkidle" });
    await dismissCookieConsentIfPresent(page);
    await expect(page.getByText(clasesTitle).first()).toBeVisible({ timeout: 60_000 });

    await adminLogin(page);
    await page.goto(`/admin/workspace/clasificados/clases?q=${encodeURIComponent(clasesTitle)}`, {
      waitUntil: "networkidle",
    });
    await expect(page.getByText(clasesTitle).first()).toBeVisible({ timeout: 60_000 });

    await page.goto(`/clasificados/comunidad/resultados?lang=es&q=${encodeURIComponent(clasesTitle)}`, {
      waitUntil: "networkidle",
    });
    await expect(page.getByText(clasesTitle)).toHaveCount(0);
    await page.goto("/clasificados/comunidad?lang=es", { waitUntil: "networkidle" });
    await expect(page.getByText(clasesTitle)).toHaveCount(0);

    // —— Gate 3: Comunidad UI publish ——
    await seedSupabaseSession({
      page,
      context,
      supabaseUrl: SUPABASE_URL,
      anonKey: SUPABASE_ANON,
      email: SELLER_EMAIL,
      password: SELLER_PASSWORD,
    });
    await page.goto("/publicar/comunidad/quick?lang=es", { waitUntil: "networkidle" });
    await dismissCookieConsentIfPresent(page);

    await expect(page.getByText(/Stripe|checkout con tarjeta|Pagar ahora/i)).toHaveCount(0);

    await page.getByLabel(/Título del evento/i).fill(comunidadTitle);
    await page.getByLabel(/^Organizador$/i).fill("Leonix Smoke Community");
    await page.getByLabel(/Tipo \/ categoría del evento/i).selectOption("feria");
    await page.getByLabel(/Descripción corta/i).fill(
      "Evento comunitario de prueba creado por smoke test para verificar publicación real.",
    );
    await page.getByLabel(/¿Para quién es el evento\?/i).selectOption("familias");
    await page.getByLabel(/¿Requiere registro\?/i).selectOption("no");

    await page.getByLabel(/Costo del evento/i).selectOption("gratis");

    await page.getByLabel(/Fecha de inicio del evento/i).fill("2030-07-20");
    await page.getByLabel(/Hora de inicio del evento/i).fill("10:00");
    await page.getByLabel(/Hora de fin del evento/i).fill("11:30");
    await page.getByLabel(/Qué deben llevar o saber/i).fill("Agua y ropa cómoda");

    await page.locator("section", { has: page.getByRole("heading", { name: /4\. Imagen/i }) }).scrollIntoViewIfNeeded();
    await uploadFlyerImage(page, /4\. Imagen/i);

    await page.locator("section", { has: page.getByRole("heading", { name: /5\. Contacto \/ CTA/i }) }).scrollIntoViewIfNeeded();
    await fillPrimaryContactCta(page, {
      phone: "4085559876",
      whatsapp: "4085559876",
      email: "smoke-comunidad-ui@example.test",
      website: "www.leonixsmoke-comunidad.example",
    });

    await page.locator("section", { has: page.getByRole("heading", { name: /6\. Ubicación/i }) }).scrollIntoViewIfNeeded();
    await fillNorCalCity(page);
    await page.getByLabel(/Código postal/i).fill("95116");
    await page.getByLabel(/Nombre del lugar/i).fill("Plaza Cívica");
    await page.getByLabel(/^Dirección$/i).fill("456 Avenida Central");

    await page.locator("#community-publish-confirm").scrollIntoViewIfNeeded();
    await confirmComunidadCheckboxes(page);

    await page.getByRole("button", { name: "Vista previa" }).click();
    await expect(page).toHaveURL(/\/publicar\/comunidad\/quick\/preview/);
    await expect(page.getByRole("heading", { name: new RegExp(comunidadTitle, "i") })).toBeVisible();
    await expect(page.getByText("Leonix Smoke Community")).toBeVisible();
    await expect(page.getByRole("link", { name: "Volver a editar" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Publicar anuncio" })).toBeVisible();
    await expect(page.getByText(/Stripe|checkout con tarjeta|Pagar ahora/i)).toHaveCount(0);

    await page.getByRole("button", { name: "Publicar anuncio" }).click();
    await expect(page.getByRole("button", { name: "Publicando…" })).toBeVisible({ timeout: 5000 }).catch(() => {});
    await page.waitForURL(/\/clasificados\/anuncio\/[a-f0-9-]{36}\?lang=es/i, { timeout: 120_000 });
    const comUrl = page.url();
    const comIdMatch = comUrl.match(/anuncio\/([a-f0-9-]{36})/i);
    expect(comIdMatch?.[1]).toBeTruthy();
    const comunidadId = comIdMatch![1];
    expect(comunidadId).not.toBe(clasesId);

    await expect(page.getByTestId("community-anuncio-hero")).toBeVisible();
    await expect(page.locator(`img[src*="blob:"], img[src^="http"], img[src^="/"]`).first()).toBeVisible();
    const comBody = await page.locator("body").innerText();
    expect(comBody).not.toMatch(/\{\s*"Leonix:/);
    expect(comBody.toLowerCase()).not.toContain("https://www.facebook.com");
    await expect(page.getByText("NorCal")).toHaveCount(0);

    // —— Gate 4: Comunidad surfaces ——
    await page.goto("/clasificados/comunidad?lang=es", { waitUntil: "networkidle" });
    await expect(page.getByText(comunidadTitle).first()).toBeVisible({ timeout: 60_000 });

    await page.goto(`/clasificados/comunidad/resultados?lang=es&q=${encodeURIComponent(comunidadTitle)}`, {
      waitUntil: "networkidle",
    });
    await expect(page.getByText(comunidadTitle).first()).toBeVisible({ timeout: 60_000 });

    await seedSupabaseSession({
      page,
      context,
      supabaseUrl: SUPABASE_URL,
      anonKey: SUPABASE_ANON,
      email: SELLER_EMAIL,
      password: SELLER_PASSWORD,
    });
    await page.goto("/dashboard/mis-anuncios?lang=es", { waitUntil: "networkidle" });
    await dismissCookieConsentIfPresent(page);
    await expect(page.getByText(comunidadTitle).first()).toBeVisible({ timeout: 60_000 });

    await adminLogin(page);
    await page.goto(`/admin/workspace/clasificados/comunidad?q=${encodeURIComponent(comunidadTitle)}`, {
      waitUntil: "networkidle",
    });
    await expect(page.getByText(comunidadTitle).first()).toBeVisible({ timeout: 60_000 });

    await page.goto(`/clasificados/clases/resultados?lang=es&q=${encodeURIComponent(comunidadTitle)}`, {
      waitUntil: "networkidle",
    });
    await expect(page.getByText(comunidadTitle)).toHaveCount(0);
    await page.goto("/clasificados/clases?lang=es", { waitUntil: "networkidle" });
    await expect(page.getByText(comunidadTitle)).toHaveCount(0);

    // —— Gate 5: Paid clases (publish blocked) + PDF (publish error) ——
    await seedSupabaseSession({
      page,
      context,
      supabaseUrl: SUPABASE_URL,
      anonKey: SUPABASE_ANON,
      email: SELLER_EMAIL,
      password: SELLER_PASSWORD,
    });
    await page.goto("/publicar/clases/quick?lang=es", { waitUntil: "networkidle" });
    await dismissCookieConsentIfPresent(page);
    await page.locator("#empleos-final-review").scrollIntoViewIfNeeded();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: /Eliminar borrador/i }).click();
    await page.goto("/publicar/clases/quick?lang=es", { waitUntil: "networkidle" });
    await dismissCookieConsentIfPresent(page);

    await page.getByLabel(/Título de la clase/i).fill(`Smoke Clase Pagada ${stamp}`);
    await page.getByLabel(/Organizador, instructor o negocio/i).fill("Leonix Paid Test");
    await page.getByLabel(/Tipo \/ categoría de la clase/i).selectOption("boxeo");
    await page.getByLabel(/Descripción corta/i).fill("Prueba clase pagada — no debe publicarse como gratis.");
    await page.getByLabel(/¿Para quién es la clase\?/i).selectOption("adultos");
    await page.getByLabel(/Nivel/i).selectOption("intermedio");
    await page.getByLabel(/¿Requiere registro\?/i).selectOption("no");
    await page.getByRole("radio", { name: /Clase pagada/i }).check();
    await page.getByLabel(/^Precio$/i).fill("25");
    await page.getByLabel(/Precio por/i).selectOption("porClase");
    await page.getByRole("radio", { name: /^Presencial$/i }).check();
    await setMondaySchedule(page);
    await page.locator("section", { has: page.getByRole("heading", { name: /4\. Imagen/i }) }).scrollIntoViewIfNeeded();
    await uploadFlyerImage(page, /4\. Imagen/i);
    await page.locator("section", { has: page.getByRole("heading", { name: /5\. Contacto \/ CTA/i }) }).scrollIntoViewIfNeeded();
    await fillPrimaryContactCta(page, {
      phone: "4085551111",
      whatsapp: "4085551111",
      email: "smoke-paid-clases@example.test",
      website: "www.paid-smoke.example",
    });
    await page.locator("section", { has: page.getByRole("heading", { name: /6\. Ubicación/i }) }).scrollIntoViewIfNeeded();
    await fillNorCalCity(page);
    await page.locator("#community-publish-confirm").scrollIntoViewIfNeeded();
    await confirmPublishCheckboxes(page);
    await page.getByRole("button", { name: "Vista previa" }).click();
    await expect(page).toHaveURL(/\/publicar\/clases\/quick\/preview/);
    const paidPublish = page.getByRole("button", { name: "Publicar anuncio" });
    await expect(paidPublish).toBeDisabled();
    await expect(page.getByText(COMMUNITY_PUBLISH_COPY.es.paidClassPublishBlocked)).toBeVisible();
    await seedSupabaseSession({
      page,
      context,
      supabaseUrl: SUPABASE_URL,
      anonKey: SUPABASE_ANON,
      email: SELLER_EMAIL,
      password: SELLER_PASSWORD,
    });
    await page.goto("/dashboard/mis-anuncios?lang=es", { waitUntil: "networkidle" });
    await dismissCookieConsentIfPresent(page);
    await expect(page.getByText(`Smoke Clase Pagada ${stamp}`)).toHaveCount(0);

    // PDF-only: new draft via delete then minimal + pdf
    await page.goto("/publicar/clases/quick?lang=es", { waitUntil: "networkidle" });
    await page.evaluate((k) => {
      try {
        sessionStorage.removeItem(k);
      } catch {
        /* ignore */
      }
    }, COMMUNITY_SESSION_KEYS.clases);
    await page.goto("/publicar/clases/quick?lang=es", { waitUntil: "networkidle" });

    const minimalPdf = Buffer.from(
      "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n",
    );
    const tmpPdf = path.join(REPO_ROOT, `.tmp-smoke-${stamp}.pdf`);
    fs.writeFileSync(tmpPdf, minimalPdf);

    await page.getByLabel(/Título de la clase/i).fill(`Smoke PDF Only ${stamp}`);
    await page.getByLabel(/Organizador, instructor o negocio/i).fill("PDF Smoke Org");
    await page.getByLabel(/Tipo \/ categoría de la clase/i).selectOption("boxeo");
    await page.getByLabel(/Descripción corta/i).fill("Solo PDF en galería — publicación debe bloquearse con mensaje claro.");
    await page.getByLabel(/¿Para quién es la clase\?/i).selectOption("adultos");
    await page.getByLabel(/Nivel/i).selectOption("principiante");
    await page.getByLabel(/¿Requiere registro\?/i).selectOption("no");
    await page.getByRole("radio", { name: /Clase gratis/i }).check();
    await page.getByRole("radio", { name: /^Presencial$/i }).check();
    await setMondaySchedule(page);
    await page.locator("section", { has: page.getByRole("heading", { name: /4\. Imagen/i }) }).scrollIntoViewIfNeeded();
    await page.locator("section", { has: page.getByRole("heading", { name: /4\. Imagen/i }) }).locator('input[type="file"]').first().setInputFiles(tmpPdf);
    await page.locator("section", { has: page.getByRole("heading", { name: /5\. Contacto \/ CTA/i }) }).scrollIntoViewIfNeeded();
    await fillPrimaryContactCta(page, {
      phone: "4085552222",
      whatsapp: "4085552222",
      email: "smoke-pdf@example.test",
      website: "www.pdf-smoke.example",
    });
    await page.locator("section", { has: page.getByRole("heading", { name: /6\. Ubicación/i }) }).scrollIntoViewIfNeeded();
    await fillNorCalCity(page);
    await page.locator("#community-publish-confirm").scrollIntoViewIfNeeded();
    await confirmPublishCheckboxes(page);
    await page.getByRole("button", { name: "Vista previa" }).click();
    await expect(page).toHaveURL(/\/publicar\/clases\/quick\/preview/);
    await page.getByRole("button", { name: "Publicar anuncio" }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("alert")).toContainText(/PDF|imagen|image|JPG|PNG|WebP/i);
    await expect(page).toHaveURL(/\/publicar\/clases\/quick\/preview/);
    await seedSupabaseSession({
      page,
      context,
      supabaseUrl: SUPABASE_URL,
      anonKey: SUPABASE_ANON,
      email: SELLER_EMAIL,
      password: SELLER_PASSWORD,
    });
    await page.goto("/dashboard/mis-anuncios?lang=es", { waitUntil: "networkidle" });
    await dismissCookieConsentIfPresent(page);
    await expect(page.getByText(`Smoke PDF Only ${stamp}`)).toHaveCount(0);
    try {
      fs.unlinkSync(tmpPdf);
    } catch {
      /* ignore */
    }

    // Comunidad: PDF-only must block publish with clear alert
    await seedSupabaseSession({
      page,
      context,
      supabaseUrl: SUPABASE_URL,
      anonKey: SUPABASE_ANON,
      email: SELLER_EMAIL,
      password: SELLER_PASSWORD,
    });
    await page.goto("/publicar/comunidad/quick?lang=es", { waitUntil: "networkidle" });
    await page.evaluate((k) => {
      try {
        sessionStorage.removeItem(k);
      } catch {
        /* ignore */
      }
    }, COMMUNITY_SESSION_KEYS.comunidad);
    await page.goto("/publicar/comunidad/quick?lang=es", { waitUntil: "networkidle" });
    await dismissCookieConsentIfPresent(page);
    const tmpPdfCom = path.join(REPO_ROOT, `.tmp-smoke-com-${stamp}.pdf`);
    fs.writeFileSync(tmpPdfCom, minimalPdf);

    await page.getByLabel(/Título del evento/i).fill(`Smoke PDF Comunidad ${stamp}`);
    await page.getByLabel(/^Organizador$/i).fill("PDF Comunidad Org");
    await page.getByLabel(/Tipo \/ categoría del evento/i).selectOption("feria");
    await page.getByLabel(/Descripción corta/i).fill("Solo PDF en volante — publicación debe bloquearse con mensaje claro.");
    await page.getByLabel(/¿Para quién es el evento\?/i).selectOption("familias");
    await page.getByLabel(/¿Requiere registro\?/i).selectOption("no");
    await page.getByLabel(/Costo del evento/i).selectOption("gratis");
    await page.getByLabel(/Fecha de inicio del evento/i).fill("2030-08-10");
    await page.getByLabel(/Hora de inicio del evento/i).fill("09:00");
    await page.getByLabel(/Hora de fin del evento/i).fill("10:30");
    await page.getByLabel(/Qué deben llevar o saber/i).fill("Agua");
    await page.locator("section", { has: page.getByRole("heading", { name: /4\. Imagen/i }) }).scrollIntoViewIfNeeded();
    await page.locator("section", { has: page.getByRole("heading", { name: /4\. Imagen/i }) }).locator('input[type="file"]').first().setInputFiles(tmpPdfCom);
    await page.locator("section", { has: page.getByRole("heading", { name: /5\. Contacto \/ CTA/i }) }).scrollIntoViewIfNeeded();
    await fillPrimaryContactCta(page, {
      phone: "4085553333",
      whatsapp: "4085553333",
      email: "smoke-pdf-com@example.test",
      website: "www.pdf-com.example",
    });
    await page.locator("section", { has: page.getByRole("heading", { name: /6\. Ubicación/i }) }).scrollIntoViewIfNeeded();
    await fillNorCalCity(page);
    await page.getByLabel(/Código postal/i).fill("95116");
    await page.getByLabel(/Nombre del lugar/i).fill("Parque");
    await page.getByLabel(/^Dirección$/i).fill("789 Calle Secundaria");
    await page.locator("#community-publish-confirm").scrollIntoViewIfNeeded();
    await confirmComunidadCheckboxes(page);
    await page.getByRole("button", { name: "Vista previa" }).click();
    await expect(page).toHaveURL(/\/publicar\/comunidad\/quick\/preview/);
    await page.getByRole("button", { name: "Publicar anuncio" }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 60_000 });
    await expect(page.getByRole("alert")).toContainText(/PDF|imagen|image|JPG|PNG|WebP/i);
    await expect(page).toHaveURL(/\/publicar\/comunidad\/quick\/preview/);
    await seedSupabaseSession({
      page,
      context,
      supabaseUrl: SUPABASE_URL,
      anonKey: SUPABASE_ANON,
      email: SELLER_EMAIL,
      password: SELLER_PASSWORD,
    });
    await page.goto("/dashboard/mis-anuncios?lang=es", { waitUntil: "networkidle" });
    await dismissCookieConsentIfPresent(page);
    await expect(page.getByText(`Smoke PDF Comunidad ${stamp}`)).toHaveCount(0);
    try {
      fs.unlinkSync(tmpPdfCom);
    } catch {
      /* ignore */
    }

    // —— Gate 6: contract smoke + build ——
    const { execSync } = await import("child_process");
    execSync("npx tsx scripts/community-quick-publish-contract-smoke.ts", {
      cwd: REPO_ROOT,
      stdio: "pipe",
      env: process.env as NodeJS.ProcessEnv,
    });
    execSync("npm run build", { cwd: REPO_ROOT, stdio: "pipe", env: process.env as NodeJS.ProcessEnv });

    // Persist ids for humans re-running locally (no secrets)
    const summaryPath = path.join(REPO_ROOT, ".community-quick-ui-smoke-last.txt");
    fs.writeFileSync(
      summaryPath,
      `clases_id=${clasesId}\nclases_title=${clasesTitle}\ncomunidad_id=${comunidadId}\ncomunidad_title=${comunidadTitle}\n`,
      "utf8",
    );
  });
});
