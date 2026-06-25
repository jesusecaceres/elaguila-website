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

function inventoryDrawer(page: import("@playwright/test").Page) {
  return page.getByRole("dialog", { name: /Agregar vehículo al inventario|Editar vehículo adicional/i });
}

async function fillParentToInventoryStep(page: import("@playwright/test").Page) {
  const step = page.locator('section:not([aria-hidden="true"])').first();
  const cb = step.getByRole("combobox");
  await cb.nth(0).selectOption("2020");
  await cb.nth(1).selectOption("Toyota");
  await cb.nth(2).selectOption("Camry");
  await step.getByLabel("Precio (USD)").fill("25000");
  await step.getByPlaceholder("Ciudad del vehículo").fill("San Jose");
  await step.locator("select").last().selectOption("CA");
  await step.locator('input[maxlength="5"]').fill("95112");
  for (let i = 0; i < 4; i++) {
    await page.getByRole("button", { name: "Siguiente" }).click();
  }
  const dealerStep = page.locator("section").filter({
    has: page.getByRole("heading", { name: "Información del negocio" }),
  });
  await dealerStep.locator("input").first().fill("Polish32 Dealer");
  await dealerStep.locator('input[inputmode="tel"]').first().fill("4085550100");
  await page.getByRole("button", { name: "Siguiente" }).click();
  await page.getByRole("button", { name: "Siguiente" }).click();
}

async function saveChildVehicle(args: {
  page: import("@playwright/test").Page;
  year: string;
  make: string;
  model: string;
  price: string;
  imageUrl: string;
}) {
  await args.page.getByRole("button", { name: "Agregar vehículo al inventario" }).click();
  const drawer = inventoryDrawer(args.page);
  await expect(drawer).toBeVisible();
  const childCb = drawer.getByRole("combobox");
  await childCb.nth(0).selectOption(args.year);
  await childCb.nth(1).selectOption(args.make);
  await childCb.nth(2).selectOption(args.model);
  await drawer.getByLabel("Precio (USD)").fill(args.price);
  for (let i = 0; i < 3; i++) {
    await expect(drawer.getByRole("button", { name: "Siguiente" })).toBeEnabled({ timeout: 15_000 });
    await drawer.getByRole("button", { name: "Siguiente" }).click();
  }
  const media = drawer.locator("#autos-inventory-child-media");
  await media.locator('input:not([type="file"])').first().fill(args.imageUrl);
  await media.getByRole("button", { name: "Agregar imagen", exact: true }).click();
  for (let i = 0; i < 3; i++) {
    await drawer.getByRole("button", { name: "Siguiente" }).click();
  }
  await drawer.getByRole("button", { name: "Guardar en inventario" }).click();
  await expect(drawer).toBeHidden({ timeout: 30_000 });
}

async function assertDraftShelfReadOnly(scope: import("@playwright/test").Locator) {
  await expect(scope).toBeVisible();
  await expect(scope.locator('[data-autos-related-inventory-draft-cta="1"]').first()).toBeVisible();
  await expect(scope.getByRole("link", { name: /Ver vehículo|View vehicle/i })).toHaveCount(0);
}

async function assertNoBodyOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 2);
  expect(overflow).toBe(true);
}

test.describe("A5.POLISH-32 premium preview + mobile inventory shelf", () => {
  test.skip(!url || !anon, "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");

  test("desktop and mobile preview layout with read-only shelf and Step 7 intact", async ({ page, context }) => {
    test.setTimeout(360_000);
    await seedSupabaseSession({ page, context });
    await page.goto("/publicar/autos/negocios?lang=es");
    await dismissConsentIfPresent(page);
    await expect(page.getByRole("button", { name: "Siguiente" })).toBeVisible({ timeout: 60_000 });

    await fillParentToInventoryStep(page);
    await saveChildVehicle({
      page,
      year: "2021",
      make: "Honda",
      model: "Civic",
      price: "18000",
      imageUrl: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=400&q=80",
    });
    await saveChildVehicle({
      page,
      year: "2019",
      make: "Ford",
      model: "Fusion",
      price: "14000",
      imageUrl: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=400&q=80",
    });

    await expect(page.getByRole("button", { name: "Ver vista previa" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Editar" }).first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Quitar" }).first()).toBeVisible();

    await page.goto("/clasificados/autos/negocios/preview?lang=es");
    await dismissConsentIfPresent(page);
    await expect(page.locator('[data-autos-preview-utility-bar="1"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.locator('[data-autos-premium-preview-page="1"]')).toBeVisible();

    const parentShelf = page.locator('[data-autos-related-inventory-shelf="1"]').first();
    await assertDraftShelfReadOnly(parentShelf);
    await assertNoBodyOverflow(page);

    await page.getByRole("link", { name: /Volver a editar|Back to edit/i }).click();
    await expect(page.getByRole("button", { name: "Agregar vehículo al inventario" })).toBeVisible({ timeout: 60_000 });

    const childA = page.locator("article").filter({ hasText: "Civic" }).first();
    await childA.getByRole("button", { name: "Ver vista previa" }).click();
    await expect(page.locator('[data-autos-child-inventory-preview="1"]')).toBeVisible();
    const childShelf = page
      .locator('[data-autos-child-inventory-preview="1"]')
      .locator('[data-autos-related-inventory-shelf="1"]')
      .first();
    await assertDraftShelfReadOnly(childShelf);

    await page.setViewportSize({ width: 390, height: 844 });
    await assertNoBodyOverflow(page);
    await expect(page.locator('[data-autos-preview-utility-bar="1"]')).toBeVisible();
    await expect(childShelf).toBeVisible();

    await page.getByRole("button", { name: /Volver a editar|Back to edit/i }).click();
    await expect(page.locator("article").filter({ hasText: "Vehículo adicional" })).toHaveCount(2);

    await page.reload();
    await dismissConsentIfPresent(page);
    await expect(page.getByRole("button", { name: "Agregar vehículo al inventario" })).toBeVisible({ timeout: 60_000 });
    await expect(page.locator("article").filter({ hasText: "Vehículo adicional" })).toHaveCount(2);
  });
});
