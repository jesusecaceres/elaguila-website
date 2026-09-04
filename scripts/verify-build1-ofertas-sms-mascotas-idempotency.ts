/**
 * Globalization Build 1 — targeted safe defect closure.
 *
 * A) Ofertas Locales SMS analytics truth: restores the distinct `message_click` event for the
 *    SMS action (previously dropped by a dedupe cleanup that correctly removed 4 truly-redundant
 *    events but also silently dropped this genuinely distinct one), without restoring duplicate
 *    tracking for phone/whatsapp/website/directions.
 * B) Mascotas y Perdidos publish idempotency: adopts the exact existing reuse/idempotency pattern
 *    already proven in Busco/Comunidad/Clases (`quickListingIdempotency.ts` + `publish_attempt_key`),
 *    closing the double-submit/back-button duplicate-row risk. No new schema/migration — reuses
 *    the same `listings.publish_attempt_key` column and unique index already in production use by
 *    the 3 sibling categories.
 *
 * Run: npx tsx scripts/verify-build1-ofertas-sms-mascotas-idempotency.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = join(__dirname, "..");
const read = (rel: string) => readFileSync(join(REPO_ROOT, rel), "utf8");
let failures = 0;
let checks = 0;
function check(label: string, fn: () => void): void {
  checks += 1;
  try {
    fn();
    console.log(`  ok  - ${label}`);
  } catch (err) {
    failures += 1;
    console.error(`  FAIL - ${label}`);
    console.error(`         ${err instanceof Error ? err.message : String(err)}`);
  }
}

function main(): void {
  console.log("verify-build1-ofertas-sms-mascotas-idempotency: starting");

  // ── A: Ofertas SMS analytics ────────────────────────────────────────────────────────────
  const ofertasSrc = read("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicDetailView.tsx");

  check("Ofertas: trackOfertaLocalCta is imported (re-added for SMS only)", () => {
    assert.match(ofertasSrc, /import \{\s*trackOfertaLocalCta,/);
  });

  check("Ofertas: SMS button emits a distinct message_click via trackOfertaLocalCta(..., \"sms\", ...)", () => {
    const smsBlockMatch = ofertasSrc.match(/\{smsHref[\s\S]{0,900}?\{c\.sms\}/);
    assert.ok(smsBlockMatch, "SMS button JSX block not found");
    const smsBlock = smsBlockMatch![0];
    assert.match(smsBlock, /trackOfertaLocalCta\(\{ ofertaLocalId: offer\.id, leonixAdId: offer\.leonixAdId \}, "sms", "public_detail"\)/);
    assert.match(smsBlock, /track\("phone", "sms"\)/, "phone_click for sms provider must still fire (intentional, not removed)");
  });

  check("Ofertas: phone button does NOT gain a duplicate event (only track(\"phone\") remains, no trackOfertaLocalCta)", () => {
    const phoneBlockMatch = ofertasSrc.match(/href=\{offer\.phoneHref\}[\s\S]{0,300}?\{c\.call\}/);
    assert.ok(phoneBlockMatch, "phone button JSX block not found");
    assert.doesNotMatch(phoneBlockMatch![0], /trackOfertaLocalCta/);
  });

  check("Ofertas: whatsapp button does NOT gain a duplicate event", () => {
    const waBlockMatch = ofertasSrc.match(/href=\{offer\.whatsappHref\}[\s\S]{0,300}?\{c\.whatsapp\}/);
    assert.ok(waBlockMatch, "whatsapp button JSX block not found");
    assert.doesNotMatch(waBlockMatch![0], /trackOfertaLocalCta/);
  });

  check("Ofertas: website/directions buttons unaffected (no trackOfertaLocalCta anywhere else in ContactHub)", () => {
    const allTrackOfertaLocalCtaCalls = ofertasSrc.match(/trackOfertaLocalCta\(/g) ?? [];
    // Exactly one call site: the SMS button. Import line uses a different token shape (no parens
    // immediately after in the same way), so this only counts real invocations.
    assert.equal(allTrackOfertaLocalCtaCalls.length, 1, `expected exactly 1 trackOfertaLocalCta(...) call, found ${allTrackOfertaLocalCtaCalls.length}`);
  });

  check("Shared evidence: message_click is a real, already-allowlisted event type", () => {
    const eventTypesSrc = read("app/lib/listingAnalyticsEventTypes.ts");
    assert.match(eventTypesSrc, /"message_click"/);
  });

  check("Shared evidence: listingEngagementRecorder already maps sms -> message_click (reused, not reinvented)", () => {
    const recorderSrc = read("app/lib/analytics/client/listingEngagementRecorder.ts");
    assert.match(recorderSrc, /sms:\s*"message_click"/);
  });

  // ── B: Mascotas publish idempotency ─────────────────────────────────────────────────────
  const mascotasPublisherSrc = read(
    "app/(site)/publicar/mascotas-y-perdidos/shared/publishMascotasPerdidosQuickToListings.ts",
  );

  check("Mascotas: publisher imports the shared quickListingIdempotency helpers (reused, not reinvented)", () => {
    assert.match(mascotasPublisherSrc, /from "@\/app\/\(site\)\/clasificados\/lib\/quickListingIdempotency"/);
    assert.match(mascotasPublisherSrc, /verifyQuickListingReusable/);
    assert.match(mascotasPublisherSrc, /getOrCreateSessionPublishAttemptKey/);
    assert.match(mascotasPublisherSrc, /isPublishAttemptKeyConflict/);
    assert.match(mascotasPublisherSrc, /fetchOwnListingIdByPublishAttemptKey/);
    assert.match(mascotasPublisherSrc, /clearSessionPublishAttemptKey/);
  });

  check("Mascotas: publisher accepts existingListingId + onListingIdKnown (matches Busco/Comunidad/Clases signature)", () => {
    assert.match(mascotasPublisherSrc, /existingListingId\?:\s*string \| null/);
    assert.match(mascotasPublisherSrc, /onListingIdKnown\?:\s*\(listingId: string\) => void/);
  });

  check("Mascotas: reuse-verified path UPDATEs the existing row (never a fresh insert)", () => {
    assert.match(mascotasPublisherSrc, /if \(reuseCheck\?\.safe\)/);
    assert.match(mascotasPublisherSrc, /updateListingsRowResilient\(supabase, listingId, updatablePayload\)/);
  });

  check("Mascotas: a failed reuse verification fails closed (never falls back to insert)", () => {
    assert.match(mascotasPublisherSrc, /else if \(existingListingId\)[\s\S]{0,500}?return \{ ok: false, error: quickListingExistingIdentityInvalidMessage\(lang\) \};/);
  });

  check("Mascotas: normal first-publish path still inserts, now carrying a publish_attempt_key", () => {
    assert.match(mascotasPublisherSrc, /insertPayload\.publish_attempt_key = publishAttemptKey/);
    assert.match(mascotasPublisherSrc, /insertListingsRowResilient\(supabase, insertPayload\)/);
  });

  check("Mascotas: a racing/retried insert recovers the same row by attempt key instead of duplicating", () => {
    assert.match(mascotasPublisherSrc, /isPublishAttemptKeyConflict\(ins\.error\)/);
    assert.match(mascotasPublisherSrc, /fetchOwnListingIdByPublishAttemptKey\(supabase, \{/);
  });

  check("Mascotas: photo requirement (existing behavior) is untouched", () => {
    assert.match(mascotasPublisherSrc, /orderedUrls\.length === 0/);
  });

  check("Mascotas: category constant matches the existing insertPayload.category value", () => {
    assert.match(mascotasPublisherSrc, /const MASCOTAS_CATEGORY = "mascotas-y-perdidos";/);
    assert.match(mascotasPublisherSrc, /category: "mascotas-y-perdidos",/);
  });

  const mascotasSessionKeysSrc = read(
    "app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosSessionKeys.ts",
  );
  check("Mascotas: new in-flight session key added, existing draft key untouched", () => {
    assert.match(mascotasSessionKeysSrc, /MASCOTAS_PERDIDOS_QUICK_DRAFT_KEY = "leonix_mascotas_perdidos_quick_draft_v2"/);
    assert.match(mascotasSessionKeysSrc, /MASCOTAS_PERDIDOS_QUICK_IN_FLIGHT_LISTING_ID_KEY = "leonix_mascotas_perdidos_quick_in_flight_listing_id_v1"/);
  });

  const mascotasBarSrc = read(
    "app/(site)/publicar/mascotas-y-perdidos/quick/preview/MascotasPerdidosQuickPreviewPublishBar.tsx",
  );
  check("Mascotas: preview publish bar reads/writes/clears the in-flight id (matches Busco caller pattern)", () => {
    assert.match(mascotasBarSrc, /existingListingId: inFlightId/);
    assert.match(mascotasBarSrc, /onListingIdKnown: \(listingId\) => \{/);
    assert.match(mascotasBarSrc, /window\.sessionStorage\.removeItem\(MASCOTAS_PERDIDOS_QUICK_IN_FLIGHT_LISTING_ID_KEY\)/);
  });

  check("REGRESSION: Busco's reference pattern is untouched (never modified this build)", () => {
    const buscoSrc = read("app/(site)/publicar/busco/shared/publishBuscoQuickToListings.ts");
    assert.match(buscoSrc, /verifyQuickListingReusable/);
    assert.match(buscoSrc, /getOrCreateSessionPublishAttemptKey/);
  });

  console.log(`\nverify-build1-ofertas-sms-mascotas-idempotency: ${checks - failures}/${checks} checks passed`);
  if (failures > 0) process.exitCode = 1;
}

main();
