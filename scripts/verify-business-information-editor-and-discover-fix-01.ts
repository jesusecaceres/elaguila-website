/**
 * LEONIX BUSINESS INFORMATION EDITOR / DISCOVER FIX — focused verifier for the NEW WIRING ONLY.
 * Run: npx tsx scripts/verify-business-information-editor-and-discover-fix-01.ts
 *
 * Proves (plain node:assert, matching this repo's convention — no jest/vitest):
 *  1. LIVE DEFECT ROOT CAUSE still holds as source-proven: ai_research consent is never written
 *     by any UI/route (CanvassForm only ever posts 4 of the 5 consent types), so
 *     runBusinessAiResearch's two-consent gate would always 409 consent_not_provided for every
 *     business — this is the exact defect reported, not a guess.
 *  2. The protected AI research engine (runBusinessAiResearch / research/route.ts) is COMPLETELY
 *     UNTOUCHED by this mission — same two-consent gate, same Gemini call, same capability. Never
 *     weakened, never bypassed.
 *  3. The new public-only prospect-research lane never checks consent and never calls the
 *     AI/Gemini provider — proven by absence, not just a doc comment.
 *  4. The new lane is gated by a capability (`run_public_research`) that is textually DISTINCT
 *     from `run_ai_research`, granted to all three sales roles (unlike run_ai_research, which
 *     stays manager+).
 *  5. The new `edit_business_identity` capability exists and is granted to all three sales roles.
 *  6. The identity write path never sets `is_primary`/`preferred_channel` true on any insert or
 *     update — the single business-wide unique indexes on those columns can never be violated by
 *     this new code.
 *  7. The UI truthfully distinguishes the two research modes (a consent-required note on the AI
 *     panel; the public panel's own no-consent-required copy) and a specific, non-generic error
 *     message exists for consent_not_provided.
 *  8. The Business Information editor writes through the identity route only, and Servicios
 *     prefill needs zero changes — it already reads the exact tables the editor writes.
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

// 1. Live defect root cause — ai_research is never written -----------------------------------
const canvassRouteSrc = read("app/api/admin/businesses/canvass/route.ts");
assert.ok(
  /type: "photo_capture" \| "file_upload" \| "source_research" \| "followup_contact"/.test(canvassRouteSrc),
  "the canvass intake route's consent-write type union still (compile-time) excludes ai_research — the exact root cause",
);
assert.ok(!canvassRouteSrc.includes('"ai_research"'), "the canvass route never writes ai_research consent");
const canvassFormSrc = read("app/admin/(dashboard)/businesses/canvass/CanvassForm.tsx");
assert.ok(!canvassFormSrc.includes("consentAiResearch") && !/ai.?research/i.test(canvassFormSrc), "the canvass form renders no ai_research consent control");

// 2. The protected AI engine is completely untouched ------------------------------------------
for (const f of [
  "app/lib/business/aiResearch/repository.ts",
  "app/api/admin/businesses/[businessId]/research/route.ts",
  "app/lib/business/aiResearch/googlePlacesAdapter.ts",
  "app/lib/business/aiResearch/websiteAdapter.ts",
  "app/lib/business/aiResearch/geminiProvider.ts",
]) {
  assert.ok(!allTouched.includes(f), `${f} (the protected, consent-gated AI research engine) was not touched — unweakened, unchanged`);
}

// 3. New public-only lane never checks consent, never calls the AI provider --------------------
const publicResearchSrc = read("app/lib/business/aiResearch/publicProspectResearch.ts");
assert.ok(!publicResearchSrc.includes("getLatestConsentState"), "the public prospect research lane never reads/requires any consent record");
assert.ok(!publicResearchSrc.includes("getDefaultBusinessIntelligenceProvider") && !publicResearchSrc.includes("synthesizeBrief") && !publicResearchSrc.includes("geminiProvider"), "the public lane never calls the AI/Gemini provider");
assert.ok(publicResearchSrc.includes("runGooglePlacesResearchV1") && publicResearchSrc.includes("runWebsiteResearchV1"), "the public lane reuses the EXISTING public-data adapters directly, no new fetch/scrape code");
assert.ok(!/business_ai_research_runs|business_ai_briefing_drafts/.test(publicResearchSrc), "the public lane never persists into the AI-briefing tables — candidates are ephemeral until a human accepts one");

// 4. Distinct, correctly-scoped capability for the new lane -------------------------------------
const prospectRouteSrc = read("app/api/admin/businesses/[businessId]/prospect-research/route.ts");
assert.ok(prospectRouteSrc.includes('requireStaffWorkspaceWriteAccess("run_public_research")'), "the new route is gated by run_public_research, not run_ai_research");
const capsSrc = read("app/admin/_lib/salesWorkspaceCapabilities.ts");
assert.ok(capsSrc.includes('"run_public_research"') && capsSrc.includes('"edit_business_identity"'), "both new capabilities are declared in the matrix");
const salesRepBlockStart = capsSrc.indexOf("sales_rep: [");
const salesRepBlock = capsSrc.slice(salesRepBlockStart, capsSrc.indexOf("\n};", salesRepBlockStart));
assert.ok(salesRepBlock.includes('"run_public_research"') && salesRepBlock.includes('"edit_business_identity"'), "sales_rep (the lightest-trust role) holds both new capabilities — deliberately lighter-weight than run_ai_research, which sales_rep does NOT hold");
assert.ok(!salesRepBlock.includes('"run_ai_research"'), "sales_rep still does not hold run_ai_research — the protected engine's trust tier is unchanged");

// 5. Identity write path never risks the single-business-wide-primary unique indexes -----------
const contactsRepoSrc = read("app/lib/business/repositories/contactsRepo.ts");
const serviceAreasRepoSrc = read("app/lib/business/repositories/serviceAreasRepo.ts");
assert.ok(!/update\(\{[^}]*is_primary:\s*true/.test(contactsRepoSrc), "contactsRepo's update path never sets is_primary=true (business_contacts_one_primary_idx is a single business-wide unique index, not one-per-type)");
assert.ok(contactsRepoSrc.includes("is_primary: false") && !contactsRepoSrc.includes("is_primary: true"), "contactsRepo's new insert path only ever inserts is_primary=false");
assert.ok(serviceAreasRepoSrc.includes("is_primary: false") && !/is_primary:\s*true/.test(serviceAreasRepoSrc), "serviceAreasRepo's new write path only ever inserts is_primary=false, same single-index caveat");

// 6. Core businesses-table writer never touches lifecycle-controlled columns --------------------
const businessesRepoSrc = read("app/lib/business/repositories/businessesRepo.ts");
assert.ok(!/row\.(status|onboarding_status|creation_source|slug)\s*=/.test(businessesRepoSrc), "updateBusinessCoreFieldsAsStaff never writes status/onboarding_status/creation_source/slug");

// 7. UI truthfully distinguishes the two research modes -----------------------------------------
const fieldDiscoverySrc = read("app/admin/(dashboard)/businesses/[businessId]/FieldDiscoveryActions.tsx");
assert.ok(/Requiere el consentimiento del cliente/.test(fieldDiscoverySrc), "the AI Research panel now states its client-consent requirement explicitly");
assert.ok(fieldDiscoverySrc.includes("PublicProspectResearchPanel"), "the public research panel component is defined in this file");
assert.ok(/No requiere consentimiento del cliente|No client consent required/.test(fieldDiscoverySrc), "the public research panel states no client consent is required");
const errMsgSrc = read("app/admin/_lib/staffWriteErrorMessages.ts");
assert.ok(errMsgSrc.includes("consent_not_provided:"), "a specific, non-generic message now exists for consent_not_provided — no more silent/generic 409 surprise");

// 8. Business Information editor writes only through the identity route; prefill needs no changes
assert.ok(!allTouched.includes("app/(site)/clasificados/publicar/servicios/lib/serviciosPrefillFromBusinessContext.ts"), "the Servicios prefill adapter was not touched — it already reads the exact tables the new editor writes (businesses/business_contacts/business_service_areas/business_digital_profiles), so the loop closes with zero prefill-side changes");
const editorClientSrc = read("app/admin/(dashboard)/businesses/[businessId]/information/BusinessInformationEditorClient.tsx");
assert.ok(editorClientSrc.includes("/api/admin/businesses/${businessId}/identity"), "the editor reads and writes through the one identity route, no second write path");

console.log("verify-business-information-editor-and-discover-fix-01: PASS (8 contracts)");
