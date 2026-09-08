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

const HTML_EXTRACTION = "app/lib/recursos/intake/htmlExtraction.ts";
const URL_PROPOSAL = "app/lib/recursos/intake/urlCandidateProposal.ts";
const URL_AI_ADAPTER = "app/lib/recursos/intake/aiProposalAdapter.ts";
const PDF_AI_ADAPTER = "app/lib/recursos/intake/pdfOrganizationAiAdapter.ts";
const PROMOTE_ACTION = "app/admin/recursosUrlCandidateActions.ts";
const SOURCE_INGESTION = "app/lib/recursos/sourceIngestion.ts";
const TRANSLATION_ACTIONS = "app/admin/recursosTranslationActions.ts";
const DETAIL_PAGE = "app/admin/(dashboard)/recursos/[id]/page.tsx";
const REVERIFY = "app/lib/recursos/intake/reverifyResourceViaUrl.ts";
const PUBLIC_QUERIES = "app/lib/recursos/server/communityResourcesPublicQueries.ts";
const BILINGUAL_FALLBACK = "app/lib/recursos/recursosBilingualFallback.ts";

// --- ES-5A: language detection ------------------------------------------------------------------
assert("htmlExtraction.ts exists", exists(HTML_EXTRACTION));
if (exists(HTML_EXTRACTION)) {
  const src = read(HTML_EXTRACTION);
  assert("DetectedLanguage type exists", /export type DetectedLanguage = "en" \| "es" \| "bilingual" \| "unknown"/.test(src));
  assert("detectSourceLanguage (HTML variant) exists", /export function detectSourceLanguage\(/.test(src));
  assert("detectSourceLanguageFromText (text-only variant, reusable for PDF) exists", /export function detectSourceLanguageFromText\(/.test(src));
  assert("uses <html lang> attribute as one signal", /extractHtmlLangAttribute|lang=\[.*a-zA-Z-/.test(src));
  assert("uses a SET of multiple stopwords, not a single word (avoids one-word reliance)", /SPANISH_STOPWORDS = new Set\(\[[\s\S]{100,}?\]\)/.test(src));
  assert("DeterministicSignals carries detectedLanguage", /detectedLanguage: DetectedLanguage/.test(src));
  assert("extractDeterministicSignals actually calls detectSourceLanguage", /detectedLanguage: detectSourceLanguage\(html, text\)/.test(src));
  assert("language detection is documented as advisory, not factual verification", /advisory only, never factual verification|advisory, not/.test(src));
}

// --- ES-5C: URL proposal carries Spanish fields ---------------------------------------------------
assert("urlCandidateProposal.ts exists", exists(URL_PROPOSAL));
if (exists(URL_PROPOSAL)) {
  const src = read(URL_PROPOSAL);
  for (const f of ["shortDescriptionEs", "detailsEs", "eligibilityEs", "hoursNoteEs"]) {
    assert(`UrlCandidateProposal type includes ${f}`, new RegExp(`${f}: string \\| null;`).test(src));
  }
  assert("UrlCandidateProposal carries detectedSourceLanguage metadata", /detectedSourceLanguage: DetectedLanguage;/.test(src));
  assert("UrlCandidateProposal carries spanishIsOfficialSource metadata", /spanishIsOfficialSource: boolean;/.test(src));
  assert("new fields are in FIELD_KEYS (generic jsonb cargo-bay encoder, no schema change needed)", /"shortDescriptionEs",\s*\n\s*"detailsEs",\s*\n\s*"eligibilityEs",\s*\n\s*"hoursNoteEs",/.test(src));
  assert("decodeProposalFromDiscrepancies restores the new fields with safe defaults", /shortDescriptionEs: get\("shortDescriptionEs"\)/.test(src) && /spanishIsOfficialSource: get\("spanishIsOfficialSource"\) === "true"/.test(src));
}

// --- ES-5B: URL AI proposal contract is language-conditional + defense-in-depth --------------------
assert("aiProposalAdapter.ts exists", exists(URL_AI_ADAPTER));
if (exists(URL_AI_ADAPTER)) {
  const src = read(URL_AI_ADAPTER);
  assert("system prompt instructs Spanish extraction (not translation) for es sources", /If the source is SPANISH: extract/.test(src));
  assert("system prompt instructs both-language extraction for bilingual sources", /If the source is BILINGUAL/.test(src));
  assert("system prompt forbids generating Spanish for English sources at intake time", /If the source is ENGLISH.*leave ALL Spanish fields.*null/s.test(src) || /Do NOT translate the English content into Spanish/.test(src));
  assert("parseAiProposalJson accepts a detectedLanguage parameter", /parseAiProposalJson\(raw: string, officialSourceUrl: string, detectedLanguage: DetectedLanguage/.test(src));
  assert(
    "defense-in-depth: Es fields are forcibly null unless detectedLanguage is es/bilingual, regardless of what the model returns",
    /sourceMayHaveSpanish = detectedLanguage === "es" \|\| detectedLanguage === "bilingual"/.test(src) && /sourceMayHaveSpanish \? str\(o\.shortDescriptionEs\) : null/.test(src),
  );
  assert("proposeCandidateFieldsWithAi passes signals.detectedLanguage through to the parser", /parseAiProposalJson\(content, officialSourceUrl, signals\.detectedLanguage\)/.test(src));
}

// --- ES-5D: PDF AI proposal contract mirrors the URL one -------------------------------------------
assert("pdfOrganizationAiAdapter.ts exists", exists(PDF_AI_ADAPTER));
if (exists(PDF_AI_ADAPTER)) {
  const src = read(PDF_AI_ADAPTER);
  assert("system prompt has the same 3-way language-conditional Spanish rule", /If the batch is SPANISH/.test(src) && /If the batch is BILINGUAL/.test(src) && /If the batch is ENGLISH/.test(src));
  assert("computes detected language once per batch via detectSourceLanguageFromText (no <html lang> available for PDF text)", /detectSourceLanguageFromText\(combinedText\)/.test(src));
  assert("parseOneOrganization applies the same defense-in-depth Es gating as the URL adapter", /sourceMayHaveSpanish = detectedLanguage === "es" \|\| detectedLanguage === "bilingual"/.test(src));
  assert("PdfOrganizationProposal inherits the new fields via the UrlCandidateProposal intersection type (no duplicate type)", /export type PdfOrganizationProposal = UrlCandidateProposal & \{/.test(src));
}

// --- ES-5F: promotion no longer hardcodes Spanish blank, preserves when present ----------------------
assert("recursosUrlCandidateActions.ts exists", exists(PROMOTE_ACTION));
if (exists(PROMOTE_ACTION)) {
  const src = read(PROMOTE_ACTION);
  const promoteFn = src.match(/export async function promoteUrlCandidateAction[\s\S]*?\n}\n/)?.[0] ?? "";
  assert("promotion no longer hardcodes shortDescriptionEs to \"\" unconditionally", !/shortDescriptionEs: "",/.test(promoteFn));
  assert("promotion preserves proposal.shortDescriptionEs when present", /shortDescriptionEs: proposal\.shortDescriptionEs \?\? ""/.test(promoteFn));
  assert("promotion preserves proposal.detailsEs/eligibilityEs/hoursNoteEs when present", /detailsEs: proposal\.detailsEs \?\? null/.test(promoteFn) && /eligibilityEs: proposal\.eligibilityEs \?\? null/.test(promoteFn) && /hoursNoteEs: proposal\.hoursNoteEs \?\? null/.test(promoteFn));
  assert("hasOfficialSpanish gate requires spanishIsOfficialSource=true (not just any stray Es text)", /proposal\.spanishIsOfficialSource && Boolean\(proposal\.shortDescriptionEs/.test(promoteFn));

  // ES-5G: initial status after promotion
  assert("official-Spanish promotion sets spanish_status to needs_translation_review (never official_spanish directly)", /dbSetCommunityResourceSpanishStatus\(result\.id, "needs_translation_review", sourceType\)/.test(promoteFn));
  assert("never auto-sets official_spanish at promotion time", !/"official_spanish"/.test(promoteFn.replace(/\/\/.*$/gm, "")));
  assert("source type is official_spanish_source or official_bilingual_source depending on evidence", /proposal\.detectedSourceLanguage === "bilingual" \? "official_bilingual_source" : "official_spanish_source"/.test(promoteFn));
  assert("promotion status-setting is conditional on hasOfficialSpanish (never unconditional)", /if \(hasOfficialSpanish\)/.test(promoteFn));
}

// --- ES-5F: static 2023 dataset audited, correctly left unmodified -----------------------------------
assert("sourceIngestion.ts exists", exists(SOURCE_INGESTION));
if (exists(SOURCE_INGESTION)) {
  const src = read(SOURCE_INGESTION);
  assert("candidateToResourceDraft() carries an explicit ES-5F audit comment explaining why it's unmodified", /Gate ES-5F.*audited, not modified/s.test(src));
  assert("CandidateResourceRecord.suggestedDescriptionEs remains hard-typed null (static dataset untouched)", /suggestedDescriptionEs: null;/.test(src));
}

// --- ES-5H: confirm-official-Spanish action, permission, factual verification unchanged --------------
// Existing Resource Official-Spanish Bridge (Gate ES-9F, PM-authorized): the safety-check logic
// that used to live inline inside confirmOfficialSpanishAction was extracted into a shared,
// reusable confirmOfficialSpanishCore so approveOfficialSpanishBatchAction can call the exact same
// implementation instead of a divergent second copy. The logic itself is unchanged (extraction,
// not a behavior change) — these assertions now look for it in the CORE, and separately confirm
// the form-bound wrapper still requires can_manage_recursos and actually delegates to that core.
assert("recursosTranslationActions.ts exists", exists(TRANSLATION_ACTIONS));
if (exists(TRANSLATION_ACTIONS)) {
  const src = read(TRANSLATION_ACTIONS);
  assert("confirmOfficialSpanishAction exists", /export async function confirmOfficialSpanishAction/.test(src));
  assert("confirmOfficialSpanishCore exists (extracted, reusable core)", /export async function confirmOfficialSpanishCore/.test(src));
  const wrapperFn = src.match(/export async function confirmOfficialSpanishAction[\s\S]*?\n}\n/)?.[0] ?? "";
  const coreFn = src.match(/export async function confirmOfficialSpanishCore[\s\S]*?\n}\n/)?.[0] ?? "";
  assert("wrapper requires can_manage_recursos", /requireLeonixAdminPermission\("can_manage_recursos"\)/.test(wrapperFn));
  assert("wrapper delegates to the shared core (no duplicated safety-check logic)", /confirmOfficialSpanishCore\(resourceId, actor\)/.test(wrapperFn));
  assert("core requires effective verification status = verified", /resolveEffectiveVerificationStatus\(resource\.verification\) !== "verified"/.test(coreFn));
  assert("core requires Spanish presentation content to exist", /hasSpanishContent/.test(coreFn));
  assert("core requires official Spanish/bilingual evidence already recorded (never sets source_type itself)", /sourceType !== "official_spanish_source" && sourceType !== "official_bilingual_source"/.test(coreFn));
  assert("core requires no unresolved pending proposals on Spanish fields", /SPANISH_FIELDS\.has\(p\.fieldName\)/.test(coreFn));
  assert("core sets spanish_status to official_spanish, preserving (not overwriting) the existing source_type", /dbSetCommunityResourceSpanishStatus\(resourceId, "official_spanish", sourceType\)/.test(coreFn));
  assert("core NEVER touches verification_status/last_verified_at/next_verification_at", !/verificationStatus:|verification_status:|lastVerifiedAt:|last_verified_at:|nextVerificationAt:|next_verification_at:/.test(coreFn));
  // ES-5N: verification event + audit
  assert("core writes evidence_recorded verification event on confirmation", /eventType: "evidence_recorded"/.test(coreFn));
  assert("event sourceType matches the actual preserved source_type (truthful provenance, no new event type)", /sourceType,\s*\n\s*notes: "Español oficial confirmado/.test(coreFn));
  assert("audit write for official Spanish confirmation", /auditAdminWrite\("recurso_official_spanish_confirmed"/.test(src));
}

// --- ES-5I/5J: bilingual admin UX, AI-translation suppression ----------------------------------------
assert("resource detail page exists", exists(DETAIL_PAGE));
if (exists(DETAIL_PAGE)) {
  const src = read(DETAIL_PAGE);
  assert("shows official-source-in-Spanish / official-bilingual-source callout", /Fuente oficial bilingüe/.test(src) && /Fuente oficial en español/.test(src));
  assert("wires confirmOfficialSpanishAction", /confirmOfficialSpanishAction/.test(src));
  // Owner Spanish Translation Review Workspace rewrite: Generar/Regenerar now live exclusively in
  // the workspace.path==="ai_translation" branch, which is structurally unreachable whenever
  // official-source Spanish evidence exists (path becomes "official_spanish" instead) — a
  // stronger guarantee than the old flag check (which only hid them mid-confirmation, not after).
  assert("workspace routes official-source resources to the official_spanish path, never the ai_translation path", /workspace\.path === "official_spanish"/.test(src) && /workspace\.path === "no_base_content"/.test(src));
  assert("officialSpanishAwaitingConfirmation is gated on needs_translation_review + official evidence", /officialSpanishAwaitingConfirmation = hasOfficialSpanishEvidence && spanishStatus === "needs_translation_review"/.test(src));
  assert("AI-translation approval action hidden when official Spanish evidence exists (published branch explicitly excludes it)", /!hasOfficialSpanishEvidence \? \(\s*<a href="#recurso-form"/.test(src) && /!hasOfficialSpanishEvidence \? \(\s*<form action={regenerateSpanishTranslationAction}/.test(src));
}

// --- ES-5K: reverification keeps url_recheck provenance, never mislabels as ai_translation_reviewed ---
assert("reverifyResourceViaUrl.ts exists", exists(REVERIFY));
if (exists(REVERIFY)) {
  const src = read(REVERIFY);
  assert("proposalSource is unconditionally url_recheck (never switches to translation for Spanish changes)", /proposalSource: "url_recheck"/.test(src) && !/proposalSource: "translation"/.test(src));
  assert("reverification never writes spanish_status/spanish_source_type itself (provenance stays whatever it already was)", !/spanish_status|spanish_source_type|dbSetCommunityResourceSpanishStatus/.test(src));
  assert("reverification carries the deterministic language signal forward (real signal, not fabricated)", /detectedSourceLanguage: signals\.detectedLanguage/.test(src));
}

// --- Public rendering unchanged, no auto official_spanish, no auto publish ----------------------------
// Gate ES-8 has now legitimately landed and is the intended owner of both of these — the public
// query file DOES join spanish_status/spanish_source_type, and the public fallback resolver DOES
// gate on spanish_status. These checks now assert that landing happened correctly, rather than
// asserting it hadn't happened yet.
assert("public query file carries spanish trust (Gate ES-8, expected)", exists(PUBLIC_QUERIES) && /spanish_status/.test(read(PUBLIC_QUERIES)));
if (exists(BILINGUAL_FALLBACK)) {
  const resolveFnBody = read(BILINGUAL_FALLBACK).match(/export function resolveBilingualField[\s\S]*?\n}\n/)?.[0] ?? "";
  assert("public resolver now gates on spanish_status (Gate ES-8, expected)", resolveFnBody.length > 0 && /spanishStatus/.test(resolveFnBody));
}
assert("no automatic community_resources.active flip anywhere in the promotion Spanish-handling block", exists(PROMOTE_ACTION) && !/active: true/.test(read(PROMOTE_ACTION)));

// --- No candidate-table migration unless explicitly justified -----------------------------------------
// Forward-compatible supersession: this gate itself added no migration, which remains true — the
// one migration that IS newer than the foundation file belongs to a later, separately PM-approved
// gate (Existing Resource Official-Spanish Bridge, ES-9), not to this gate.
assert("no new migration file added in this gate (Preferred: no migration — satisfied)", (() => {
  const dir = path.join(root, "supabase", "migrations");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql"));
  const expectedNewest = "20260821090000_recursos_spanish_bridge_foundation.sql";
  const KNOWN_LATER_GATES = ["20260821140000_recursos_official_spanish_bridge.sql"];
  const newerThanFoundation = files.filter((f) => f > expectedNewest && !KNOWN_LATER_GATES.includes(f));
  return newerThanFoundation.length === 0;
})());
assert("community_resource_candidate_reviews table/schema untouched (cargo-bay jsonb reuse only)", !exists("supabase/migrations/20260821090000_recursos_spanish_bridge_foundation.sql") || !/candidate_reviews/.test(read("supabase/migrations/20260821090000_recursos_spanish_bridge_foundation.sql")));

let passCount = 0;
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} — ${c.name}${c.detail !== undefined && !c.ok ? ` (${JSON.stringify(c.detail)})` : ""}`);
  if (c.ok) passCount++;
}
console.log(`\n${passCount}/${checks.length} checks passed.`);
if (passCount !== checks.length) process.exitCode = 1;
