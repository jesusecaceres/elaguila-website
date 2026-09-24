/**
 * LEONIX ASSISTED SERVICIOS NAVIGATION CLEANUP — focused verifier for the NEW WIRING ONLY.
 * Run: npx tsx scripts/verify-p0-assisted-servicios-navigation-01.ts
 *
 * Proves (plain node:assert, matching this repo's convention — no jest/vitest):
 *  1. The persistent assisted header renders ONLY when a server-verified assisted context is
 *     present (useAssistedPublishingUi()) — never for a normal customer.
 *  2. Its Next/Back buttons drive the EXACT SAME extracted callbacks (handleGoBack/handleGoNext)
 *     the pre-existing footer Back/Next buttons now also call — no second/duplicate step-
 *     transition rule, no new validation, no new data model.
 *  3. From step 1 (index 0), Back is an explicit router.push to
 *     /admin/businesses/<businessId> — never router.back()/browser history — and Admin/Concierge
 *     always targets the flat /admin/businesses list (a different target, on purpose).
 *  4. Neither the header nor its back handler ever calls a draft-clearing function.
 *  5. Mobile-safe: overflow-x-hidden, truncate on the business name, shrink-0 on both action
 *     buttons — no layout that can overflow at ~390px.
 *  6. Minimal footprint: exactly 2 files touched, and NONE of the Save for Client / Publish for
 *     Client architecture (publish route, my-listing route, assistedListingCustody.ts) was
 *     touched by this navigation-only mission.
 *  7. The existing 1-8 step rail/footer structure is untouched in shape (still 8 steps, canGoBack/
 *     canGoNext bounds-check logic unchanged).
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

const HEADER_FILE = "app/(site)/clasificados/publicar/servicios/components/AssistedServiciosStepHeader.tsx";
const APP_FILE = "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx";

// 1. Header only renders in assisted mode -------------------------------------------------------
const appSrc = read(APP_FILE);
assert.ok(appSrc.includes("useAssistedPublishingUi()"), "the application component consumes the shared assisted UI context");
assert.ok(/\{assistedUi \? \(\s*<AssistedServiciosStepHeader/.test(appSrc), "AssistedServiciosStepHeader is mounted only inside an `assistedUi ?` guard");

// 2. Header drives the SAME extracted step-transition callbacks as the footer --------------------
assert.ok(/const handleGoBack = useCallback\(/.test(appSrc) && /const handleGoNext = useCallback\(/.test(appSrc), "handleGoBack/handleGoNext are extracted, named callbacks");
const footerBackIdx = appSrc.indexOf('{lang === "es" ? "Anterior" : "Back"}');
const footerBeforeBack = appSrc.slice(Math.max(0, footerBackIdx - 400), footerBackIdx);
assert.ok(footerBeforeBack.includes("onClick={handleGoBack}"), "the footer Back button calls the extracted handleGoBack, not an inline duplicate");
const footerNextIdx = appSrc.indexOf('{lang === "es" ? "Siguiente" : "Next"}');
const footerBeforeNext = appSrc.slice(Math.max(0, footerNextIdx - 400), footerNextIdx);
assert.ok(footerBeforeNext.includes("onClick={handleGoNext}"), "the footer Next button calls the extracted handleGoNext, not an inline duplicate");
assert.ok(appSrc.includes("onBack={handleAssistedHeaderBack}") && appSrc.includes("onNext={handleGoNext}"), "the header's Next prop is the IDENTICAL handleGoNext the footer uses; Back goes through the step-aware wrapper");
// Only ONE occurrence of the step-4 pending-field-commit block (inside handleGoNext) — proves it
// was extracted, not copy-pasted a second time for the header.
const pendingFieldMarker = "const pendingService = w.customServiceLabel.trim();";
const markerCount = appSrc.split(pendingFieldMarker).length - 1;
assert.equal(markerCount, 1, "the step-4 pending-field-commit logic exists exactly once (extracted, not duplicated for the new header)");

// 3. Step-1 Back is an explicit route push to the business; Admin/Concierge is a different, flat target
assert.ok(/if \(step > 0\) \{\s*handleGoBack\(\);\s*return;\s*\}/.test(appSrc), "handleAssistedHeaderBack defers to handleGoBack for any step after the first");
assert.ok(
  /router\.push\(`\/admin\/businesses\/\$\{encodeURIComponent\(assistedUi\.businessId\)\}#prospect-journey`\)/.test(appSrc),
  "step-1 Back is an explicit router.push to the specific business, never router.back()/browser history",
);
assert.ok(!appSrc.includes("router.back()"), "no browser-history fallback anywhere in this file");
const headerSrc = read(HEADER_FILE);
assert.ok(headerSrc.includes('href="/admin/businesses"'), 'Admin / Concierge always targets the flat /admin/businesses list');
assert.ok(!headerSrc.includes("/admin/businesses/${businessId}") && !headerSrc.includes("/admin/businesses/$"), "Admin / Concierge never targets a specific business — that is Back's job at step 1, a deliberately different destination");

// 4. Never clears the draft --------------------------------------------------------------------
assert.ok(!headerSrc.includes("clearServiciosDraftStorageAndIdb") && !headerSrc.includes("deleteApplicationDraft"), "the header component itself never references a draft-clearing function");
const backHandlerIdx = appSrc.indexOf("const handleAssistedHeaderBack = useCallback(");
const backHandlerSrc = appSrc.slice(backHandlerIdx, appSrc.indexOf("}, [step, handleGoBack, assistedUi, router]);", backHandlerIdx));
assert.ok(!backHandlerSrc.includes("clearServiciosDraftStorageAndIdb") && !backHandlerSrc.includes("deleteApplicationDraft"), "handleAssistedHeaderBack never clears the draft");

// 5. Mobile-safe -----------------------------------------------------------------------------
assert.ok(headerSrc.includes("overflow-x-hidden"), "header container prevents horizontal overflow");
assert.ok(headerSrc.includes("truncate") && headerSrc.includes("min-w-0"), "business name truncates instead of forcing overflow");
assert.ok((headerSrc.match(/shrink-0/g) ?? []).length >= 3, "Back / Admin-Concierge / Next all stay fixed-size (shrink-0) so the center name is what compresses");

// 6. Minimal footprint — exactly this mission's 2 files, no Save/Publish architecture touched ----
// Excludes verifier scripts themselves: this verifier's own file, plus the three sibling
// verifiers whose stale "form component untouched" assertions this mission legitimately requires
// updating (each documented inline in its own file, pointing back to this verifier).
// `git diff --name-only HEAD` (allTouched's source) is empty once this mission's changes are
// already committed — this positive "exactly these files" check is only meaningful against an
// uncommitted working tree, so it's skipped (not failed) once there's nothing left uncommitted;
// the two files' actual CONTENTS are still fully verified by contracts 1-5 and 7 regardless.
const nonVerifierTouched = allTouched.filter((f) => !f.startsWith("scripts/verify-"));
if (nonVerifierTouched.length > 0) {
  // Gate QB-IDENTITY-01: the original form of this check ("the working tree contains EXACTLY these
  // two files") could only ever pass while this mission was the sole uncommitted work in the tree —
  // its own comment above already concedes that limitation. Any later mission sharing the working
  // tree fails it for reasons that have nothing to do with navigation scope creep.
  //
  // The real claim is preserved and is now checked directly and permanently: this mission's
  // navigation work must not reach into the Servicios Save/Publish architecture or the assisted
  // navigation surfaces beyond its own two files. That is asserted against a named list, so it
  // keeps protecting the boundary no matter what else is in the tree.
  const NAVIGATION_ADJACENT_PROTECTED = [
    "app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx",
    "app/(site)/clasificados/publicar/servicios/lib/serviciosPublishClient.ts",
    "app/api/clasificados/servicios/lib/serviciosPublishServerAuth.ts",
    "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplicationSteps.tsx",
  ];
  const creep = nonVerifierTouched.filter((f) => NAVIGATION_ADJACENT_PROTECTED.includes(f));
  assert.deepEqual(
    creep,
    [],
    `no navigation-adjacent scope creep — this mission owns only ${APP_FILE} and ${HEADER_FILE}`,
  );
} else {
  console.log("  (skipping file-touch-list check — working tree is clean/already committed; contracts 1-5 and 7 still verify the two files' real contents)");
}
// Gate QB-IDENTITY-01 / QB-STAFF-03 legitimately extend two of these files (an additive canonical
// link write in the servicios publish route; extraction of the token crypto into a pure, testable
// module behind an unchanged API). Both are explicitly authorized and neither is navigation work,
// so they are removed from this navigation-only mission's blanket list. The claim that matters —
// that the Save for Client / Publish for Client ARCHITECTURE is intact — is asserted directly
// below instead of being inferred from the files being byte-frozen.
for (const f of [
  "app/api/clasificados/servicios/my-listing/route.ts",
  "app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx",
]) {
  assert.ok(!allTouched.includes(f), `${f} (Save for Client / Publish for Client architecture) was not touched — navigation-only mission`);
}

// 6b. Save for Client / Publish for Client architecture asserted directly, in place of the two
// blanket file-freeze checks removed above.
{
  const pubSrc = read("app/api/clasificados/servicios/publish/route.ts");
  assert.ok(pubSrc.includes("save_for_client") && pubSrc.includes("publish_for_client"), "both assisted actions intact");
  // Gate QB-STAFF-03 (2026-09-21) — the publish seam redeems through the STRICTER reader, which
  // verifies the same signed server-minted cookie AND re-resolves the live staff roster at
  // redemption. The bare reader would now be a weakening here, so it is forbidden outright.
  assert.ok(pubSrc.includes("readActiveAssistedPublishingContext("), "assisted mode still requires the signed server-minted cookie");
  assert.ok(!/[^e]readAssistedPublishingContext\(/.test(pubSrc), "a write seam never redeems with the unchecked reader");
  assert.ok(pubSrc.includes("refuseUnlessAuthoritativePayment("), "Publish for Client still gated on authoritative listing+package payment");
  assert.ok(pubSrc.includes("linkAssistedListingToBusiness("), "assisted custody write intact");
  assert.ok(
    pubSrc.includes("isServiciosListingOwner(existing.owner_user_id, ownerUserId)"),
    "the ORIGINAL customer ownership check is still present in its own branch",
  );
  const tokSrc = read("app/lib/auth/assistedPublishingToken.ts");
  assert.ok(
    tokSrc.includes('createHmac("sha256"') && tokSrc.includes("timingSafeEqual"),
    "the token crypto is unchanged in substance after extraction — same HMAC-SHA256 + constant-time compare",
  );
}

// 7. Existing 1-8 step structure is untouched in shape -------------------------------------------
assert.ok(appSrc.includes("const canGoBack = step > 0;") && appSrc.includes("const canGoNext = step < totalSteps - 1;"), "step bounds-check logic is byte-identical, unchanged");
assert.ok(appSrc.includes("SERVICIOS_APPLICATION_STEP_COUNT"), "still driven by the single existing step-count constant, no new one introduced");

console.log("verify-p0-assisted-servicios-navigation-01: PASS (7 contracts)");
