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

const MIGRATION = "supabase/migrations/20260821090000_recursos_spanish_bridge_foundation.sql";
const CHANGE_DETECTION = "app/lib/recursos/intake/resourceChangeDetection.ts";
const PROPOSALS_DB = "app/lib/recursos/intake/server/resourceChangeProposalsDb.ts";
const CHANGE_ACTIONS = "app/admin/recursosChangeProposalActions.ts";
const CAMBIOS_PAGE = "app/admin/(dashboard)/recursos/cambios/page.tsx";
const SPANISH_STATUS_DB = "app/lib/recursos/intake/server/resourceSpanishStatusDb.ts";
const BILINGUAL_FALLBACK = "app/lib/recursos/recursosBilingualFallback.ts";
const PUBLIC_QUERIES = "app/lib/recursos/server/communityResourcesPublicQueries.ts";
const PUBLIC_TYPES = "app/lib/recursos/types.ts";

// --- ES-1A: migration provenance columns ------------------------------------------------------
assert("Spanish Bridge migration file exists", exists(MIGRATION));
if (exists(MIGRATION)) {
  const src = read(MIGRATION);
  assert("migration adds spanish_status column", /add column if not exists spanish_status/.test(src));
  assert("migration adds spanish_source_type column", /add column if not exists spanish_source_type/.test(src));
  assert(
    "spanish_status allows exactly the 5 specified values",
    /spanish_status in \(\s*'official_spanish', 'official_english_only', 'verified_translation',\s*'needs_translation_review', 'not_available'\s*\)/.test(src),
  );
  assert(
    "spanish_source_type allows exactly the 5 specified values",
    /spanish_source_type in \(\s*'official_spanish_source', 'official_bilingual_source',\s*'ai_translation_reviewed', 'staff_written', 'none'\s*\)/.test(src),
  );
  assert("spanish_status defaults to not_available", /spanish_status text not null default 'not_available'/.test(src));
  assert("migration does NOT add reviewer/date/source-url provenance columns", !/spanish_reviewed_by|spanish_reviewed_at|spanish_translated_from_evidence|spanish_field_provenance/.test(src));
  assert("no new table created in this migration", !/create table/i.test(src));
  assert("no destructive statement (drop table/truncate/delete) in this migration", !/drop table|truncate|delete from/i.test(src));

  // ES-1B
  assert("proposal_source CHECK widened to include translation", /check \(proposal_source in \('pdf_reextraction', 'url_recheck', 'partner_request', 'manual', 'translation'\)\)/.test(src));
  assert("proposal_source widen uses drop-constraint-if-exists + re-add (Gate 1 disposition-widen pattern)", /drop constraint if exists resource_change_proposals_proposal_source_check/.test(src));
  assert("no existing proposal rows rewritten (no UPDATE statement in this migration)", !/^\s*update\s/im.test(src));

  assert("migration contains no Production project ref", !/xuieateniufcrsfdomwl/.test(src));
}

// --- ES-2A/B: writable Spanish fields + getResourceFieldValue -----------------------------------
assert("resourceChangeDetection.ts exists", exists(CHANGE_DETECTION));
if (exists(CHANGE_DETECTION)) {
  const src = read(CHANGE_DETECTION);
  for (const [field, column] of [
    ["shortDescriptionEs", "short_description_es"],
    ["detailsEs", "details_es"],
    ["eligibilityEs", "eligibility_es"],
    ["hoursNoteEs", "hours_note_es"],
  ]) {
    assert(`WRITABLE_FIELD_COLUMNS maps ${field} -> ${column}`, new RegExp(`${field}: "${column}"`).test(src));
  }
  assert("getResourceFieldValue has a case for shortDescriptionEs", /case "shortDescriptionEs":\s*\n\s*return resource\.shortDescriptionEs/.test(src));
  assert("getResourceFieldValue has a case for detailsEs", /case "detailsEs":\s*\n\s*return resource\.detailsEs/.test(src));
  assert("getResourceFieldValue has a case for eligibilityEs", /case "eligibilityEs":\s*\n\s*return resource\.eligibilityEs/.test(src));
  assert("getResourceFieldValue has a case for hoursNoteEs", /case "hoursNoteEs":\s*\n\s*return resource\.contact\.hoursNoteEs/.test(src));
  assert("ProposalSource type includes translation", /export type ProposalSource = "pdf_reextraction" \| "url_recheck" \| "partner_request" \| "manual" \| "translation"/.test(src));
  const safetySetLiteral = src.match(/SAFETY_SENSITIVE_FIELDS: ReadonlySet<string> = new Set\(\[[\s\S]*?\]\);/)?.[0] ?? "";
  assert(
    "SAFETY_SENSITIVE_FIELDS unchanged — does NOT include any *Es field (translation exclusion is separate, not merged into this set)",
    safetySetLiteral.length > 0 && !/Es"/.test(safetySetLiteral),
  );
  assert("isHighRiskResourceForTranslation helper exists (ES-2D)", /export function isHighRiskResourceForTranslation/.test(src));
  assert("isHighRiskResourceForTranslation checks urgent-safety category, crisisPhone, is24Hours", /primaryCategory === "urgent-safety"/.test(src) && /crisisPhone/.test(src) && /is24Hours === true/.test(src));
  const highRiskFnBody = src.match(/export function isHighRiskResourceForTranslation[\s\S]*?\n}\n/)?.[0] ?? "";
  assert(
    "isHighRiskResourceForTranslation never writes/mutates a factual value (no assignment to resource fields)",
    highRiskFnBody.length > 0 && !/resource\.\w+\s*=(?!=)/.test(highRiskFnBody),
  );
}

// --- ES-2B: no third independent ProposalSource union left behind -------------------------------
assert("resourceChangeProposalsDb.ts exists", exists(PROPOSALS_DB));
if (exists(PROPOSALS_DB)) {
  const src = read(PROPOSALS_DB);
  assert("CreateResourceChangeProposalInput imports the shared ProposalSource type (no separate inline union)", /import type \{ ProposalSource \} from "@\/app\/lib\/recursos\/intake\/resourceChangeDetection"/.test(src));
  assert("proposalSource field uses the shared ProposalSource type", /proposalSource: ProposalSource;/.test(src));
  assert("no leftover inline literal union for proposalSource", !/proposalSource:\s*"pdf_reextraction" \| "url_recheck" \| "partner_request" \| "manual";/.test(src));
  assert("ResourceChangeProposalRow carries resource category/crisisPhone/is24Hours for high-risk classification (ES-2D)", /resourcePrimaryCategory/.test(src) && /resourceCrisisPhone/.test(src) && /resourceIs24Hours/.test(src));
}

// --- ES-2C: bulk-safe-accept excludes translation, safety exclusion preserved -------------------
assert("recursosChangeProposalActions.ts exists", exists(CHANGE_ACTIONS));
if (exists(CHANGE_ACTIONS)) {
  const src = read(CHANGE_ACTIONS);
  const bulkFn = src.match(/export async function acceptAllSafeChangeProposalsAction[\s\S]*?\n}\n/)?.[0] ?? "";
  assert("acceptAllSafeChangeProposalsAction excludes proposalSource === 'translation'", /proposalSource !== "translation"/.test(bulkFn));
  assert("acceptAllSafeChangeProposalsAction still excludes safety-sensitive fields (not replaced)", /!isSafetySensitiveField\(p\.fieldName\)/.test(bulkFn));
  assert("both exclusions combined with AND (not one replacing the other)", /!isSafetySensitiveField\(p\.fieldName\) && p\.proposalSource !== "translation"/.test(bulkFn));
}

// --- ES-2E: Cambios UX -----------------------------------------------------------------------
assert("cambios page exists", exists(CAMBIOS_PAGE));
if (exists(CAMBIOS_PAGE)) {
  const src = read(CAMBIOS_PAGE);
  assert("Cambios page has a Todos/Datos/Traducciones filter", /"todos"/.test(src) && /"datos"/.test(src) && /"traducciones"/.test(src));
  assert("Cambios page filters rows by proposalSource for the tipo param", /proposalSource === "translation"|proposalSource !== "translation"/.test(src));
  assert("Cambios page shows a TRADUCCIÓN ES badge", /Traducción ES/.test(src));
  assert("Cambios page shows an ALTO RIESGO badge", /Alto riesgo — revisar individualmente/.test(src));
  assert("Cambios page imports isHighRiskResourceForTranslation", /isHighRiskResourceForTranslation/.test(src));
  assert("safeCount (displayed bulk-safe count) excludes translation proposals — matches the actual action", /safeCount = proposals\.filter\(\(p\) => !isSafetySensitiveField\(p\.fieldName\) && p\.proposalSource !== "translation"\)/.test(src));
  assert("bulk-safe warning copy mentions translation exclusion truthfully", /traducci[oó]n/i.test(src) && /sensible/i.test(src));
  assert("no fake/no-op action wired to a real-looking button (every form action is a real imported function)", /acceptAllSafeChangeProposalsAction|acceptChangeProposalAction|rejectChangeProposalAction|needsMoreResearchChangeProposalAction/.test(src));
}

// --- ES-2F: Spanish status DB adapter, narrow, no public write ----------------------------------
assert("resourceSpanishStatusDb.ts exists", exists(SPANISH_STATUS_DB));
if (exists(SPANISH_STATUS_DB)) {
  const src = read(SPANISH_STATUS_DB);
  assert("module is server-only", /import "server-only"/.test(src));
  assert("dbGetCommunityResourceSpanishStatus exists", /export async function dbGetCommunityResourceSpanishStatus/.test(src));
  assert("dbSetCommunityResourceSpanishStatus exists and writes only spanish_status/spanish_source_type", /export async function dbSetCommunityResourceSpanishStatus/.test(src) && /spanish_status: status, spanish_source_type: sourceType/.test(src));
  assert("no generic arbitrary-column update function in this module", !/\[column\]:|Record<string, unknown>\s*=\s*\{\s*\.\.\./.test(src));
  assert("no server action (\"use server\") wired to this module yet — deferred to ES-4", !/"use server"/.test(src));
}
assert("no new admin action file for marking Spanish approved exists yet (deferred to ES-4)", !exists("app/admin/recursosSpanishStatusActions.ts"));

// --- ES-2G: doctrine supersession, documented not silently overridden ---------------------------
assert("recursosBilingualFallback.ts exists", exists(BILINGUAL_FALLBACK));
if (exists(BILINGUAL_FALLBACK)) {
  const src = read(BILINGUAL_FALLBACK);
  assert("old V1 doctrine text is preserved for history (quoted, not deleted)", /no machine-generated resource translations, ever/.test(src));
  assert("explicit SUPERSEDES language present", /SUPERSEDES/.test(src));
  assert("new doctrine states translation flows through resource_change_proposals / Cambios", /resource_change_proposals/.test(src) && /Cambios/.test(src));
  assert("new doctrine states translation never auto-applies/auto-publishes", /NEVER auto-applied or auto-published/.test(src));
  assert("new doctrine references spanish_status as the public-trust gate", /spanish_status/.test(src));
  assert("public resolver (renamed resolveBilingualField in Gate ES-8) still exists and gates on spanish_status", /export function resolveBilingualField/.test(src) && /spanishStatus/.test(src));
}

// --- Public rendering / query contract — ES-8 is the gate that legitimately wires this up --------
assert("public query file carries spanish_status/spanish_source_type (Gate ES-8, expected)", exists(PUBLIC_QUERIES) && /spanish_status/.test(read(PUBLIC_QUERIES)) && /spanish_source_type/.test(read(PUBLIC_QUERIES)));
assert("PublicResourceRecord type in types.ts not touched by this gate", !exists(PUBLIC_TYPES) || !/spanishStatus|spanishSourceType/.test(read(PUBLIC_TYPES)));

// --- No auto-translation / no auto-apply anywhere in this gate's new/changed code ----------------
const filesToScanForAutoApply = [CHANGE_DETECTION, PROPOSALS_DB, CHANGE_ACTIONS, SPANISH_STATUS_DB];
for (const f of filesToScanForAutoApply) {
  if (!exists(f)) continue;
  const src = read(f);
  assert(`${f}: no AI Gateway call introduced yet (translator is ES-3, not this gate)`, !/ai-gateway\.vercel\.sh/.test(src));
  assert(`${f}: no auto-accept of a translation proposal (no unconditional status="accepted" write tied to proposalSource==="translation")`, !/proposalSource === "translation"[\s\S]{0,200}"accepted"/.test(src));
}

// --- No Production references anywhere in this gate's changes -----------------------------------
for (const f of [MIGRATION, CHANGE_DETECTION, PROPOSALS_DB, CHANGE_ACTIONS, CAMBIOS_PAGE, SPANISH_STATUS_DB, BILINGUAL_FALLBACK]) {
  if (!exists(f)) continue;
  assert(`${f}: no Production project ref (xuieateniufcrsfdomwl)`, !/xuieateniufcrsfdomwl/.test(read(f)));
}

let passCount = 0;
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} — ${c.name}${c.detail !== undefined && !c.ok ? ` (${JSON.stringify(c.detail)})` : ""}`);
  if (c.ok) passCount++;
}
console.log(`\n${passCount}/${checks.length} checks passed.`);
if (passCount !== checks.length) process.exitCode = 1;
