/**
 * Run: npx tsx scripts/rentas-publish-listing-row-contract-selftest.ts
 *
 * Simulates `buildListingsInsertRowForLeonixPublish` description/title columns for Rentas/BR Leonix publish.
 */
import assert from "node:assert/strict";
import {
  LEONIX_LISTINGS_DESCRIPTION_DB_MAX_CHARS,
  LEONIX_LISTINGS_DESCRIPTION_DB_MIN_CHARS,
} from "../app/(site)/clasificados/lib/leonixPublishPublicDescription";
import { buildListingsInsertRowForLeonixPublish } from "../app/(site)/clasificados/lib/leonixPublishRealEstateListingCore";

function assertDescriptionColumn(row: Record<string, unknown>): void {
  const d = row.description;
  assert.ok(d === null || typeof d === "string", "description is null or string");
  if (typeof d === "string") {
    assert.ok(d.length >= LEONIX_LISTINGS_DESCRIPTION_DB_MIN_CHARS, `len ${d.length} in 1..19`);
    assert.ok(d.length <= LEONIX_LISTINGS_DESCRIPTION_DB_MAX_CHARS, `len ${d.length} > max`);
    assert.ok(!/^data:/i.test(d), "no data url in description");
  }
}

function assertTitleColumn(row: Record<string, unknown>): void {
  const t = row.title;
  assert.equal(typeof t, "string");
  const title = t as string;
  assert.ok(title.length === 0 || title.length >= 5, `title len ${title.length}`);
  assert.ok(title.length <= 120, `title len ${title.length}`);
}

function main() {
  const owner = "00000000-0000-4000-8000-000000000001";
  const baseParams = {
    title: "Casa en renta zona centro",
    description: "Descripción mínima válida para renta.",
    city: "Ciudad de México",
    price: 12000,
    isFree: false,
    category: "rentas" as const,
    sellerType: "personal" as const,
    detailPairs: [{ label: "Tipo", value: "Residencial" }],
    contactPhoneDigits: "5551234567",
    contactEmail: "a@b.co",
    imageSources: ["https://x.public.blob.vercel-storage.com/a.jpg"],
    lang: "es" as const,
  };

  const row1 = buildListingsInsertRowForLeonixPublish(owner, baseParams);
  assertDescriptionColumn(row1);
  assertTitleColumn(row1);

  const rowShortDesc = buildListingsInsertRowForLeonixPublish(owner, {
    ...baseParams,
    description: "corta",
  });
  assert.equal(rowShortDesc.description, null);

  const rowLong = buildListingsInsertRowForLeonixPublish(owner, {
    ...baseParams,
    description: "x".repeat(LEONIX_LISTINGS_DESCRIPTION_DB_MAX_CHARS + 80),
  });
  assertDescriptionColumn(rowLong);
  assert.equal((rowLong.description as string).length, LEONIX_LISTINGS_DESCRIPTION_DB_MAX_CHARS);

  const skinnyClip = `${"a".repeat(18)}${" ".repeat(5000)}`;
  const rowPad = buildListingsInsertRowForLeonixPublish(owner, { ...baseParams, description: skinnyClip });
  assert.equal(rowPad.description, null);

  const explicitNull = buildListingsInsertRowForLeonixPublish(owner, baseParams, { listingDescriptionForDb: null });
  assert.equal(explicitNull.description, null);

  const explicit = buildListingsInsertRowForLeonixPublish(owner, baseParams, {
    listingDescriptionForDb: "Descripción mínima válida otra vez.",
  });
  assert.equal(explicit.description, "Descripción mínima válida otra vez.");

  console.log("rentas-publish-listing-row-contract-selftest: OK");
}

main();
