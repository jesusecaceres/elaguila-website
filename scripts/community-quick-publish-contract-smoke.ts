/**
 * Clases/Comunidad quick publish contract (no network).
 * Run: npx tsx scripts/community-quick-publish-contract-smoke.ts
 */
import assert from "node:assert/strict";

import { communityGalleryContainsPdf } from "../app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings";
import type { EmpleosImageItem } from "../app/(site)/publicar/empleos/shared/media/empleosMediaTypes";

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

  console.log("community-quick-publish-contract-smoke: PASS");
}

main();
