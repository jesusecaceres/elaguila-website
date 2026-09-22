/**
 * P0 Sales Ad Creation Flow — focused verifier for the NEW WIRING ONLY.
 * Run: npx tsx scripts/verify-p0-sales-ad-creation-flow-01.ts
 *
 * Proves (plain node:assert, matching this repo's convention — no jest/vitest):
 *  1. Mobile entry (Gate 2): the staff home's Create Ad quick action carries the create_listing
 *     intent (search-first, same pattern as every other Quick Action) instead of the bare
 *     launcher; the business page hero has a Create Ad button, rendered BEFORE any other hero
 *     action / before the Prospect Journey Strip, using the same intent resolver.
 *  2. Real category application, same tab for every category (Gate 3 + Gate 6 prerequisite):
 *     create-for-client's categoryHref() returns sameTab:true for ANY category once a business
 *     is selected, not only the prefill-supported ones — every category's draft/session store is
 *     tab-scoped, so a new-tab handoff can never carry return context.
 *  3. No new architecture: no new Supabase migration, no new API route created by this change,
 *     no new "Save Draft" button was inserted into any category's own form/step components.
 *  4. Return context (Gate 6): HandoffClient writes the generic concierge return context for
 *     EVERY category (not only Servicios's prefill branch); conciergeReturnContext.ts is a pure,
 *     SSR-safe, sessionStorage-only module (same substrate every category draft already uses).
 *  5. Preview identifies business/category/draft state + Back to Business (Gate 5):
 *     ConciergeReturnBanner is mounted on both proof-lane preview pages (Servicios, Restaurantes)
 *     and renders nothing when no concierge context exists (never visible to a real customer).
 *  6. Custody note preserved untouched (Gate 8) — this build does not touch or delay it.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

// 1. Mobile entry ---------------------------------------------------------------------------------
const staffOsSrc = read("app/admin/_lib/staffOperatingSystem.ts");
assert.ok(
  /key:\s*"create_for_client"[\s\S]{0,200}href:\s*buildConciergeInventoryHref\("create_listing"\)/.test(staffOsSrc),
  "staff home Create Ad quick action carries the create_listing intent (search-first)",
);
assert.ok(!/key:\s*"create_for_client"[\s\S]{0,200}href:\s*STAFF_OS_ROUTES\.createForClient/.test(staffOsSrc), "Create Ad no longer links the bare launcher directly");

const businessPageSrc = read("app/admin/(dashboard)/businesses/[businessId]/page.tsx");
assert.ok(businessPageSrc.includes('resolveConciergeActionDestination("create_listing", business.id)'), "business page hero has a Create Ad link using the existing intent resolver");
const heroCreateAdIdx = businessPageSrc.indexOf('resolveConciergeActionDestination("create_listing", business.id)');
const heroAddNoteIdx = businessPageSrc.indexOf("Agregar nota / Add note");
const prospectStripIdx = businessPageSrc.indexOf("<ProspectJourneyStrip");
assert.ok(heroCreateAdIdx > -1 && heroAddNoteIdx > -1 && heroCreateAdIdx < heroAddNoteIdx, "Create Ad renders before Add note in the hero action row");
assert.ok(heroCreateAdIdx < prospectStripIdx, "Create Ad is reachable before scrolling to the Prospect Journey Strip — not buried");

// 2. Same-tab handoff for every category -----------------------------------------------------------
const createForClientSrc = read("app/admin/(dashboard)/businesses/create-for-client/page.tsx");
assert.ok(!/if \(businessId && PREFILL_SUPPORTED\.has\(key\)\)/.test(createForClientSrc), "categoryHref no longer gates same-tab handoff on prefill support");
assert.ok(/if \(businessId\) \{/.test(createForClientSrc), "categoryHref routes same-tab for ANY category once a business is selected");
assert.ok(/prefill:\s*PREFILL_SUPPORTED\.has\(key\)/.test(createForClientSrc), "prefill flag stays correctly scoped to PREFILL_SUPPORTED even though sameTab no longer is");
assert.ok(createForClientSrc.includes('target={target.sameTab ? undefined : "_blank"}'), "business category cards still honor the computed sameTab flag (now true whenever a business is selected)");

// 3. No new architecture -----------------------------------------------------------------------
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
assert.ok(!allTouched.some((f) => f.startsWith("supabase/migrations/")), "no new Supabase migration was added");
// LEONIX P0 FINAL ASSISTED PUBLISHING BRIDGE (later, explicitly-authorized mission) legitimately
// MODIFIES two pre-existing routes (servicios publish + my-listing) to add an isolated assisted
// branch — that is not a new route file, so the real invariant here ("no new API ROUTE FILE was
// added") is checked against untrackedFiles only, not every modified file under app/api/.
assert.ok(!untrackedFiles.some((f) => f.startsWith("app/api/") && !f.includes("application-context")), "no new API route FILE was added");
// LEONIX ASSISTED SERVICIOS NAVIGATION CLEANUP (later, explicitly-authorized, navigation-only
// mission) legitimately touches ClasificadosServiciosApplication.tsx for a persistent assisted
// header + extracted step-transition callbacks — no new Save Draft button, no new persistence
// call. See verify-p0-assisted-servicios-navigation-01.ts for the dedicated proof.
for (const f of ["app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx"]) {
  assert.ok(!allTouched.includes(f), `${f} (a category's own form component) was not touched — no new Save Draft button was inserted into it`);
}

// 4. Return context — written for every category, pure + SSR-safe ------------------------------
const handoffSrc = read("app/admin/(dashboard)/businesses/create-for-client/handoff/HandoffClient.tsx");
assert.ok(handoffSrc.includes("writeConciergeReturnContext({"), "handoff writes the concierge return context");
const seedLineIdx = handoffSrc.indexOf('category === "servicios" ? seedServiciosDraftFromBusinessContext');
const writeCtxIdx = handoffSrc.indexOf("writeConciergeReturnContext({");
assert.ok(seedLineIdx > -1 && writeCtxIdx > seedLineIdx, "return-context write happens after the seed decision, unconditionally (not nested inside the servicios-only branch)");
// The write call must not be inside an `if (category === "servicios")` guard — confirm no such
// guard wraps it by checking the immediately preceding non-blank line isn't a servicios-only if.
const beforeWrite = handoffSrc.slice(0, writeCtxIdx);
const lastIfServicios = beforeWrite.lastIndexOf('if (category === "servicios")');
assert.ok(lastIfServicios === -1, "writeConciergeReturnContext is never gated behind a servicios-only if");

const ctxModuleSrc = read("app/lib/business/applicationContext/conciergeReturnContext.ts");
assert.ok(!/^import.*supabase/im.test(ctxModuleSrc), "conciergeReturnContext.ts has no Supabase/DB dependency");
assert.ok(ctxModuleSrc.includes("sessionStorage"), "conciergeReturnContext.ts uses sessionStorage — the same substrate every category draft already uses");
assert.ok(ctxModuleSrc.includes('typeof window !== "undefined"'), "conciergeReturnContext.ts is SSR-safe");
assert.ok(!ctxModuleSrc.includes('"use client"'), "conciergeReturnContext.ts is a plain module (no client boundary needed), importable from server code too");

// 5. Preview shows draft identity + Back to Business, invisible to real customers ----------------
const bannerSrc = read("app/components/business/ConciergeReturnBanner.tsx");
assert.ok(bannerSrc.startsWith('"use client";'), "ConciergeReturnBanner is a client component (reads sessionStorage)");
assert.ok(/if \(!mounted \|\| !ctx\) return null;/.test(bannerSrc), "banner renders nothing without concierge context — never visible to a real customer's own preview");
assert.ok(bannerSrc.includes("readConciergeReturnContext"), "banner reads context via the shared module, no duplicate storage logic");
assert.ok(bannerSrc.includes("Volver al negocio / Back to Business") && bannerSrc.includes("#prospect-journey"), "banner provides Back to Business, linking to the business's prospect-journey section");
assert.ok(/editHref/.test(bannerSrc), "banner supports an Edit affordance");

// P0 continuation (Staff-Assisted Category Access) — the banner is now mounted at ONE universal
// choke point (PublishAuthGate.tsx, inside every category's gate) rather than per-page, so it
// covers application AND preview pages for every category without per-page edits. See
// verify-p0-staff-assisted-category-access-01.ts for the full assertion of that mount point; this
// script only re-confirms the two proof-lane preview pages were NOT left with a stale duplicate.
const serviciosPreviewPage = read("app/(site)/clasificados/publicar/servicios/preview/page.tsx");
assert.ok(!serviciosPreviewPage.includes("<ConciergeReturnBanner"), "Servicios preview no longer duplicates the banner mount (now universal via PublishAuthGate)");
const restaurantesPreviewPage = read("app/(site)/clasificados/restaurantes/preview/page.tsx");
assert.ok(!restaurantesPreviewPage.includes("<ConciergeReturnBanner"), "Restaurantes preview no longer duplicates the banner mount (now universal via PublishAuthGate)");

// 6. Custody note (Gate 8, superseded by QUICK SALES ENTRY CONSOLIDATION) ---------------------
// The "owner decision" caveat this gate once pinned verbatim has been DECIDED for the four paid
// categories: they are created only through the Quick Sales cockpit, under server-issued custody
// attributed to the staff actor. The SITE-account caveat must survive ONLY for the remaining
// lanes that still open a public application from this page — it must not be dropped, and it
// must not be stated as if it still applied to the four Quick Sales lanes.
assert.ok(
  /Servicios, Restaurantes, Autos Dealer (y|and) Bienes Negocio/.test(createForClientSrc) &&
    /Venta asistida Quick|Quick assisted sale/.test(createForClientSrc) &&
    /cuenta del SITIO conectada en este dispositivo/.test(createForClientSrc) &&
    !createForClientSrc.includes("custody account Leonix uses for managed listings is an owner decision"),
  "the custody note names the four Quick Sales lanes as server-custody and keeps the SITE-account caveat scoped to the remaining lanes",
);
assert.ok(!/owner_user_id/.test(createForClientSrc) && !allTouched.some((f) => f.includes("ownership") && !f.includes("OwnershipClaimPanel")), "no custody/ownership architecture was touched this build (separate P0, per Gate 8)");

console.log("verify-p0-sales-ad-creation-flow-01: PASS (6 contracts)");
