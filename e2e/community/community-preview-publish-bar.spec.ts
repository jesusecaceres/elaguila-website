import { test, expect } from "@playwright/test";

import { COMMUNITY_SESSION_KEYS } from "../../app/(site)/publicar/community/shared/constants/communitySessionKeys";
import { COMMUNITY_PUBLISH_COPY } from "../../app/(site)/publicar/community/shared/copy/communityPublishCopy";
import {
  buildMinimalClasesQuickDraftForPreviewContract,
  buildMinimalComunidadQuickDraftForPreviewContract,
  buildPaidClasesQuickDraftForPreviewContract,
} from "../../scripts/community-quick-preview-minimal-drafts";

test.describe.configure({ timeout: 60_000 });

test.describe("Community quick preview publish bar (session draft)", () => {
  test("clases preview shows Volver a editar and Publicar anuncio", async ({ page }) => {
    const draft = buildMinimalClasesQuickDraftForPreviewContract();
    await page.addInitScript(
      ([key, json]: [string, string]) => {
        sessionStorage.setItem(key, json);
      },
      [COMMUNITY_SESSION_KEYS.clases, JSON.stringify(draft)],
    );
    await page.goto("/publicar/clases/quick/preview?from=publicar&lang=es");
    await expect(page.getByRole("link", { name: "Volver a editar" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Publicar anuncio" })).toBeVisible();
  });

  test("comunidad preview shows Volver a editar and Publicar anuncio", async ({ page }) => {
    const draft = buildMinimalComunidadQuickDraftForPreviewContract();
    await page.addInitScript(
      ([key, json]: [string, string]) => {
        sessionStorage.setItem(key, json);
      },
      [COMMUNITY_SESSION_KEYS.comunidad, JSON.stringify(draft)],
    );
    await page.goto("/publicar/comunidad/quick/preview?from=publicar&lang=es");
    await expect(page.getByRole("link", { name: "Volver a editar" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Publicar anuncio" })).toBeVisible();
  });

  test("paid clases preview keeps CTA visible but disabled with paid copy", async ({ page }) => {
    const draft = buildPaidClasesQuickDraftForPreviewContract();
    await page.addInitScript(
      ([key, json]: [string, string]) => {
        sessionStorage.setItem(key, json);
      },
      [COMMUNITY_SESSION_KEYS.clases, JSON.stringify(draft)],
    );
    await page.goto("/publicar/clases/quick/preview?from=publicar&lang=es");
    const btn = page.getByRole("button", { name: "Publicar anuncio" });
    await expect(btn).toBeVisible();
    await expect(btn).toBeDisabled();
    await expect(page.getByText(COMMUNITY_PUBLISH_COPY.es.paidClassPublishBlocked)).toBeVisible();
  });
});
