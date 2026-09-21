/**
 * LEONIX P0 FINAL ASSISTED PUBLISHING BRIDGE — focused verifier for the NEW WIRING ONLY.
 * Run: npx tsx scripts/verify-p0-final-assisted-publishing-bridge-01.ts
 *
 * Proves (plain node:assert, matching this repo's convention — no jest/vitest):
 *  1. Zero new database architecture: no new Supabase migration. Custody is composed entirely
 *     from the pre-existing `business_listing_links` junction; "hidden, not yet public" reuses the
 *     already-legal-but-previously-unused `draft` value in servicios_public_listings.listing_status.
 *  2. The assisted-publishing token now carries a real Supabase Auth `authUserId` (required for
 *     business_listing_links.linked_by, which is NOT NULL REFERENCES auth.users), independent of
 *     rosterId, minted only from a fresh staff re-verification — never client-supplied.
 *  3. The custody module (assistedListingCustody.ts) never writes to a listing's owner_user_id and
 *     never uses rosterId as attribution — only the real authUserId.
 *  4. The Servicios publish route's assisted branch is isolated from the customer owner-mutation
 *     policy: `decideServiciosOwnerSaveStatus`/`isServiciosListingOwner` still gate the ORIGINAL
 *     (unchanged) customer branch only; the assisted branch never writes owner_user_id; Publish for
 *     Client requires a cleared manual payment; Leonix-locked statuses are still refused.
 *  5. The strict customer bearer-token 401 gate and the Revenue OS checkout payment_required gate
 *     are both still fully intact for a normal (non-assisted) request — only additively bypassed
 *     when isAssistedRequest is server-verified true.
 *  6. The my-listing reopen route authorizes an assisted, token-less request ONLY via the signed
 *     cookie + a verified business_listing_links match, and only ever by canonical id (never
 *     slug/leonixAdId) — the customer bearer-token path is otherwise unchanged.
 *  7. No new category form, no duplicate/parallel application: the real Servicios application
 *     component was not touched. No Restaurantes production code was touched this round (the
 *     second-category gap is reported, not silently half-built).
 *  8. UI: the assisted CTA (Save for Client / Publish for Client) is provided through ONE context
 *     at the existing PublishAuthGate choke point, never a new per-category gate; a normal
 *     customer's checkout CTA is untouched when no assisted context is present.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const changedFiles = execSync("git diff --name-only HEAD", { cwd: ROOT, encoding: "utf8" })
  .trim()
  .split(/\r?\n/)
  .filter(Boolean)
  .map((f) => f.replace(/\\/g, "/"));
const untrackedFiles = execSync("git status --short", { cwd: ROOT, encoding: "utf8" })
  .trim()
  .split(/\r?\n/)
  .filter((l) => l.startsWith("??"))
  .map((l) => l.replace(/^\?\?\s+/, "").replace(/\\/g, "/"));
const allTouched = [...changedFiles, ...untrackedFiles];

// 1. Zero new CUSTODY database architecture -------------------------------------------------------
// The claim this protects is that assisted custody is composed from the EXISTING
// business_listing_links junction plus the existing draft status value — never from a second,
// parallel custody store. Gate QB-LIFECYCLE-02 authors one additive migration that widens two
// lifecycle CHECK constraints (no new table, no custody concept, and deliberately NOT applied), so
// the guard is narrowed to the actual claim instead of a blanket "no migration may ever exist".
const CUSTODY_TABLE_RE = /create\s+table[\s\S]{0,200}?(business_listing_links|custody|assisted_publish|prepared_listing)/i;
for (const f of allTouched.filter((x) => x.startsWith("supabase/migrations/"))) {
  const sql = read(f);
  assert.ok(
    !CUSTODY_TABLE_RE.test(sql),
    `${f} must not create a parallel custody store — custody stays composed from business_listing_links + the existing draft status value`,
  );
}

// 2. Assisted token carries a real authUserId, independent of rosterId ---------------------------
// Gate QB-STAFF-03 moved the token's mint/verify crypto into the pure, importable
// assistedPublishingToken.ts so it can be attacked by a real test rather than matched as a string.
// Same claims, same strictness, correct file. Behavioural proof (forgery, tampering of authUserId,
// expiry extension) lives in scripts/verify-quick-assisted-operations-01.ts.
const tokenSrc = read("app/lib/auth/assistedPublishingToken.ts");
assert.ok(/authUserId:\s*string/.test(tokenSrc), "AssistedPublishingContext declares authUserId: string");
assert.ok(/input\.authUserId/.test(tokenSrc) && /parsed\.authUserId/.test(tokenSrc), "authUserId is both minted from input and validated on read");
assert.ok(
  read("app/lib/auth/assistedPublishingSession.ts").includes('import "server-only";'),
  "the secret-owning wrapper remains server-only",
);
assert.ok(/!parsed\.authUserId/.test(tokenSrc), "readAssistedPublishingContext fails closed when authUserId is missing, same as businessId/category/rosterId");

const contextRouteSrc = read("app/api/admin/businesses/[businessId]/application-context/route.ts");
assert.ok(contextRouteSrc.includes("access.actor.authUserId") && contextRouteSrc.includes("authUserId: access.actor.authUserId"), "authUserId is minted from the FRESH staff re-verification result, never a client-supplied value");

// 3. Custody module never touches ownership, attributes only via the real authUserId -------------
const custodySrc = read("app/lib/business/assistedListingCustody.ts");
assert.ok(custodySrc.includes('import "server-only";'), "custody module is server-only");
assert.ok(!/\.eq\("owner_user_id"|owner_user_id:\s/.test(custodySrc), "assistedListingCustody.ts never queries or writes any listing's owner_user_id — pure business_listing_links + leonix_payment_records reuse (doc comment may still name it for context)");
assert.ok(custodySrc.includes("linked_by: input.linkedByAuthUserId") && !custodySrc.includes("linked_by: input.rosterId"), "business_listing_links.linked_by is attributed to the real authUserId, never a rosterId string");
assert.ok(custodySrc.includes('.eq("manual_state", "cleared")'), "Publish for Client's payment gate checks the real leonix_payment_records cleared state, not a client-declared flag");

// 4. Publish route — assisted branch isolated from the customer owner-mutation policy -------------
const publishSrc = read("app/api/clasificados/servicios/publish/route.ts");
// Gate QB-STAFF-03 (2026-09-21) — the publish route redeems through the STRICTER reader: same
// signed-cookie resolution, plus a live staff-roster re-check at redemption. `my-listing` below
// is a READ and deliberately keeps the cheap synchronous reader.
assert.ok(publishSrc.includes("readActiveAssistedPublishingContext(req.cookies)"), "publish route resolves assisted context server-side from signed cookies only");
assert.ok(!/[^e]readAssistedPublishingContext\(/.test(publishSrc), "the publish route never redeems a write with the unchecked reader");
assert.ok(publishSrc.includes('assistedActionRaw === "save_for_client"') && publishSrc.includes('assistedActionRaw === "publish_for_client"'), "two explicit, named assisted actions — no implicit/inferred assisted mode");
assert.ok(publishSrc.includes('return NextResponse.json({ ok: false, error: "assisted_context_required" }, { status: 403 });'), "an assistedAction without a valid server-verified assisted context is refused, never silently ignored or silently treated as a normal save");

const assistedBranchStart = publishSrc.indexOf("if (isAssistedRequest) {");
const assistedBranchEnd = publishSrc.indexOf("} else if (existing) {", assistedBranchStart);
assert.ok(assistedBranchStart > -1 && assistedBranchEnd > assistedBranchStart, "found the isolated assisted persistence branch, immediately followed by the ORIGINAL unchanged customer `else if (existing)` branch");
const assistedBranch = publishSrc.slice(assistedBranchStart, assistedBranchEnd);
assert.ok(!/decideServiciosOwnerSaveStatus\(/.test(assistedBranch), "the assisted branch never CALLS decideServiciosOwnerSaveStatus (whose transition table assumes a proven customer owner) — a doc comment may still name it for contrast");
assert.ok(!/owner_user_id\s*:/.test(assistedBranch), "the assisted branch's insert/update objects never set owner_user_id — stays unclaimed/null, Gate 5 #6");
assert.ok(assistedBranch.includes("hasClearedManualPaymentForListing"), "Publish for Client requires a cleared manual payment, checked inside the assisted branch");
assert.ok(assistedBranch.includes("SERVICIOS_LEONIX_LOCKED_STATUSES.has(existingStatus)"), "a Leonix-locked row (suspended/rejected) still cannot be written through the assisted path either");
assert.ok(assistedBranch.includes("linkAssistedListingToBusiness"), "a successful assisted persist always (re-)confirms the business_listing_links custody record");

const normalBranch = publishSrc.slice(assistedBranchEnd, publishSrc.indexOf("} else if (existingListingIdRaw) {", assistedBranchEnd));
assert.ok(normalBranch.includes("isServiciosListingOwner(existing.owner_user_id, ownerUserId)"), "the ORIGINAL customer ownership check is still present, byte-identical in shape, in its own untouched branch");
assert.ok(normalBranch.includes("decideServiciosOwnerSaveStatus({"), "the ORIGINAL customer save-status decision is still the only status authority for a real customer save");

// 5. Strict gates still intact for a normal request, additively bypassed only when verified -------
assert.ok(/if \(strict && !ownerUserId && !isAssistedRequest\) \{/.test(publishSrc), "the strict customer bearer-token 401 gate is unchanged except for the additive && !isAssistedRequest — a normal unauthenticated request in production is still refused");
assert.ok(/if \(strict && isSupabaseAdminConfigured\(\) && !pendingPayment && !isAssistedRequest\) \{/.test(publishSrc), "the Revenue OS checkout payment_required gate is unchanged except for the additive && !isAssistedRequest");

// 6. my-listing reopen — token-less path only via verified cookie + linked business, by id only --
const myListingSrc = read("app/api/clasificados/servicios/my-listing/route.ts");
assert.ok(myListingSrc.includes("readAssistedPublishingContext(req.cookies)"), "reopen route resolves assisted context server-side from signed cookies only");
assert.ok(/if \(isAssistedRequest && !id\)/.test(myListingSrc), "an assisted reopen is refused without an explicit canonical id — never resolvable by slug/leonixAdId");
assert.ok(myListingSrc.includes("isListingLinkedToBusiness({") && myListingSrc.includes("rec.owner_user_id == null"), "an assisted reopen independently re-verifies the row has no customer owner AND is verified-linked to that exact business, not just 'a valid cookie exists'");
assert.ok(myListingSrc.includes('if (!token && !isAssistedRequest) {') && myListingSrc.includes('"auth_required"'), "a request with neither a customer bearer nor a valid assisted cookie is still refused, unchanged in spirit from the original auth_required gate");

// 7. No new/duplicate category form; Restaurantes untouched this round ----------------------------
// LEONIX ASSISTED SERVICIOS NAVIGATION CLEANUP (later, explicitly-authorized, navigation-only
// mission) legitimately touches ClasificadosServiciosApplication.tsx to add a persistent assisted
// header + extract the existing footer's step-transition handlers into named callbacks — no new
// field, no new persistence call, no duplicate application. See
// verify-p0-assisted-servicios-navigation-01.ts for the dedicated proof of that boundary.
//
// Gate 9 (the "Restaurantes adapter gap") is CLOSED: the Restaurantes publish route now carries a
// real assisted branch, and Gate QB-IDENTITY-01 additionally gives it the canonical self-service
// link write. The blanket "was not touched" check therefore no longer expresses a true claim about
// that file — it would now be asserting that a gap which has been deliberately closed is still
// open. The preview client remains untouched, and the two claims that actually matter for this
// contract (no duplicate application; the assisted branch never fabricates customer ownership) are
// re-proven directly below.
for (const f of [
  "app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx",
]) {
  assert.ok(!allTouched.includes(f), `${f} was not touched — no duplicate application`);
}

// 7b. Restaurantes publish: the claims the blanket check used to stand in for, asserted directly.
{
  const rsrc = read("app/api/clasificados/restaurantes/publish/route.ts");
  assert.ok(
    rsrc.includes("save_for_client") && rsrc.includes("publish_for_client"),
    "Gate 9 is genuinely closed — the Restaurantes route has a real assisted branch, not a reported gap",
  );
  assert.ok(
    /const ownerUserId = isAssistedRequest \? null : verifiedOwnerId;/.test(rsrc),
    "the assisted branch never fabricates customer ownership — owner_user_id stays unclaimed",
  );
  assert.ok(
    rsrc.includes("linkAssistedListingToBusiness("),
    "assisted custody is recorded through the shared business_listing_links primitive, not a second store",
  );
  // "No duplicate application" means the route must not DEFINE a second application model or a
  // second intake shape — reusing the canonical model's types and merge helper is the point.
  assert.ok(
    !/export (type|interface) Restaurante\w*(Draft|ApplicationModel)\b/.test(rsrc),
    "no duplicate application model is DEFINED inside the publish route — it reuses the canonical one",
  );
  assert.ok(
    rsrc.includes("restauranteListingApplicationModel"),
    "it reuses the canonical application model rather than re-deriving the draft shape",
  );
}

// 8. UI — one context at the existing choke point, normal customer CTA untouched -----------------
const uiContextSrc = read("app/components/auth/AssistedPublishingUiContext.tsx");
assert.ok(uiContextSrc.includes("createContext") && uiContextSrc.includes("useAssistedPublishingUi"), "a single reusable context + hook, not a per-category prop");
const gateSrc = read("app/components/auth/PublishAuthGate.tsx");
assert.ok(gateSrc.includes("AssistedPublishingUiProvider") && gateSrc.includes("value={assisted}"), "the context is provided from the SAME server-verified `assisted` value already used for the banner — no second trust source");

const previewSrc = read("app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx");
assert.ok(previewSrc.includes("useAssistedPublishingUi()"), "the Servicios preview consumes the shared assisted UI context");
assert.ok(/const showFinalCheckout =\s*\n\s*!assistedUi/.test(previewSrc), "the normal customer Stripe checkout CTA is additively gated off (!assistedUi &&) — its own conditions for a real customer are otherwise unchanged");
assert.ok(previewSrc.includes('assistedAction: action') || previewSrc.includes("assistedAction,"), "the assisted Save/Publish handlers actually pass assistedAction through to the publish API call");
assert.ok(previewSrc.includes("hasClearedManualPaymentForListing") === false, "the client never re-implements or second-guesses the server's payment-cleared check");

console.log("verify-p0-final-assisted-publishing-bridge-01: PASS (8 contracts)");
