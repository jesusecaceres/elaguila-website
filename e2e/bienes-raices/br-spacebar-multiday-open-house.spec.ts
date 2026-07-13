import { test, expect, type Page, type BrowserContext, type Locator } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const LINK = "Agent Portfolio and Client Reviews";
const ADDITIONAL =
  "Saturday and Sunday from 11:00 AM to 3:00 PM; Monday by appointment.";
const NOTES = "Please call the agent before arriving at the property.";
const ES = "Disponible sábado y domingo de 11:00 AM a 3:00 PM; lunes con cita previa.";

const CATEGORIES = ["residencial", "comercial", "terreno_lote"] as const;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SELLER_EMAIL = (process.env.BR_SMOKE_EMAIL ?? "").trim() || (process.env.SMOKE_SELLER_EMAIL ?? "").trim();
const SELLER_PASSWORD = (process.env.BR_SMOKE_PASSWORD ?? "").trim() || (process.env.SMOKE_SELLER_PASSWORD ?? "").trim();

function authStorageKey(supabaseUrl: string): string {
  const ref = new URL(supabaseUrl).hostname.split(".")[0];
  return `sb-${ref}-auth-token`;
}

async function seedSupabaseSession(
  page: Page,
  context: BrowserContext,
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

async function typeExact(page: Page, selector: string, text: string) {
  const loc = page.locator(selector).first();
  await loc.click();
  await loc.fill("");
  await loc.pressSequentially(text, { delay: 12 });
  await expect(loc).toHaveValue(text);
}

async function waitForDraftPersisted(page: Page, needle: string) {
  await expect
    .poll(
      async () =>
        page.evaluate((n) => {
          try {
            const keys = [
              "br-negocio-agente-residencial-preview-draft",
              "br-negocio-agente-residencial-return-draft",
              "br-negocio-agente-residencial-draft-ls-fallback",
            ];
            for (const k of keys) {
              const a = sessionStorage.getItem(k);
              const b = localStorage.getItem(k);
              if ((a && a.includes(n)) || (b && b.includes(n))) return true;
            }
            return false;
          } catch {
            return false;
          }
        }, needle),
      { timeout: 20_000 },
    )
    .toBe(true);
}

async function goToStep(page: Page, stepIndex: number) {
  // Desktop chrome is sticky aside (lg+); wait after navigations/reloads before clicking.
  const desktop = page.locator("aside nav button").nth(stepIndex);
  await expect(desktop).toBeVisible({ timeout: 90_000 });
  await desktop.click();
}

async function openParentApp(page: Page, propiedad: string) {
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto(`/clasificados/publicar/bienes-raices/negocio?propiedad=${propiedad}&lang=en`, {
    waitUntil: "domcontentloaded",
  });
  // Auth guard may bounce once; wait for application chrome (desktop step nav).
  await expect(page.locator("aside nav").getByText(/Listing type|Tipo de anuncio/i).first()).toBeVisible({
    timeout: 90_000,
  });
  await expect(page.getByText(/Publish Real Estate|Publicar/i).first()).toBeVisible({ timeout: 30_000 });
}

async function proveParentTypingAndOpenHouse(page: Page, propiedad: string) {
  await openParentApp(page, propiedad);

  await goToStep(page, 6);
  await page.waitForTimeout(250);
  const titleSel = '[data-br-business-link-title="0"]';
  await expect(page.locator(titleSel)).toBeVisible({ timeout: 30_000 });
  await typeExact(page, titleSel, LINK);
  // Still on professional / links step after multi-word typing
  await expect(page.locator(titleSel)).toBeVisible();

  await goToStep(page, 8);
  await page.waitForTimeout(250);

  if ((await page.locator("[data-br-open-house-event]").count()) === 0) {
    await page.locator("[data-br-oh-add-event]").click();
  }
  await expect(page.locator("[data-br-open-house-event='0']")).toBeVisible();

  await page.locator("[data-br-oh-start-date='0']").fill("2026-07-17");
  await page.locator("[data-br-oh-end-date='0']").fill("2026-07-20");
  await page.locator("[data-br-oh-start-time='0']").fill("10:00");
  await page.locator("[data-br-oh-end-time='0']").fill("14:00");
  await typeExact(page, "[data-br-oh-additional-days='0']", ADDITIONAL);
  await typeExact(page, "[data-br-oh-notes='0']", NOTES);

  await page.locator("[data-br-oh-add-event]").click();
  await expect(page.locator("[data-br-open-house-event='1']")).toBeVisible();
  await page.locator("[data-br-oh-start-date='1']").fill("2026-07-25");
  await page.locator("[data-br-oh-end-date='1']").fill("2026-07-26");
  await page.locator("[data-br-oh-start-time='1']").fill("12:00");
  await page.locator("[data-br-oh-end-time='1']").fill("16:00");
  await typeExact(page, "[data-br-oh-additional-days='1']", "Sunday hours are 1:00 PM to 3:00 PM.");
  await typeExact(page, "[data-br-oh-notes='1']", "Enter through the side gate.");

  await expect(page.locator("[data-br-oh-start-date='0']")).toHaveValue("2026-07-17");
  await expect(page.locator("[data-br-oh-additional-days='0']")).toHaveValue(ADDITIONAL);

  await typeExact(page, "[data-br-oh-notes='0']", ES);
  await expect(page.locator("[data-br-oh-notes='0']")).toHaveValue(ES);
  await typeExact(page, "[data-br-oh-notes='0']", NOTES);

  await waitForDraftPersisted(page, "2026-07-17");
  await waitForDraftPersisted(page, "Saturday and Sunday");

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("aside nav").getByText(/Optional extras|Extras opcionales/i).first()).toBeVisible({
    timeout: 90_000,
  });
  await goToStep(page, 8);
  await expect(page.locator("[data-br-oh-start-date='0']")).toHaveValue("2026-07-17", { timeout: 45_000 });
  await expect(page.locator("[data-br-oh-end-date='0']")).toHaveValue("2026-07-20");
  await expect(page.locator("[data-br-oh-additional-days='0']")).toHaveValue(ADDITIONAL);
  await expect(page.locator("[data-br-oh-notes='0']")).toHaveValue(NOTES);
  await expect(page.locator("[data-br-oh-start-date='1']")).toHaveValue("2026-07-25");

  await page.locator("[data-br-open-house-event='1'] button").filter({ hasText: /Remove|Eliminar/i }).click();
  await expect(page.locator("[data-br-open-house-event='1']")).toHaveCount(0);
  await expect(page.locator("[data-br-oh-start-date='0']")).toHaveValue("2026-07-17");

  // Preview handoff storage
  await goToStep(page, 9);
  const draftRaw = await page.evaluate(() => {
    try {
      return (
        sessionStorage.getItem("br-negocio-agente-residencial-preview-draft") ||
        localStorage.getItem("br-negocio-agente-residencial-draft-ls-fallback")
      );
    } catch {
      return null;
    }
  });
  expect(draftRaw).toBeTruthy();
  expect(String(draftRaw)).toContain("2026-07-17");
  expect(String(draftRaw)).toContain("Saturday and Sunday");

  await goToStep(page, 6);
  await expect(page.locator(titleSel)).toHaveValue(LINK);

  // Volver path: push preview draft then reload application and restore
  await page.evaluate(() => {
    try {
      const raw =
        sessionStorage.getItem("br-negocio-agente-residencial-preview-draft") ||
        localStorage.getItem("br-negocio-agente-residencial-draft-ls-fallback");
      if (raw) sessionStorage.setItem("br-negocio-agente-residencial-return-draft", raw);
    } catch {
      /* ignore */
    }
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("aside nav").getByText(/Optional extras|Extras opcionales/i).first()).toBeVisible({
    timeout: 90_000,
  });
  await goToStep(page, 8);
  await expect(page.locator("[data-br-oh-additional-days='0']")).toHaveValue(ADDITIONAL, { timeout: 45_000 });
}

test.describe("Bienes Spacebar + multi-day open house runtime", () => {
  test.describe.configure({ mode: "serial", timeout: 360_000 });

  test.beforeEach(async ({ page, context }) => {
    test.skip(!url || !anon, "Supabase env missing");
    test.skip(!SELLER_EMAIL || !SELLER_PASSWORD, "Set BR_SMOKE_EMAIL + BR_SMOKE_PASSWORD for authenticated publish form");
    await seedSupabaseSession(page, context, url!, anon!, SELLER_EMAIL, SELLER_PASSWORD);
  });

  for (const cat of CATEGORIES) {
    test(`Parent ${cat}: spacebar + multi-day OH + refresh`, async ({ page }) => {
      await proveParentTypingAndOpenHouse(page, cat);
    });
  }

  async function openChildInventory(page: Page, channel: "residencial" | "comercial" | "terreno_lote") {
    await goToStep(page, 9);
    await expect(page.getByText(/Property inventory|Inventario de propiedades|Inventory Pack|Paquete de inventario/i).first()).toBeVisible({
      timeout: 30_000,
    });

    const acceptPack = page.getByRole("button", { name: /Add Inventory Pack|Agregar Paquete de inventario/i });
    if (await acceptPack.count()) {
      await acceptPack.first().click();
      await page.waitForTimeout(400);
    }

    const addBtn = page.getByRole("button", { name: /Add property to inventory|Agregar propiedad al inventario/i });
    await expect(addBtn.first()).toBeVisible({ timeout: 30_000 });
    await addBtn.first().click();

    await expect(page.getByRole("heading", { name: /Add property to inventory|Agregar propiedad al inventario/i })).toBeVisible({
      timeout: 45_000,
    });

    const channelLabel =
      channel === "residencial"
        ? /Residential|Residencial/
        : channel === "comercial"
          ? /Commercial|Comercial/
          : /Land\s*\/\s*Lot|Terreno/;
    await page.getByRole("button", { name: channelLabel }).first().click();
    await page.getByRole("link", { name: /Continue to property form|Continuar al formulario/i }).click();

    const dialog = page.locator("[data-br-child-inventory-app]");
    await expect(dialog).toBeVisible({ timeout: 60_000 });
    return dialog;
  }

  async function goToChildOptionalExtras(dialog: Locator) {
    await dialog.locator("[data-br-child-step='8']").click();
    await expect(dialog.locator("[data-br-oh-add-event], [data-br-open-house-event]").first()).toBeVisible({
      timeout: 20_000,
    });
  }

  async function proveChildOhTyping(
    page: Page,
    channel: "residencial" | "comercial" | "terreno_lote",
  ) {
    await openParentApp(page, "residencial");
    await goToStep(page, 8);
    if ((await page.locator("[data-br-open-house-event]").count()) === 0) {
      await page.locator("[data-br-oh-add-event]").click();
    }
    await typeExact(page, "[data-br-oh-additional-days='0']", ADDITIONAL);
    await waitForDraftPersisted(page, "Saturday and Sunday");

    const dialog = await openChildInventory(page, channel);
    await goToChildOptionalExtras(dialog);

    if ((await dialog.locator("[data-br-open-house-event]").count()) === 0) {
      await dialog.locator("[data-br-oh-add-event]").click();
    }
    await expect(dialog.locator("[data-br-open-house-event='0']")).toBeVisible();
    await dialog.locator("[data-br-oh-start-date='0']").fill("2026-07-25");
    await dialog.locator("[data-br-oh-end-date='0']").fill("2026-07-26");
    await dialog.locator("[data-br-oh-start-time='0']").fill("12:00");
    await dialog.locator("[data-br-oh-end-time='0']").fill("16:00");

    const childAdd = dialog.locator("[data-br-oh-additional-days='0']");
    await childAdd.click();
    await childAdd.fill("");
    await childAdd.pressSequentially("Sunday hours are 1:00 PM to 3:00 PM.", { delay: 12 });
    await expect(childAdd).toHaveValue("Sunday hours are 1:00 PM to 3:00 PM.");

    const childNotes = dialog.locator("[data-br-oh-notes='0']");
    await childNotes.click();
    await childNotes.fill("");
    await childNotes.pressSequentially("Enter through the side gate.", { delay: 12 });
    await expect(childNotes).toHaveValue("Enter through the side gate.");

    // Leave without saving — parent persisted draft must remain untouched.
    page.once("dialog", (d) => d.accept());
    await dialog.getByRole("button", { name: /Cancel|Cancelar/i }).click();
    await expect(dialog).toHaveCount(0, { timeout: 30_000 });

    await goToStep(page, 8);
    await expect(page.locator("[data-br-oh-additional-days='0']")).toHaveValue(ADDITIONAL, { timeout: 45_000 });
  }

  test("Child Residential OH via inventory add flow", async ({ page }) => {
    await proveChildOhTyping(page, "residencial");
  });

  test("Child Commercial + Land inventory OH spacebar + isolation", async ({ page }) => {
    await proveChildOhTyping(page, "comercial");
    await proveChildOhTyping(page, "terreno_lote");
  });
});
