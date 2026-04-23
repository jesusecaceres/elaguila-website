import { execSync } from "node:child_process";

import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Must match `scripts/br-authenticated-smoke.ts` (rows owned by this user). */
const SELLER_EMAIL = (process.env.BR_SMOKE_EMAIL ?? "").trim() || (process.env.SMOKE_SELLER_EMAIL ?? "").trim();
const SELLER_PASSWORD = (process.env.BR_SMOKE_PASSWORD ?? "").trim() || (process.env.SMOKE_SELLER_PASSWORD ?? "").trim();
const BUYER_EMAIL = (process.env.SMOKE_BUYER_EMAIL ?? "smoke.buyer@yourdomain.com").trim();
const BUYER_PASSWORD = (process.env.SMOKE_BUYER_PASSWORD ?? "LeonixSmoke!2026Buyer").trim();

const ADMIN_SITE_PASSWORD =
  process.env.ADMIN_PASSWORD ?? process.env.SMOKE_ADMIN_SITE_PASSWORD ?? process.env.SMOKE_ADMIN_PASSWORD ?? "";

type BrSeed = { privado: string; negocio: string; stamp: string };

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
}

function runBrKeepRowsSmoke(): BrSeed {
  const cmd = process.platform === "win32" ? "npx.cmd" : "npx";
  const out = execSync(`${cmd} tsx scripts/br-authenticated-smoke.ts`, {
    encoding: "utf8",
    env: { ...process.env, BR_SMOKE_KEEP_ROWS: "1" },
    cwd: process.cwd(),
  });
  const idLine = out.split("\n").find((l) => l.includes("BR_AUTH_SMOKE_LISTING_IDS="));
  if (!idLine) throw new Error("br-authenticated-smoke: missing BR_AUTH_SMOKE_LISTING_IDS line\n" + out.slice(-4000));
  const jsonPart = idLine.split("BR_AUTH_SMOKE_LISTING_IDS=")[1]?.trim();
  if (!jsonPart) throw new Error("br-authenticated-smoke: could not parse ids line: " + idLine);
  const ids = JSON.parse(jsonPart) as { privado?: string; negocio?: string };
  if (!ids.privado || !ids.negocio) throw new Error("br-authenticated-smoke: bad ids json: " + jsonPart);
  const stampLine = out.split("\n").find((l) => l.includes("Title stamp (for search / filters):"));
  const stamp = stampLine?.split("Title stamp (for search / filters):")[1]?.trim() ?? "";
  if (!stamp.startsWith("br-smoke-")) throw new Error("br-authenticated-smoke: missing stamp line\n" + out.slice(-4000));
  return { privado: ids.privado, negocio: ids.negocio, stamp };
}

test.describe.configure({ timeout: 300_000 });

test.describe("Bienes Raíces runtime QA (keep-rows seed → browser surfaces → cleanup)", () => {
  test.beforeAll(async () => {
    test.skip(!url || !anon || !service, "Supabase env missing");
    test.skip(!SELLER_EMAIL || !SELLER_PASSWORD, "Set BR_SMOKE_EMAIL + BR_SMOKE_PASSWORD (same seller as br-authenticated-smoke)");
    test.skip(
      normEmail(SELLER_EMAIL) === normEmail(BUYER_EMAIL),
      "BR_SMOKE_EMAIL must differ from SMOKE_BUYER_EMAIL for inquiry test",
    );
    const admin = createClient(url!, service!, { auth: { persistSession: false, autoRefreshToken: false } });
    for (const [email, password] of [
      [SELLER_EMAIL, SELLER_PASSWORD],
      [BUYER_EMAIL, BUYER_PASSWORD],
    ] as const) {
      const { error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
      if (error && !String(error.message).toLowerCase().includes("already")) throw error;
    }
  });

  test("publish seed → landing/results/detail/dashboard → buyer inquiry → admin queue → status gate → cleanup", async ({
    page,
    context,
    browser,
  }) => {
    test.skip(!url || !anon || !service);
    test.skip(!SELLER_EMAIL || !SELLER_PASSWORD);

    const baseURL = test.info().project.use.baseURL ?? "http://127.0.0.1:3025";
    const adminClient = createClient(url!, service!, { auth: { persistSession: false, autoRefreshToken: false } });
    let seed: BrSeed | null = null;

    try {
      seed = runBrKeepRowsSmoke();
      const { privado, negocio, stamp } = seed;
      const titlePriv = `${stamp} Privado`;
      const titleNeg = `${stamp} Negocio`;

      const filterPrivUrl = `${baseURL}/clasificados/bienes-raices/resultados?lang=es&operationType=venta&propertyType=casa&city=Monterrey&pets=true&pool=true&furnished=true&zip=90210&q=${encodeURIComponent(stamp)}`;
      const filterNegUrl = `${baseURL}/clasificados/bienes-raices/resultados?lang=es&operationType=renta&sellerType=negocio&city=Monterrey&q=${encodeURIComponent(stamp)}`;

      // --- SELLER: landing (live pool; production has no demo merge)
      await seedSupabaseSession(page, context, url!, anon!, SELLER_EMAIL, SELLER_PASSWORD);
      await page.goto(`${baseURL}/clasificados/bienes-raices?lang=es`);
      await expect(page.getByText(stamp, { exact: false }).first()).toBeVisible({ timeout: 90_000 });

      // --- Results + filter lanes
      await page.goto(filterPrivUrl);
      await expect(page.getByText(titlePriv, { exact: false }).first()).toBeVisible({ timeout: 90_000 });
      await page.goto(filterNegUrl);
      await expect(page.getByText(titleNeg, { exact: false }).first()).toBeVisible({ timeout: 90_000 });

      // --- Public detail (fresh anon context — avoids shared Supabase browser singleton + seller JWT edge cases)
      const anonCtx = await browser.newContext({ baseURL });
      const anonPage = await anonCtx.newPage();
      try {
        await anonPage.goto(`${baseURL}/clasificados/anuncio/${encodeURIComponent(privado)}?lang=es`);
        await waitForAnuncioTitle(anonPage, titlePriv);
        await anonPage.goto(`${baseURL}/clasificados/anuncio/${encodeURIComponent(negocio)}?lang=es`);
        await waitForAnuncioTitle(anonPage, titleNeg);
      } finally {
        await anonCtx.close();
      }

      // --- Dashboard (avoid hidden <option> text in the 2xl-only mobile preview picker)
      await page.goto(`${baseURL}/dashboard/mis-anuncios?lang=es`);
      await expect(page.locator(`a[href="/clasificados/anuncio/${privado}"]`).first()).toBeVisible({ timeout: 90_000 });
      await expect(page.locator(`a[href="/clasificados/anuncio/${negocio}"]`).first()).toBeVisible({ timeout: 90_000 });

      // --- BUYER: inquiry on negocio listing (different account)
      await seedSupabaseSession(page, context, url!, anon!, BUYER_EMAIL, BUYER_PASSWORD);
      await page.goto(`${baseURL}/clasificados/anuncio/${encodeURIComponent(negocio)}?lang=es`);
      await waitForAnuncioTitle(page, titleNeg);
      const inquiryWait = page.waitForResponse(
        (r) =>
          r.request().method() === "POST" &&
          new URL(r.url()).pathname.replace(/\/+$/, "") === "/api/clasificados/en-venta/inquiry",
        { timeout: 60_000 },
      );
      await page.getByRole("button", { name: /Correo \(Leonix\)|Email \(Leonix\)/i }).click();
      await page.getByPlaceholder(/Tu mensaje|Your message/i).fill(`BR runtime QA inquiry ${stamp}`);
      await page.getByRole("button", { name: /Enviar por Leonix|Send via Leonix/i }).click();
      const inq = await inquiryWait;
      expect(inq.ok(), `inquiry failed ${inq.status()}`).toBeTruthy();

      // --- ADMIN queue (shared site password)
      if (ADMIN_SITE_PASSWORD) {
        await page.goto(`${baseURL}/admin/login`);
        await page.locator('input[name="password"]').fill(ADMIN_SITE_PASSWORD);
        await page.getByRole("button", { name: /log in/i }).click();
        await page.waitForURL(/\/admin(\/|$)/, { timeout: 45_000 });
        await page.goto(`${baseURL}/admin/workspace/clasificados?category=bienes-raices&q=${encodeURIComponent(stamp)}`);
        await expect(page.getByText(titlePriv, { exact: false }).first()).toBeVisible({ timeout: 90_000 });
        await expect(page.getByText(titleNeg, { exact: false }).first()).toBeVisible({ timeout: 90_000 });
      }

      // --- STATUS GATE: hide from public when unpublished
      const { error: hideErr } = await adminClient.from("listings").update({ is_published: false }).eq("id", privado);
      expect(hideErr, String(hideErr)).toBeNull();
      await page.goto(`${baseURL}/clasificados/anuncio/${encodeURIComponent(privado)}?lang=es`);
      await expect(page.getByRole("heading", { name: /Anuncio no encontrado|Listing not found/i })).toBeVisible({
        timeout: 60_000,
      });
      const { error: showErr } = await adminClient.from("listings").update({ is_published: true }).eq("id", privado);
      expect(showErr, String(showErr)).toBeNull();
    } finally {
      if (seed) {
        await adminClient.from("listings").delete().in("id", [seed.privado, seed.negocio]);
      }
    }
  });
});

function normEmail(e: string): string {
  return e.trim().toLowerCase();
}

async function waitForAnuncioTitle(page: import("@playwright/test").Page, title: string) {
  await page.waitForFunction(
    (expected: string) => {
      const t = document.body?.innerText ?? "";
      if (t.includes(expected)) return true;
      if (/anuncio no encontrado|listing not found|could not load|no se pudo cargar/i.test(t)) return true;
      return false;
    },
    title,
    { timeout: 90_000 },
  );
  const body = await page.locator("body").innerText();
  expect(body).toContain(title);
}
