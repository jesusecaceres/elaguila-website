import { test, expect } from "@playwright/test";

import { COMMUNITY_SESSION_KEYS } from "../../app/(site)/publicar/community/shared/constants/communitySessionKeys";
import {
  buildMinimalClasesQuickDraftForPreviewContract,
  buildMinimalComunidadQuickDraftForPreviewContract,
} from "../../scripts/community-quick-preview-minimal-drafts";

const NORCAL_RE = /NorCal/i;
const RAW_SOCIAL_RE = /https?:\/\/(www\.)?(facebook|instagram|tiktok|youtube|linkedin|twitter|x)\.com/i;

async function assertPublicDetailShell(page: import("@playwright/test").Page) {
  await expect(page.getByTestId("leonix-public-detail-shell")).toBeVisible();
  await expect(page.getByTestId("community-quick-ad-body")).toBeVisible();
  await expect(page.getByTestId("community-anuncio-hero")).toBeVisible();
  await expect(page.getByTestId("community-contact-location")).toBeVisible();
  await expect(page.getByTestId("community-public-detail-sidebar")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(NORCAL_RE);
  await expect(page.locator("body")).not.toContainText(RAW_SOCIAL_RE);
}

test.describe("Community quick preview ↔ published shell parity", () => {
  test("clases preview uses public detail shell markers", async ({ page }) => {
    const draft = buildMinimalClasesQuickDraftForPreviewContract();
    await page.addInitScript(
      ([key, json]: [string, string]) => {
        sessionStorage.setItem(key, json);
      },
      [COMMUNITY_SESSION_KEYS.clases, JSON.stringify(draft)],
    );
    await page.goto("/publicar/clases/quick/preview?from=publicar&lang=es");
    await assertPublicDetailShell(page);
    await expect(page.getByRole("button", { name: "Publicar anuncio" })).toBeVisible();
    const shell = page.getByTestId("leonix-public-detail-shell");
    await expect(shell).toHaveAttribute("data-shell-mode", "preview");
    const heroBox = await page.getByTestId("community-anuncio-hero").boundingBox();
    const shellBox = await shell.boundingBox();
    expect(heroBox).not.toBeNull();
    expect(shellBox).not.toBeNull();
    if (heroBox && shellBox) {
      expect(heroBox.width).toBeLessThan(shellBox.width * 0.92);
    }
  });

  test("clases published sample uses same public detail shell markers", async ({ page }) => {
    await page.goto("/clasificados/anuncio/clases-personal-1?lang=es");
    await assertPublicDetailShell(page);
    await expect(page.getByRole("button", { name: "Publicar anuncio" })).toHaveCount(0);
    await expect(page.getByTestId("leonix-public-detail-shell")).toHaveAttribute("data-shell-mode", "published");
  });

  test("comunidad preview uses public detail shell markers", async ({ page }) => {
    const draft = buildMinimalComunidadQuickDraftForPreviewContract();
    await page.addInitScript(
      ([key, json]: [string, string]) => {
        sessionStorage.setItem(key, json);
      },
      [COMMUNITY_SESSION_KEYS.comunidad, JSON.stringify(draft)],
    );
    await page.goto("/publicar/comunidad/quick/preview?from=publicar&lang=es");
    await assertPublicDetailShell(page);
    await expect(page.getByRole("button", { name: "Publicar anuncio" })).toBeVisible();
    await expect(page.getByTestId("leonix-public-detail-shell")).toHaveAttribute("data-shell-mode", "preview");
  });

  test("comunidad published sample uses same public detail shell markers", async ({ page }) => {
    await page.goto("/clasificados/anuncio/comunidad-personal-1?lang=es");
    await assertPublicDetailShell(page);
    await expect(page.getByRole("button", { name: "Publicar anuncio" })).toHaveCount(0);
    await expect(page.getByTestId("leonix-public-detail-shell")).toHaveAttribute("data-shell-mode", "published");
  });
});
