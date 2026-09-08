#!/usr/bin/env node
/**
 * Existing Resource Official-Spanish Bridge — Gate ES-9 verifier. Static source checks only (no
 * DB/network) — same doctrine as every other verify-recursos-*.mjs in this repo. Behavioral
 * (actually-executed) coverage for the pure integrity-check logic lives separately in
 * test-recursos-official-spanish-integrity-pure-cases.ts (run via `npx tsx`), since
 * prepareOfficialSpanishProposals.ts and the admin actions are "server-only"/"use server" and
 * cannot be safely imported outside a Next.js server context.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

const checks = [];
function assert(name, ok, detail) {
  checks.push({ name, ok, detail });
}
function read(relPath) {
  const p = join(ROOT, relPath);
  if (!existsSync(p)) return null;
  return readFileSync(p, "utf8");
}
function exists(relPath) {
  return existsSync(join(ROOT, relPath));
}

const MIGRATION_GLOB_HIT = "supabase/migrations/20260821140000_recursos_official_spanish_bridge.sql";
const CHANGE_DETECTION = "app/lib/recursos/intake/resourceChangeDetection.ts";
const INTEGRITY_CHECK = "app/lib/recursos/intake/translation/translationIntegrityCheck.ts";
const PREPARE = "app/lib/recursos/intake/translation/prepareOfficialSpanishProposals.ts";
const OFFICIAL_ACTIONS = "app/admin/recursosOfficialSpanishActions.ts";
const TRANSLATION_ACTIONS = "app/admin/recursosTranslationActions.ts";
const QUEUE = "app/lib/recursos/intake/spanishReconciliationQueue.ts";
const ESPANOL_PAGE = "app/admin/(dashboard)/recursos/espanol/page.tsx";
const ID_PAGE = "app/admin/(dashboard)/recursos/[id]/page.tsx";
const CHANGE_ACTIONS = "app/admin/recursosChangeProposalActions.ts";
const CAMBIOS_PAGE = "app/admin/(dashboard)/recursos/cambios/page.tsx";
const HISTORICAL_VERIFIER = "scripts/recursos/verify-recursos-spanish-bridge-foundation.mjs";
const RECONCILIATION_VERIFIER = "scripts/recursos/verify-recursos-spanish-reconciliation.mjs";
const PURE_TEST = "scripts/recursos/test-recursos-official-spanish-integrity-pure-cases.ts";

// ---------- Gate 1: migration (additive only) ----------
assert("new migration file exists", exists(MIGRATION_GLOB_HIT));
if (exists(MIGRATION_GLOB_HIT)) {
  const src = read(MIGRATION_GLOB_HIT);
  assert("widens the CHECK to include official_spanish", /check \(proposal_source in \([\s\S]{0,200}?'official_spanish'/.test(src));
  assert("preserves every historical value (pdf_reextraction, url_recheck, partner_request, manual, translation)", ["pdf_reextraction", "url_recheck", "partner_request", "manual", "translation"].every((v) => src.includes(`'${v}'`)));
  assert("uses drop-constraint-if-exists + re-add (same precedent as ES-1B)", /drop constraint if exists resource_change_proposals_proposal_source_check/.test(src));
  assert("no new table created", !/create table/i.test(src));
  assert("no new column added", !/add column/i.test(src));
  assert("no RLS statement (no alter table ... enable row level security / policy)", !/enable row level security|create policy/i.test(src));
  assert("no destructive statement (drop table/truncate/delete/update)", !/drop table|truncate|delete from|^\s*update\s/im.test(src));
  assert("no Production project ref", !/xuieateniufcrsfdomwl/.test(src));
}
assert("historical migration file untouched by this gate (not read/matched as if it were rewritten)", exists("supabase/migrations/20260821090000_recursos_spanish_bridge_foundation.sql"));

// ---------- Gate 2: type + generic bulk safety ----------
assert("resourceChangeDetection.ts exists", exists(CHANGE_DETECTION));
if (exists(CHANGE_DETECTION)) {
  const src = read(CHANGE_DETECTION);
  assert("ProposalSource includes official_spanish", /export type ProposalSource = [\s\S]{0,10}?"pdf_reextraction"[\s\S]*?"official_spanish"/.test(src));
}
assert("recursosChangeProposalActions.ts exists", exists(CHANGE_ACTIONS));
if (exists(CHANGE_ACTIONS)) {
  const src = read(CHANGE_ACTIONS);
  const bulkFn = src.match(/export async function acceptAllSafeChangeProposalsAction[\s\S]*?\n}\n/)?.[0] ?? "";
  assert("generic bulk-safe factual accept excludes proposalSource === 'official_spanish'", /proposalSource !== "official_spanish"/.test(bulkFn));
  assert("generic bulk-safe factual accept STILL excludes proposalSource === 'translation' (not replaced)", /proposalSource !== "translation"/.test(bulkFn));
  assert("both exclusions combined with AND in the same filter", /proposalSource !== "translation" && p\.proposalSource !== "official_spanish"/.test(bulkFn));
}

// ---------- Gate 3: official Spanish integrity ----------
assert("translationIntegrityCheck.ts exists", exists(INTEGRITY_CHECK));
if (exists(INTEGRITY_CHECK)) {
  const src = read(INTEGRITY_CHECK);
  assert("checkOfficialSpanishFieldIntegrity exported", /export function checkOfficialSpanishFieldIntegrity/.test(src));
  assert("checkFieldTranslationIntegrity (existing) is NOT removed or renamed", /export function checkFieldTranslationIntegrity/.test(src));
  assert("compares against STRUCTURED FACTS, not the English prose field alone (takes an OfficialSpanishStructuredFacts param)", /checkOfficialSpanishFieldIntegrity\(facts: OfficialSpanishStructuredFacts/.test(src));
  const fnBody = src.match(/export function checkOfficialSpanishFieldIntegrity[\s\S]*?\n}/)?.[0] ?? "";
  assert("never auto-corrects/writes (no assignment to the proposed text parameter)", fnBody.length > 0 && !/proposedEsText\s*=(?!=)/.test(fnBody));
  assert("reuses the shared token extractor (no second regex set duplicated)", /allowedStructuredTokens\(facts\)/.test(fnBody) || /extractTokens/.test(src));
  assert("is24Hours=true adds the always-open token (never unconditionally)", /if \(facts\.is24Hours === true\)/.test(src));
}
assert("behavioral pure-case test file exists for the integrity check (actually executed via tsx, not just regex-matched)", exists(PURE_TEST));

// ---------- Gate 4: prepareOfficialSpanishProposals ----------
assert("prepareOfficialSpanishProposals.ts exists", exists(PREPARE));
if (exists(PREPARE)) {
  const src = read(PREPARE);
  assert("server-only", /import "server-only"/.test(src));
  assert("checks effective verification status = verified before any write", /resolveEffectiveVerificationStatus\(resource\.verification\)/.test(src) && /!== "verified"/.test(src));
  assert("uses the REAL isHighRiskResourceForTranslation helper (not a proxy field like urgencyLevel)", /isHighRiskResourceForTranslation\(\{/.test(src));
  assert("refuses when high-risk, before any proposal is created", /if \(highRisk\)/.test(src));
  assert("refuses when spanish_status is already official_spanish (no silent overwrite of published official Spanish)", /spanishStatus === "official_spanish"/.test(src));
  assert("requires a non-empty source URL", /sourceUrl = input\.sourceUrl\.trim\(\)/.test(src) && /if \(!sourceUrl\)/.test(src));
  assert("requires at least one supplied ES field", /if \(suppliedFields\.length === 0\)/.test(src));
  assert("checks for a conflicting pending translation OR official_spanish proposal on the same field before creating a new one", /p\.proposalSource === "translation" \|\| p\.proposalSource === "official_spanish"/.test(src));
  assert("uses the existing idempotent proposal creator (no second insert path)", /dbCreateResourceChangeProposalIfNotPending/.test(src));
  assert("never AI-generates missing content (no translation-adapter import)", !/translateVerifiedFacts|spanishTranslationAdapter/.test(src));
  assert("only creates a proposal for a field that actually passed integrity (rejects that field alone, never fills blanks)", /skippedIntegrityFields\.push/.test(src) && /continue; \/\/ reject this field only/.test(src));
  assert("sets spanish_status to needs_translation_review, never directly to official_spanish (only the confirmation core may do that)", /dbSetCommunityResourceSpanishStatus\(resource\.id, "needs_translation_review", input\.sourceType\)/.test(src));
  assert("records provenance via verification_events (evidence_recorded, with sourceUrl/sourceType)", /eventType: "evidence_recorded"/.test(src) && /sourceUrl,/.test(src));
  assert("no Production project ref", !/xuieateniufcrsfdomwl/.test(src));
}

// ---------- Gate 5/6: server actions + shared confirmation core ----------
assert("recursosOfficialSpanishActions.ts exists", exists(OFFICIAL_ACTIONS));
if (exists(OFFICIAL_ACTIONS)) {
  const src = read(OFFICIAL_ACTIONS);
  assert("\"use server\"", /"use server"/.test(src));
  assert("attachOfficialSpanishSourceAction exported and requires can_manage_recursos", /export async function attachOfficialSpanishSourceAction/.test(src) && /requireLeonixAdminPermission\("can_manage_recursos"\)/.test(src));
  assert("approveOfficialSpanishBatchAction exported and requires can_manage_recursos", /export async function approveOfficialSpanishBatchAction/.test(src));
  assert("batch capped via the SHARED MAX_BULK_SPANISH_DRAFT_BATCH constant (no second cap invented)", /MAX_BULK_SPANISH_DRAFT_BATCH/.test(src) && /\.slice\(0, MAX_BULK_SPANISH_DRAFT_BATCH\)/.test(src));
  assert("per-resource try/catch in the batch loop — one failure does not abort the rest", /for \(const entry of batch\)[\s\S]{0,80}try\s*\{/.test(src));
  assert("calls the SHARED confirmOfficialSpanishCore (no divergent second confirmation implementation)", /confirmOfficialSpanishCore\(/.test(src));
  assert("re-checks effective verification status live at approval time (not trusting the snapshot alone)", /resolveEffectiveVerificationStatus\(resource\.verification\)/.test(src));
  assert("re-checks high-risk live at approval time (defense-in-depth, not relying on attach-time guard alone)", /isHighRiskResourceForTranslation\(\{/.test(src));
  assert("re-checks integrity against CURRENT structured facts at approval time (not the value captured at attach time)", /checkOfficialSpanishFieldIntegrity\(/.test(src) && /buildOfficialSpanishStructuredFacts\(resource\)/.test(src));
  assert("a resource that fails re-validation is skipped, not published (result.ok check before any field write)", /if \(!result\.ok\)/.test(src) || /return \{ ok: false/.test(src));
  assert("emits field_accepted events with sourceType official_spanish (distinct from translation's audit trail)", /sourceType: "official_spanish"/.test(src));
  assert("auditAdminWrite called for both the attach gesture and the batch gesture", (src.match(/auditAdminWrite\(/g) || []).length >= 2);
  assert("no Production project ref", !/xuieateniufcrsfdomwl/.test(src));
}
assert("recursosTranslationActions.ts exists", exists(TRANSLATION_ACTIONS));
if (exists(TRANSLATION_ACTIONS)) {
  const src = read(TRANSLATION_ACTIONS);
  assert("confirmOfficialSpanishCore exported (extracted, reusable core)", /export async function confirmOfficialSpanishCore/.test(src));
  assert("confirmOfficialSpanishAction (form-bound) delegates to the core, not a duplicated copy of the checks", /confirmOfficialSpanishAction[\s\S]{0,400}confirmOfficialSpanishCore\(resourceId, actor\)/.test(src));
  assert("core still requires spanish_source_type to already be official_* before it can run (precondition preserved)", /sourceType !== "official_spanish_source" && sourceType !== "official_bilingual_source"/.test(src));
  assert("core still refuses when a pending Spanish-field proposal exists", /SPANISH_FIELDS\.has\(p\.fieldName\)/.test(src));
  assert("AI translation actions untouched: generateSpanishTranslationAction still present", /export async function generateSpanishTranslationAction/.test(src));
  assert("AI translation actions untouched: regenerateSpanishTranslationAction still present", /export async function regenerateSpanishTranslationAction/.test(src));
  assert("AI translation actions untouched: markSpanishReviewedAction still present", /export async function markSpanishReviewedAction/.test(src));
  assert("AI translation actions untouched: editTranslationProposalAction still present", /export async function editTranslationProposalAction/.test(src));
  assert("AI translation actions untouched: approveSpanishTranslationAction still present", /export async function approveSpanishTranslationAction/.test(src));
  assert("approveSpanishTranslationAction's translation-only filter is untouched (still 'translation' only, not widened)", /pendingTranslations = pending\.filter\(\(p\) => p\.proposalSource === "translation"\);/.test(src));
}

// ---------- Gate 7: reconciliation model (spot checks — full coverage lives in verify-recursos-spanish-reconciliation.mjs) ----------
assert("spanishReconciliationQueue.ts exists", exists(QUEUE));
if (exists(QUEUE)) {
  const src = read(QUEUE);
  assert("isEligibleForOfficialSpanishBatchApproval exported", /export function isEligibleForOfficialSpanishBatchApproval/.test(src));
  assert("existing FUENTE_OFICIAL_ES / officialSpanishAwaitingConfirmation classification reused, not replaced", /officialSpanishAwaitingConfirmation/.test(src) && /FUENTE_OFICIAL_ES/.test(src));
  assert("MAX_BULK_SPANISH_DRAFT_BATCH still = 20 (shared cap, not duplicated)", /MAX_BULK_SPANISH_DRAFT_BATCH\s*=\s*20/.test(src));
}

// ---------- Gate 8: espanol command center ----------
assert("espanol/page.tsx exists", exists(ESPANOL_PAGE));
if (exists(ESPANOL_PAGE)) {
  const src = read(ESPANOL_PAGE);
  assert("imports approveOfficialSpanishBatchAction (reused, not reinvented)", /approveOfficialSpanishBatchAction/.test(src));
  assert("batch CTA text present", /Aprobar español oficial y publicar/.test(src));
  assert("shows source URL for FUENTE_OFICIAL_ES rows", /officialSourceUrl/.test(src));
  assert("shows an integrity PASS/HOLD indicator", /Integridad: PASS/.test(src) && /Integridad: HOLD/.test(src));
  assert("EN and ES are paired per FIELD (not all EN then all ES) — each field's own block contains both labels", /EN \(actual\)[\s\S]{0,400}ES \(propuesto, fuente oficial\)/.test(src));
  assert("result banner reports requested/processed/published/skipped/failed", ["requested", "processed", "published", "skipped", "failed"].every((k) => src.includes(k)));
  assert("result banner names the exact resource + reason for every skip/failure (no silent count-only banner)", /oficialBatchSummary\.skipped\.map/.test(src) && /oficialBatchSummary\.failed\.map/.test(src));
  assert("batch checkbox targets a form distinct from the translation-draft batch form (bulk-official-spanish-form)", /form="bulk-official-spanish-form"/.test(src));
  assert("no new dashboard route created — extends the existing /admin/recursos/espanol page only", exists(ESPANOL_PAGE) && !exists("app/admin/(dashboard)/recursos/espanol-oficial/page.tsx"));
}

// ---------- Gate 9: resource detail workspace ----------
assert("[id]/page.tsx exists", exists(ID_PAGE));
if (exists(ID_PAGE)) {
  const src = read(ID_PAGE);
  assert("imports attachOfficialSpanishSourceAction", /attachOfficialSpanishSourceAction/.test(src));
  assert("source URL input present", /name="sourceUrl"/.test(src));
  assert("source type select present with both official_spanish_source and official_bilingual_source options", /name="sourceType"/.test(src) && /official_spanish_source/.test(src) && /official_bilingual_source/.test(src));
  assert("all four optional ES fields present (shortDescriptionEs/detailsEs/eligibilityEs/hoursNoteEs)", ["shortDescriptionEs", "detailsEs", "eligibilityEs", "hoursNoteEs"].every((f) => src.includes(f)));
  assert("attach control gated on NOT high-risk (canAttachOfficialSpanishSource requires !highRisk)", /canAttachOfficialSpanishSource = isVerified && !highRisk/.test(src));
  assert("attach control gated on already-verified", /canAttachOfficialSpanishSource = isVerified/.test(src));
  assert("attach control never offered once spanish_status is already official_spanish", /spanishStatus !== "official_spanish";\s*\n\s*const pendingOfficialSpanishOnPage/.test(src));
}

// ---------- Gate 10: Cambios truthful presentation ----------
assert("cambios/page.tsx exists", exists(CAMBIOS_PAGE));
if (exists(CAMBIOS_PAGE)) {
  const src = read(CAMBIOS_PAGE);
  assert("SOURCE_LABEL includes a truthful official_spanish entry (never falls back to the raw string)", /official_spanish: "Fuente oficial ES"/.test(src));
  assert("official_spanish is its own tab bucket, never merged into 'datos' (factual)", /tipo === "oficial_es"/.test(src));
  assert("'datos' tab explicitly excludes official_spanish (three-way split, not binary)", /proposalSource !== "translation" && p\.proposalSource !== "official_spanish"/.test(src));
  assert("translation tab semantics unchanged (still filters strictly on proposalSource === 'translation')", /tipo === "traducciones"\s*\n\s*\? allRows\.filter\(\(p\) => p\.proposalSource === "translation"\)/.test(src));
  assert("high-risk defense-in-depth badge now also covers official_spanish rows, not just translation", /\(isTranslation \|\| isOfficialSpanish\) && isHighRiskResourceForTranslation/.test(src));
}

// ---------- Gate 11/12: historical + reconciliation verifiers updated ----------
assert("historical verifier (verify-recursos-spanish-bridge-foundation.mjs) exists and was extended, not weakened", exists(HISTORICAL_VERIFIER));
if (exists(HISTORICAL_VERIFIER)) {
  const src = read(HISTORICAL_VERIFIER);
  assert("still asserts the historical 5-value ES-1B prefix against the untouched historical migration file", /pdf_reextraction.*url_recheck.*partner_request.*manual.*translation/.test(src.replace(/\n/g, " ")));
  assert("additionally asserts the CURRENT ProposalSource union also contains official_spanish (forward-compatible supersession, not a rewrite of history)", /ALSO includes official_spanish/.test(src));
}
assert("reconciliation verifier (verify-recursos-spanish-reconciliation.mjs) exists and asserts the new three-way pending split semantically", exists(RECONCILIATION_VERIFIER));
if (exists(RECONCILIATION_VERIFIER)) {
  const src = read(RECONCILIATION_VERIFIER);
  assert("asserts pendingFactualCount excludes translation (semantic window match, not one brittle exact-source regex)", /pendingFactualCount excludes translation-sourced pending proposals/.test(src));
  assert("asserts pendingFactualCount ALSO excludes official_spanish", /pendingFactualCount ALSO excludes official_spanish-sourced pending proposals/.test(src));
  assert("asserts pendingOfficialSpanish data is exposed for the owner workspace", /pendingOfficialSpanish proposal rows are exposed/.test(src));
}

// ---------- No Production references anywhere in this gate's new/changed files ----------
for (const f of [CHANGE_DETECTION, INTEGRITY_CHECK, PREPARE, OFFICIAL_ACTIONS, TRANSLATION_ACTIONS, QUEUE, ESPANOL_PAGE, ID_PAGE, CHANGE_ACTIONS, CAMBIOS_PAGE]) {
  if (!exists(f)) continue;
  assert(`${f}: no Production project ref (xuieateniufcrsfdomwl)`, !/xuieateniufcrsfdomwl/.test(read(f)));
}

// ---------- Gate ES-QA1: final end-to-end QA fixes ----------
const COMMAND_CENTER_PAGE = "app/admin/(dashboard)/recursos/page.tsx";
const FILTER_BAR = "app/admin/_components/recursos/RecursosFilterBar.tsx";

// Bug 1 — search scroll jump
assert("RecursosFilterBar.tsx exists", exists(FILTER_BAR));
if (exists(FILTER_BAR)) {
  const src = read(FILTER_BAR);
  // Matches to end-of-statement (;) rather than first ")" — router.push's first argument is a
  // template literal containing its own parens (params.toString()), which a naive [^)]* stops at.
  const pushCalls = src.match(/router\.push\([^;]*\);/g) ?? [];
  assert("at least one router.push call found in the filter bar", pushCalls.length > 0);
  assert("every router.push call preserves scroll position ({ scroll: false }) — filtering must never yank the operator to the top", pushCalls.length > 0 && pushCalls.every((c) => /\{\s*scroll:\s*false\s*\}/.test(c)));
}

// Bug 2 — responsive admin layout / clipped actions
assert("admin command center page exists", exists(COMMAND_CENTER_PAGE));
if (exists(COMMAND_CENTER_PAGE)) {
  const src = read(COMMAND_CENTER_PAGE);
  assert("desktop table Actions column is sticky (stays reachable regardless of horizontal scroll)", /sticky right-0[\s\S]{0,150}Actions/.test(src));
  assert("desktop table Actions cells are ALSO sticky (header alone isn't enough — the body cells must match)", (src.match(/sticky right-0/g) ?? []).length >= 2);
  assert("table min-width trimmed from the original 1200px", !/min-w-\[1200px\]/.test(src));

  // Bug 5 — resource name clickable
  assert(
    "organization name links to the resource detail page (desktop table)",
    /<Link href={`\/admin\/recursos\/\$\{r\.id\}`} className="font-semibold text-\[#1E1810\][\s\S]{0,80}>\s*\{r\.organizationName\}/.test(src),
  );
  assert("Editar action preserved alongside the new name link (not replaced)", /Editar/.test(src) && /Ver público/.test(src));

  // Bug 6 — duplicate Deactivate control
  assert(
    "VerificationActions no longer offers a redundant 'inactive' status option (ActiveToggle is the single Activate/Deactivate control)",
    !/status: "inactive"/.test(src),
  );
  assert("ActiveToggle (the real Activate/Deactivate control) still exists and is wired", /function ActiveToggle/.test(src) && /setResourceActiveAction/.test(src));
}

// Bug 3 — official-source textareas too small
assert("[id]/page.tsx exists", exists(ID_PAGE));
if (exists(ID_PAGE)) {
  const src = read(ID_PAGE);
  assert("official-Spanish attach textareas no longer use the too-small rows={2}", !/rows={2}[\s\S]{0,40}className="mt-1 w-full/.test(src));
  assert("official-Spanish attach textareas have a usable min-height and are resizable", /min-h-\[9rem\][\s\S]{0,40}resize-y/.test(src) || /resize-y[\s\S]{0,120}min-h-\[9rem\]/.test(src));
}

// Bug 4 — batch result summary bug (root cause: duplicate individual-confirm button on the same
// FUENTE_OFICIAL_ES row as the batch checkbox, not a serialization defect — the batch summary
// object itself was always computed correctly; a genuinely-empty batch now says so honestly).
assert("espanol/page.tsx exists", exists(ESPANOL_PAGE));
if (exists(ESPANOL_PAGE)) {
  const src = read(ESPANOL_PAGE);
  assert(
    "individual FUENTE_OFICIAL_ES confirm button is gated OFF whenever the batch checkbox is also offered (no duplicate action on the same row)",
    /queueStatus === "FUENTE_OFICIAL_ES" && !eligibleForOfficialSpanishBatch/.test(src),
  );
  assert("a zero-item batch result shows an honest explanation instead of a bare 0/0 banner", /requested === 0/.test(src) && /ya se hayan confirmado individualmente/.test(src));
  assert("non-zero batch results still show the full requested/processed/published/skipped/failed breakdown", /oficialBatchSummary\.processed\}\/\{oficialBatchSummary\.requested\}/.test(src));
}

let passCount = 0;
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} — ${c.name}${c.detail !== undefined && !c.ok ? ` (${JSON.stringify(c.detail)})` : ""}`);
  if (c.ok) passCount++;
}
console.log(`\n${passCount}/${checks.length} checks passed.`);
if (passCount !== checks.length) process.exitCode = 1;
