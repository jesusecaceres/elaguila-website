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
  await dealerStep.locator("input").first().fill("R29 Proof Dealer");
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
  imageUrls: string[];
  videoUrl?: string;
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
  const singleUrl = media.locator('input:not([type="file"])').first();
  for (const imageUrl of args.imageUrls) {
    await singleUrl.fill(imageUrl);
    await media.getByRole("button", { name: "Agregar imagen", exact: true }).click();
  }
  if (args.videoUrl) {
    await media.getByPlaceholder(/Pega un enlace de video/i).fill(args.videoUrl);
    await media.getByRole("button", { name: "Añadir video", exact: true }).click();
  }
  for (let i = 0; i < 3; i++) {
    await drawer.getByRole("button", { name: "Siguiente" }).click();
  }
  await drawer.getByRole("button", { name: "Guardar en inventario" }).click();
  await expect(drawer).toBeHidden({ timeout: 30_000 });
}

async function goToChildMediaStep(drawer: import("@playwright/test").Locator) {
  for (let i = 0; i < 3; i++) {
    await drawer.getByRole("button", { name: "Siguiente" }).click();
  }
  await expect(drawer.locator("#autos-inventory-child-media")).toBeVisible({ timeout: 30_000 });
}

async function advanceChildDrawerFromMediaToSave(drawer: import("@playwright/test").Locator) {
  for (let i = 0; i < 3; i++) {
    await expect(drawer.getByRole("button", { name: "Siguiente" })).toBeEnabled({ timeout: 15_000 });
    await drawer.getByRole("button", { name: "Siguiente" }).click();
  }
  await expect(drawer.getByRole("button", { name: "Guardar en inventario" })).toBeVisible({ timeout: 15_000 });
}

async function readDraftInventorySnapshot(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const prefix = "leonix:autos:negocios:activeDraft:v";
    const hint = sessionStorage.getItem("lx-autos-draft-ns-hint-negocios");
    if (!hint) return null;
    for (let v = 9; v >= 1; v--) {
      const raw = sessionStorage.getItem(`${prefix}${v}:${hint}`);
      if (!raw) continue;
      const draft = JSON.parse(raw) as {
        additionalInventoryVehicles?: Array<Record<string, unknown>>;
      };
      const children = draft.additionalInventoryVehicles ?? [];
      return {
        length: children.length,
        ids: children.map((c) => String(c.id ?? c.childId ?? "")),
        models: children.map((c) => String(c.model ?? "")),
        mediaCounts: children.map((c) => {
          const imgs = Array.isArray(c.mediaImages)
            ? c.mediaImages.length
            : Array.isArray(c.photos)
              ? c.photos.length
              : 0;
          const videos = Array.isArray(c.videoUrls)
            ? c.videoUrls.length
            : Array.isArray(c.videoLinks)
              ? c.videoLinks.length
              : 0;
          return { imgs, videos };
        }),
      };
    }
    return null;
  });
}

test.describe("A5.RECOVERY-29 inventory array preservation", () => {
  test.skip(!url || !anon, "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");

  test("two children survive save, preview/back, edit, and refresh", async ({ page, context }) => {
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
      imageUrls: [
        "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=400&q=80",
      ],
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    });

    await saveChildVehicle({
      page,
      year: "2019",
      make: "Ford",
      model: "Fusion",
      price: "14000",
      imageUrls: [
        "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=400&q=80",
      ],
    });

    const childCards = page.locator("article").filter({ hasText: "Vehículo adicional" });
    await expect(childCards).toHaveCount(2);
    await expect(page.locator("article").filter({ hasText: "Vehículo principal" })).toHaveCount(1);
    await expect(page.getByText(/Inventario del dealer ·\s*3\/10 incluidos/)).toBeVisible();

    const afterBothSave = await readDraftInventorySnapshot(page);
    expect(afterBothSave?.length).toBe(2);
    expect(afterBothSave?.models.sort()).toEqual(["Civic", "Fusion"]);

    const childA = childCards.filter({ hasText: "Civic" }).first();
    const childB = childCards.filter({ hasText: "Fusion" }).first();

    await childA.getByRole("button", { name: "Ver vista previa" }).click();
    await expect(page.locator('[data-autos-child-inventory-preview="1"]')).toBeVisible();
    await expect(page.locator('[data-autos-preview-media-count]')).toHaveAttribute("data-autos-preview-media-count", /[2-9]/);
    await page.getByRole("button", { name: "Volver a editar" }).click();
    await expect(page.locator('[data-autos-child-inventory-preview="1"]')).toHaveCount(0);
    await expect(childCards).toHaveCount(2);

    const afterVolver = await readDraftInventorySnapshot(page);
    expect(afterVolver?.length).toBe(2);

    await childA.getByRole("button", { name: "Editar" }).click();
    const drawer = inventoryDrawer(page);
    await expect(drawer).toHaveAttribute("data-autos-inventory-drawer-mode", "edit");
    await expect(drawer.getByRole("combobox").nth(2)).toHaveValue("Civic");
    await goToChildMediaStep(drawer);
    await expect(drawer.locator("#autos-inventory-child-media")).toHaveAttribute("data-autos-editor-media-count", /[2-9]/);
    await expect(drawer.locator("#autos-inventory-child-media")).toHaveAttribute("data-autos-editor-video-count", /[1-9]/);
    await advanceChildDrawerFromMediaToSave(drawer);
    await drawer.getByRole("button", { name: "Guardar en inventario" }).click();
    await expect(drawer).toBeHidden();
    await expect(page.locator("article").filter({ hasText: "Vehículo adicional" })).toHaveCount(2);

    await page.reload();
    await dismissConsentIfPresent(page);
    await expect(page.getByRole("button", { name: "Agregar vehículo al inventario" })).toBeVisible({ timeout: 60_000 });
    await expect(page.locator("article").filter({ hasText: "Vehículo adicional" })).toHaveCount(2);

    const afterRefresh = await readDraftInventorySnapshot(page);
    expect(afterRefresh?.length).toBe(2);

    const childAAfter = page.locator("article").filter({ hasText: "Civic" }).first();
    const childBAfter = page.locator("article").filter({ hasText: "Fusion" }).first();
    await childAAfter.getByRole("button", { name: "Editar" }).click();
    const drawerA = inventoryDrawer(page);
    await goToChildMediaStep(drawerA);
    await expect(drawerA.locator("#autos-inventory-child-media")).toHaveAttribute("data-autos-editor-media-count", /[2-9]/);
    await drawerA.getByRole("button", { name: "Cancelar" }).click();

    await childBAfter.getByRole("button", { name: "Editar" }).click();
    const drawerB = inventoryDrawer(page);
    await goToChildMediaStep(drawerB);
    await expect(drawerB.locator("#autos-inventory-child-media")).toHaveAttribute("data-autos-editor-media-count", /[1-9]/);
  });
});
