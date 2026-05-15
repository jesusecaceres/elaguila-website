import { test, expect } from "@playwright/test";

import { COMMUNITY_SESSION_KEYS } from "../../app/(site)/publicar/community/shared/constants/communitySessionKeys";
import {
  buildMinimalClasesQuickDraftForPreviewContract,
  buildMinimalComunidadQuickDraftForPreviewContract,
} from "../../scripts/community-quick-preview-minimal-drafts";

const NORCAL_RE = /NorCal/i;
const RAW_SOCIAL_RE = /https?:\/\/(www\.)?(facebook|instagram|tiktok|youtube|linkedin|twitter|x)\.com/i;

const UNSPLASH_HANDSHAKE =
  "images.unsplash.com/photo-1521791136064-7986c2920216";

async function assertPublicDetailShell(page: import("@playwright/test").Page) {
  await expect(page.getByTestId("leonix-public-detail-shell")).toBeVisible();
  await expect(page.getByTestId("community-quick-ad-body")).toBeVisible();
  await expect(page.getByTestId("community-anuncio-hero")).toBeVisible();
  await expect(page.getByTestId("community-contact-location")).toBeVisible();
  await expect(page.getByTestId("community-public-detail-sidebar")).toBeVisible();
  await expect(page.locator("body")).not.toContainText(NORCAL_RE);
  await expect(page.locator("body")).not.toContainText(RAW_SOCIAL_RE);
}

async function assertSidebarNoDeadContactOrDistance(page: import("@playwright/test").Page) {
  await expect(page.getByRole("button", { name: /Ver contacto|View contact/i })).toHaveCount(0);
  const sidebar = page.getByTestId("community-public-detail-sidebar");
  await expect(sidebar.getByPlaceholder(/Ingresa tu ciudad|Enter your city/i)).toHaveCount(0);
  await expect(page.getByTestId("community-quick-sidebar-actions")).toBeVisible();
}

test.describe("Community quick preview ↔ published shell parity", () => {
  test("clases preview uses public detail shell markers", async ({ page }) => {
    const draft = buildMinimalClasesQuickDraftForPreviewContract();
    draft.images = [{ id: "parity-flyer", url: "/logo.png", alt: "flyer", isMain: true }];
    await page.addInitScript(
      ([key, json]: [string, string]) => {
        sessionStorage.setItem(key, json);
      },
      [COMMUNITY_SESSION_KEYS.clases, JSON.stringify(draft)],
    );
    await page.goto("/publicar/clases/quick/preview?from=publicar&lang=es");
    await assertPublicDetailShell(page);
    await assertSidebarNoDeadContactOrDistance(page);
    await expect(page.getByRole("button", { name: "Publicar anuncio" })).toBeVisible();
    const hero = page.getByTestId("community-anuncio-hero");
    await expect(hero).toHaveAttribute("data-community-flyer-kind", "image");
    const src = await hero.getAttribute("data-community-flyer-src");
    expect(src).toContain("logo.png");
    expect(src).not.toContain(UNSPLASH_HANDSHAKE);
    const box = await hero.boundingBox();
    expect(box).not.toBeNull();
    if (box) expect(box.height).toBeGreaterThanOrEqual(400);
  });

  test("clases published sample uses same public detail shell markers", async ({ page }) => {
    await page.goto("/clasificados/anuncio/clases-personal-1?lang=es");
    await assertPublicDetailShell(page);
    await assertSidebarNoDeadContactOrDistance(page);
    await expect(page.getByRole("button", { name: "Publicar anuncio" })).toHaveCount(0);
    await expect(page.getByTestId("leonix-public-detail-shell")).toHaveAttribute("data-shell-mode", "published");
    const hero = page.getByTestId("community-anuncio-hero");
    await expect(hero).toHaveAttribute("data-community-flyer-kind", "image");
    const src = await hero.getAttribute("data-community-flyer-src");
    expect(src).toContain("logo.png");
    expect(src).not.toContain(UNSPLASH_HANDSHAKE);
    const box = await hero.boundingBox();
    expect(box).not.toBeNull();
    if (box) expect(box.height).toBeGreaterThanOrEqual(400);
  });

  test("comunidad preview uses public detail shell markers", async ({ page }) => {
    const draft = buildMinimalComunidadQuickDraftForPreviewContract();
    draft.images = [{ id: "parity-flyer", url: "/logo.png", alt: "flyer", isMain: true }];
    await page.addInitScript(
      ([key, json]: [string, string]) => {
        sessionStorage.setItem(key, json);
      },
      [COMMUNITY_SESSION_KEYS.comunidad, JSON.stringify(draft)],
    );
    await page.goto("/publicar/comunidad/quick/preview?from=publicar&lang=es");
    await assertPublicDetailShell(page);
    await assertSidebarNoDeadContactOrDistance(page);
    await expect(page.getByRole("button", { name: "Publicar anuncio" })).toBeVisible();
    await expect(page.getByTestId("leonix-public-detail-shell")).toHaveAttribute("data-shell-mode", "preview");
    const hero = page.getByTestId("community-anuncio-hero");
    await expect(hero).toHaveAttribute("data-community-flyer-kind", "image");
    const src = await hero.getAttribute("data-community-flyer-src");
    expect(src).toContain("logo.png");
    expect(src).not.toContain(UNSPLASH_HANDSHAKE);
  });

  test("comunidad published sample uses same public detail shell markers", async ({ page }) => {
    await page.goto("/clasificados/anuncio/comunidad-personal-1?lang=es");
    await assertPublicDetailShell(page);
    await assertSidebarNoDeadContactOrDistance(page);
    await expect(page.getByRole("button", { name: "Publicar anuncio" })).toHaveCount(0);
    await expect(page.getByTestId("leonix-public-detail-shell")).toHaveAttribute("data-shell-mode", "published");
    const hero = page.getByTestId("community-anuncio-hero");
    await expect(hero).toHaveAttribute("data-community-flyer-kind", "image");
    const src = await hero.getAttribute("data-community-flyer-src");
    expect(src).toContain("logo.png");
    expect(src).not.toContain(UNSPLASH_HANDSHAKE);
  });
});
