import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SELLER_EMAIL = process.env.SMOKE_SELLER_EMAIL ?? "smoke.seller@yourdomain.com";
const SELLER_PASSWORD = process.env.SMOKE_SELLER_PASSWORD ?? "LeonixSmoke!2026Seller";

function authStorageKey(supabaseUrl: string): string {
  const ref = new URL(supabaseUrl).hostname.split(".")[0];
  return `sb-${ref}-auth-token`;
}

async function seedSupabaseSession(args: {
  page: import("@playwright/test").Page;
  context: import("@playwright/test").BrowserContext;
}) {
  if (!url || !anon) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const browserAnon = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: sess, error } = await browserAnon.auth.signInWithPassword({
    email: SELLER_EMAIL,
    password: SELLER_PASSWORD,
  });
  if (error || !sess.session) throw new Error(error?.message ?? "signInWithPassword failed");
  const storageKey = authStorageKey(url);
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

async function dismissConsentIfPresent(page: import("@playwright/test").Page) {
  const accept = page.getByRole("button", { name: /Aceptar todo|Accept all|Guardar preferencias|Save preferences/i });
  if (await accept.count()) {
    await accept.first().click({ timeout: 5000 }).catch(() => {});
  }
}

async function fillMinimalVehicleSteps(page: import("@playwright/test").Page) {
  const step = page.locator('section:not([aria-hidden="true"])').first();
  const cb = step.getByRole("combobox");
  await cb.nth(0).selectOption("2020");
  await cb.nth(1).selectOption("Toyota");
  await cb.nth(2).selectOption("Camry");
  await step.getByLabel("Precio (USD)").fill("25000");
  await step.getByPlaceholder("Ciudad del vehículo").fill("San Jose");
  await step.locator("select").last().selectOption("CA");
  await step.locator('input[maxlength="5"]').fill("95112");
  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.getByRole("button", { name: "Siguiente" }).click();

  const mediaStep = page.locator('section:not([aria-hidden="true"])').first();
  const singleUrl = mediaStep.locator('input:not([type="file"])').first();
  await singleUrl.fill(
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=400&q=80",
  );
  await mediaStep.getByRole("button", { name: "Agregar imagen", exact: true }).click();

  await page.getByRole("button", { name: "Siguiente" }).click();
}

function visibleDealerStep(page: import("@playwright/test").Page) {
  return page.locator('section:not([aria-hidden="true"])').filter({
    has: page.getByRole("heading", { name: "Información del negocio" }),
  });
}

async function goToVisibleDealerStep(page: import("@playwright/test").Page) {
  const dealerHeading = page.getByRole("heading", { name: "Información del negocio" });
  for (let i = 0; i < 8 && !(await dealerHeading.isVisible()); i++) {
    await page.getByRole("button", { name: "Siguiente" }).click();
  }
  await expect(dealerHeading).toBeVisible({ timeout: 30_000 });
}

test.describe("A5.RECOVERY-27 Step 5 add website button", () => {
  test.skip(!url || !anon, "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");

  test("Añadir website adds rows, enforces max 2, persists, and preview shows valid link", async ({
    page,
    context,
  }) => {
    test.setTimeout(240_000);
    await seedSupabaseSession({ page, context });
    await page.goto("/publicar/autos/negocios?lang=es");
    await dismissConsentIfPresent(page);
    await expect(page.getByRole("button", { name: "Siguiente" })).toBeVisible({ timeout: 60_000 });

    await fillMinimalVehicleSteps(page);

    const step5 = visibleDealerStep(page);
    await step5.locator("input").first().fill("R27 Proof Dealer");
    await step5.locator('input[inputmode="tel"]').first().fill("4085550100");

    const linksSection = step5.locator('[data-autos-dealer-custom-links-section="1"]');
    const addBtn = step5.getByRole("button", { name: "Añadir website" });

    await expect(linksSection).toHaveAttribute("data-autos-dealer-custom-links-count", "0");
    await addBtn.click();
    await expect(linksSection).toHaveAttribute("data-autos-dealer-custom-links-count", "1");
    await expect(linksSection.locator('[data-autos-dealer-custom-link-row]')).toHaveCount(1);

    const row1 = linksSection.locator('[data-autos-dealer-custom-link-row]').first();
    const row1Inputs = row1.locator("input");
    await row1Inputs.nth(0).fill("Financiamiento");
    await row1Inputs.nth(1).fill("https://example.com/financing");

    await addBtn.click();
    await expect(linksSection).toHaveAttribute("data-autos-dealer-custom-links-count", "2");
    const row2 = linksSection.locator('[data-autos-dealer-custom-link-row]').nth(1);
    const row2Inputs = row2.locator("input");
    await row2Inputs.nth(0).fill("Promociones");
    await row2Inputs.nth(1).fill("https://example.com/promos");

    await expect(addBtn).toBeDisabled();
    await expect(step5.locator('[data-autos-dealer-custom-links-max="1"]')).toBeVisible();
    await expect(step5.getByText("Puedes agregar hasta 2 websites importantes.")).toBeVisible();

    await row2.getByRole("button", { name: "Eliminar" }).click();
    await expect(linksSection).toHaveAttribute("data-autos-dealer-custom-links-count", "1");
    await expect(addBtn).toBeEnabled();

    await page.waitForTimeout(1000);
    await page.reload();
    await dismissConsentIfPresent(page);
    await expect(page.getByRole("button", { name: "Siguiente" })).toBeVisible({ timeout: 60_000 });
    await goToVisibleDealerStep(page);
    const step5AfterRefresh = visibleDealerStep(page);
    const linksAfterRefresh = step5AfterRefresh.locator('[data-autos-dealer-custom-links-section="1"]');
    await expect(linksAfterRefresh).toHaveAttribute("data-autos-dealer-custom-links-count", "1");
    const refreshedInputs = linksAfterRefresh.locator('[data-autos-dealer-custom-link-row]').first().locator("input");
    await expect(refreshedInputs.nth(0)).toHaveValue("Financiamiento");
    await expect(refreshedInputs.nth(1)).toHaveValue("https://example.com/financing");

    await page.getByRole("button", { name: "Siguiente" }).click();
    await page.getByRole("button", { name: "Siguiente" }).click();
    await page.getByRole("button", { name: "Vista previa", exact: true }).click();
    await expect(page).toHaveURL(/\/clasificados\/autos\/negocios\/preview/, { timeout: 60_000 });
    await expect(page.getByRole("link", { name: "Financiamiento" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("link", { name: "Promociones" })).toHaveCount(0);
  });
});
