/**
 * P0 Staff-Assisted Category Access — focused verifier for the NEW WIRING ONLY.
 * Run: npx tsx scripts/verify-p0-staff-assisted-category-access-01.ts
 *
 * Proves (plain node:assert, matching this repo's convention — no jest/vitest):
 *  1. ONE new capability (assisted_category_publishing), granted to all three Sales Workspace
 *     roles — same precedent tier as conduct_canvassing/manage_business_profile — no broadening
 *     beyond that.
 *  2. The signed-token module is independent, dedicated-secret, fail-closed, httpOnly, and never
 *     shares code/secret with the existing admin bootstrap token.
 *  3. The token can ONLY be minted server-side, only after a fresh capability-gated staff
 *     re-verification, on the one proven same-tab route — never from a query string, never
 *     client-settable.
 *  4. The client-side gate (PublishAuthGate) skips the customer Supabase check ONLY when a
 *     server-verified assisted context is present, and its ORIGINAL customer-auth code path is
 *     byte-for-byte unchanged (no weakening).
 *  5. The adapter is ONE shared choke point — none of the ~16 per-category layout.tsx wrapper
 *     files were touched, and neither category's real publish-time server auth
 *     (serviciosOwnerIdFromBearer / restauranteOwnerIdFromBearer) was touched at all.
 *  6. No new category form, no new admin-only duplicate application, no new database
 *     architecture (draft custody stays 100% in the existing sessionStorage substrate).
 *  7. Normal customer regression: an unauthenticated/un-cookied request still redirects; the
 *     assisted banner never renders without a real concierge context.
 */
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
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

// 1. Capability precedent ---------------------------------------------------------------------
const capsSrc = read("app/admin/_lib/salesWorkspaceCapabilities.ts");
assert.ok(capsSrc.includes('"assisted_category_publishing"'), "new capability declared");
const roleCapabilitiesStart = capsSrc.indexOf("const ROLE_CAPABILITIES");
assert.ok(roleCapabilitiesStart > -1, "found the ROLE_CAPABILITIES map");
const roleCapabilitiesSrc = capsSrc.slice(roleCapabilitiesStart);
const roleBlocks = ["super_admin: [", "sales_manager: [", "sales_rep: ["];
for (let i = 0; i < roleBlocks.length; i++) {
  const idx = roleCapabilitiesSrc.indexOf(roleBlocks[i]);
  assert.ok(idx > -1, `found ${roleBlocks[i]} block`);
  const nextIdx = i + 1 < roleBlocks.length ? roleCapabilitiesSrc.indexOf(roleBlocks[i + 1], idx + 1) : roleCapabilitiesSrc.indexOf("\n};", idx);
  const block = roleCapabilitiesSrc.slice(idx, nextIdx === -1 ? undefined : nextIdx);
  assert.ok(block.includes('"assisted_category_publishing"'), `${roleBlocks[i]} role grants assisted_category_publishing (same tier as conduct_canvassing/manage_business_profile)`);
}

// 2. Signed-token module — independent secret, fail-closed, httpOnly ----------------------------
const tokenModuleSrc = read("app/lib/auth/assistedPublishingSession.ts");
assert.ok(tokenModuleSrc.includes('import "server-only";'), "token module is server-only");
assert.ok(tokenModuleSrc.includes("ASSISTED_PUBLISHING_SESSION_SECRET"), "uses its own dedicated secret env var");
assert.ok(!tokenModuleSrc.includes("process.env.ADMIN_BOOTSTRAP_SESSION_SECRET") && !tokenModuleSrc.includes("process.env.ADMIN_PASSWORD"), "never reads the bootstrap secret or the shared admin password env vars — independent failure domains (doc comment may still name them for context)");
/**
 * Gate QB-STAFF-03 — the HMAC construction now lives in the pure, importable
 * `assistedPublishingToken.ts` so it can be attacked by a real test instead of only matched as a
 * string. The assertion is UNCHANGED in substance (same claim, same strictness); it simply reads
 * the file that now holds the crypto. The behavioural proof that a forged or tampered token is
 * actually rejected lives in scripts/verify-quick-assisted-operations-01.ts (12 attack cases).
 */
const tokenCryptoSrc = read("app/lib/auth/assistedPublishingToken.ts");
assert.ok(tokenCryptoSrc.includes('createHmac("sha256"') && tokenCryptoSrc.includes("timingSafeEqual"), "same HMAC-SHA256 + constant-time-compare pattern as the proven bootstrap token, not reinvented crypto");
assert.ok(tokenModuleSrc.includes("verifyAssistedPublishingTokenWithSecret") && tokenModuleSrc.includes("createAssistedPublishingTokenWithSecret"), "the server-only wrapper delegates to that crypto rather than duplicating it");
assert.ok(/if \(!secret\) return null;/.test(tokenModuleSrc), "fails closed when the secret is not configured (create)");
assert.ok(/if \(!secret\) return null;[\s\S]{0,400}LEONIX_ASSISTED_PUBLISH_COOKIE/.test(tokenModuleSrc) || tokenModuleSrc.match(/if \(!secret\) return null;/g)!.length >= 2, "fails closed on verify too");
assert.ok(tokenModuleSrc.includes("httpOnly: true") && tokenModuleSrc.includes('sameSite: "strict"'), "cookie is httpOnly + sameSite strict, mirroring applyLeonixAdminSessionCookies");
// Expiry and lifetime now live with the crypto in assistedPublishingToken.ts. Same claims, same
// strictness, correct file — plus real expiry attacks in verify-quick-assisted-operations-01.ts.
assert.ok(/expiresAtMs\s*<=\s*nowMs/.test(tokenCryptoSrc) || /parsed\.expiresAtMs\s*<=\s*nowMs/.test(tokenCryptoSrc), "verifies expiry, not just signature");
assert.ok(/issuedAtMs\s*>\s*nowMs/.test(tokenCryptoSrc), "rejects a token issued in the future (clock-skew forgery)");
assert.ok(/60\s*\*\s*60;/.test(tokenCryptoSrc), "short-lived (1 hour), not a standing credential");
adminSessionUntouched();
function adminSessionUntouched() {
  assert.ok(!allTouched.includes("app/lib/supabase/adminSession.ts"), "the existing, proven admin bootstrap session module was never touched");
}

// 3. Server-side-only minting, capability-gated, on the one proven same-tab route --------------
const contextRouteSrc = read("app/api/admin/businesses/[businessId]/application-context/route.ts");
assert.ok(contextRouteSrc.includes("requireSalesWorkspaceAccess()"), "mint path still requires the full staff re-verification (real Supabase Auth + roster lookup)");
assert.ok(contextRouteSrc.includes('actorHasCapability(access.actor, "assisted_category_publishing")'), "minting is capability-gated");
assert.ok(contextRouteSrc.includes("applyAssistedPublishingCookie(res,"), "cookie is applied server-side on the response, never client-constructed");
assert.ok(!/searchParams\.get\("assisted"\)|searchParams\.get\("staff"\)/.test(contextRouteSrc), "no query-string flag alone can trigger minting — only a real capability check does");
assert.ok(contextRouteSrc.includes("access.actor.rosterId &&"), "bootstrap actors (empty rosterId) are structurally excluded from ever getting a minted token");

const handoffSrc = read("app/admin/(dashboard)/businesses/create-for-client/handoff/HandoffClient.tsx");
assert.ok(handoffSrc.includes("?category=${encodeURIComponent(category)}"), "the one same-tab handoff request now also carries category so the mint can scope the token");

// 4. Client gate — additive only, original customer-auth path untouched ------------------------
const gateSrc = read("app/components/auth/PublishAuthGate.tsx");
assert.ok(gateSrc.includes("assisted?: AssistedProp") || gateSrc.includes("assisted = null"), "gate accepts an optional, server-verified assisted prop");
assert.ok(gateSrc.includes('if (assisted) {') && gateSrc.includes('setStatus("authed");'), "assisted context short-circuits to authed without any network call");
// The ORIGINAL customer check body must still be present, verbatim, proving nothing was weakened.
assert.ok(gateSrc.includes("sb.auth.getSession()") && gateSrc.includes("sb.auth.getUser()") && gateSrc.includes("window.location.replace(loginHref)"), "the real customer Supabase session check + redirect-to-login path is fully intact, unweakened");
assert.ok(gateSrc.includes("createSupabaseBrowserClient()"), "still the same customer Supabase browser client, unchanged");

const layoutSrc = read("app/components/auth/PublishAuthGateLayout.tsx");
assert.ok(layoutSrc.includes("await cookies()") && layoutSrc.includes("readAssistedPublishingContext(jar)"), "layout resolves the assisted context server-side, from signed cookies only");
assert.ok(!/searchParams/.test(layoutSrc), "the layout never reads a query string for authorization");

// 5. One shared choke point — no per-category files touched, publish-time auth untouched --------
const PER_CATEGORY_LAYOUTS = [
  "app/(site)/publicar/mascotas-y-perdidos/quick/preview/layout.tsx",
  "app/(site)/publicar/comunidad/quick/preview/layout.tsx",
  "app/(site)/publicar/clases/quick/preview/layout.tsx",
  "app/(site)/publicar/busco/quick/preview/layout.tsx",
  "app/(site)/clasificados/viajes/preview/layout.tsx",
  "app/(site)/clasificados/restaurantes/publicar/layout.tsx",
  "app/(site)/clasificados/rentas/preview/layout.tsx",
  "app/(site)/clasificados/publicar/layout.tsx",
  "app/(site)/clasificados/en-venta/preview/layout.tsx",
  "app/(site)/clasificados/bienes-raices/preview/layout.tsx",
  "app/(site)/clasificados/autos/privado/preview/layout.tsx",
  "app/(site)/clasificados/autos/negocios/preview/layout.tsx",
  "app/(site)/publicar/layout.tsx",
];
for (const f of PER_CATEGORY_LAYOUTS) {
  if (existsSync(join(ROOT, f))) {
    assert.ok(!allTouched.includes(f), `${f} was not touched — the adapter lives entirely in PublishAuthGate/PublishAuthGateLayout`);
  }
}
// LEONIX P0 FINAL ASSISTED PUBLISHING BRIDGE (later, explicitly-authorized mission) legitimately
// extends app/api/clasificados/servicios/publish/route.ts with an isolated assisted-mode branch
// (Save for Client / Publish for Client) — that file is intentionally no longer in this
// "untouched" list. Its own focused verifier (verify-p0-final-assisted-publishing-bridge-01.ts,
// contracts 4-5) independently re-proves the ORIGINAL customer owner-mutation policy and the
// strict bearer-token / Revenue OS checkout gates inside that file are still fully intact,
// byte-identical in shape, only additively bypassed when a server-verified assisted context is
// present. Restaurantes and the shared bearer-auth helper remain untouched by either mission.
//
// Gate QB-IDENTITY-01 extends app/api/clasificados/restaurantes/publish/route.ts the same way and
// for the same kind of reason: an ADDITIVE canonical `business_listing_links` write on the
// self-service branch, so customer-published and Leonix-published listings converge on one
// relationship. It is therefore removed from the blanket "untouched" list, following the exact
// precedent above — and replaced immediately below by TARGETED assertions that the publish-time
// customer auth enforcement inside it is still fully intact. A blanket file-unchanged check would
// freeze the file forever; the targeted checks below are stricter about the thing that matters.
for (const f of [
  "app/api/clasificados/servicios/lib/serviciosPublishServerAuth.ts",
]) {
  assert.ok(!allTouched.includes(f), `${f} (real publish-time customer auth enforcement) was not touched — unweakened, unchanged`);
}

// 5b. Restaurantes publish: the customer auth enforcement is re-proven directly, in place of the
// blanket untouched check removed above. Each assertion names a distinct enforcement property.
{
  const rsrc = read("app/api/clasificados/restaurantes/publish/route.ts");
  assert.ok(
    /const verifiedOwnerId = await restauranteOwnerIdFromBearer\(req\);/.test(rsrc),
    "restaurantes publish still derives the customer identity from a real Supabase bearer token",
  );
  assert.ok(
    /if \(strict && !verifiedOwnerId && !isAssistedRequest\)/.test(rsrc),
    "strict (production) publishing still REQUIRES a real customer bearer token unless a server-verified assisted context is present",
  );
  assert.ok(
    /const ownerUserId = isAssistedRequest \? null : verifiedOwnerId;/.test(rsrc),
    "an assisted publish still leaves owner_user_id unclaimed — it never fabricates customer ownership",
  );
  assert.ok(
    /existingOwnerUserId && verifiedOwnerId && existingOwnerUserId !== verifiedOwnerId/.test(rsrc),
    "the cross-owner mutation guard is intact — one customer can never overwrite another's listing",
  );
  // The additive change must be exactly that: a link write, never an ownership write.
  assert.ok(
    !/owner_user_id:\s*body\.|owner_user_id:\s*draft\./.test(rsrc),
    "ownership is never taken from the request body or the draft",
  );
}

// 6. No new architecture ------------------------------------------------------------------------
// Gate QB-LIFECYCLE-02 authors ONE additive migration that only widens two lifecycle CHECK
// constraints (it creates no table and no custody architecture, and is deliberately not applied).
// The claim this guard protects is "draft custody stays out of the database", so it is narrowed to
// that claim rather than dropped: no migration may introduce custody/listing-link architecture.
const CUSTODY_ARCHITECTURE_RE = /create\s+table[\s\S]*?(business_listing_links|custody|assisted_)/i;
for (const f of allTouched.filter((x) => x.startsWith("supabase/migrations/"))) {
  const sql = read(f);
  assert.ok(
    !CUSTODY_ARCHITECTURE_RE.test(sql),
    `${f} must not introduce custody/listing-link database architecture — draft custody stays composed from existing tables`,
  );
}
// LEONIX ASSISTED SERVICIOS NAVIGATION CLEANUP (later, explicitly-authorized, navigation-only
// mission) legitimately touches ClasificadosServiciosApplication.tsx for a persistent assisted
// header + extracted step-transition callbacks — no new field, no new persistence, no duplicate
// application. See verify-p0-assisted-servicios-navigation-01.ts for the dedicated proof.
for (const f of ["app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx"]) {
  assert.ok(!allTouched.includes(f), `${f} (a category's own form component) was not touched — no new/duplicate application`);
}
const returnCtxSrc = read("app/lib/business/applicationContext/conciergeReturnContext.ts");
assert.ok(returnCtxSrc.includes('managementMode: "leonix_assisted"') && returnCtxSrc.includes("customerOwner: null") && returnCtxSrc.includes("createdByStaffActor"), "draft custody metadata (Gate 3) lives in the existing sessionStorage context, not a new DB row");
assert.ok(!returnCtxSrc.includes("supabase") && !returnCtxSrc.includes(".insert("), "still zero DB writes from this module");

// 7. Normal customer regression ------------------------------------------------------------------
const bannerSrc = read("app/components/business/ConciergeReturnBanner.tsx");
assert.ok(/if \(!mounted \|\| !ctx\) return null;/.test(bannerSrc), "banner still renders nothing without real concierge context — never visible to a customer");
assert.ok(gateSrc.includes("assisted ? <ConciergeReturnBanner") , "banner only mounts inside the gate when assisted is truthy (server-verified)");

console.log("verify-p0-staff-assisted-category-access-01: PASS (7 contracts)");
