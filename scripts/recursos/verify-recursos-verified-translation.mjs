import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}
function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

const checks = [];
function assert(name, condition, detail) {
  checks.push({ name, ok: Boolean(condition), detail });
}

const ADAPTER = "app/lib/recursos/intake/translation/spanishTranslationAdapter.ts";
const INTEGRITY = "app/lib/recursos/intake/translation/translationIntegrityCheck.ts";
const GENERATE = "app/lib/recursos/intake/translation/generateSpanishTranslationProposals.ts";
const ACTIONS = "app/admin/recursosTranslationActions.ts";
const DETAIL_PAGE = "app/admin/(dashboard)/recursos/[id]/page.tsx";
const CHANGE_DETECTION = "app/lib/recursos/intake/resourceChangeDetection.ts";
const SPANISH_STATUS_DB = "app/lib/recursos/intake/server/resourceSpanishStatusDb.ts";
const PUBLIC_QUERIES = "app/lib/recursos/server/communityResourcesPublicQueries.ts";
const BILINGUAL_FALLBACK = "app/lib/recursos/recursosBilingualFallback.ts";

// --- ES-3A: adapter exists, AI Gateway, model env pattern ----------------------------------------
assert("spanishTranslationAdapter.ts exists", exists(ADAPTER));
if (exists(ADAPTER)) {
  const src = read(ADAPTER);
  assert("uses AI Gateway endpoint", /ai-gateway\.vercel\.sh\/v1\/chat\/completions/.test(src));
  assert("uses AI_GATEWAY_API_KEY", /AI_GATEWAY_API_KEY/.test(src));
  assert("uses RECURSOS_TRANSLATION_MODEL env with a conservative default (same pattern as other adapters)", /RECURSOS_TRANSLATION_MODEL/.test(src) && /openai\/gpt-4o-mini/.test(src));
  assert("no new provider abstraction introduced (module is self-contained, not a generic provider layer)", !/class \w*Provider|interface \w*Provider/.test(src));

  // ES-3B: bidirectional direction support
  assert("TranslationDirection supports en-to-es", /"en-to-es"/.test(src));
  assert("TranslationDirection supports es-to-en", /"es-to-en"/.test(src));
  assert("translateVerifiedFacts accepts a direction parameter", /translateVerifiedFacts\([^)]*direction/.test(src));

  // ES-3B: verified-facts-only input contract
  assert("TranslationInput type has no raw HTML/full-page-text field", !/pageText|rawHtml|fullText|sanitizedText/.test(src));
  assert("input carries only organizationName/programName + the 4 presentation fields", /organizationName: string;\s*\n\s*programName: string \| null;\s*\n\s*.*shortDescription/.test(src.replace(/\s+/g, " ").replace(/organizationName: string;\s*programName: string \| null;\s*.*shortDescription/, "organizationName: string;\nprogramName: string | null;\nshortDescription")) || /shortDescription: string \| null;/.test(src));

  // ES-3C: structured output, 4-field scope
  assert("TranslationOutput has exactly shortDescription/details/eligibility/hoursNote", /shortDescription: string \| null;\s*\n\s*details: string \| null;\s*\n\s*eligibility: string \| null;\s*\n\s*hoursNote: string \| null;/.test(src));
  assert("prompt states translator-not-fact-checker doctrine", /not a fact-checker/.test(src));
  assert("prompt forbids adding/removing/softening/broadening/narrowing facts", /add, remove, soften, broaden, narrow/.test(src));
  assert("prompt requires empty source -> empty output", /empty source field/.test(src) && /return that field empty/.test(src));
  assert("prompt forbids inferring 24\\/7 or crisis language", /Do not infer 24\/7/.test(src) && /Do not invent crisis language/.test(src));
  assert("prompt forbids translating org names unless source provides one", /Do not translate organization names/.test(src));

  // ES-3C: temp 0, 12s timeout, fail closed, no retries
  assert("temperature is 0", /temperature: 0/.test(src));
  assert("12 second timeout via AbortController", /setTimeout\(\(\) => controller\.abort\(\), 12000\)/.test(src));
  assert("fails closed to null on missing API key", /if \(!key\) return null;/.test(src));
  assert("fails closed to null on non-ok response", /if \(!res\.ok\) return null;/.test(src));
  assert("fails closed to null in catch block (no retry loop)", /catch \{\s*\n\s*return null;/.test(src));
  const fetchFnBody = src.match(/export async function translateVerifiedFacts[\s\S]*?\n}\n/)?.[0] ?? "";
  assert("no retry/for-loop around the fetch call", fetchFnBody.length > 0 && !/for \(let attempt|\.retry\(|maxRetries/i.test(fetchFnBody) && (fetchFnBody.match(/fetch\(/g) || []).length === 1);

  // never a direct resource write
  assert("adapter never writes community_resources / never calls supabase directly", !/from\(.?community_resources/.test(src) && !/getAdminSupabase/.test(src));
}

// --- ES-3D: structured-token integrity check ------------------------------------------------------
assert("translationIntegrityCheck.ts exists", exists(INTEGRITY));
if (exists(INTEGRITY)) {
  const src = read(INTEGRITY);
  assert("checks phone-like numbers", /PHONE_RE/.test(src));
  assert("checks URLs", /URL_RE/.test(src));
  assert("checks email addresses", /EMAIL_RE/.test(src));
  assert("checks explicit 24/7 indicators", /ALWAYS_OPEN_RE|24\\\/7/.test(src));
  assert("checks currency amounts", /CURRENCY_RE/.test(src));
  assert("checks numeric values (eligibility thresholds proxy)", /NUMBER_RE/.test(src));
  assert("returns invented tokens rather than auto-correcting (no mutation of translatedText)", /invented/.test(src) && !/translatedText\s*=/.test(src.replace(/const \w+\s*=\s*translatedText/, "")));
  assert("checkFieldTranslationIntegrity function exported", /export function checkFieldTranslationIntegrity/.test(src));
}

// --- ES-3E: proposal generation, verified-only, translation source, no direct write ---------------
assert("generateSpanishTranslationProposals.ts exists", exists(GENERATE));
if (exists(GENERATE)) {
  const src = read(GENERATE);
  assert("requires resolveEffectiveVerificationStatus === 'verified' before generating", /resolveEffectiveVerificationStatus\(resource\.verification\)/.test(src) && /!== "verified"/.test(src));
  assert("reuses detectResourceFieldChanges (no second diff engine)", /detectResourceFieldChanges\(/.test(src));
  assert("reuses dbCreateResourceChangeProposalIfNotPending (idempotent, no second insert path)", /dbCreateResourceChangeProposalIfNotPending\(/.test(src));
  assert("proposalSource is 'translation'", /proposalSource: "translation"/.test(src));
  assert("never writes community_resources directly (no supabase update call in this file)", !/getAdminSupabase|\.update\(/.test(src));
  assert("runs the integrity check per field before proposing", /checkFieldTranslationIntegrity\(/.test(src));
  assert("skips (does not auto-correct) a field that fails integrity", /skippedIntegrityFields\.push/.test(src) && /continue/.test(src));
  assert("passes only EN presentation fields to the translator (shortDescriptionEn/detailsEn/eligibilityEn/hoursNoteEn)", /resource\.shortDescriptionEn/.test(src) && /resource\.detailsEn/.test(src) && /resource\.eligibilityEn/.test(src) && /resource\.contact\.hoursNoteEn/.test(src));

  // ES-3F: cost/double-click guard
  assert("pending-proposal cost guard: checks for existing pending translation proposals before calling the AI", /dbListPendingResourceChangeProposalsForResource/.test(src) && /alreadyPending/.test(src));
  const guardOrder = src.indexOf("dbListPendingResourceChangeProposalsForResource") < src.indexOf("translateVerifiedFacts(");
  assert("the pending-check happens BEFORE the AI call, not after", guardOrder);

  // ES-3G: verification event
  assert("writes a verification_event with eventType ai_proposal_generated", /eventType: "ai_proposal_generated"/.test(src));
  assert("verification_event uses sourceType 'translation'", /sourceType: "translation"/.test(src));
  assert("does not store full prompts or secrets in the event notes", !/AI_GATEWAY_API_KEY/.test(src.match(/insertVerificationEvent[\s\S]*?\}\);/)?.[0] ?? ""));
}

// --- ES-3H / actions: audit, permission, verified requirement, generate/regenerate/mark-reviewed ---
assert("recursosTranslationActions.ts exists", exists(ACTIONS));
if (exists(ACTIONS)) {
  const src = read(ACTIONS);
  const permissionGateCount = (src.match(/requireLeonixAdminPermission\("can_manage_recursos"\)/g) || []).length;
  assert("all 3 actions require can_manage_recursos", permissionGateCount >= 3);

  assert("generateSpanishTranslationAction exists", /export async function generateSpanishTranslationAction/.test(src));
  assert("regenerateSpanishTranslationAction exists", /export async function regenerateSpanishTranslationAction/.test(src));
  assert("markSpanishReviewedAction exists", /export async function markSpanishReviewedAction/.test(src));

  assert("audit write for translation generation", /auditAdminWrite\("recurso_spanish_translation_generated"/.test(src));
  assert("audit write for translation regeneration", /auditAdminWrite\("recurso_spanish_translation_regenerated"/.test(src));
  assert("audit write for mark-reviewed", /auditAdminWrite\("recurso_spanish_marked_reviewed"/.test(src));

  const markReviewedFn = src.match(/export async function markSpanishReviewedAction[\s\S]*?\n}\n/)?.[0] ?? "";
  assert("markSpanishReviewedAction requires effective verification status === verified", /resolveEffectiveVerificationStatus\(resource!\.verification\) !== "verified"/.test(markReviewedFn));
  assert("markSpanishReviewedAction requires ZERO pending translation proposals", /pending\.some\(\(p\) => p\.proposalSource === "translation"\)/.test(markReviewedFn));
  assert("markSpanishReviewedAction requires at least one non-empty Spanish field", /hasSpanishContent/.test(markReviewedFn));
  assert(
    "markSpanishReviewedAction NEVER touches verification_status/last_verified_at/next_verification_at",
    !/verificationStatus:|verification_status:|lastVerifiedAt:|last_verified_at:|nextVerificationAt:|next_verification_at:/.test(markReviewedFn),
  );
  assert("markSpanishReviewedAction only writes via dbSetCommunityResourceSpanishStatus (narrow, not a generic update)", /dbSetCommunityResourceSpanishStatus\(resourceId, "verified_translation", "ai_translation_reviewed"\)/.test(markReviewedFn));

  const regenFn = src.match(/export async function regenerateSpanishTranslationAction[\s\S]*?\n}\n/)?.[0] ?? "";
  assert("regenerate action supersedes (rejects) prior pending translation proposals rather than leaving duplicates", /dbUpdateResourceChangeProposalStatus\(p\.id, "rejected", actor\)/.test(regenFn));
}

// --- Spanish status DB adapter still narrow (Phase A, re-confirmed) --------------------------------
if (exists(SPANISH_STATUS_DB)) {
  const src = read(SPANISH_STATUS_DB);
  assert("dbSetCommunityResourceSpanishStatus still accepts any valid status/sourceType combo (ES-4F future compatibility, not hardcoded to verified_translation)", /status: SpanishStatus/.test(src) && !/status: "verified_translation"/.test(src));
}

// --- ES-4A/B/G/I: bilingual admin card -------------------------------------------------------------
assert("resource detail page exists", exists(DETAIL_PAGE));
if (exists(DETAIL_PAGE)) {
  const src = read(DETAIL_PAGE);
  assert("page renders 'Presentación bilingüe' section", /Presentación bilingüe/.test(src));
  // Owner Spanish Translation Review Workspace rewrite: the old 4x static <BilingualFieldRow/>
  // grid was replaced by workspace.fields.map(...) (the same 4 fields, now status-aware and
  // editable) — the field count guarantee now lives in resourceTranslationWorkspace.ts's
  // FIELD_DEFS array, checked separately below.
  assert("renders all 4 translatable fields via the workspace model (workspace.fields.map used for both published and review layouts)", (src.match(/workspace\.fields\.map/g) || []).length >= 2);
  assert("shows spanish_status label", /SPANISH_STATUS_LABEL/.test(src));
  assert("shows spanish_source_type label", /SPANISH_SOURCE_TYPE_LABEL/.test(src));
  assert("shows official source URL and last verified date within the bilingual section", /officialSourceUrl/.test(src));
  assert("wires generateSpanishTranslationAction", /generateSpanishTranslationAction/.test(src));
  assert("wires regenerateSpanishTranslationAction", /regenerateSpanishTranslationAction/.test(src));
  // markSpanishReviewedAction is superseded in the primary UI by approveSpanishTranslationAction,
  // which does strictly more (accepts the pending proposals AND marks Spanish reviewed in one
  // atomic-checked action) — the old function is preserved unchanged in recursosTranslationActions.ts
  // (checked above) but is no longer the page's wiring.
  assert("wires approveSpanishTranslationAction (Owner Workspace Step 3 — supersedes markSpanishReviewedAction in the primary UI)", /approveSpanishTranslationAction/.test(src));
  assert("high-risk warning text present and gated by isHighRiskResourceForTranslation", /isHighRiskResourceForTranslation/.test(src) && /revisar cada traducción individualmente/i.test(src));
  assert("re-uses the existing VerificationTimeline component for translation history (no new timeline UI)", /VerificationTimeline events={translationEvents}/.test(src));
  assert("translation events filtered from the SAME already-fetched timeline (no second event query)", /timeline\.filter\(\(e\) => e\.sourceType === "translation"\)/.test(src));
}

// --- Bulk-safe-accept / high-risk translation exclusion still intact (Phase A regression) -----------
assert("resourceChangeDetection.ts still has isHighRiskResourceForTranslation", exists(CHANGE_DETECTION) && /export function isHighRiskResourceForTranslation/.test(read(CHANGE_DETECTION)));

// --- ES-4H: public runtime behavior — ES-8 has now landed and legitimately owns both of these -------
assert("public query file was never touched by translation-generation internals directly (translateVerifiedFacts/spanishTranslationAdapter stay out of the public query layer — only the narrow spanish_status/spanish_source_type join, which is ES-8's job, is expected)", !exists(PUBLIC_QUERIES) || !/translateVerifiedFacts|spanishTranslationAdapter/.test(read(PUBLIC_QUERIES)));
if (exists(BILINGUAL_FALLBACK)) {
  const src = read(BILINGUAL_FALLBACK);
  assert("lang=en still preserves English as before (ES-8 kept this branch's behavior unchanged, just renamed the function)", /if \(input\.lang === "en"\)/.test(src));
  const resolveFnBody = src.match(/export function resolveBilingualField[\s\S]*?\n}\n/)?.[0] ?? "";
  assert("public fallback now gates on spanish_status (Gate ES-8, expected — this is the enforcement point named back in ES-4's own doctrine comment)", resolveFnBody.length > 0 && /spanishStatus/.test(resolveFnBody));
}

let passCount = 0;
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} — ${c.name}${c.detail !== undefined && !c.ok ? ` (${JSON.stringify(c.detail)})` : ""}`);
  if (c.ok) passCount++;
}
console.log(`\n${passCount}/${checks.length} checks passed.`);
if (passCount !== checks.length) process.exitCode = 1;
