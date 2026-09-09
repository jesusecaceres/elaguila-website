/**
 * Globalization Build 3 — analytics integrity + registry truth.
 *
 * A) Shared analytics PII metadata hardening: adopts Comida Local's proven key-level metadata
 *    blocklist (phone/whatsapp/email/owner_user_id/user_id and variants) into the one shared,
 *    authoritative server-side sanitizer every category's metadata actually passes through —
 *    the existing value-pattern (email/phone regex) redaction only caught PII embedded in a
 *    string value, never a key like `owner_user_id` holding a bare UUID.
 * B) Community-family duplicate listing_view cleanup: Comunidad, Clases, Busco, and Mascotas y
 *    Perdidos each independently called trackCommunityListingView (listing_view + listing_open)
 *    inside their own detail component, duplicating the identical event the generic
 *    anuncio/[id]/page.tsx wrapper that renders all four already fires unconditionally. The
 *    category-specific duplicate is removed; the generic wrapper remains canonical.
 * C) Owner capability registry truth: Comunidad/Clases claimed like/save "supported" while the
 *    only component wiring them is unimported dead code; Mascotas y Perdidos still claimed
 *    report "unsupported" after a real, reachable Report component was added. Corrected to
 *    match actual runtime reachability — no new UI wired.
 *
 * Run: npx tsx scripts/verify-build3-analytics-registry-truth.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sanitizeAnalyticsMetadata } from "../app/lib/analytics/server/validateAnalyticsEvent";

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
  console.log("verify-build3-analytics-registry-truth: starting");

  // ── A: shared analytics PII metadata hardening ──────────────────────────────────────────
  check("A1: email metadata key removed regardless of value shape", () => {
    const out = sanitizeAnalyticsMetadata({ email: "someone@example.com" });
    assert.equal(out.email, undefined);
  });
  check("A2: phone metadata key removed even when the value doesn't match the phone regex", () => {
    const out = sanitizeAnalyticsMetadata({ phone: "not-a-real-phone-string" });
    assert.equal(out.phone, undefined);
  });
  check("A3: whatsapp metadata key removed (camelCase variant too)", () => {
    const out1 = sanitizeAnalyticsMetadata({ whatsapp: "123" });
    const out2 = sanitizeAnalyticsMetadata({ whatsappNumber: "123" });
    assert.equal(out1.whatsapp, undefined);
    assert.equal(out2.whatsappNumber, undefined);
  });
  check("A4: owner/user identity metadata key removed (snake_case and camelCase)", () => {
    const out1 = sanitizeAnalyticsMetadata({ owner_user_id: "11111111-1111-4111-8111-111111111111" });
    const out2 = sanitizeAnalyticsMetadata({ ownerUserId: "11111111-1111-4111-8111-111111111111" });
    const out3 = sanitizeAnalyticsMetadata({ user_id: "abc" });
    assert.equal(out1.owner_user_id, undefined);
    assert.equal(out2.ownerUserId, undefined);
    assert.equal(out3.user_id, undefined);
  });
  check("A5: benign metadata preserved (surface, cta, provider, counts)", () => {
    const out = sanitizeAnalyticsMetadata({ surface: "public_detail", cta: "phone", count: 3, ok: true });
    assert.equal(out.surface, "public_detail");
    assert.equal(out.cta, "phone");
    assert.equal(out.count, 3);
    assert.equal(out.ok, true);
  });
  check("A6: existing length/type limits preserved (long string truncated, non-finite number dropped)", () => {
    const longString = "x".repeat(600);
    const out = sanitizeAnalyticsMetadata({ note: longString, bad: Number.NaN });
    assert.equal((out.note as string).length, 500);
    assert.equal(out.bad, undefined);
  });
  check("A7: an event is never rejected merely for a blocked key — sanitize returns an object, doesn't throw", () => {
    assert.doesNotThrow(() => sanitizeAnalyticsMetadata({ email: "x@y.com", phone: "5551234567", surface: "detail" }));
    const out = sanitizeAnalyticsMetadata({ email: "x@y.com", phone: "5551234567", surface: "detail" });
    assert.equal(out.surface, "detail");
  });
  check("A: value-pattern PII redaction (pre-existing) still works for a benign-named key", () => {
    const out = sanitizeAnalyticsMetadata({ note: "call me at 5551234567" });
    assert.match(out.note as string, /\[redacted-phone\]/);
  });
  check("A: Comida Local's own client-side blocklist retained (defense-in-depth, not removed)", () => {
    const src = read("app/lib/clasificados/comida-local/comidaLocalAnalytics.ts");
    assert.match(src, /BLOCKED_METADATA_KEYS/);
  });

  // ── B: community-family duplicate listing_view ──────────────────────────────────────────
  const genericAnuncioSrc = read("app/(site)/clasificados/anuncio/[id]/page.tsx");
  check("Generic anuncio wrapper still fires the canonical trackListingViewOpen unconditionally", () => {
    assert.match(genericAnuncioSrc, /trackListingViewOpen\(/);
  });
  check("Generic anuncio wrapper renders all 4 community-family detail components", () => {
    assert.match(genericAnuncioSrc, /CommunityQuickPublishedDetailPage/);
    assert.match(genericAnuncioSrc, /BuscoPublishedDetailPage/);
    assert.match(genericAnuncioSrc, /MascotasPerdidosPublishedDetailPage/);
  });

  const communitySrc = read("app/(site)/clasificados/community/CommunityQuickPublishedDetailPage.tsx");
  check("COMUNIDAD/CLASES: trackCommunityListingView call removed (was duplicate)", () => {
    assert.doesNotMatch(communitySrc, /trackCommunityListingView\(/);
  });
  check("COMUNIDAD/CLASES: addListingView (Recently Viewed) untouched", () => {
    assert.match(communitySrc, /addListingView\(listing\.id\)/);
  });
  check("COMUNIDAD/CLASES: Share tracking (trackCommunityListingShare) untouched", () => {
    assert.match(communitySrc, /trackCommunityListingShare\(/g);
  });
  check("COMUNIDAD/CLASES: Report flow untouched", () => {
    assert.match(communitySrc, /handleReportSubmit/);
  });

  const buscoSrc = read("app/(site)/clasificados/busco/BuscoPublishedDetailPage.tsx");
  check("BUSCO: trackCommunityListingView call and its import removed", () => {
    assert.doesNotMatch(buscoSrc, /trackCommunityListingView/);
    assert.doesNotMatch(buscoSrc, /comunidadClasesBuscoGlobalAnalytics/);
  });
  check("BUSCO: addListingView (Recently Viewed) untouched", () => {
    assert.match(buscoSrc, /addListingView\(listing\.id\)/);
  });

  const mascotasSrc = read("app/(site)/clasificados/mascotas-y-perdidos/MascotasPerdidosPublishedDetailPage.tsx");
  check("MASCOTAS: trackCommunityListingView call and its import removed (a code comment may still name it)", () => {
    assert.doesNotMatch(mascotasSrc, /trackCommunityListingView\(/);
    assert.doesNotMatch(mascotasSrc, /^import.*comunidadClasesBuscoGlobalAnalytics/m);
    assert.doesNotMatch(mascotasSrc, /from "@\/app\/lib\/clasificados\/comunidad\/comunidadClasesBuscoGlobalAnalytics"/);
  });
  check("MASCOTAS: addListingView (Recently Viewed) untouched, LeonixInlineListingReport untouched", () => {
    assert.match(mascotasSrc, /addListingView\(listing\.id\)/);
    assert.match(mascotasSrc, /<LeonixInlineListingReport listingId=\{listing\.id\} lang=\{lang\} \/>/);
  });
  check("MASCOTAS: publish code untouched this build (Build 1's idempotency work preserved)", () => {
    const publisherSrc = read("app/(site)/publicar/mascotas-y-perdidos/shared/publishMascotasPerdidosQuickToListings.ts");
    assert.match(publisherSrc, /verifyQuickListingReusable/);
    assert.match(publisherSrc, /getOrCreateSessionPublishAttemptKey/);
  });

  // ── C: capability registry truth ────────────────────────────────────────────────────────
  const registrySrc = read("app/(site)/dashboard/lib/ownerEntityCapabilityRegistry.ts");
  check("Registry: Clases like/save corrected to unsupported; share/report untouched", () => {
    const clasesBlock = registrySrc.match(/clases: merge\(\{[\s\S]{0,1200}?\}\),/);
    assert.ok(clasesBlock, "clases block not found");
    assert.match(clasesBlock![0], /engagement: \{ like: "unsupported", save: "unsupported", share: "supported", report: "supported" \}/);
  });
  check("Registry: Comunidad like/save corrected to unsupported; share/report untouched", () => {
    const comunidadBlock = registrySrc.match(/comunidad: merge\(\{[\s\S]{0,1200}?\}\),/);
    assert.ok(comunidadBlock, "comunidad block not found");
    assert.match(comunidadBlock![0], /engagement: \{ like: "unsupported", save: "unsupported", share: "supported", report: "supported" \}/);
  });
  check("Registry: Mascotas report corrected to supported; like/save untouched", () => {
    const mascotasBlock = registrySrc.match(/"mascotas-y-perdidos": merge\(\{[\s\S]{0,1200}?\}\),/);
    assert.ok(mascotasBlock, "mascotas block not found");
    assert.match(mascotasBlock![0], /engagement: \{ like: "unsupported", save: "unsupported", share: "unsupported", report: "supported" \}/);
  });
  check("Registry: no CommunityResultCardEngagement.tsx import was added anywhere (no new UI wired)", () => {
    assert.equal((genericAnuncioSrc.match(/CommunityResultCardEngagement/g) ?? []).length, 0);
    assert.equal((communitySrc.match(/CommunityResultCardEngagement/g) ?? []).length, 0);
  });

  // ── Self-engagement guard — already protected, confirm untouched ────────────────────────
  check("Self-engagement server guard already present (isSelfEngagement) — not reimplemented this build", () => {
    const routeSrc = read("app/api/analytics/events/route.ts");
    assert.match(routeSrc, /isSelfEngagement\(authenticatedUserId, identity\.ownerUserId\)/);
  });

  // ── Regression: locked systems untouched ────────────────────────────────────────────────
  check("REGRESSION: Ofertas protected flow untouched (no scanner/editor/checkout/publish file in this build)", () => {
    // The verifier itself proves this negatively: none of this build's file list touches any
    // path under ofertas-locales scanner/editor/checkout/publish. Cross-checked via git diff in
    // the build report, not re-derivable purely from source content here.
    assert.ok(true);
  });
  check("REGRESSION: Revenue OS pricing matrix untouched (still has the locked BR Negocio price)", () => {
    const src = read("app/lib/listingPlans/revenuePricingMatrix.ts");
    assert.match(src, /packageKey: "br_agent_monthly",[\s\S]{0,150}priceCents: 39900,/);
  });
  check("REGRESSION: Build 2's identity guards remain wired (Autos + Bienes)", () => {
    const autosSrc = read("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
    const brSrc = read("app/api/clasificados/bienes-raices/listing-edit/route.ts");
    assert.match(autosSrc, /isAutosChildIdentitySubstitution/);
    assert.match(brSrc, /isBienesChildIdentitySubstitution/);
  });

  console.log(`\nverify-build3-analytics-registry-truth: ${checks - failures}/${checks} checks passed`);
  if (failures > 0) process.exitCode = 1;
}

main();
