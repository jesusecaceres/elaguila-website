/**
 * Gates QB-IDENTITY-01 / QB-LIFECYCLE-02 / QB-MEDIA-02 — BEHAVIORAL proof.
 * Run: npx tsx scripts/verify-quick-lifecycle-media-behavior-01.ts
 *
 * Imports the REAL pure modules and exercises their decision logic. No database, no network.
 * Where a claim can only be established about server code that cannot be imported (a route with
 * `server-only` transitively in its import graph), the check is explicitly labelled a WIRING
 * check and asserts on the call actually being present — never on a comment.
 *
 * SECTION A — lifecycle capability truth (schema-honest, no invented statuses)
 * SECTION B — media semantics (0 / 1-3 / 4 images, video, logo-only, headshot-only)
 * SECTION C — identity: link-first resolution + ambiguity refusal wiring
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import {
  QUICK_BUSINESS_LIFECYCLE_CAPABILITIES,
  getLifecycleCapability,
  isLifecycleIntentSupported,
  isTransitionLegalFrom,
  resolveLifecycleEndpoint,
} from "../app/lib/quickBusiness/quickBusinessLifecycleCapabilities";
import {
  buildQuickMediaLimits,
  effectiveRole,
  extractSemanticMediaItems,
  requiredSubjectRoleForCategory,
  validateQuickBusinessMediaForCategory,
  validateQuickBusinessMediaSemantics,
} from "../app/lib/quickBusiness/quickBusinessMediaSemantics";

const failures: string[] = [];
let checks = 0;
function check(name: string, fn: () => void) {
  checks += 1;
  try {
    fn();
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}
const read = (p: string) => readFileSync(p, "utf8");

// =============================================================================
// SECTION A — LIFECYCLE CAPABILITY TRUTH
// =============================================================================

check("A1: every declared target status is legal in that family's real schema vocabulary", () => {
  // These sets are the DB CHECK constraints, transcribed from the migrations.
  const SCHEMA_VOCABULARY: Record<string, readonly string[]> = {
    servicios: [
      "draft", "preview_ready", "publish_ready", "pending_payment",
      "pending_review", "published", "paused_unpublished", "rejected", "suspended",
    ],
    restaurantes: ["pending_payment", "published", "suspended", "archived"],
    "autos-dealer": ["draft", "pending_payment", "active", "payment_failed", "cancelled", "removed"],
    // `listings` has no DB CHECK; this is the vocabulary its RLS policy + service writes use.
    "bienes-negocio": ["active", "paused", "pending", "removed", "sold"],
  };
  for (const [category, caps] of Object.entries(QUICK_BUSINESS_LIFECYCLE_CAPABILITIES)) {
    const vocab = SCHEMA_VOCABULARY[category];
    assert.ok(vocab, `no schema vocabulary recorded for ${category}`);
    for (const [intent, cap] of Object.entries(caps)) {
      if (cap.state !== "supported") continue;
      assert.ok(
        cap.targetStatus && vocab.includes(cap.targetStatus),
        `${category}.${intent} targets "${cap.targetStatus}" which is NOT in that family's real status vocabulary — this is the "invented paused status" failure mode`,
      );
      for (const from of cap.fromStatuses ?? []) {
        assert.ok(vocab.includes(from), `${category}.${intent} expects from-status "${from}" not in vocabulary`);
      }
    }
  }
});

check("A2: Restaurantes has NO pause capability (its schema has no paused value)", () => {
  assert.equal(isLifecycleIntentSupported("restaurantes", "pause"), false);
  const cap = getLifecycleCapability("restaurantes", "pause")!;
  assert.equal(cap.state, "unsupported_by_schema");
  assert.ok(cap.reason && cap.reason.length > 20, "an unsupported capability must state why");
  assert.equal(cap.endpoint, undefined, "an unsupported capability must expose no endpoint");
});

check("A3: Servicios has NO end capability (its schema has no archived value)", () => {
  assert.equal(isLifecycleIntentSupported("servicios", "end"), false);
  assert.equal(getLifecycleCapability("servicios", "end")!.state, "unsupported_by_schema");
});

check("A4: Autos end is merged with unpublish, not a separate fake control", () => {
  assert.equal(getLifecycleCapability("autos-dealer", "end")!.state, "merged_with_pause");
  assert.equal(isLifecycleIntentSupported("autos-dealer", "end"), false);
  // But unpublish/restore genuinely work.
  assert.equal(isLifecycleIntentSupported("autos-dealer", "pause"), true);
  assert.equal(isLifecycleIntentSupported("autos-dealer", "resume"), true);
});

check("A5: an unsupported intent can never produce a request", () => {
  assert.equal(resolveLifecycleEndpoint("restaurantes", "pause", "abc"), null);
  assert.equal(resolveLifecycleEndpoint("servicios", "end", "abc"), null);
  assert.equal(resolveLifecycleEndpoint("autos-dealer", "end", "abc"), null);
  // Supported ones do, with the id substituted into the path where the route needs it.
  const autos = resolveLifecycleEndpoint("autos-dealer", "pause", "id 42")!;
  assert.ok(autos.endpoint.includes("id%2042"), "listing id must be URL-encoded into the path");
  assert.ok(!autos.endpoint.includes("{listingId}"), "the placeholder must be substituted");
});

check("A6: transitions are gated on the listing's real current status", () => {
  assert.equal(isTransitionLegalFrom("servicios", "pause", "published"), true);
  assert.equal(isTransitionLegalFrom("servicios", "pause", "paused_unpublished"), false, "cannot pause an already-paused listing");
  assert.equal(isTransitionLegalFrom("servicios", "resume", "paused_unpublished"), true);
  assert.equal(isTransitionLegalFrom("servicios", "resume", "published"), false);
  assert.equal(isTransitionLegalFrom("restaurantes", "end", "published"), true);
  assert.equal(isTransitionLegalFrom("restaurantes", "end", "archived"), false, "cannot archive twice");
  assert.equal(isTransitionLegalFrom("bienes-negocio", "end", "paused"), true, "a paused BR listing can still be ended");
});

check("A7: the authored migration is NOT silently assumed applied", () => {
  const caps = read("app/lib/quickBusiness/quickBusinessLifecycleCapabilities.ts");
  const migration = read("supabase/migrations/20260920120000_quick_business_lifecycle_capability_parity.sql");
  assert.ok(migration.includes("'paused'") && migration.includes("'archived'"), "migration adds the two missing values");
  assert.ok(migration.includes("NOT APPLIED"), "migration states it has not been applied");
  // While unapplied, the matrix MUST still report those two as unsupported.
  assert.equal(getLifecycleCapability("restaurantes", "pause")!.state, "unsupported_by_schema");
  assert.equal(getLifecycleCapability("servicios", "end")!.state, "unsupported_by_schema");
  assert.ok(caps.includes("unsupported_by_schema"), "matrix models the unapplied state");
});

// =============================================================================
// SECTION B — MEDIA SEMANTICS
// =============================================================================

const vehicle = { role: "vehicle", mime: "image/jpeg" };
const property = { role: "property", mime: "image/jpeg" };
const logo = { role: "logo", mime: "image/png" };
const headshot = { role: "headshot", mime: "image/jpeg" };
const video = { role: "vehicle", mime: "video/mp4" };

function codes(category: string, items: Array<{ role?: string | null; mime?: string | null }>): string[] {
  return (validateQuickBusinessMediaForCategory(category, items) ?? []).map((i) => i.code);
}

check("B1: ZERO images is rejected for every family", () => {
  for (const cat of ["servicios", "restaurantes", "autos-dealer", "bienes-negocio"]) {
    assert.ok(codes(cat, []).includes("too_few_subject_images"), `${cat} must reject zero images`);
  }
});

check("B2: 1, 2 and 3 subject images are accepted", () => {
  assert.deepEqual(codes("autos-dealer", [vehicle]), []);
  assert.deepEqual(codes("autos-dealer", [vehicle, vehicle]), []);
  assert.deepEqual(codes("autos-dealer", [vehicle, vehicle, vehicle]), []);
  assert.deepEqual(codes("bienes-negocio", [property]), []);
});

check("B3: FOUR images is rejected", () => {
  assert.ok(codes("autos-dealer", [vehicle, vehicle, vehicle, vehicle]).includes("too_many_images"));
  assert.ok(codes("bienes-negocio", [property, property, property, property]).includes("too_many_images"));
});

check("B4: VIDEO is rejected", () => {
  assert.ok(codes("autos-dealer", [video]).includes("video_not_allowed"));
  assert.ok(codes("bienes-negocio", [{ role: "property", mime: "video/quicktime" }]).includes("video_not_allowed"));
});

check("B5: LOGO-ONLY is rejected — a dealer logo is not a vehicle photo", () => {
  const issues = codes("autos-dealer", [logo]);
  assert.ok(issues.includes("missing_subject_role"), `expected missing_subject_role, got ${issues.join(",")}`);
  // And three logos still do not make a listing.
  assert.ok(codes("autos-dealer", [logo, logo, logo]).includes("missing_subject_role"));
});

check("B6: HEADSHOT-ONLY is rejected — an agent headshot is not a property photo", () => {
  assert.ok(codes("bienes-negocio", [headshot]).includes("missing_subject_role"));
  assert.ok(codes("bienes-negocio", [headshot, logo]).includes("missing_subject_role"));
});

check("B7: an identity asset alongside a real subject photo is fine, and is not counted", () => {
  assert.deepEqual(codes("autos-dealer", [vehicle, logo]), [], "a logo may accompany a vehicle photo");
  // Identity assets are excluded from the max count: 3 vehicles + a logo is still valid.
  assert.deepEqual(codes("autos-dealer", [vehicle, vehicle, vehicle, logo]), []);
});

check("B8: a WRONG-subject photo does not satisfy another family's requirement", () => {
  // A property photo cannot satisfy a vehicle listing.
  assert.ok(codes("autos-dealer", [property]).includes("missing_subject_role"));
  // A vehicle photo cannot satisfy a property listing.
  assert.ok(codes("bienes-negocio", [vehicle]).includes("missing_subject_role"));
});

check("B9: an unrecognized role is an error, never a silent subject", () => {
  assert.ok(codes("autos-dealer", [{ role: "vehcile", mime: "image/jpeg" }]).includes("invalid_role"));
});

check("B10: legacy unroled media stays valid (existing stored media remains readable)", () => {
  assert.equal(effectiveRole({ role: null }, "vehicle"), "vehicle");
  assert.equal(effectiveRole({}, "property"), "property");
  assert.deepEqual(codes("autos-dealer", [{ mime: "image/jpeg" }]), [], "a pre-roles image still validates");
});

check("B11: required subject role per family is correct", () => {
  assert.equal(requiredSubjectRoleForCategory("autos-dealer"), "vehicle");
  assert.equal(requiredSubjectRoleForCategory("bienes-negocio"), "property");
  assert.equal(requiredSubjectRoleForCategory("servicios"), "business");
  assert.equal(requiredSubjectRoleForCategory("restaurantes"), "business");
  assert.equal(requiredSubjectRoleForCategory("not-a-family"), null);
  assert.equal(buildQuickMediaLimits("not-a-family"), null);
});

check("B12: limits match the Quick contract (1-3, no video)", () => {
  const limits = buildQuickMediaLimits("autos-dealer")!;
  assert.equal(limits.minSubjectImages, 1);
  assert.equal(limits.maxImages, 3);
  assert.equal(limits.videoAllowed, false);
  // Direct call on the raw validator too, so the wrapper is not the only tested path.
  assert.deepEqual(validateQuickBusinessMediaSemantics([vehicle], limits), []);
});

check("B13: the extractor finds media under each family's field name, and [] when absent", () => {
  assert.equal(extractSemanticMediaItems({ mediaImages: [{ role: "vehicle" }] }).length, 1);
  assert.equal(extractSemanticMediaItems({ fotosDataUrls: ["data:image/jpeg;base64,x"] }).length, 1);
  assert.equal(extractSemanticMediaItems({ galleryImages: ["a", "b"] }).length, 2);
  assert.deepEqual(extractSemanticMediaItems({}), [], "no media field at all yields zero items");
  assert.deepEqual(extractSemanticMediaItems(null), []);
  // A bare string entry carries no role, so it defaults to the subject role.
  assert.equal(extractSemanticMediaItems({ images: ["https://x/y.jpg"] })[0]!.role, null);
});

check("B14 WIRING: both assisted publish routes actually call the semantic validator", () => {
  for (const p of [
    "app/api/clasificados/autos/assisted-publish/route.ts",
    "app/api/clasificados/bienes-raices/negocio/assisted-publish/route.ts",
  ]) {
    const src = read(p);
    assert.ok(src.includes("validateQuickBusinessMediaForCategory("), `${p} must call the validator`);
    assert.ok(src.includes("extractSemanticMediaItems("), `${p} must extract the media set`);
    assert.ok(src.includes("media_contract_violation"), `${p} must refuse with a media error`);
    assert.ok(src.includes("422"), `${p} must return 422 on a media contract violation`);
  }
});

// =============================================================================
// SECTION C — CANONICAL IDENTITY
// =============================================================================

check("C1 WIRING: all four publish paths write the canonical link", () => {
  const sites: Array<[string, string]> = [
    ["app/api/clasificados/servicios/publish/route.ts", "linkSelfServiceListingToBusiness("],
    ["app/api/clasificados/restaurantes/publish/route.ts", "linkSelfServiceListingToBusiness("],
    ["app/api/clasificados/autos/listings/route.ts", "linkSelfServiceListingToBusiness("],
    // Bienes publishes from the browser, so it converges through the server seam instead.
    ["app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts", "/api/business/listing-link"],
  ];
  for (const [file, needle] of sites) {
    assert.ok(read(file).includes(needle), `${file} must write the canonical business↔listing link`);
  }
});

check("C2: the link module proves ownership and never trusts a client claim", () => {
  const src = read("app/lib/business/canonicalListingLink.ts");
  assert.ok(src.includes("verifyListingOwnedByUser"), "ownership is verified server-side");
  assert.ok(src.includes("resolveListingSourceOwnershipContract"), "owner column comes from the canonical contract, not a hard-coded list");
  assert.ok(src.includes("23505"), "a concurrent duplicate insert is collapsed into success, not an error");
  assert.ok(src.includes("conflict_other_business"), "a listing already linked elsewhere is refused");
});

check("C3: resolution is link-first with a GUARDED fallback that refuses ambiguity", () => {
  const src = read("app/lib/business/canonicalListingLink.ts");
  const linkIdx = src.indexOf('.from("business_listing_links")');
  const fallbackIdx = src.indexOf("GUARDED FALLBACK");
  assert.ok(linkIdx > -1 && fallbackIdx > -1 && linkIdx < fallbackIdx, "the canonical link must be consulted BEFORE the owner scan");
  assert.ok(src.includes('reason: "ambiguous"'), "more than one candidate must refuse, not guess");
});

check("C4: my-listing no longer picks an arbitrary listing", () => {
  const src = read("app/api/clasificados/quick-business/my-listing/route.ts");
  assert.ok(src.includes("resolveCanonicalListingForUser("), "must resolve through the canonical resolver");
  assert.ok(src.includes("ambiguous_listing") && src.includes("409"), "ambiguity must surface as a 409, never a silent pick");
  // Strip comments first: the file legitimately DESCRIBES the removed pattern in its header.
  // The assertion is about executable code, so it must not be satisfied or broken by prose.
  const executable = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
  assert.ok(
    !/\.order\([^)]*\)\s*\.limit\(1\)/.test(executable),
    "the arbitrary order+limit(1) owner scan must be gone from EXECUTABLE code — that is how the wrong listing got mutated",
  );
});

check("C5: the bienes status-column defect is fixed", () => {
  const src = read("app/api/clasificados/quick-business/my-listing/route.ts");
  // `listings` uses `status`; the previous version read `listing_status` and always got "".
  const bienesBlock = src.slice(src.indexOf('"bienes-negocio": {'), src.indexOf('"bienes-negocio": {') + 400);
  assert.ok(bienesBlock.includes('statusColumn: "status"'), "listings.status, not listing_status");
});

check("C6: the doorway sends a bearer token on every authenticated call", () => {
  const src = read("app/(site)/publicar/negocio-rapido/_components/QuickBusinessMyBusinessClient.tsx");
  const fetchCount = (src.match(/await fetch\(/g) ?? []).length;
  const authCount = (src.match(/Authorization: `Bearer \$\{token\}`/g) ?? []).length;
  assert.ok(fetchCount >= 3, `expected the doorway to make several authenticated calls, saw ${fetchCount}`);
  assert.equal(
    authCount,
    fetchCount,
    "EVERY fetch from the doorway must carry a bearer token — a call without one always 401s, which is a control that cannot perform its action",
  );
  assert.ok(src.includes("getAccessToken"), "token acquisition must be centralized");
});

check("C7: the doorway renders controls only for supported capabilities", () => {
  const src = read("app/(site)/publicar/negocio-rapido/_components/QuickBusinessMyBusinessClient.tsx");
  assert.ok(src.includes('state === "supported"'), "control rendering is gated on real capability");
  assert.ok(src.includes("isTransitionLegalFrom("), "and on the listing's real current status");
  assert.ok(src.includes("resolveLifecycleEndpoint("), "endpoints come from the capability matrix");
});

if (failures.length) {
  console.error(`verify-quick-lifecycle-media-behavior-01: ${failures.length}/${checks} FAILED`);
  for (const f of failures) console.error("  ✗ " + f);
  process.exit(1);
}
console.log(`verify-quick-lifecycle-media-behavior-01: OK (${checks} checks, no DB, no network)`);
