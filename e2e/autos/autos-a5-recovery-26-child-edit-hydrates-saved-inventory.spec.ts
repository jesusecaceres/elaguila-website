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

test.describe("A5.RECOVERY-26 child edit hydrates saved inventory", () => {
  test.skip(!url || !anon, "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");

  test("Editar opens saved child after save, preview/back, and refresh", async ({ page, context }) => {
    test.setTimeout(240_000);
    await seedSupabaseSession({ page, context });
    await page.goto("/publicar/autos/negocios?lang=es");
    await dismissConsentIfPresent(page);
    await expect(page.getByRole("button", { name: "Siguiente" })).toBeVisible({ timeout: 60_000 });

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
    await dealerStep.locator("input").first().fill("R26 Proof Dealer");
    await dealerStep.locator('input[inputmode="tel"]').first().fill("4085550100");
    await page.getByRole("button", { name: "Siguiente" }).click();
    await page.getByRole("button", { name: "Siguiente" }).click();

    await page.getByRole("button", { name: "Agregar vehículo al inventario" }).click();
    const drawer = inventoryDrawer(page);
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute("data-autos-inventory-drawer-mode", "add");

    const childCb = drawer.getByRole("combobox");
    await childCb.nth(0).selectOption("2021");
    await childCb.nth(1).selectOption("Honda");
    await childCb.nth(2).selectOption("Civic");
    await drawer.getByLabel("Precio (USD)").fill("18000");
    for (let i = 0; i < 3; i++) {
      await drawer.getByRole("button", { name: "Siguiente" }).click();
    }
    const media = drawer.locator("#autos-inventory-child-media");
    const singleUrl = media.locator('input:not([type="file"])').first();
    await singleUrl.fill("https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=400&q=80");
    await media.getByRole("button", { name: "Agregar imagen", exact: true }).click();
    await media.getByPlaceholder(/Pega un enlace de video/i).fill("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    await media.getByRole("button", { name: "Añadir video", exact: true }).click();
    for (let i = 0; i < 3; i++) {
      await drawer.getByRole("button", { name: "Siguiente" }).click();
    }
    await drawer.getByRole("button", { name: "Guardar en inventario" }).click();
    await expect(drawer).toBeHidden({ timeout: 30_000 });

    const childCard = page.locator("article").filter({ hasText: "Vehículo adicional" }).first();
    await expect(childCard.locator("img")).toBeVisible({ timeout: 15_000 });

    await childCard.getByRole("button", { name: "Editar" }).click();
    await expect(drawer).toBeVisible();
    await expect(drawer).toHaveAttribute("data-autos-inventory-drawer-mode", "edit");
    await expect(drawer.getByRole("heading", { name: "Editar vehículo adicional" })).toBeVisible();
    await expect(drawer.getByRole("combobox").nth(0)).toHaveValue("2021");
    await expect(drawer.getByRole("combobox").nth(1)).toHaveValue("Honda");
    await drawer.getByRole("button", { name: "Cancelar" }).click();
    await expect(drawer).toBeHidden();

    await childCard.getByRole("button", { name: "Ver vista previa" }).click();
    await expect(page.locator('[data-autos-child-inventory-preview="1"]')).toBeVisible();
    await page.getByRole("button", { name: "Volver a editar" }).click();
    await expect(page.locator('[data-autos-child-inventory-preview="1"]')).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Agregar vehículo al inventario" })).toBeVisible();

    await childCard.getByRole("button", { name: "Editar" }).click();
    await expect(drawer).toHaveAttribute("data-autos-inventory-drawer-mode", "edit");
    await expect(drawer.getByRole("combobox").nth(2)).toHaveValue("Civic");

    await drawer.getByRole("button", { name: "Cancelar" }).click();
    await page.reload();
    await dismissConsentIfPresent(page);
    await expect(page.getByRole("button", { name: "Agregar vehículo al inventario" })).toBeVisible({ timeout: 60_000 });

    const childAfterRefresh = page.locator("article").filter({ hasText: "Vehículo adicional" }).first();
    await childAfterRefresh.getByRole("button", { name: "Editar" }).click();
    await expect(drawer).toHaveAttribute("data-autos-inventory-drawer-mode", "edit");
    await expect(drawer.getByRole("combobox").nth(1)).toHaveValue("Honda");
    await expect(drawer.getByLabel("Precio (USD)")).toHaveValue(/18,?000|18000/);
  });
});
