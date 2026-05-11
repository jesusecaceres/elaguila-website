/**
 * Rentas publish media transport gates (no network).
 * Run: npx tsx scripts/rentas-publish-media-smoke.ts
 */
import assert from "node:assert/strict";
import {
  isRentasPublishableRemoteImageRef,
  rentasDraftImageRequiresBlobUpload,
} from "../app/(site)/clasificados/rentas/shared/rentasPublishMediaTransport";
import { orderedRentasGallerySourcesForPublish } from "../app/(site)/clasificados/rentas/shared/rentasPublishFormHelpers";

const tinyData =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
const httpsOk = "https://cdn.example.com/rentas/a.jpg";

function main() {
  assert.equal(isRentasPublishableRemoteImageRef(httpsOk), true);
  assert.equal(isRentasPublishableRemoteImageRef(tinyData), false);
  assert.equal(isRentasPublishableRemoteImageRef("blob:http://x"), false);
  assert.equal(rentasDraftImageRequiresBlobUpload(tinyData), true);
  assert.equal(rentasDraftImageRequiresBlobUpload(httpsOk), false);
  assert.equal(rentasDraftImageRequiresBlobUpload(""), false);

  const ordered = orderedRentasGallerySourcesForPublish(["a", "b", "c", "d"], 1);
  assert.deepEqual(ordered, ["b", "c", "d", "a"], "cover-first publish order");

  // Transport: draft may hold data URLs; they must not count as publishable until Blob upload step.
  assert.equal(isRentasPublishableRemoteImageRef(tinyData), false, "data:image blocked from transport");

  console.log("rentas-publish-media-smoke: OK");
}

main();
