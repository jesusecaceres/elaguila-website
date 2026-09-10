/**
 * Gate BIENES-PRIVADO-1 verifier — the $49.99 / 45-day private-seller fixed term.
 *
 * Behavioral first, source-assertion second. `stripComments()` is applied before every source
 * assertion so a doc comment describing a rule can never satisfy a check about the code.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-bienes-privado-gate1-lifecycle.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  BIENES_FSBO_LIFECYCLE_CATEGORY,
  BIENES_FSBO_LIFECYCLE_PACKAGE_KEY,
  BIENES_FSBO_LISTING_LIFECYCLE_CONFIG,
  bienesFsboDurationDays,
  bienesFsboRenewalPriceCents,
  isBrFsboRow,
  isBrFsboRowWithinTerm,
  resolveBrFsboLifecycleConfigForRow,
} from "../app/lib/listingLifecycle/bienesFsboLifecycle";
import { LISTING_LIFECYCLE_CONFIGS, getListingLifecycleConfig } from "../app/lib/listingLifecycle/listingLifecycleConfig";
import { resolveListingLifecycle, computeFixedDayRenewalExpiresAt } from "../app/lib/listingLifecycle/resolveListingLifecycle";
import { getRevenuePackageDefinition } from "../app/lib/listingPlans/revenuePricingMatrix";
import {
  BR_FSBO_OWNER_STATUS_ACTIONS,
  isBrFsboOwnerStatusAction,
  resolveBrFsboOwnerStatusDecision,
} from "../app/lib/clasificados/bienes-raices/brFsboOwnerStatusAuthority";

const ROOT = join(__dirname, "..");
let passed = 0;
const failures: string[] = [];

function assert(cond: unknown, label: string): void {
  if (cond) {
    passed += 1;
    return;
  }
  failures.push(label);
}

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

/** Strips block and line comments so a doc comment can never satisfy a code assertion. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.parse("2026-09-09T12:00:00.000Z");

const fsboRow = (over: Record<string, unknown> = {}) => ({
  category: "bienes-raices",
  seller_type: "personal",
  listing_json: { br_publish: { lane: "privado" } },
  expires_at: new Date(NOW + 10 * DAY_MS).toISOString(),
  ...over,
});

const negocioRow = (over: Record<string, unknown> = {}) => ({
  category: "bienes-raices",
  seller_type: "business",
  inventory_role: "main",
  listing_json: { br_publish: { lane: "negocio" } },
  expires_at: null,
  ...over,
});

/* ───────────────────────── 1. Commercial truth comes from the matrix ────────────────────── */

const def = getRevenuePackageDefinition(BIENES_FSBO_LIFECYCLE_PACKAGE_KEY);
assert(def != null, "br_fsbo_45d exists in the Revenue OS matrix");
assert(def?.category === "bienes-raices", "br_fsbo_45d is a bienes-raices package");
assert(def?.customerType === "private_seller", "br_fsbo_45d is sold to a private seller");
assert(def?.priceCents === 4999, "owner truth: $49.99");
assert(def?.durationDays === 45, "owner truth: 45-day term");
assert(def?.billingMode === "one_time", "FSBO is one-time, not a subscription");
assert(bienesFsboDurationDays() === 45, "duration derives from the matrix");
assert(bienesFsboRenewalPriceCents() === 4999, "renewal price derives from the matrix");
assert(
  BIENES_FSBO_LISTING_LIFECYCLE_CONFIG.durationDays === def?.durationDays,
  "lifecycle config duration equals matrix duration (no duplicated literal)",
);
assert(
  BIENES_FSBO_LISTING_LIFECYCLE_CONFIG.renewalPriceCents === def?.priceCents,
  "renewal price equals matrix price",
);
{
  const src = stripComments(read("app/lib/listingLifecycle/bienesFsboLifecycle.ts"));
  assert(src.includes("getRevenuePackageDefinition("), "duration is READ from the matrix in code");
  assert((src.match(/\b45\b/g) ?? []).length <= 1, "at most one 45 literal in code (the fallback guard)");
  assert(!/4999/.test(src), "no duplicated price literal in code");
}

/* ───────────────── 2. Lane separation — Negocio never inherits the fixed term ───────────── */

assert(isBrFsboRow(fsboRow()) === true, "an FSBO row is recognized");
assert(isBrFsboRow(negocioRow()) === false, "a Negocio row is NOT an FSBO row");
assert(isBrFsboRow({ category: "rentas", seller_type: "personal" }) === false, "a Rentas row is not FSBO");
assert(
  isBrFsboRow({ category: "bienes-raices", seller_type: "personal" }) === true,
  "listing_json is not required (public readers do not all select it)",
);
assert(
  isBrFsboRow({ category: "bienes-raices", seller_type: "personal", listing_json: { br_publish: { lane: "negocio" } } }) === false,
  "an explicit negocio lane wins over seller_type",
);
assert(isBrFsboRow({ category: "BIENES-RAICES", seller_type: " Personal " }) === true, "case/whitespace tolerant");

assert(resolveBrFsboLifecycleConfigForRow(fsboRow()) === BIENES_FSBO_LISTING_LIFECYCLE_CONFIG, "FSBO row resolves the config");
assert(resolveBrFsboLifecycleConfigForRow(negocioRow()) === null, "Negocio row resolves NO fixed-term config");

// The registry trap: a category-only lookup must not hand a Negocio row an expiring contract.
assert(
  !LISTING_LIFECYCLE_CONFIGS.some((c) => c.category === BIENES_FSBO_LIFECYCLE_CATEGORY),
  "the FSBO config is deliberately NOT in the category-matchable registry",
);
assert(getListingLifecycleConfig("bienes-raices") === null, "getListingLifecycleConfig('bienes-raices') stays null");
assert(getListingLifecycleConfig("rentas") != null, "Rentas registry lookup is unaffected");

/* ───────────────────────── 3. The ONE public expiry rule ────────────────────────────────── */

assert(isBrFsboRowWithinTerm(fsboRow(), NOW) === true, "an in-term FSBO row is publicly visible");
assert(
  isBrFsboRowWithinTerm(fsboRow({ expires_at: new Date(NOW - 1).toISOString() }), NOW) === false,
  "an expired FSBO row leaves public surfaces",
);
assert(
  isBrFsboRowWithinTerm(fsboRow({ expires_at: new Date(NOW).toISOString() }), NOW) === false,
  "expiry is exclusive at the boundary",
);
assert(isBrFsboRowWithinTerm(fsboRow({ expires_at: null }), NOW) === true, "no expires_at means no term to enforce");
assert(isBrFsboRowWithinTerm(fsboRow({ expires_at: "   " }), NOW) === true, "blank expires_at fails open");
assert(isBrFsboRowWithinTerm(fsboRow({ expires_at: "not-a-date" }), NOW) === true, "unparseable expires_at fails open");
assert(
  isBrFsboRowWithinTerm(negocioRow({ expires_at: new Date(NOW - 90 * DAY_MS).toISOString() }), NOW) === true,
  "a Negocio row is NEVER hidden by the FSBO term rule, even with a stale expires_at",
);
assert(
  isBrFsboRowWithinTerm({ category: "rentas", seller_type: "personal", expires_at: new Date(NOW - DAY_MS).toISOString() }, NOW) === true,
  "a non-BR row is never hidden by this rule",
);

/* ────────────── 4. The shared lifecycle reader, driven by the FSBO config ───────────────── */

const lc = (over: Record<string, unknown>) =>
  resolveListingLifecycle(
    {
      category: BIENES_FSBO_LIFECYCLE_CATEGORY,
      packageKey: BIENES_FSBO_LIFECYCLE_PACKAGE_KEY,
      status: "active",
      isPublished: true,
      nowIso: new Date(NOW).toISOString(),
      ...over,
    },
    BIENES_FSBO_LISTING_LIFECYCLE_CONFIG,
  );

assert(lc({ expiresAt: new Date(NOW + 30 * DAY_MS).toISOString() }).lifecycleState === "active", "mid-term reads active");
assert(lc({ expiresAt: new Date(NOW + 30 * DAY_MS).toISOString() }).isRenewalEligible === false, "no early renewal at 30 days out");
assert(lc({ expiresAt: new Date(NOW + 3 * DAY_MS).toISOString() }).lifecycleState === "expiring_soon", "3 days out is expiring_soon");
assert(lc({ expiresAt: new Date(NOW + 3 * DAY_MS).toISOString() }).isRenewalEligible === true, "renewal opens inside the 7-day window");
assert(lc({ expiresAt: new Date(NOW - DAY_MS).toISOString() }).lifecycleState === "expired", "past expiry reads expired");
assert(lc({ expiresAt: new Date(NOW - DAY_MS).toISOString() }).isRenewalEligible === true, "an expired listing may renew");
assert(lc({ expiresAt: new Date(NOW - DAY_MS).toISOString() }).isPubliclyVisible === false, "an expired listing is not publicly visible");
assert(lc({ status: "pending", expiresAt: null }).lifecycleState === "pending_payment", "unpaid reads pending_payment");
assert(lc({ status: "pending", expiresAt: null }).isRenewalEligible === false, "an unpaid listing cannot renew");
assert(lc({ status: "suspended", expiresAt: new Date(NOW - DAY_MS).toISOString() }).isRenewalEligible === false, "a suspended listing cannot renew");
// The honest legacy answer: a pre-gate row with no term is `unknown`, never a fabricated one.
assert(lc({ expiresAt: null }).lifecycleState === "unknown", "a legacy row with no expires_at reads unknown");
assert(lc({ expiresAt: null }).renewalReason === "missing_expires_at", "and says exactly why");
assert(lc({ expiresAt: null }).expiresAtIso === null, "no expiry is invented for a legacy row");

/* ───────────────────── 5. Term arithmetic — the shared engine, both cases ───────────────── */

const paidAt = new Date(NOW).toISOString();
const firstTerm = computeFixedDayRenewalExpiresAt({ currentExpiresAtIso: null, paymentCompletedAtIso: paidAt, durationDays: bienesFsboDurationDays() });
assert(Date.parse(firstTerm) === NOW + 45 * DAY_MS, "first activation = payment + 45 days");

const earlyRenew = computeFixedDayRenewalExpiresAt({
  currentExpiresAtIso: new Date(NOW + 5 * DAY_MS).toISOString(),
  paymentCompletedAtIso: paidAt,
  durationDays: bienesFsboDurationDays(),
});
assert(Date.parse(earlyRenew) === NOW + 50 * DAY_MS, "early renewal STACKS onto remaining days (no days burned)");

const lateRenew = computeFixedDayRenewalExpiresAt({
  currentExpiresAtIso: new Date(NOW - 10 * DAY_MS).toISOString(),
  paymentCompletedAtIso: paidAt,
  durationDays: bienesFsboDurationDays(),
});
assert(Date.parse(lateRenew) === NOW + 45 * DAY_MS, "renewal after expiry starts a clean 45 days from payment");

/* ─────────────────── 6. The WRITE half — webhook activation + renewal ──────────────────── */
{
  const raw = read("app/lib/listingPlans/revenueBienesFsboFulfillment.ts");
  const src = stripComments(raw);
  assert(src.includes("expires_at: expiresAt"), "activation writes expires_at onto the listing row");
  assert(src.includes("computeFixedDayRenewalExpiresAt("), "it reuses the shared fixed-term engine");
  assert(src.includes("bienesFsboDurationDays()"), "duration comes from the shared matrix-backed helper");
  assert(!/durationDays:\s*45\b/.test(src), "no duplicated 45-day literal at the write site");
  assert(src.includes("paymentRecordIsRenewal("), "renewal truth comes from the payment record");
  assert(src.includes("renewal_applied_at"), "a replayed webhook is idempotent");
  assert(src.includes('.eq("id", listingId)'), "the write targets the SAME row by id");
  assert(!/\.insert\(/.test(src), "no duplicate listing is ever inserted");
  assert(src.includes('published_at: row.published_at ?? now'), "published_at is preserved on renewal");
  assert(src.includes('outcome: renewal ? "renewed" : "activated"'), "renewal and activation are reported distinctly");
  // Compare-and-set is preserved in BOTH operations.
  assert(src.includes('.eq("category", "bienes-raices")'), "category is re-asserted in the WHERE clause");
  assert(src.includes('.eq("seller_type", "personal")'), "lane is re-asserted in the WHERE clause");
  assert(
    src.includes('.eq("status", BIENES_RAICES_FSBO_PENDING_CHECKOUT_STATUS).eq("is_published", false)'),
    "first activation still requires pending + unpublished",
  );
  assert(src.includes("BIENES_RAICES_FSBO_RENEWABLE_FROM_STATUSES"), "renewal has its own explicit from-status allow-list");
  assert(
    /RENEWABLE_FROM_STATUSES\.has\(status\)/.test(src),
    "a renewal out of an unexpected status is refused before any write",
  );
}
{
  const src = stripComments(read("app/lib/listingPlans/revenueFulfillment.ts"));
  assert(
    /activatePaidBienesFsboListingFromRevenueOs\(\{[\s\S]{0,400}?paymentRecordId: input\.paymentRecord\.id/.test(src),
    "the webhook passes the payment record so renewal can be detected",
  );
  assert(src.includes("bienes_fsbo_listing_renewed_after_payment"), "a renewal is audit-logged as a renewal");
}

/* ─────────────────── 7. The READ half — ONE rule on every public surface ────────────────── */

const SURFACES: Array<[string, string]> = [
  ["app/(site)/clasificados/bienes-raices/lib/fetchBrPublishedListingsBrowser.ts", "browse results"],
  ["app/(site)/clasificados/bienes-raices/lib/brPublishedListingsServer.ts", "sitemap reader"],
  ["app/lib/saved-search/bienes-raices/bienesRaicesPublicEligibleListing.ts", "Saved Search eligibility"],
  ["app/(site)/clasificados/anuncio/[id]/page.tsx", "canonical public detail"],
  ["app/(site)/clasificados/bienes-raices/lib/fetchBrSimilarOtherClientListingsBrowser.ts", "similar listings"],
];
for (const [rel, label] of SURFACES) {
  const src = stripComments(read(rel));
  assert(src.includes("isBrFsboRowWithinTerm("), `${label} applies the shared term rule`);
  assert(
    src.includes('from "@/app/lib/listingLifecycle/bienesFsboLifecycle"'),
    `${label} imports the rule rather than re-expressing it`,
  );
  // No surface may hand-roll an expiry comparison.
  assert(
    !/expires_at[\s\S]{0,60}(Date\.now\(\)|new Date\(\)\.getTime\(\))/.test(src),
    `${label} contains no hand-rolled expiry comparison`,
  );
}

// Each reader must actually SELECT the columns the rule evaluates, or the rule is a silent no-op.
{
  const browse = read("app/(site)/clasificados/bienes-raices/lib/fetchBrPublishedListingsBrowser.ts");
  assert(/BR_LISTINGS_SELECT_BASE[\s\S]{0,600}expires_at/.test(browse), "browse selects expires_at");
  assert(/BR_LISTINGS_SELECT_BASE[\s\S]{0,600}category/.test(browse), "browse selects category");

  const sitemap = read("app/(site)/clasificados/bienes-raices/lib/brPublishedListingsServer.ts");
  assert(/SITEMAP_SELECT[\s\S]{0,400}expires_at/.test(sitemap), "the sitemap reader selects expires_at");
  assert(/SITEMAP_SELECT[\s\S]{0,400}seller_type/.test(sitemap), "the sitemap reader selects seller_type");

  const ss = read("app/lib/saved-search/bienes-raices/bienesRaicesSavedSearchEligibilitySupport.ts");
  assert(/BR_LISTING_SELECT[\s\S]{0,600}expires_at/.test(ss), "Saved Search selects expires_at");

  const detail = read("app/(site)/clasificados/anuncio/[id]/page.tsx");
  assert(/ANUNCIO_LISTING_SELECT_BASE[\s\S]{0,600}expires_at/.test(detail), "public detail selects expires_at");

  const similar = read("app/(site)/clasificados/bienes-raices/lib/fetchBrSimilarOtherClientListingsBrowser.ts");
  assert(/SIMILAR_SELECT[\s\S]{0,600}expires_at/.test(similar), "similar listings selects expires_at");
}

// The shared row rule is untouched — this gate is additive, not a rewrite of browse eligibility.
{
  const src = stripComments(read("app/(site)/clasificados/lib/listingPublicBrowseEligibility.ts"));
  assert(!src.includes("expires"), "the shared browse rule still knows nothing about terms");
  assert(!src.includes("bienes"), "the shared browse rule stays category-neutral");
}

/* ─────────────────── 8. Renewal checkout — server-owned, lane-scoped ────────────────────── */
{
  const src = stripComments(read("app/lib/listingLifecycle/listingRenewalFulfillment.ts"));
  assert(src.includes("export async function validateBienesFsboRenewalCheckoutOwnership"), "an FSBO renewal gate exists");
  assert(src.includes("isBrFsboRow(data)"), "the gate rejects a non-FSBO row");
  assert(src.includes("BIENES_FSBO_LISTING_LIFECYCLE_CONFIG"), "eligibility uses the FSBO config EXPLICITLY");
  assert(src.includes("listing_owner_mismatch"), "ownership is verified server-side");
  assert(src.includes("renewal_not_eligible"), "eligibility is verified server-side");
  assert(src.includes("validateRentasRenewalCheckoutOwnership"), "the Rentas gate is left intact");
}
{
  const src = stripComments(read("app/api/revenue-os/checkout/route.ts"));
  assert(src.includes("isBienesFsboRenewalEarly"), "the checkout route has an FSBO renewal branch");
  assert(src.includes("validateBienesFsboRenewalCheckoutOwnership("), "and calls the server gate before pricing");
  assert(
    /isBienesFsboRenewalEarly[\s\S]{0,200}BIENES_FSBO_LIFECYCLE_PACKAGE_KEY/.test(src),
    "the branch is scoped to the FSBO package key, so Negocio cannot enter it",
  );
  assert(src.includes("serverVerifiedCurrentExpiresAt = ownerGate.currentExpiresAt"), "the expiry used is the server's, not the client's");
  assert(src.includes("isFixedTermRenewal"), "both fixed-term lanes share one renewal concept");
}
{
  // The client may request a renewal; it may never price or authorize one.
  const src = stripComments(read("app/(site)/dashboard/mis-anuncios/page.tsx"));
  assert(src.includes("startFixedTermRenewal"), "one renewal starter serves both fixed-term lanes");
  assert(src.includes("isBrFsboRow(row)"), "the lane is decided from the ROW, not from UI state");
  assert(!/priceCents\s*[:=]/.test(src.split("startFixedTermRenewal")[1]?.slice(0, 1200) ?? ""), "the client sends no price");
}

/* ──────────────── 9. Owner + Admin term truth via the existing shared readers ───────────── */
{
  const src = stripComments(read("app/(site)/dashboard/mis-anuncios/page.tsx"));
  assert(src.includes("BIENES_FSBO_LISTING_LIFECYCLE_CONFIG"), "the owner card resolves FSBO through the shared reader");
  assert(src.includes("fixedTermLifecycle"), "the card's lifecycle prop now covers both fixed-term lanes");
  assert(
    /isBrFsboRow\(x\)[\s\S]{0,400}resolveListingLifecycle\(/.test(src),
    "the FSBO config is only ever applied to a proven FSBO row",
  );
  assert(src.includes("RENTAS_LISTING_LIFECYCLE_CONFIG"), "Rentas still uses its own config");
  // No second dashboard engine.
  assert(src.includes("LeonixRealEstateListingManageCard"), "the existing shared card is reused");
}
{
  // Admin needs no new engine: its queue already selects the term columns and its existing shared
  // monetization reader surfaces `expires_at` and raises `expires_at_missing` when absent.
  const adminSelect = read("app/admin/_lib/listingsAdminSelect.ts");
  assert(adminSelect.includes("expires_at"), "the Admin ops queue already selects expires_at");
  assert(adminSelect.includes("seller_type"), "the Admin ops queue already selects seller_type");
  const monet = stripComments(read("app/lib/listingPlans/categoryListingMonetization.ts"));
  assert(monet.includes('hasOwn(row, "expires_at")'), "the shared Admin reader reports term truth from the row");
  assert(monet.includes("expires_at_missing"), "and names the gap honestly when the column is absent");
}

/* ────────────────── 10. Privado status safety — server-owned transitions ───────────────── */

const dec = (status: string, action: (typeof BR_FSBO_OWNER_STATUS_ACTIONS)[number], isPublished = true) =>
  resolveBrFsboOwnerStatusDecision({ row: { status, is_published: isPublished }, action });

// THE payment-bypass fix.
assert(dec("pending", "relist").ok === false, "an unpaid pending row cannot be published from the dashboard");
assert(
  dec("pending", "relist").ok === false && (dec("pending", "relist") as { error: string }).error === "br_fsbo_status_payment_required",
  "and the refusal says payment is required, not 'try again'",
);
assert(dec("draft", "relist").ok === false, "a draft row cannot be published either");
assert(dec("pending_payment", "resume").ok === false, "resume cannot bypass payment either");

assert(dec("sold", "relist").ok === true, "a sold row may be relisted");
assert(
  dec("sold", "relist").ok === true && JSON.stringify((dec("sold", "relist") as { patch: unknown }).patch) === JSON.stringify({ status: "active", is_published: true }),
  "relist restores active + published",
);
assert(dec("active", "mark_sold").ok === true, "a live row may be marked sold");
assert(dec("pending", "mark_sold").ok === false, "a pending row has nothing to sell");
assert(dec("active", "mark_sold", false).ok === false, "an unpublished row cannot be marked sold");
assert(dec("active", "pause").ok === true, "a live row may be paused");
assert(dec("paused", "pause").ok === false, "an already-paused row cannot be paused again");
assert(dec("paused", "resume").ok === true, "a paused row may resume");
assert(dec("active", "resume").ok === false, "resume requires a genuinely paused row");
assert(dec("active", "archive").ok === true, "archive is allowed from active");
assert(dec("pending", "archive").ok === true, "archive is allowed from pending (it publishes nothing)");

// Moderation states are absolute.
for (const moderated of ["removed", "flagged", "suspended"]) {
  for (const action of BR_FSBO_OWNER_STATUS_ACTIONS) {
    assert(dec(moderated, action).ok === false, `no owner action escapes '${moderated}' (${action})`);
  }
}

assert(isBrFsboOwnerStatusAction("relist") === true, "the action vocabulary is closed");
assert(isBrFsboOwnerStatusAction("delete") === false, "an unknown action is rejected");
assert(isBrFsboOwnerStatusAction("activate_pending") === false, "the Negocio vocabulary is not accepted here");

{
  const src = stripComments(read("app/lib/clasificados/bienes-raices/brFsboOwnerStatusAuthority.ts"));
  assert(!src.includes("import "), "the policy is pure: zero imports, zero I/O");
  assert(!src.includes("expires_at"), "no owner action can touch the paid term");
  assert(!/\bdelete\b/i.test(src), "no owner action deletes anything");
  assert(src.includes('status: "removed"'), "archive is a SOFT archive, matching the existing patch");
}
{
  const src = stripComments(read("app/api/clasificados/bienes-raices/privado-status/route.ts"));
  assert(src.includes("resolveBrFsboOwnerStatusDecision("), "the route delegates every rule to the pure policy");
  assert(src.includes("isBrFsboRow(row)"), "the route enforces the lane");
  assert(src.includes(".in(\"status\", [...decision.fromStatuses])"), "the write is a compare-and-set on the authorized prior states");
  assert(src.includes('.eq("owner_id", bearerUserId)'), "ownership is re-asserted in the WHERE clause");
  assert(!src.includes("readError.message"), "a raw database error is never returned to the client");
  assert(!src.includes("expires_at"), "the route cannot write a term");
}
{
  // Every owner surface routes Privado through the server; none writes status directly any more.
  for (const rel of [
    "app/(site)/dashboard/mis-anuncios/page.tsx",
    "app/(site)/dashboard/mis-anuncios/[id]/page.tsx",
    "app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx",
  ]) {
    const src = stripComments(read(rel));
    assert(src.includes("callBrFsboStatusMutation("), `${rel} routes Privado status through the server`);
    assert(src.includes("brFsboStatusErrorMessage("), `${rel} surfaces the server's own refusal copy`);
  }
  const client = stripComments(read("app/(site)/dashboard/lib/brFsboStatusClient.ts"));
  assert(!client.includes("resolveBrFsboOwnerStatusDecision"), "the client holds no transition rules");
  assert(!client.includes('.from("listings")'), "the client performs no listings table write");
}
{
  // Privado is NOT forced through the Negocio service, and vice versa.
  const negocio = stripComments(read("app/lib/clasificados/bienes-raices/brListingLifecycleService.ts"));
  assert(negocio.includes('row.seller_type !== "business"'), "the Negocio service still refuses non-business rows");
  assert(!negocio.includes("brFsboOwnerStatusAuthority"), "the Negocio service was not modified by this gate");
}

/* ───────────────── 11. WhatsApp, media warning, address privacy ─────────────────────────── */
{
  const src = stripComments(read("app/(site)/clasificados/bienes-raices/listing/mapBrListingRowToPrivadoPreviewVm.ts"));
  assert(src.includes("buildInternationalWhatsAppWaMeHref("), "the shared international WhatsApp contract is adopted");
  assert(!/https:\/\/wa\.me\//.test(src), "the bare-digit wa.me construction is gone");

  assert(src.includes("buildBrPublicLocationForLiveDetail("), "location is composed by the shared privacy-safe builder");
  assert(!src.includes("googleMapsSearchUrl("), "the mapper no longer builds its own maps query from a raw pair");
  assert(!src.includes("addressLine: showExact ? humanLocation : humanLocation"), "the dead identical-branch ternary is gone");
  assert(src.includes("exactAddressLine"), "an exact address line exists as its own gated value");
  assert(
    (src.match(/exactAddressLine\s*=\s*showExact\s*\?/g) ?? []).length === 1,
    "the exact address is populated in exactly one place, gated on the opt-in",
  );
  assert(!/showExact\s*=\s*true/.test(src), "exact-address visibility is never hardcoded true");
  assert(src.includes("allHumanPairRows("), "the location builder is fed the unfiltered pair rows it needs");
}
{
  const src = stripComments(read("app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts"));
  assert(src.includes("warnDroppedUnpersistableMedia("), "the FSBO publish path adopts the shared media-drop warning");
  assert(src.includes("brPrivadoOrderedGallery"), "the FSBO gallery is built once and reused");
  assert(
    /warnDroppedUnpersistableMedia\([\s\S]{0,160}buildProposedFinalMediaSet\(\{ existing: brPrivadoOrderedGallery \}\)/.test(src),
    "the warning is fed the real proposed media set",
  );
  assert(src.includes("imageSources: brPrivadoOrderedGallery"), "the published gallery is byte-for-byte the same list as before");
}

/* ──────────────────── 12. Out-of-scope surfaces genuinely untouched ─────────────────────── */
{
  // Instruction 10: FSBO Related Listings is NOT built in this gate.
  const related = stripComments(read("app/(site)/clasificados/bienes-raices/lib/fetchBrRelatedInventoryListingsBrowser.ts"));
  assert(!related.includes("isBrFsboRowWithinTerm"), "Negocio inventory Related Listings was not touched");
  assert(!related.includes("fsbo"), "no FSBO Related Listings was built (deferred to BIENES-PRIVADO-2)");

  // No migration was authored or applied in this gate.
  const src = stripComments(read("app/lib/listingLifecycle/bienesFsboLifecycle.ts"));
  assert(!/CREATE|ALTER|ADD COLUMN/i.test(src), "no schema change is implied by this gate");

  // The dead exact-address mapper is neither revived nor deleted.
  const liveDetailShell = read("app/(site)/clasificados/anuncio/[id]/page.tsx");
  assert(liveDetailShell.includes("BienesRaicesPrivadoLiveDetailShell"), "the live Privado shell is still the rendering path");
}

/* ──────────────────────────────────── report ───────────────────────────────────────────── */

if (failures.length > 0) {
  console.error(`\nverify-bienes-privado-gate1-lifecycle: ${passed} passed, ${failures.length} FAILED\n`);
  for (const f of failures) console.error(`  FAIL  ${f}`);
  process.exit(1);
}
console.log(`verify-bienes-privado-gate1-lifecycle: ${passed}/${passed} PASS`);
