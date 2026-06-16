import fs from "node:fs";
import path from "node:path";

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

const PROOF_JSON = path.join(
  process.cwd(),
  "app/lib/clasificados/autos/.recovery-25-browser-proof.json",
);

const IMAGE_URL_1 = "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/240px-PNG_transparency_demonstration_1.png";
const IMAGE_URL_2 = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/JPEG_example_flower.jpg/320px-JPEG_example_flower.jpg";
const VIDEO_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

type ProofSnap = Record<string, unknown>;

async function captureProof(page: import("@playwright/test").Page, label: string, source: string): Promise<ProofSnap> {
  return page.evaluate(
    ({ label, source }) => {
      const DRAFT_SESSION_PREFIX = "leonix:autos:negocios:activeDraft:v";
      const NAMESPACE_HINT_KEY = "lx-autos-draft-ns-hint-negocios";
      let draft: Record<string, unknown> | null = null;
      try {
        const hint = sessionStorage.getItem(NAMESPACE_HINT_KEY)?.trim();
        if (hint) {
          for (let v = 9; v >= 1; v--) {
            const keyed = sessionStorage.getItem(`${DRAFT_SESSION_PREFIX}${v}:${hint}`);
            if (keyed) {
              draft = JSON.parse(keyed) as Record<string, unknown>;
              break;
            }
          }
        }
        if (!draft) {
          for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (!key?.startsWith(DRAFT_SESSION_PREFIX)) continue;
            const raw = sessionStorage.getItem(key);
            if (!raw) continue;
            draft = JSON.parse(raw) as Record<string, unknown>;
            break;
          }
        }
      } catch {
        draft = null;
      }
      const children = (draft?.additionalInventoryVehicles ?? []) as Array<Record<string, unknown>>;
      const child = children[0] ?? null;
      const inProgress = (draft?.inProgressInventoryVehicleDraft ?? null) as Record<string, unknown> | null;
      const imgs = (child?.mediaImages ?? []) as Array<{ id?: string; url?: string; sortOrder?: number; isPrimary?: boolean }>;
      const videoUrls = (child?.videoUrls ?? []) as string[];
      const cover = imgs.find((m) => m.isPrimary) ?? imgs[0];
      const inProgImgs = (inProgress?.mediaImages ?? []) as unknown[];
      const editorMedia = document.querySelector("[data-autos-editor-media-count]");
      const editorVideos = document.querySelector("[data-autos-editor-video-count]");
      const previewMedia = document.querySelector("[data-autos-preview-media-count]");
      const hasScalars = Boolean(child?.year || child?.make || child?.model);
      return {
        label,
        source,
        childId: (child?.id as string) ?? null,
        year: child?.year,
        make: child?.make,
        model: child?.model,
        mediaField: "mediaImages",
        mediaImagesCount: imgs.length,
        imageUrlCount: imgs.filter((m) => typeof m.url === "string" && /^https?:\/\//i.test(m.url)).length,
        coverId: cover?.id ?? null,
        sortOrders: imgs.map((m) => m.sortOrder ?? 0),
        videoUrlsCount: videoUrls.length,
        isReducedObject: Boolean(hasScalars && imgs.length === 0 && videoUrls.length === 0),
        inProgressMediaImagesCount: inProgress ? inProgImgs.length : null,
        drawerEditingId: (draft?.inventoryDrawerEditingId as string) ?? null,
        editorMediaCount: editorMedia ? Number(editorMedia.getAttribute("data-autos-editor-media-count") ?? "0") : null,
        editorVideoCount: editorVideos ? Number(editorVideos.getAttribute("data-autos-editor-video-count") ?? "0") : null,
        previewMediaCount: previewMedia ? Number(previewMedia.getAttribute("data-autos-preview-media-count") ?? "0") : null,
      };
    },
    { label, source },
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

async function clickNextInScope(scope: import("@playwright/test").Locator) {
  await scope.getByRole("button", { name: "Siguiente" }).click();
}

async function fillByLabel(scope: import("@playwright/test").Page | import("@playwright/test").Locator, label: string, value: string) {
  const field = scope.locator("div").filter({ has: scope.getByText(label) }).first();
  await field.locator("input, textarea").first().fill(value);
}

async function fillParentMinimum(page: import("@playwright/test").Page) {
  const step = page.locator('section:not([aria-hidden="true"])').first();
  const cb = step.getByRole("combobox");
  await cb.nth(0).selectOption("2020");
  await cb.nth(1).selectOption("Toyota");
  await cb.nth(2).selectOption("Camry");
  await step.getByLabel("Precio (USD)").fill("25000");
  await step.getByPlaceholder("Ciudad del vehículo").fill("San Jose");
  await step.locator("select").last().selectOption("CA");
  await step.locator('input[maxlength="5"]').fill("95112");
}

async function fillChildIdentity(scope: import("@playwright/test").Locator) {
  const cb = scope.getByRole("combobox");
  await cb.nth(0).selectOption("2021");
  await cb.nth(1).selectOption("Honda");
  await cb.nth(2).selectOption("Civic");
  await scope.getByLabel("Precio (USD)").fill("18000");
}

function childMediaSection(scope: import("@playwright/test").Locator) {
  return scope.locator("#autos-inventory-child-media");
}

async function goToChildMediaStep(scope: import("@playwright/test").Locator) {
  await fillChildIdentity(scope);
  for (let i = 0; i < 3; i++) {
    await clickNextInScope(scope);
  }
  await expect(childMediaSection(scope)).toBeVisible({ timeout: 30_000 });
}

async function addChildMedia(scope: import("@playwright/test").Locator) {
  const media = childMediaSection(scope);
  await expect(media).toBeVisible({ timeout: 30_000 });
  const singleUrl = media.locator('input:not([type="file"])').first();
  await singleUrl.fill(IMAGE_URL_1);
  await media.getByRole("button", { name: "Agregar imagen", exact: true }).click();
  await expect(media).toHaveAttribute("data-autos-editor-media-count", "1");
  await singleUrl.fill(IMAGE_URL_2);
  await media.getByRole("button", { name: "Agregar imagen", exact: true }).click();
  await expect(media).toHaveAttribute("data-autos-editor-media-count", "2");
  const videoInput = media.getByPlaceholder(/Pega un enlace de video/i);
  await videoInput.fill(VIDEO_URL);
  await media.getByRole("button", { name: "Añadir video", exact: true }).click();
  await expect(media).toHaveAttribute("data-autos-editor-video-count", "1");
}

async function assertEditorHasMedia(scope: import("@playwright/test").Locator) {
  await expect(scope.locator("[data-autos-editor-media-count]")).toHaveAttribute("data-autos-editor-media-count", /[1-9]/);
  await expect(scope.locator("[data-autos-editor-video-count]")).toHaveAttribute("data-autos-editor-video-count", /[1-9]/);
  await expect(scope.getByText("Aún no hay fotos en el borrador")).toHaveCount(0);
}

test.describe("A5.RECOVERY-25 child inventory media browser proof", () => {
  test.skip(!url || !anon, "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");

  test("child media persists save → card → preview → back → edit → refresh → edit", async ({ page, context }) => {
    test.setTimeout(240_000);
    const proof: { beforeFixReference: string; afterFix: ProofSnap[] } = {
      beforeFixReference:
        "Pre-R24/R25: resolveDrawerInitialDraft preferred stale inProgressInventoryVehicleDraft; editor mediaImagesCount=0 while card/preview showed saved media.",
      afterFix: [],
    };

    await seedSupabaseSession({ page, context });
    await page.goto("/publicar/autos/negocios?lang=es");
    await dismissConsentIfPresent(page);
    await expect(page.getByRole("button", { name: "Siguiente" })).toBeVisible({ timeout: 60_000 });

    await fillParentMinimum(page);

    for (let i = 0; i < 4; i++) {
      await page.getByRole("button", { name: "Siguiente" }).click();
    }

    const dealerStep = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Información del negocio" }),
    });
    await dealerStep.locator("input").first().fill("R25 Proof Dealer");
    await dealerStep.locator('input[inputmode="tel"]').first().fill("4085550100");
    await page.getByRole("button", { name: "Siguiente" }).click();
    await page.getByRole("button", { name: "Siguiente" }).click();

    await expect(page.getByRole("button", { name: "Agregar vehículo al inventario" })).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("button", { name: "Agregar vehículo al inventario" }).click();
    const drawer = inventoryDrawer(page);
    await expect(drawer).toBeVisible();

    await goToChildMediaStep(drawer);
    await addChildMedia(drawer);
    proof.afterFix.push(await captureProof(page, "A", "child drawer form before save / AutosNegociosMediaManager"));

    await clickNextInScope(drawer);
    await clickNextInScope(drawer);
    await clickNextInScope(drawer);
    await drawer.getByRole("button", { name: "Guardar en inventario" }).click();
    await expect(drawer).toBeHidden({ timeout: 30_000 });

    proof.afterFix.push(
      await captureProof(page, "B", "saved additionalInventoryVehicles / upsertAdditionalInventoryVehicle"),
    );
    proof.afterFix.push(await captureProof(page, "C", "sessionStorage active draft after save / flushDraft"));

    const childCard = page.locator("article").filter({ hasText: "Vehículo adicional" }).first();
    await expect(childCard.locator("img")).toBeVisible({ timeout: 15_000 });

    await childCard.getByRole("button", { name: "Ver vista previa" }).click();
    await expect(page.locator('[data-autos-child-inventory-preview="1"]')).toBeVisible();
    await expect(page.locator("[data-autos-preview-media-count]")).toHaveAttribute(
      "data-autos-preview-media-count",
      /[1-9]/,
    );
    proof.afterFix.push(
      await captureProof(page, "D", "child preview / mapInheritedDealerPreviewListing + inventoryVehicleDraftToListingSlice"),
    );

    await page.getByRole("button", { name: "Volver a editar" }).click();
    await expect(page.locator('[data-autos-child-inventory-preview="1"]')).toHaveCount(0);
    proof.afterFix.push(
      await captureProof(page, "E", "sessionStorage after Volver a editar / rehydrateFromStorage"),
    );

    await childCard.getByRole("button", { name: "Editar" }).click();
    await expect(drawer).toBeVisible();
    await goToChildMediaStep(drawer);
    await assertEditorHasMedia(drawer);
    proof.afterFix.push(
      await captureProof(page, "F", "child editor after Editar / resolveCanonicalChildInventoryEditorDraft"),
    );
    await drawer.getByRole("button", { name: "Cancelar" }).click();
    await expect(drawer).toBeHidden();

    await page.reload();
    await dismissConsentIfPresent(page);
    await expect(page.getByRole("button", { name: "Agregar vehículo al inventario" })).toBeVisible({
      timeout: 60_000,
    });
    proof.afterFix.push(await captureProof(page, "G", "sessionStorage after refresh / loadAutosNegociosDraftResolved"));

    const childCardAfterRefresh = page.locator("article").filter({ hasText: "Vehículo adicional" }).first();
    await expect(childCardAfterRefresh.locator("img")).toBeVisible({ timeout: 15_000 });
    await childCardAfterRefresh.getByRole("button", { name: "Editar" }).click();
    await expect(drawer).toBeVisible();
    await goToChildMediaStep(drawer);
    await assertEditorHasMedia(drawer);
    proof.afterFix.push(
      await captureProof(page, "H", "child editor after refresh + Editar / reconcileInProgressInventoryWithSavedChildren"),
    );

    for (const snap of proof.afterFix) {
      if (["B", "C", "D", "E", "G"].includes(String(snap.label))) {
        expect(snap.mediaImagesCount).toBeGreaterThanOrEqual(2);
        expect(snap.videoUrlsCount).toBeGreaterThanOrEqual(1);
        expect(snap.isReducedObject).toBe(false);
      }
      if (["A", "F", "H"].includes(String(snap.label))) {
        expect(snap.editorMediaCount).toBeGreaterThanOrEqual(2);
        expect(snap.editorVideoCount).toBeGreaterThanOrEqual(1);
      }
      if (snap.label === "D") {
        expect(snap.previewMediaCount).toBeGreaterThanOrEqual(2);
      }
      if (["E", "F"].includes(String(snap.label))) {
        const inProg = snap.inProgressMediaImagesCount;
        if (inProg !== null && snap.mediaImagesCount > 0) {
          expect(inProg === 0 || inProg === snap.mediaImagesCount).toBeTruthy();
        }
      }
    }

    fs.mkdirSync(path.dirname(PROOF_JSON), { recursive: true });
    fs.writeFileSync(PROOF_JSON, JSON.stringify(proof, null, 2), "utf8");
  });
});
