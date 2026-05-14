/**
 * Gate 08C — Rentas final public.listings payload contract (insert row shape + Rentas boundary preflight).
 *
 * Run: npx tsx scripts/rentas-publish-payload-contract-smoke.ts
 */
import assert from "node:assert/strict";
import {
  LEONIX_LISTINGS_DESCRIPTION_DB_MAX_CHARS,
  LEONIX_LISTINGS_DESCRIPTION_DB_MIN_CHARS,
} from "../app/(site)/clasificados/lib/leonixPublishPublicDescription";
import { buildListingsInsertRowForLeonixPublish } from "../app/(site)/clasificados/lib/leonixPublishRealEstateListingCore";
import {
  buildRentasPublishFinalPayloadDebug,
  rentasPublishFinalBoundaryPreflight,
  rentasPublishGalleryUrlsPreflight,
} from "../app/(site)/clasificados/rentas/lib/rentasPublishFinalPayloadDebug";

function assertSafeDescription(d: unknown): void {
  assert.ok(d === null || typeof d === "string");
  if (typeof d === "string") {
    assert.ok(d.length === 0 || (d.length >= LEONIX_LISTINGS_DESCRIPTION_DB_MIN_CHARS && d.length <= LEONIX_LISTINGS_DESCRIPTION_DB_MAX_CHARS));
    assert.ok(!/^data:/i.test(d));
    assert.ok(!/^blob:/i.test(d));
    assert.ok(!/;base64,/i.test(d));
  }
}

function assertSafeTitle(t: unknown): void {
  assert.equal(typeof t, "string");
  const s = t as string;
  assert.ok(s.length === 0 || (s.length >= 5 && s.length <= 120));
}

function main() {
  const owner = "00000000-0000-4000-8000-000000000099";
  const base = {
    title: "Casa en renta zona norte",
    description: "Descripción mínima válida para contrato de publicación.",
    city: "Monterrey",
    price: 8500,
    isFree: false,
    category: "rentas" as const,
    sellerType: "personal" as const,
    detailPairs: [{ label: "Tipo", value: "Residencial" }],
    contactPhoneDigits: "5551234567",
    contactEmail: "x@y.co",
    imageSources: ["https://a.public.blob.vercel-storage.com/gallery/1.jpg"],
    lang: "es" as const,
  };

  const row = buildListingsInsertRowForLeonixPublish(owner, base);
  assertSafeDescription(row.description);
  assertSafeTitle(row.title);
  assert.equal(row.category, "rentas");

  const dbg = buildRentasPublishFinalPayloadDebug({
    insertPayload: row,
    imageSources: base.imageSources,
    muxAssetId: undefined,
    muxPlaybackId: undefined,
    muxThumbnailUrl: undefined,
    sellerType: "personal",
    titleForDb: String(row.title ?? ""),
    descriptionForDb: row.description == null ? null : String(row.description),
  });
  assert.equal(rentasPublishFinalBoundaryPreflight(dbg, row, base.imageSources, "es"), null);

  const badImages = buildListingsInsertRowForLeonixPublish(owner, { ...base, imageSources: ["data:image/png;base64,QUJD"] });
  const dbgBad = buildRentasPublishFinalPayloadDebug({
    insertPayload: badImages,
    imageSources: ["data:image/png;base64,QUJD"],
    sellerType: "personal",
    titleForDb: String(badImages.title ?? ""),
    descriptionForDb: badImages.description == null ? null : String(badImages.description),
  });
  assert.notEqual(
    rentasPublishFinalBoundaryPreflight(dbgBad, badImages, ["data:image/png;base64,QUJD"], "es"),
    null,
  );

  assert.equal(rentasPublishGalleryUrlsPreflight(["https://x.example.com/a.jpg"], "es"), null);
  const galBlob = rentasPublishGalleryUrlsPreflight(["blob:http://local/x"], "es");
  assert.ok(typeof galBlob === "string" && galBlob.length > 0);

  const hugePair = "x".repeat(60_000);
  const rowHuge = buildListingsInsertRowForLeonixPublish(owner, {
    ...base,
    detailPairs: [{ label: "X", value: hugePair }],
  });
  const dbgHuge = buildRentasPublishFinalPayloadDebug({
    insertPayload: rowHuge,
    imageSources: base.imageSources,
    sellerType: "personal",
    titleForDb: String(rowHuge.title ?? ""),
    descriptionForDb: rowHuge.description == null ? null : String(rowHuge.description),
  });
  assert.notEqual(rentasPublishFinalBoundaryPreflight(dbgHuge, rowHuge, base.imageSources, "es"), null);

  console.log("rentas-publish-payload-contract-smoke: OK");
}

main();
