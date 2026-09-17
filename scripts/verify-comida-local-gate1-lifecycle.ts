/**
 * Gate COMIDA-LOCAL-1 verifier — behavioral proofs, not string matching.
 *
 * Run:  node node_modules/tsx/dist/cli.mjs scripts/verify-comida-local-gate1-lifecycle.ts
 *
 * Every assertion here executes the real shipped modules. Where a claim can only be made about
 * source (a route's DB call chain), the source is read with comments STRIPPED first, so a
 * sentence in a doc comment can never satisfy an assertion about code.
 */

import { readFileSync } from "node:fs";
import path from "node:path";

import { createEmptyComidaLocalDraft } from "../app/lib/clasificados/comida-local/createEmptyComidaLocalDraft";
import {
  mergeComidaLocalDraftFromStorage,
  sanitizeComidaLocalDraftForStorage,
} from "../app/lib/clasificados/comida-local/comidaLocalDraftPersistence";
import { mapComidaLocalDraftToPreviewVm } from "../app/lib/clasificados/comida-local/mapComidaLocalDraftToPreviewVm";
import {
  COMIDA_LOCAL_TEMPORARY_LOCATION_FRESH_MS,
  evaluateComidaLocalTemporaryLocationFreshness,
  formatComidaLocalTemporaryLocationFreshness,
  normalizeComidaLocalLocationUpdatedAt,
  readComidaLocalTemporaryLocationPayload,
  resolveComidaLocalTemporaryLocationStamp,
} from "../app/lib/clasificados/comida-local/comidaLocalTemporaryLocation";
import { resolveComidaLocalOwnerEditTargetStatus } from "../app/lib/clasificados/comida-local/comidaLocalOwnerEditStatusAuthority";
import { laneSuspensionSpecForCategory } from "../app/lib/listingPlans/subscriptionLifecyclePolicy";
import { buildComidaLocalWhatsAppHref, hasUsableComidaLocalWhatsApp } from "../app/lib/clasificados/comida-local/comidaLocalFormatting";
import { getComidaLocalCheckpointCard } from "../app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints";
import { formatRevenuePriceLabel, getRevenuePackagePriceCents } from "../app/lib/listingPlans/revenuePricingMatrix";
import { REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS } from "../app/lib/listingPlans/revenueActiveEntitlementGuard";
import type { ComidaLocalDraft } from "../app/lib/clasificados/comida-local/comidaLocalTypes";

const ROOT = path.resolve(__dirname, "..");

let passed = 0;
const failures: string[] = [];

function check(name: string, fn: () => void): void {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.log(`  FAIL  ${name} -> ${e instanceof Error ? e.message : String(e)}`);
  }
}

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function eq(actual: unknown, expected: unknown, message: string): void {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error(`${message} (got ${a}, expected ${b})`);
}

/** Read a source file with block and line comments removed. */
function stripComments(file: string): string {
  return readFileSync(path.join(ROOT, file), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const HOUR = 60 * 60 * 1000;

function draftWith(overrides: Partial<ComidaLocalDraft>): ComidaLocalDraft {
  return { ...createEmptyComidaLocalDraft(), ...overrides };
}

console.log("\nGate COMIDA-LOCAL-1 — Comida Local lifecycle verification\n");

/* ============================================================================================
 * 1. FIND ME TODAY — 24h freshness, read-time expiry, fail closed
 * ==========================================================================================*/

console.log("FIND ME TODAY");

check("24h window constant is exactly 24 hours", () => {
  eq(COMIDA_LOCAL_TEMPORARY_LOCATION_FRESH_MS, 24 * HOUR, "fresh window");
});

check("a location updated 2h ago is fresh and publicly visible", () => {
  const now = Date.parse("2026-09-09T12:00:00.000Z");
  const draft = draftWith({
    locationNote: "Hoy en la esquina de First y Santa Clara",
    locationUpdatedAt: new Date(now - 2 * HOUR).toISOString(),
  });
  const vm = mapComidaLocalDraftToPreviewVm(draft, "es", { viewer: "public", nowMs: now });
  eq(vm.temporaryLocation.state, "fresh", "state");
  assert(vm.temporaryLocation.publiclyVisible, "should be publicly visible");
  eq(vm.locationNote, "Hoy en la esquina de First y Santa Clara", "note rendered");
  eq(vm.temporaryLocation.freshnessLabel, "Actualizado hace 2 h", "es freshness label");
});

check("the English freshness label reads 'Updated 2h ago'", () => {
  const now = Date.parse("2026-09-09T12:00:00.000Z");
  const draft = draftWith({
    locationNote: "Today at First and Santa Clara",
    locationUpdatedAt: new Date(now - 2 * HOUR).toISOString(),
  });
  const vm = mapComidaLocalDraftToPreviewVm(draft, "en", { viewer: "public", nowMs: now });
  eq(vm.temporaryLocation.freshnessLabel, "Updated 2h ago", "en freshness label");
});

check("EXPIRED: a location 25h old disappears from the public read entirely", () => {
  const now = Date.parse("2026-09-09T12:00:00.000Z");
  const draft = draftWith({
    locationNote: "Ayer en el mercado",
    locationUrl: "https://maps.example.com/pin",
    locationUpdatedAt: new Date(now - 25 * HOUR).toISOString(),
  });
  const vm = mapComidaLocalDraftToPreviewVm(draft, "es", { viewer: "public", nowMs: now });
  eq(vm.temporaryLocation.state, "expired", "state");
  assert(!vm.temporaryLocation.publiclyVisible, "must not be publicly visible");
  eq(vm.locationNote, "", "note must be dropped");
  eq(vm.temporaryLocation.freshnessLabel, "", "no freshness claim for an expired location");
  assert(
    !vm.contactActions.some((a) => a.id === "location"),
    "the 'where I am today' link must expire with the note",
  );
  assert(
    !vm.sections.showLocationAvailability,
    "with nothing else in it, the Find Me Today section must not render at all",
  );
});

check("BOUNDARY: exactly 24h is still fresh, one ms past is expired", () => {
  const now = Date.parse("2026-09-09T12:00:00.000Z");
  const payload = { locationNote: "aqui", locationUrl: "" };
  eq(
    evaluateComidaLocalTemporaryLocationFreshness({
      payload,
      stamp: new Date(now - 24 * HOUR).toISOString(),
      nowMs: now,
    }).state,
    "fresh",
    "at exactly 24h",
  );
  eq(
    evaluateComidaLocalTemporaryLocationFreshness({
      payload,
      stamp: new Date(now - 24 * HOUR - 1).toISOString(),
      nowMs: now,
    }).state,
    "expired",
    "one ms past 24h",
  );
});

check("FAIL CLOSED: content with no stamp (legacy row) is never shown publicly", () => {
  const now = Date.parse("2026-09-09T12:00:00.000Z");
  const draft = draftWith({ locationNote: "Escrito hace semanas", locationUpdatedAt: "" });
  const vm = mapComidaLocalDraftToPreviewVm(draft, "es", { viewer: "public", nowMs: now });
  eq(vm.temporaryLocation.state, "unstamped", "state");
  eq(vm.locationNote, "", "unstamped content must not render publicly");
});

check("FAIL CLOSED: a garbage stamp is treated as unstamped, not as fresh", () => {
  const now = Date.parse("2026-09-09T12:00:00.000Z");
  for (const bad of ["not-a-date", "0000", "{}", " ", "13/45/2026"]) {
    const vm = mapComidaLocalDraftToPreviewVm(
      draftWith({ locationNote: "x", locationUpdatedAt: bad }),
      "es",
      { viewer: "public", nowMs: now },
    );
    eq(vm.locationNote, "", `garbage stamp ${JSON.stringify(bad)} must not render`);
  }
});

check("FAIL CLOSED: a far-future stamp cannot buy permanent freshness", () => {
  const now = Date.parse("2026-09-09T12:00:00.000Z");
  const vm = mapComidaLocalDraftToPreviewVm(
    draftWith({
      locationNote: "x",
      locationUpdatedAt: new Date(now + 400 * HOUR).toISOString(),
    }),
    "es",
    { viewer: "public", nowMs: now },
  );
  eq(vm.temporaryLocation.state, "unstamped", "future stamp");
  eq(vm.locationNote, "", "future-stamped content must not render");
});

check("DEFAULT IS PUBLIC: a call site that forgets `viewer` fails closed", () => {
  const now = Date.parse("2026-09-09T12:00:00.000Z");
  const draft = draftWith({
    locationNote: "stale",
    locationUpdatedAt: new Date(now - 72 * HOUR).toISOString(),
  });
  const vm = mapComidaLocalDraftToPreviewVm(draft, "es", { nowMs: now });
  eq(vm.locationNote, "", "default viewer must behave as public");
});

check("OWNER PREVIEW keeps draft truth but says it is not public", () => {
  const now = Date.parse("2026-09-09T12:00:00.000Z");
  const draft = draftWith({
    locationNote: "Ayer en el mercado",
    locationUpdatedAt: new Date(now - 30 * HOUR).toISOString(),
  });
  const vm = mapComidaLocalDraftToPreviewVm(draft, "es", { viewer: "owner", nowMs: now });
  eq(vm.locationNote, "Ayer en el mercado", "owner sees their own draft truth");
  assert(!vm.temporaryLocation.publiclyVisible, "but it is not public");
  assert(vm.temporaryLocation.ownerWarning.length > 0, "owner is told why");
  eq(vm.temporaryLocation.freshnessLabel, "", "an expired location claims no freshness");
});

check("OWNER PREVIEW of a brand-new draft is not warned about being unstamped", () => {
  const now = Date.parse("2026-09-09T12:00:00.000Z");
  const draft = draftWith({ locationNote: "Hoy en la plaza", locationUpdatedAt: "" });
  const newDraftVm = mapComidaLocalDraftToPreviewVm(draft, "es", { viewer: "owner", nowMs: now });
  eq(newDraftVm.temporaryLocation.ownerWarning, "", "no scary warning before first publish");
  const publishedVm = mapComidaLocalDraftToPreviewVm(draft, "es", {
    viewer: "owner",
    nowMs: now,
    ownerListingPublished: true,
  });
  assert(
    publishedVm.temporaryLocation.ownerWarning.length > 0,
    "an already-published unstamped row IS warned",
  );
});

/* ============================================================================================
 * 2. TIMESTAMP AUTHORITY — refresh on real change, preserve on unrelated edit
 * ==========================================================================================*/

console.log("\nTIMESTAMP AUTHORITY");

const OLD_STAMP = "2026-09-01T08:00:00.000Z";
const NOW_ISO = "2026-09-09T12:00:00.000Z";

check("UNRELATED EDIT preserves the stamp — no false refresh", () => {
  const previous = draftWith({
    businessName: "Tacos Lupita",
    locationNote: "Hoy en First St",
    locationUrl: "https://maps.example.com/a",
  });
  const next = { ...previous, businessName: "Tacos Lupita y Familia", queVendes: "Tacos" };
  const stamp = resolveComidaLocalTemporaryLocationStamp({
    previousPayload: readComidaLocalTemporaryLocationPayload(previous),
    previousStamp: OLD_STAMP,
    nextPayload: readComidaLocalTemporaryLocationPayload(next),
    nowIso: NOW_ISO,
  });
  eq(stamp, OLD_STAMP, "an unrelated edit must NOT refresh the stamp");
});

check("whitespace-only reformatting of the note is not a material change", () => {
  const stamp = resolveComidaLocalTemporaryLocationStamp({
    previousPayload: { locationNote: "Hoy en First St", locationUrl: "" },
    previousStamp: OLD_STAMP,
    nextPayload: { locationNote: "  Hoy   en First St  ", locationUrl: "" },
    nowIso: NOW_ISO,
  });
  eq(stamp, OLD_STAMP, "whitespace must not refresh the stamp");
});

check("changing the note DOES refresh the stamp", () => {
  const stamp = resolveComidaLocalTemporaryLocationStamp({
    previousPayload: { locationNote: "Hoy en First St", locationUrl: "" },
    previousStamp: OLD_STAMP,
    nextPayload: { locationNote: "Hoy en Alum Rock", locationUrl: "" },
    nowIso: NOW_ISO,
  });
  eq(stamp, NOW_ISO, "a real move must refresh the stamp");
});

check("changing only the location LINK also refreshes the stamp", () => {
  const stamp = resolveComidaLocalTemporaryLocationStamp({
    previousPayload: { locationNote: "Hoy en First St", locationUrl: "https://maps.example.com/a" },
    previousStamp: OLD_STAMP,
    nextPayload: { locationNote: "Hoy en First St", locationUrl: "https://maps.example.com/b" },
    nowIso: NOW_ISO,
  });
  eq(stamp, NOW_ISO, "the link is part of the temporary-location payload");
});

check("CLEARING the temporary location clears the stamp", () => {
  const stamp = resolveComidaLocalTemporaryLocationStamp({
    previousPayload: { locationNote: "Hoy en First St", locationUrl: "https://maps.example.com/a" },
    previousStamp: OLD_STAMP,
    nextPayload: { locationNote: "   ", locationUrl: "" },
    nowIso: NOW_ISO,
  });
  eq(stamp, "", "a cleared location has no freshness to claim");
});

check("a first save stamps now", () => {
  const stamp = resolveComidaLocalTemporaryLocationStamp({
    previousPayload: null,
    previousStamp: "",
    nextPayload: { locationNote: "Hoy en la plaza", locationUrl: "" },
    nowIso: NOW_ISO,
  });
  eq(stamp, NOW_ISO, "first save");
});

check("an unchanged legacy payload does NOT get a stamp invented for it", () => {
  const stamp = resolveComidaLocalTemporaryLocationStamp({
    previousPayload: { locationNote: "Escrito hace semanas", locationUrl: "" },
    previousStamp: "",
    nextPayload: { locationNote: "Escrito hace semanas", locationUrl: "" },
    nowIso: NOW_ISO,
  });
  eq(stamp, "", "we refuse to fabricate a time we do not know");
});

check("the publish route derives the stamp from the STORED row, never the request body", () => {
  const src = stripComments("app/api/clasificados/comida-local/publish/route.ts");
  assert(
    /select\([^)]*listing_json/.test(src),
    "route must read listing_json to know the previous temporary-location payload",
  );
  assert(
    src.includes("resolveComidaLocalTemporaryLocationStamp"),
    "route must use the stamp authority",
  );
  assert(
    /previousPayload:\s*previousJson/.test(src),
    "the previous payload must come from the stored row",
  );
  assert(
    /locationUpdatedAt:\s*resolveComidaLocalTemporaryLocationStamp/.test(src),
    "the persisted draft must carry the server-decided stamp",
  );
});

check("the freshness label buckets read naturally", () => {
  eq(formatComidaLocalTemporaryLocationFreshness(30 * 1000, "es"), "Actualizado hace un momento", "es <1m");
  eq(formatComidaLocalTemporaryLocationFreshness(30 * 1000, "en"), "Updated just now", "en <1m");
  eq(formatComidaLocalTemporaryLocationFreshness(45 * 60 * 1000, "es"), "Actualizado hace 45 min", "es 45m");
  eq(formatComidaLocalTemporaryLocationFreshness(45 * 60 * 1000, "en"), "Updated 45m ago", "en 45m");
  eq(formatComidaLocalTemporaryLocationFreshness(23 * HOUR, "en"), "Updated 23h ago", "en 23h");
});

/* ============================================================================================
 * 3. HOME-ADDRESS SEPARATION
 * ==========================================================================================*/

console.log("\nHOME-ADDRESS SEPARATION");

check("a private home address never leaks into Find Me Today", () => {
  const now = Date.parse("2026-09-09T12:00:00.000Z");
  const draft = draftWith({
    businessAddressLine: "1234 Private Home Way, San Jose CA",
    showAddressPublicly: false,
    locationNote: "Hoy en la plaza",
    locationUpdatedAt: new Date(now - 1 * HOUR).toISOString(),
  });
  const vm = mapComidaLocalDraftToPreviewVm(draft, "es", { viewer: "public", nowMs: now });
  eq(vm.businessAddressLine, "", "private address must not be exposed");
  assert(!vm.sections.showBusinessAddress, "address section must stay hidden");
  assert(
    !vm.locationNote.includes("Private Home Way"),
    "the temporary location must never be populated from the private address",
  );
});

check("expiring the temporary location does not touch the permanent address", () => {
  const now = Date.parse("2026-09-09T12:00:00.000Z");
  const draft = draftWith({
    businessAddressLine: "500 Market St, San Jose CA",
    showAddressPublicly: true,
    locationNote: "Ayer en el mercado",
    locationUpdatedAt: new Date(now - 48 * HOUR).toISOString(),
  });
  const vm = mapComidaLocalDraftToPreviewVm(draft, "es", { viewer: "public", nowMs: now });
  eq(vm.locationNote, "", "temporary location expired");
  eq(vm.businessAddressLine, "500 Market St, San Jose CA", "opted-in permanent address is unaffected");
});

check("standing availability is not temporary and does not expire", () => {
  const now = Date.parse("2026-09-09T12:00:00.000Z");
  const draft = draftWith({
    availabilityNote: "Solo fines de semana",
    locationNote: "Ayer en el mercado",
    locationUpdatedAt: new Date(now - 48 * HOUR).toISOString(),
  });
  const vm = mapComidaLocalDraftToPreviewVm(draft, "es", { viewer: "public", nowMs: now });
  eq(vm.locationNote, "", "temporary location expired");
  eq(vm.availabilityNote, "Solo fines de semana", "standing availability survives");
  assert(vm.sections.showLocationAvailability, "the section still renders for the standing note");
});

check("the address-privacy default is still private", () => {
  eq(createEmptyComidaLocalDraft().showAddressPublicly, false, "private by default");
});

/* ============================================================================================
 * 4. HYDRATION ROUND-TRIP (the allowlist hazard)
 * ==========================================================================================*/

console.log("\nHYDRATION ROUND-TRIP");

check("EVERY draft field round-trips through the storage merge allowlist", () => {
  // A distinctive, type-correct value for every key of ComidaLocalDraft. If a field is missing
  // from `mergeComidaLocalDraftFromStorage` it is rebuilt from the empty draft and this fails.
  const probe: ComidaLocalDraft = {
    draftListingId: "11111111-2222-3333-4444-555555555555",
    businessName: "Tacos Lupita",
    foodType: "tacos",
    foodTypeCustom: "birria",
    businessType: "food_truck",
    businessTypeCustom: "legacy-scalar",
    businessTypeCustomValues: ["carrito"],
    cityCanonical: "san-jose",
    cityDisplay: "San Jose",
    zoneNote: "Zona Este",
    primaryContactChoice: "whatsapp",
    phone: "(408) 555-1234",
    whatsapp: "(408) 555-9876",
    email: "lupita@example.com",
    queVendes: "Tacos de birria hechos al momento todos los dias.",
    instagramUrl: "https://instagram.com/tacoslupita",
    facebookUrl: "https://facebook.com/tacoslupita",
    tiktokUrl: "https://tiktok.com/@tacoslupita",
    locationNote: "Hoy en First y Santa Clara",
    locationUrl: "https://maps.example.com/pin",
    locationUpdatedAt: "2026-09-09T10:00:00.000Z",
    mobileOrderLinkUrl: "https://order.example.com",
    eventScheduleNote: "Sabado en la feria",
    cateringServiceRadiusNote: "20 millas",
    cateringEventInfoNote: "Minimo 30 personas",
    mealPrepScheduleNote: "Entregas los lunes",
    mealPrepOrderUrl: "https://mealprep.example.com",
    availabilityNote: "Fines de semana",
    weeklyHours: { monday: { closed: false, openTime: "09:00", closeTime: "17:00" } },
    serviceOptions: ["pickup", "delivery"],
    serviceOptionOtherCustom: "legacy-service",
    serviceOptionOtherCustomValues: ["a domicilio"],
    businessAddressLine: "500 Market St",
    showAddressPublicly: true,
    paymentMethods: ["cash", "venmo"],
    paymentOtherNote: "Zelle familiar",
    priceLevel: "2",
    languages: ["es", "bilingual"],
    customLanguages: ["mixteco"],
    highlights: ["hecho_en_casa", "halal"],
    highlightsOtherCustom: "legacy-highlight",
    highlightsOtherCustomValues: ["receta de la abuela"],
    additionalWebsites: [{ label: "Menu", url: "https://menu.example.com" }],
    mainPhoto: {
      id: "img-main",
      role: "main",
      url: "https://cdn.example.com/main.jpg",
      storagePath: "comida/main.jpg",
      fileName: "main.jpg",
      contentType: "image/jpeg",
      sizeBytes: 1234,
      uploadedAt: "2026-09-01T00:00:00.000Z",
    },
    logoImage: {
      id: "img-logo",
      role: "logo",
      url: "https://cdn.example.com/logo.jpg",
      storagePath: "comida/logo.jpg",
      fileName: "logo.jpg",
      contentType: "image/jpeg",
      sizeBytes: 456,
      uploadedAt: "2026-09-01T00:00:00.000Z",
    },
    galleryImages: [
      {
        id: "img-g1",
        role: "gallery",
        url: "https://cdn.example.com/g1.jpg",
        storagePath: "comida/g1.jpg",
        fileName: "g1.jpg",
        contentType: "image/jpeg",
        sizeBytes: 789,
        uploadedAt: "2026-09-01T00:00:00.000Z",
      },
    ],
  };

  const empty = createEmptyComidaLocalDraft();
  const round = mergeComidaLocalDraftFromStorage(JSON.parse(JSON.stringify(probe)));

  const lost: string[] = [];
  for (const key of Object.keys(empty) as (keyof ComidaLocalDraft)[]) {
    const before = JSON.stringify(probe[key]);
    const after = JSON.stringify(round[key]);
    if (before !== after) lost.push(`${String(key)}: ${before} -> ${after}`);
  }
  assert(lost.length === 0, `fields did not survive the allowlist merge:\n    ${lost.join("\n    ")}`);
});

check("the probe covers every field the empty draft declares (no silent blind spot)", () => {
  const empty = createEmptyComidaLocalDraft();
  assert(
    Object.keys(empty).includes("locationUpdatedAt"),
    "the new Find Me Today field must exist on the empty draft",
  );
  // 46 = the 45 pre-gate fields + locationUpdatedAt. A field added later without extending the
  // round-trip probe above trips this.
  eq(Object.keys(empty).length, 46, "draft field count");
});

check("the autosave sanitizer preserves the stamp (it runs on EVERY save)", () => {
  const draft = draftWith({
    locationNote: "Hoy en la plaza",
    locationUpdatedAt: "2026-09-09T10:00:00.000Z",
  });
  eq(
    sanitizeComidaLocalDraftForStorage(draft).locationUpdatedAt,
    "2026-09-09T10:00:00.000Z",
    "autosave must not wipe the stamp",
  );
});

check("an unparseable stored stamp normalizes to empty rather than propagating", () => {
  eq(normalizeComidaLocalLocationUpdatedAt("garbage"), "", "garbage");
  eq(normalizeComidaLocalLocationUpdatedAt(null), "", "null");
  eq(normalizeComidaLocalLocationUpdatedAt(12345), "", "number");
  eq(
    normalizeComidaLocalLocationUpdatedAt("2026-09-09T10:00:00Z"),
    "2026-09-09T10:00:00.000Z",
    "valid ISO is canonicalized",
  );
});

/* ============================================================================================
 * 5. SAME-ROW STATUS SAFETY
 * ==========================================================================================*/

console.log("\nSAME-ROW STATUS SAFETY");

check("an owner edit always targets the row's own status", () => {
  for (const s of ["published", "pending_payment", "paused", "suspended", "draft"]) {
    const d = resolveComidaLocalOwnerEditTargetStatus(s);
    assert(d.ok, `${s} must be accepted`);
    eq(d.targetStatus, s, `${s} preserved`);
  }
});

check("NULL / legacy / unknown status FAILS CLOSED — never promoted to published", () => {
  for (const s of [null, undefined, "", "   ", "PUBLISHED_PENDING", "active", "live"]) {
    const d = resolveComidaLocalOwnerEditTargetStatus(s as string | null | undefined);
    assert(!d.ok, `${JSON.stringify(s)} must be rejected, not defaulted to published`);
  }
});

check("the authority cannot be told to publish (no activationMode parameter exists)", () => {
  eq(resolveComidaLocalOwnerEditTargetStatus.length, 1, "exactly one parameter");
});

check("the publish route compare-and-sets on status AND the canonical draft_listing_id", () => {
  const src = stripComments("app/api/clasificados/comida-local/publish/route.ts");
  assert(
    src.includes("resolveComidaLocalOwnerEditTargetStatus"),
    "route must use the status authority",
  );
  assert(
    !/\?\?\s*"published"/.test(src),
    "the `?? \"published\"` escalation must be gone from the route",
  );
  const updateBlock = src.slice(src.indexOf(".update(updatePayload)"));
  assert(
    /\.eq\("draft_listing_id", draftListingId\)/.test(updateBlock),
    "same-row identity: update must key on the canonical draft_listing_id",
  );
  assert(
    /\.eq\("status", targetStatus\)/.test(updateBlock),
    "compare-and-set: update must pin the status it decided to preserve",
  );
  assert(
    /if \(!updatedRows\?\.length\)/.test(updateBlock),
    "a zero-row update must be reported, never claimed as success",
  );
});

check("the edit context still forces the row's own draft_listing_id", () => {
  const src = stripComments("app/lib/clasificados/comida-local/comidaLocalListingEditContext.ts");
  assert(src.includes("draft_listing_id"), "edit context still binds to the row's column");
});

/* ============================================================================================
 * 6. MEDIA / LANE / PRICE / NO-RECHARGE / WHATSAPP
 * ==========================================================================================*/

console.log("\nMEDIA");

check("the publish parse warns through the SHARED helper and carries the dropped list out", () => {
  const src = stripComments("app/lib/clasificados/comida-local/comidaLocalPublishValidation.ts");
  assert(
    src.includes("warnDroppedUnpersistableMedia(\"comida-local-publish\""),
    "shared warn helper must be called with a category context",
  );
  assert(
    src.includes("droppedUnpersistableMedia:"),
    "the dropped list must leave the parse boundary",
  );
  assert(
    !src.includes("function buildProposedFinalMediaSet"),
    "no local re-implementation of the media engine",
  );
});

check("both publish responses return the dropped list to the owner", () => {
  const src = stripComments("app/api/clasificados/comida-local/publish/route.ts");
  const hits = src.match(/droppedUnpersistableMedia\.length \? \{ droppedUnpersistableMedia \}/g) ?? [];
  assert(hits.length === 2, `expected the update AND insert responses to report it, saw ${hits.length}`);
});

check("both owner surfaces render the media notice", () => {
  const preview = stripComments("app/(site)/clasificados/comida-local/preview/ComidaLocalPreviewClient.tsx");
  assert(preview.includes("droppedUnpersistableMedia"), "checkout path reads it");
  assert(preview.includes("mediaDroppedNote"), "checkout path renders a note");
  const application = stripComments("app/(site)/publicar/comida-local/ComidaLocalApplicationClient.tsx");
  assert(application.includes("droppedUnpersistableMedia"), "republish path reads it");
  assert(application.includes("droppedMediaCount"), "republish path renders a note");
});

console.log("\nSUBSCRIPTION LIFECYCLE LANE");

check("comida-local is registered with its real table and status vocabulary", () => {
  const spec = laneSuspensionSpecForCategory("comida-local");
  assert(spec, "lane must be registered");
  eq(spec!.table, "comida_local_public_listings", "table");
  eq(spec!.statusColumn, "status", "status column");
  eq(spec!.visibleStatuses, ["published"], "only published is publicly visible");
  eq(spec!.suspendedValue, "suspended", "suspended value from the table's own CHECK");
});

check("the lane's status vocabulary matches the table CHECK constraint", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260604120000_comida_local_public_listings.sql"),
    "utf8",
  );
  const spec = laneSuspensionSpecForCategory("comida-local")!;
  assert(
    sql.includes(`'${spec.suspendedValue}'`),
    "suspendedValue must already exist in the table's status CHECK — nothing invented",
  );
  for (const s of spec.visibleStatuses) {
    assert(sql.includes(`'${s}'`), `visible status ${s} must exist in the CHECK`);
  }
});

check("owner-paused is deliberately NOT a payment-suspendable state", () => {
  const spec = laneSuspensionSpecForCategory("comida-local")!;
  assert(
    !spec.visibleStatuses.includes("paused"),
    "the payment engine must never overwrite an owner's pause",
  );
});

check("the suspended_reason column the engine writes is shipped", () => {
  const sql = readFileSync(
    path.join(ROOT, "supabase/migrations/20260909120000_comida_local_listing_suspended_reason.sql"),
    "utf8",
  );
  assert(/comida_local_public_listings/.test(sql), "targets the right table");
  assert(/suspended_reason/.test(sql), "adds suspended_reason");
});

console.log("\n$129 PRICE TRUTH + NO-RECHARGE");

check("the matrix is still the single price authority at $129/month", () => {
  const { priceCents } = getRevenuePackagePriceCents({
    category: "comida-local",
    packageKey: "comida_local_base_monthly",
  });
  eq(priceCents, 12900, "matrix price");
});

check("ES checkpoint says /mes and EN says /month, both matrix-derived", () => {
  const es = getComidaLocalCheckpointCard("es", "/publicar/comida-local");
  const en = getComidaLocalCheckpointCard("en", "/publicar/comida-local");
  // The amount itself is whatever `formatRevenuePriceLabel` renders from the matrix cents —
  // asserted against the matrix, never against a hardcoded literal, so this test can never
  // become the thing that pins a stale price.
  const { priceCents } = getRevenuePackagePriceCents({
    category: "comida-local",
    packageKey: "comida_local_base_monthly",
  });
  const amount = formatRevenuePriceLabel(priceCents!);
  eq(es.priceLabel, `${amount}/mes`, "es cadence");
  eq(en.priceLabel, `${amount}/month`, "en cadence");
  assert(amount.includes("129"), "the rendered amount must still be the $129 the matrix holds");
  assert(!en.priceLabel.includes("/mes"), "the English checkpoint must not say /mes");
  assert(en.modalTitle.includes(`${amount}/month`), "the modal title carries the same corrected label");
});

check("no monthly checkpoint in ANY category renders a Spanish cadence in English", () => {
  const src = stripComments("app/(site)/clasificados/publicar/_lib/categoryPublishCheckpoints.ts");
  const monthly = src.slice(src.indexOf("function monthlyPrice"), src.indexOf("function oneTimePrice"));
  assert(
    monthly.includes('lang === "en" ? "/month" : "/mes"'),
    "the shared monthly formatter must be language-aware",
  );
  assert(
    !/monthlyPrice\("[a-z_]+", "[a-z-]+"\)/.test(src),
    "every monthlyPrice call site must pass lang",
  );
});

check("the no-recharge guard still covers the Comida Local package", () => {
  assert(
    REVENUE_BASE_ENTITLEMENT_GUARD_PACKAGE_KEYS.has("comida_local_base_monthly"),
    "an active entitlement must block a second charge",
  );
});

console.log("\nWHATSAPP");

check("a bare US 10-digit number now gets its country code", () => {
  eq(
    buildComidaLocalWhatsAppHref("(408) 555-1234", ""),
    `https://wa.me/14085551234?text=${encodeURIComponent(
      "Hola, vi tu puesto de comida en Leonix Media. Me gustaría recibir más información, por favor.",
    )}`,
    "US number must resolve to a real wa.me link",
  );
});

check("an international number is passed through with its own country code intact", () => {
  const href = buildComidaLocalWhatsAppHref("+52 55 1234 5678", "Tacos Lupita");
  assert(href.startsWith("https://wa.me/525512345678?"), `unexpected href: ${href}`);
});

check("junk and out-of-range numbers produce NO WhatsApp action", () => {
  for (const bad of ["", "123", "abc", "1234567", "1234567890123456789"]) {
    eq(buildComidaLocalWhatsAppHref(bad, ""), "", `must reject ${JSON.stringify(bad)}`);
    assert(!hasUsableComidaLocalWhatsApp(bad), `eligibility must reject ${JSON.stringify(bad)}`);
  }
});

check("validation and rendering agree on WhatsApp eligibility", () => {
  const now = Date.parse("2026-09-09T12:00:00.000Z");
  for (const value of ["(408) 555-1234", "+52 55 1234 5678", "123", "", "55512345"]) {
    const vm = mapComidaLocalDraftToPreviewVm(draftWith({ whatsapp: value }), "es", {
      viewer: "public",
      nowMs: now,
    });
    const rendered = vm.contactActions.some((a) => a.id === "whatsapp");
    eq(
      rendered,
      hasUsableComidaLocalWhatsApp(value),
      `render/validation disagreement for ${JSON.stringify(value)}`,
    );
  }
});

check("the primary phone field is untouched by the WhatsApp change", () => {
  const now = Date.parse("2026-09-09T12:00:00.000Z");
  const vm = mapComidaLocalDraftToPreviewVm(draftWith({ phone: "(408) 555-1234" }), "es", {
    viewer: "public",
    nowMs: now,
  });
  const call = vm.contactActions.find((a) => a.id === "call");
  assert(call, "call action must still render");
  eq(call!.href, "tel:+14085551234", "US-formatted tel href unchanged");
});

/* ==========================================================================================*/

console.log(
  `\n${failures.length === 0 ? "ALL CHECKS PASSED" : "FAILURES"} — ${passed} passed, ${failures.length} failed\n`,
);
if (failures.length > 0) {
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
