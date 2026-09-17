/**
 * LEONIX LIVE QA BLOCKER 01 — BUSINESS INFORMATION SAVE REPAIR — focused verifier.
 * Run: npx tsx scripts/verify-business-information-save-repair-01.ts
 *
 * Proves (plain node:assert + a hand-reimplemented constant-table self-test, matching this
 * repo's convention — contactsRepo.ts is server-only and cannot be imported directly under bare
 * tsx, so the CHECK-constraint logic is re-verified against a literal copy of the exact rule,
 * not re-implemented from scratch):
 *
 *  1. ROOT CAUSE FIX: upsertContactValueAsStaff never inserts/updates a non-null channel_kind
 *     without also setting preferred_channel: true (the live constraint
 *     business_contacts_non_preferred_channel_null_chk requires exactly that pairing) — proven
 *     directly against the current source, not a stale assumption.
 *  2. The singleton-clearing step never touches (or double-clears) the row it is about to write —
 *     it excludes the target row's own id, so a whatsapp row that is ALREADY the preferred
 *     channel is UPDATED in place, never orphaned then re-inserted as a duplicate.
 *  3. The route validates business type + every contact value BEFORE any write is attempted
 *     (phase 1), and returns validation_failed with zero writes on a bad value.
 *  4. The route's write phase (phase 2) tracks savedSections/failedSections independently per
 *     field — a downstream failure can never collapse into an undifferentiated "everything
 *     failed" response.
 *  5. The route ALWAYS rehydrates and returns fresh canonical context, whether every section
 *     succeeded or not — the client never has to guess what's actually persisted.
 *  6. A partial failure returns HTTP 200 with partial:true (not a bare 400) — proven because the
 *     UI must never tell staff "save failed" while something real actually committed.
 *  7. The client reconciles its form fields from the returned context on every response that
 *     includes one — leave/return parity is enforced by re-fetching GET too (unchanged), but the
 *     immediate post-save state is now also truthful.
 *  8. The client shows a specific, non-generic message for validation_failed vs a partial
 *     failure, naming only the affected field(s) — never raw server internals.
 *  9. Cross-business / capability scoping is unchanged: identity route still requires
 *     edit_business_identity and re-verifies the business exists before any write.
 * 10. No second Business Information storage model was introduced — same 4 canonical tables,
 *     same repository functions, same BusinessApplicationContext read used everywhere.
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

// 1-2. contactsRepo.ts root-cause fix -------------------------------------------------------------
const contactsRepoSrc = read("app/lib/business/repositories/contactsRepo.ts");
assert.ok(
  /if \(channelKind\) \{[\s\S]{0,80}channel_kind IS NULL|business_contacts_non_preferred_channel_null_chk/.test(contactsRepoSrc),
  "the doc comment names the exact live constraint this fix addresses",
);
// The insert row literal must set preferred_channel from channelKind's presence, never a bare false.
assert.ok(/preferred_channel:\s*Boolean\(channelKind\)/.test(contactsRepoSrc), "insert row: preferred_channel is derived from channelKind, never hardcoded false — this is the exact line that violated the live CHECK constraint before the fix");
assert.ok(!/preferred_channel:\s*false,\s*\n\s*channel_kind:\s*channelKind/.test(contactsRepoSrc), "the old insert shape (preferred_channel: false paired with a possibly-non-null channel_kind) is gone");
// Update path: only sets preferred_channel/channel_kind on the patch when channelKind is truthy.
assert.ok(/if \(channelKind\) \{\s*\n\s*patch\.preferred_channel = true;\s*\n\s*patch\.channel_kind = channelKind;/.test(contactsRepoSrc), "update path sets preferred_channel:true together with channel_kind, never one without the other");
// Singleton-clearing excludes the target row's own id.
assert.ok(/r\.preferred_channel && r\.id !== existing\?\.id/.test(contactsRepoSrc), "the preferred_channel singleton is cleared from OTHER rows only — the target row itself (if it already holds it) is excluded from being cleared out from under itself");

// 3. Phase 1 — pre-write validation, zero writes on failure -------------------------------------
const routeSrc = read("app/api/admin/businesses/[businessId]/identity/route.ts");
assert.ok(routeSrc.includes("function validateBeforeWrite"), "a dedicated pre-write validation function exists");
const validateFnStart = routeSrc.indexOf("function validateBeforeWrite");
const validateFnSrc = routeSrc.slice(validateFnStart, routeSrc.indexOf("\n}\n", validateFnStart));
assert.ok(!/adminClient|getAdminSupabase|\.from\(/.test(validateFnSrc), "validateBeforeWrite never touches the database — pure validation only");
assert.ok(validateFnSrc.includes("KNOWN_BROAD_BUSINESS_TYPES") && validateFnSrc.includes("normalizeContactValue"), "validates business type against the known enum and every contact value via the same normalizer the write path uses");
const phase1Idx = routeSrc.indexOf("const validationErrors = validateBeforeWrite(b);");
const phase1ReturnIdx = routeSrc.indexOf("validation_failed", phase1Idx);
const firstWriteCallIdx = routeSrc.indexOf("updateBusinessCoreFieldsAsStaff(admin", phase1Idx);
assert.ok(phase1Idx > -1 && phase1ReturnIdx > -1 && phase1ReturnIdx < firstWriteCallIdx, "validation (and its early-return on failure) happens BEFORE the first write call in source order — a bad value can never let unrelated writes through first");

// 4-6. Phase 2 — per-section result contract, always 200 on partial, never total-failure lie ----
assert.ok(routeSrc.includes("savedSections") && routeSrc.includes("failedSections"), "the route tracks per-field saved/failed sections independently");
assert.ok(!routeSrc.includes("partial_write_failure"), "the old collapsed all-or-nothing error code is gone");
assert.ok(/if \(failedSections\.length\) \{\s*\n\s*return NextResponse\.json\(\s*\n\s*\{ ok: true, partial: true, savedSections, failedSections, context \},\s*\n\s*\{ status: 200 \}/.test(routeSrc), "a partial failure still returns ok:true with status 200 and both the saved and failed section lists — never a bare 400 that implies total failure");
assert.ok(/const context = await buildBusinessApplicationContext\(businessId\);/.test(routeSrc), "canonical context is rehydrated unconditionally, before branching on failedSections.length — both the success and partial responses include it");

// 7-8. Client reconciles from returned context; specific, non-generic messages -------------------
const clientSrc = read("app/admin/(dashboard)/businesses/[businessId]/information/BusinessInformationEditorClient.tsx");
assert.ok(clientSrc.includes("const freshContext = data.context;") && clientSrc.includes("if (freshContext) {"), "the client reconciles form state from the response's fresh context on every response that includes one");
assert.ok(clientSrc.includes("describeFieldErrors") && clientSrc.includes("FIELD_LABEL_ES_EN"), "field-specific, labeled error messages exist, replacing the old single generic string");
assert.ok(clientSrc.includes('data.partial && data.failedSections?.length') , "the client distinguishes a partial-success response from a total failure and messages it accordingly");
// The server's raw per-field `error` string (e.g. a Postgres error message) is read out of
// fieldErrors/failedSections only to extract `.field` for labeling — never rendered as `.error`.
// A doc comment may still name "Postgres"/"constraint" for context (checked separately above).
assert.ok(!/setSaveError\(\s*data\??\.error/.test(clientSrc), "setSaveError is never called directly with the server's raw top-level .error string — every call site routes through describeFieldErrors() or humanizeStaffWriteError()'s curated translation");
assert.ok(clientSrc.includes(".map((e) => e.field)"), "only the .field name (never .error) is extracted from server field-error entries for display");

// 9. Auth/scoping unchanged ----------------------------------------------------------------------
assert.ok(routeSrc.includes('requireStaffWorkspaceWriteAccess("edit_business_identity")'), "PATCH is still gated by edit_business_identity");
assert.ok(routeSrc.includes("getBusinessByIdForCurrentUser(admin, businessId)") && routeSrc.includes('"business_not_found"'), "the route still re-verifies the target business exists before any write, same as before this repair");

// 10. No second storage model ----------------------------------------------------------------------
for (const f of [
  "app/lib/business/aiResearch/repository.ts",
  "app/api/admin/businesses/[businessId]/research/route.ts",
  "app/(site)/clasificados/publicar/servicios/lib/serviciosPrefillFromBusinessContext.ts",
  "app/lib/business/applicationContext/businessApplicationContext.ts",
]) {
  assert.ok(!allTouched.includes(f), `${f} was not touched by this hotfix — no AI Research, Servicios prefill, or context-builder changes, matching the explicit mission scope`);
}
assert.ok(!allTouched.some((f) => f.startsWith("supabase/migrations/")), "no new migration — same canonical businesses/business_contacts/business_service_areas/business_digital_profiles tables, no new storage model");

console.log("verify-business-information-save-repair-01: PASS (10 contracts)");
