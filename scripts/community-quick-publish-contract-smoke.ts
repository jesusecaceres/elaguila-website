/**
 * Clases/Comunidad quick publish contract (no network).
 * Run: npx tsx scripts/community-quick-publish-contract-smoke.ts
 */
import assert from "node:assert/strict";

import { detailPairsToMap, isCommunityQuickListing } from "../app/(site)/clasificados/community/shared/communityListingDetailPairs";
import { communityGalleryContainsPdf } from "../app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings";
import { shouldBlockClasesPaidPublish } from "../app/(site)/publicar/community/shared/required/communityRequiredForPreview";
import type { EmpleosImageItem } from "../app/(site)/publicar/empleos/shared/media/empleosMediaTypes";
import type { ClasesQuickDraft } from "../app/(site)/publicar/community/shared/types/communityQuickDraft";

function main() {
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

  const samplePairs = [
    { label: "Leonix:communityLane", value: "quick" },
    { label: "Leonix:communityKind", value: "clases" },
    { label: "Leonix:organizer", value: "Test Org" },
    { label: "Leonix:classCategory", value: "musica" },
    { label: "Leonix:classCostType", value: "gratis" },
    { label: "Leonix:mode", value: "enLinea" },
    { label: "Leonix:weeklyScheduleJson", value: "[]" },
  ];
  const m = detailPairsToMap(samplePairs);
  assert.equal(isCommunityQuickListing(m), true);
  assert.equal(m["Leonix:classCostType"], "gratis");

  const userId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
  const listingId = "11111111-2222-3333-4444-555555555555";
  const path = `${userId}/${listingId}/photos/01.jpg`;
  assert.match(path, /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/photos\//i);

  console.log("community-quick-publish-contract-smoke: PASS");
}

main();
