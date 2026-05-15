/**
 * Clases/Comunidad quick publish contract (no network).
 * Run: npx tsx scripts/community-quick-publish-contract-smoke.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { detailPairsToMap, isCommunityQuickListing } from "../app/(site)/clasificados/community/shared/communityListingDetailPairs";
import { normalizeSocialUrlForOpen } from "../app/(site)/publicar/community/shared/lib/communityWebsiteAndSocial";
import { communityGalleryContainsPdf } from "../app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings";
import {
  gateClasesQuickPreview,
  gateComunidadQuickPreview,
  shouldBlockClasesPaidPublish,
} from "../app/(site)/publicar/community/shared/required/communityRequiredForPreview";
import type { EmpleosImageItem } from "../app/(site)/publicar/empleos/shared/media/empleosMediaTypes";
import type { ClasesQuickDraft } from "../app/(site)/publicar/community/shared/types/communityQuickDraft";
import { CLASES_QUICK_COPY, COMUNIDAD_QUICK_COPY, COMMUNITY_PUBLISH_COPY } from "../app/(site)/publicar/community/shared/copy/communityPublishCopy";
import { CLASES_CATEGORY_OPTIONS, resolveClasesCategoryPublicLabel } from "../app/(site)/publicar/community/shared/taxonomy/communityTaxonomy";
import { normalizeClasesQuickDraft } from "../app/(site)/publicar/community/shared/types/communityQuickDraft";
import {
  buildMinimalClasesQuickDraftForPreviewContract,
  buildMinimalComunidadQuickDraftForPreviewContract,
  buildPaidClasesQuickDraftForPreviewContract,
} from "./community-quick-preview-minimal-drafts";

function readSourceRel(...segments: string[]) {
  return fs.readFileSync(path.join(process.cwd(), ...segments), "utf8");
}

function main() {
  assert.equal(normalizeSocialUrlForOpen("facebook.com/tuorganizacion", "facebook"), "https://facebook.com/tuorganizacion");
  assert.equal(normalizeSocialUrlForOpen("https://www.facebook.com/x", "facebook"), "https://www.facebook.com/x");
  assert.equal(normalizeSocialUrlForOpen("https://evil.com/facebook", "facebook"), null);
  assert.equal(normalizeSocialUrlForOpen("youtu.be/abc", "youtube"), "https://youtu.be/abc");

  const pdf: EmpleosImageItem = {
    id: "1",
    url: "data:application/pdf;base64,JVBERi0=",
    alt: "flyer",
    isMain: true,
    attachmentMime: "application/pdf",
  };
  assert.equal(communityGalleryContainsPdf([pdf]), true);

  const img: EmpleosImageItem = {
    id: "2",
    url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    alt: "photo",
    isMain: true,
  };
  assert.equal(communityGalleryContainsPdf([img]), false);

  const mixed: EmpleosImageItem[] = [
    { ...img, isMain: true },
    { ...pdf, id: "3", isMain: false },
  ];
  assert.equal(communityGalleryContainsPdf(mixed), true);

  const paidClases = { classCostType: "pagada" } as ClasesQuickDraft;
  const freeClases = { classCostType: "gratis" } as ClasesQuickDraft;
  assert.equal(shouldBlockClasesPaidPublish(paidClases), true);
  assert.equal(shouldBlockClasesPaidPublish(freeClases), false);

  const optSlugs = CLASES_CATEGORY_OPTIONS.map((o) => o.value).filter(Boolean);
  assert.ok(optSlugs.includes("zumba"));
  assert.ok(optSlugs.includes("fitness"));
  assert.ok(optSlugs.includes("boxeo"));

  const copyBlob = JSON.stringify(CLASES_QUICK_COPY) + JSON.stringify(COMUNIDAD_QUICK_COPY);
  assert.ok(!copyBlob.includes("87 N King Rd"));

  assert.equal(resolveClasesCategoryPublicLabel("otro", "Boxeo Profesional", "es"), "Boxeo Profesional");

  const migrated = normalizeClasesQuickDraft({ kind: "clases", category: "zumba_fitness" } as unknown);
  assert.equal(migrated.category, "zumba");

  const samplePairs = [
    { label: "Leonix:communityLane", value: "quick" },
    { label: "Leonix:communityKind", value: "clases" },
    { label: "Leonix:organizer", value: "Test Org" },
    { label: "Leonix:classCategory", value: "musica" },
    { label: "Leonix:classCostType", value: "gratis" },
    { label: "Leonix:mode", value: "enLinea" },
    { label: "Leonix:weeklyScheduleJson", value: "[]" },
    { label: "Leonix:audience", value: "adultos" },
    { label: "Leonix:registrationRequired", value: "no" },
    { label: "Leonix:skillLevel", value: "principiante" },
  ];
  const m = detailPairsToMap(samplePairs);
  assert.equal(isCommunityQuickListing(m), true);
  assert.equal(m["Leonix:classCostType"], "gratis");

  const userId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
  const listingId = "11111111-2222-3333-4444-555555555555";
  const path = `${userId}/${listingId}/photos/photo-01.jpg`;
  assert.match(path, /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/photos\/photo-\d{2}\.jpg$/);

  assert.equal(COMMUNITY_PUBLISH_COPY.es.finalStep.publishCta, "Publicar anuncio");
  assert.equal(COMMUNITY_PUBLISH_COPY.en.finalStep.publishCta, "Publish listing");

  const previewClient = readSourceRel(
    "app/(site)/publicar/community/shared/preview/CommunityQuickPreviewClient.tsx",
  );
  assert.ok(previewClient.includes("CommunityQuickPreviewPublishBar"));
  assert.ok(previewClient.includes("CommunityQuickPublicDetailShell"));
  assert.ok(previewClient.includes('kind === "clases" && clasesDraft'));
  assert.ok(previewClient.includes('kind === "comunidad" && comunidadDraft'));

  const publicDetailShell = readSourceRel(
    "app/(site)/clasificados/community/CommunityQuickPublicDetailShell.tsx",
  );
  assert.ok(publicDetailShell.includes('data-testid="leonix-public-detail-shell"'));

  const anuncioDetail = readSourceRel("app/(site)/clasificados/anuncio/[id]/page.tsx");
  assert.ok(anuncioDetail.includes("images: listing.images"), "published quick detail must pass DB listing images into quick shell");

  const quickPublished = readSourceRel("app/(site)/clasificados/community/CommunityQuickPublishedDetailPage.tsx");
  assert.ok(quickPublished.includes("images?:"), "CommunityQuickPublishedDetailPage must include images on listing contract");

  const primitives = readSourceRel("app/(site)/publicar/community/shared/preview/communityQuickAdPrimitives.tsx");
  assert.ok(primitives.includes('kind: "pdf"'), "pickMainHeroImage must not swap user PDF for stock Unsplash handshake");

  const sidebar = readSourceRel("app/(site)/clasificados/community/CommunityQuickPublicDetailSidebar.tsx");
  assert.ok(!sidebar.includes("Ver contacto"), "sidebar must not expose dead Ver contacto CTA");
  assert.ok(!sidebar.includes("CityAutocomplete"), "sidebar must not duplicate city/distance (contact canvas has map)");

  const extSocial = readSourceRel(
    "app/(site)/publicar/community/shared/components/CommunityExtendedContactFields.tsx",
  );
  assert.ok(extSocial.includes('data-testid="community-organizer-social-fields"'));
  assert.ok(extSocial.includes("Redes sociales del organizador"));

  const contactCanvasSrc = readSourceRel(
    "app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx",
  );
  assert.ok(contactCanvasSrc.includes('data-testid="community-contact-social-icons"'));
  assert.ok(contactCanvasSrc.includes("Abrir Facebook"));
  assert.ok(contactCanvasSrc.includes("normalizeSocialUrlForOpen"));

  const previewBar = readSourceRel(
    "app/(site)/publicar/community/shared/preview/CommunityQuickPreviewPublishBar.tsx",
  );
  assert.ok(previewBar.includes("publishCommunityQuickToListings"));
  assert.ok(/publishCommunityQuickToListings\s*\(\s*\{[\s\S]*?\bkind\b/.test(previewBar));

  const clasesPreviewRoute = readSourceRel(
    "app/(site)/publicar/clases/quick/preview/ClasesQuickPreviewPageClient.tsx",
  );
  assert.ok(clasesPreviewRoute.includes('kind="clases"'));
  const comunidadPreviewRoute = readSourceRel(
    "app/(site)/publicar/comunidad/quick/preview/ComunidadQuickPreviewPageClient.tsx",
  );
  assert.ok(comunidadPreviewRoute.includes('kind="comunidad"'));

  const publishToListingsSrc = readSourceRel(
    "app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts",
  );
  assert.ok(
    publishToListingsSrc.includes('kind === "clases" && shouldBlockClasesPaidPublish'),
    "paid publish guard must be clases-only (comunidad must not enter paid-class block)",
  );

  const clasesFree = buildMinimalClasesQuickDraftForPreviewContract();
  assert.equal(gateClasesQuickPreview(clasesFree, "es").ok, true);
  const comunidadFree = buildMinimalComunidadQuickDraftForPreviewContract();
  assert.equal(gateComunidadQuickPreview(comunidadFree, "es").ok, true);
  const clasesPaid = buildPaidClasesQuickDraftForPreviewContract();
  assert.equal(gateClasesQuickPreview(clasesPaid, "es").ok, true);
  assert.equal(shouldBlockClasesPaidPublish(clasesPaid), true);

  console.log("community-quick-publish-contract-smoke: PASS");
}

main();
