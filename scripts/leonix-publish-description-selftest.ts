/**
 * Run: npx tsx scripts/leonix-publish-description-selftest.ts
 */
import assert from "node:assert/strict";
import {
  LEONIX_LISTINGS_PUBLISH_DESCRIPTION_DEFAULT_MAX,
  mapLeonixListingsDescriptionConstraintToUserMessage,
  prepareLeonixListingDescriptionForPublish,
  sanitizeLeonixListingPublishDescriptionBody,
} from "../app/(site)/clasificados/lib/leonixPublishPublicDescription";

function main() {
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

  const tooLong = "x".repeat(LEONIX_LISTINGS_PUBLISH_DESCRIPTION_DEFAULT_MAX + 50);
  const prepBad = prepareLeonixListingDescriptionForPublish(tooLong, "es");
  assert.equal(prepBad.ok, false);

  const friendly = mapLeonixListingsDescriptionConstraintToUserMessage(
    { code: "23514", message: 'new row for relation "listings" violates check constraint "description_len_check"' },
    "es",
  );
  assert.ok(friendly?.includes("demasiado larga"));

  console.log("leonix-publish-description-selftest: OK");
}

main();
