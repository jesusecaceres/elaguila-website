/**
 * Run: npx tsx scripts/leonix-publish-description-selftest.ts
 */
import assert from "node:assert/strict";
import {
  LEONIX_LISTINGS_DESCRIPTION_DB_MAX_CHARS,
  LEONIX_LISTINGS_DESCRIPTION_DB_MIN_CHARS,
  mapLeonixListingsDescriptionConstraintToUserMessage,
  prepareLeonixListingDescriptionForPublish,
  sanitizeLeonixListingPublishDescriptionBody,
  toLeonixListingsDescriptionForDb,
} from "../app/(site)/clasificados/lib/leonixPublishPublicDescription";

function assertDbDescription(db: string | null): void {
  if (db == null) return;
  assert.ok(db.length === 0 || db.length >= LEONIX_LISTINGS_DESCRIPTION_DB_MIN_CHARS, `db len ${db.length} in 1..19`);
  assert.ok(db.length <= LEONIX_LISTINGS_DESCRIPTION_DB_MAX_CHARS, `db len ${db.length} > max`);
}

function main() {
  assert.equal(toLeonixListingsDescriptionForDb(""), null);
  assert.equal(toLeonixListingsDescriptionForDb("   \n\t  "), null);
  assert.equal(toLeonixListingsDescriptionForDb("llamame"), null);
  assert.equal(toLeonixListingsDescriptionForDb("cuarto"), null);

  const valid20 = "Descripción mínima válida.";
  assert.ok(valid20.length >= LEONIX_LISTINGS_DESCRIPTION_DB_MIN_CHARS);
  const db20 = toLeonixListingsDescriptionForDb(valid20);
  assert.equal(db20, valid20);
  assertDbDescription(db20);

  const base = "Casa en renta cerca del parque.\n\nDetalles del espacio.";
  const withMarker = `${base}\n\n[LEONIX_IMAGES]\nurl=https://x.example.com/a.jpg\n[/LEONIX_IMAGES]`;
  assert.equal(sanitizeLeonixListingPublishDescriptionBody(withMarker).includes("LEONIX_IMAGES"), false);
  assert.ok(sanitizeLeonixListingPublishDescriptionBody(withMarker).includes("Casa en renta"));

  const blobLine = `${base}\nblob:http://local/x`;
  assert.ok(!sanitizeLeonixListingPublishDescriptionBody(blobLine).includes("blob:"));

  const dataUrl = `${base}\ndata:image/png;base64,QUJD`;
  assert.ok(!sanitizeLeonixListingPublishDescriptionBody(dataUrl).toLowerCase().includes("data:image"));

  const prepOk = prepareLeonixListingDescriptionForPublish(base, "es");
  assert.equal(prepOk.ok, true);
  if (prepOk.ok) assert.equal(prepOk.sanitized.includes("Casa"), true);

  const tooLong = "x".repeat(LEONIX_LISTINGS_DESCRIPTION_DB_MAX_CHARS + 50);
  const prepBad = prepareLeonixListingDescriptionForPublish(tooLong, "es");
  assert.equal(prepBad.ok, false);

  const clippedViaDb = toLeonixListingsDescriptionForDb(tooLong.slice(0, 5000));
  assert.equal(clippedViaDb?.length, LEONIX_LISTINGS_DESCRIPTION_DB_MAX_CHARS);

  const friendly = mapLeonixListingsDescriptionConstraintToUserMessage(
    { code: "23514", message: 'new row for relation "listings" violates check constraint "description_len_check"' },
    "es",
  );
  assert.ok(friendly?.includes("20"));

  console.log("leonix-publish-description-selftest: OK");
}

main();
