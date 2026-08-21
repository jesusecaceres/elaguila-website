#!/usr/bin/env node
/**
 * Gate ES-6 verifier — bulk Spanish reconciliation. Static source checks only (no DB/network).
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
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

const classificationFile = read("app/lib/recursos/intake/spanishReadinessClassification.ts");
const queueFile = read("app/lib/recursos/intake/spanishReconciliationQueue.ts");
const bulkActionsFile = read("app/admin/recursosSpanishReconciliationActions.ts");
const espanolPageFile = read("app/admin/(dashboard)/recursos/espanol/page.tsx");
const commandCenterFile = read("app/admin/(dashboard)/recursos/page.tsx");
const spanishStatusDbFile = read("app/lib/recursos/intake/server/resourceSpanishStatusDb.ts");
const proposalsDbFile = read("app/lib/recursos/intake/server/resourceChangeProposalsDb.ts");
const translationGenFile = read("app/lib/recursos/intake/translation/generateSpanishTranslationProposals.ts");
const communityResourcesDbFile = read("app/lib/recursos/server/communityResourcesDb.ts");

// ---------- ES-6A: classification helper ----------
assert("spanishReadinessClassification.ts exists", classificationFile !== null);
if (classificationFile) {
  const FIVE = ["SPANISH_READY_OFFICIAL", "SPANISH_READY_VERIFIED_TRANSLATION", "NEEDS_SPANISH_TRANSLATION", "NEEDS_TRANSLATION_REVIEW", "SOURCE_REVERIFICATION_REQUIRED"];
  assert("all 5 readiness classifications exist", FIVE.every((v) => classificationFile.includes(v)), FIVE);
  assert("classifySpanishReadiness is exported and pure (no supabase import)", /export function classifySpanishReadiness/.test(classificationFile) && !/supabase/i.test(classificationFile));
  assert(
    "staleness/reverification precedence checked FIRST (before any spanish_status branch)",
    (() => {
      const fnMatch = classificationFile.match(/export function classifySpanishReadiness[\s\S]*?\n}/);
      if (!fnMatch) return false;
      const body = fnMatch[0];
      const staleIdx = body.indexOf("SOURCE_REVERIFICATION_REQUIRED");
      const officialIdx = body.indexOf("SPANISH_READY_OFFICIAL");
      return staleIdx !== -1 && officialIdx !== -1 && staleIdx < officialIdx;
    })(),
  );
  assert("official_spanish -> SPANISH_READY_OFFICIAL", /spanishStatus === "official_spanish"[\s\S]{0,40}return "SPANISH_READY_OFFICIAL"/.test(classificationFile));
  assert("verified_translation -> SPANISH_READY_VERIFIED_TRANSLATION", /spanishStatus === "verified_translation"[\s\S]{0,40}return "SPANISH_READY_VERIFIED_TRANSLATION"/.test(classificationFile));
  assert("needs_translation_review -> NEEDS_TRANSLATION_REVIEW (not ready)", /spanishStatus === "needs_translation_review"[\s\S]{0,40}return "NEEDS_TRANSLATION_REVIEW"/.test(classificationFile));
  assert("reuses resolveEffectiveVerificationStatus (no second staleness engine)", /resolveEffectiveVerificationStatus/.test(classificationFile));
  assert("mere presence of *_es text never drives classification (function body has no .trim()/Boolean(*Es) check)", (() => {
    const fnMatch = classificationFile.match(/export function classifySpanishReadiness[\s\S]*?\n}/);
    return fnMatch ? !/Es\b.*trim\(\)|shortDescriptionEs|detailsEs|eligibilityEs|hoursNoteEs/.test(fnMatch[0]) : false;
  }));
}

// ---------- classification is derived, not stored ----------
assert(
  "no new migration file added in this gate (classification derived, not a stored column)",
  (() => {
    const migrationsDir = join(ROOT, "supabase", "migrations");
    if (!existsSync(migrationsDir)) return false;
    const files = readdirSync(migrationsDir);
    return !files.some((f) => f.includes("spanish_reconcil") || f.includes("es6") || f.includes("es_6"));
  })(),
);
assert("no SQL column named spanish_readiness/classification added anywhere in this gate's files", ![classificationFile, queueFile].some((f) => f && /add column.*(spanish_readiness|readiness_classification)/i.test(f)));

// ---------- ES-6B/queue command-center metrics ----------
assert("spanishReconciliationQueue.ts exists (composition point)", queueFile !== null);
if (queueFile) {
  assert("loadSpanishReconciliationSnapshot exported", /export async function loadSpanishReconciliationSnapshot/.test(queueFile));
  assert("unavailable is surfaced (never a fabricated zero)", /unavailable: true/.test(queueFile) && /unavailable/.test(queueFile));
  assert("isEligibleForBulkTranslationDraft exported (single source of eligibility truth)", /export function isEligibleForBulkTranslationDraft/.test(queueFile));
  assert("reuses isHighRiskResourceForTranslation (no second high-risk definition)", /isHighRiskResourceForTranslation/.test(queueFile));
}
assert("command-center page wires Spanish metrics", commandCenterFile !== null && /loadSpanishReconciliationSnapshot/.test(commandCenterFile));
assert("command-center shows 'no disponible' on unavailable, never a fake zero", commandCenterFile !== null && /spanishSnapshot\.unavailable \? "no disponible"/.test(commandCenterFile));

// ---------- ES-6C: queue page ----------
assert("Spanish reconciliation queue page exists at /admin/recursos/espanol", espanolPageFile !== null);
if (espanolPageFile) {
  assert("requires can_manage_recursos", /requireLeonixAdminPermission\("can_manage_recursos"\)/.test(espanolPageFile));
  const TABS = ["Todos", "Oficial listo", "Traducción lista", "Necesita traducción", "Necesita revisión", "Reverificar fuente"];
  assert("all 6 filter tabs present", TABS.every((t) => espanolPageFile.includes(t)), TABS);
  const ROW_FIELDS = ["organizationName", "primaryCategory", "urgencyLevel", "verification", "spanishStatus", "spanishSourceType", "hasOfficialSourceUrl", "highRisk", "pendingTranslationCount"];
  assert("row shows org/category/urgency/verification/spanish_status/spanish_source_type/official-URL/high-risk/pending-count", ROW_FIELDS.every((f) => espanolPageFile.includes(f)), ROW_FIELDS);
  const ACTIONS = ["generateSpanishTranslationAction", "regenerateSpanishTranslationAction", "confirmOfficialSpanishAction"];
  assert("wires Generar/Revisar traducción + Confirmar español oficial (reused, not reinvented)", ACTIONS.every((a) => espanolPageFile.includes(a)), ACTIONS);
  assert("Ver recurso link present", /Ver recurso/.test(espanolPageFile));
  assert("Reverificar fuente link present, gated on SOURCE_REVERIFICATION_REQUIRED", /canReverify[\s\S]{0,300}Reverificar fuente/.test(espanolPageFile));
  assert("actions are conditionally rendered per resource state (canGenerate/canRegenerate/canConfirmOfficial/canReverify gates)", /canGenerate/.test(espanolPageFile) && /canConfirmOfficial/.test(espanolPageFile));
}

// ---------- ES-6D/E/F: bulk draft action ----------
assert("recursosSpanishReconciliationActions.ts exists", bulkActionsFile !== null);
if (bulkActionsFile) {
  assert("generateSpanishDraftsBatchAction exported", /export async function generateSpanishDraftsBatchAction/.test(bulkActionsFile));
  assert("bulk action requires can_manage_recursos", /requireLeonixAdminPermission\("can_manage_recursos"\)/.test(bulkActionsFile));
  assert("bulk action cap = 20", queueFile !== null && /MAX_BULK_SPANISH_DRAFT_BATCH\s*=\s*20/.test(queueFile));
  assert(".slice(0, MAX_BULK_SPANISH_DRAFT_BATCH) enforces the cap in code, not just documentation", /\.slice\(0,\s*MAX_BULK_SPANISH_DRAFT_BATCH\)/.test(bulkActionsFile));
  assert("bulk action reuses generateSpanishTranslationProposals (no second translator)", /generateSpanishTranslationProposals\(/.test(bulkActionsFile));
  assert("bulk action never imports a create/update-resource DB function (no direct resource write)", !/dbCreateCommunityResource|dbUpdateCommunityResource|dbSetCommunityResourceSpanishStatus/.test(bulkActionsFile));
  assert("bulk action never calls dbUpdateResourceChangeProposalStatus with 'accepted' (no auto-approval)", !/dbUpdateResourceChangeProposalStatus/.test(bulkActionsFile) && !/"accepted"/.test(bulkActionsFile));
  assert("filters eligibility via isEligibleForBulkTranslationDraft (official-Spanish/stale/pending-factual excluded structurally)", /isEligibleForBulkTranslationDraft/.test(bulkActionsFile));
  assert("per-item try/catch — one failure does not abort the batch", /try\s*{[\s\S]*?generateSpanishTranslationProposals[\s\S]*?}\s*catch/.test(bulkActionsFile));
  assert("no retry loop around the AI call (no retries doctrine)", !/for\s*\([^)]*retr/i.test(bulkActionsFile) && !/while\s*\(.*retr/i.test(bulkActionsFile));
  const SUMMARY_FIELDS = ["requested", "processed", "proposalsCreated", "skippedPending", "skippedNotVerified", "failed"];
  assert("summary returns requested/processed/proposalsCreated/skippedPending/skippedNotVerified/failed", SUMMARY_FIELDS.every((f) => bulkActionsFile.includes(f)), SUMMARY_FIELDS);
  assert("audit write for the batch action", /auditAdminWrite\(/.test(bulkActionsFile));
}

// ---------- ES-6G: official Spanish priority ----------
assert(
  "isEligibleForBulkTranslationDraft excludes officialSpanishAwaitingConfirmation",
  queueFile !== null && /if \(entry\.officialSpanishAwaitingConfirmation\) return false;/.test(queueFile),
);
assert(
  "officialSpanishAwaitingConfirmation is derived from spanish_source_type official_* + status !== official_spanish",
  queueFile !== null && /official_spanish_source.*official_bilingual_source[\s\S]{0,80}spanishStatus !== "official_spanish"/.test(queueFile),
);
assert("queue page hides Generar when official Spanish is awaiting confirmation (canGenerate excludes it)", espanolPageFile !== null && /canGenerate = classification === "NEEDS_SPANISH_TRANSLATION" && !officialSpanishAwaitingConfirmation/.test(espanolPageFile));

// ---------- ES-6H: stale/reverification exclusion ----------
assert(
  "isEligibleForBulkTranslationDraft excludes anything not classified NEEDS_SPANISH_TRANSLATION (so SOURCE_REVERIFICATION_REQUIRED is structurally excluded)",
  queueFile !== null && /if \(entry\.classification !== "NEEDS_SPANISH_TRANSLATION"\) return false;/.test(queueFile),
);

// ---------- ES-6I: pending factual-change exclusion ----------
assert(
  "isEligibleForBulkTranslationDraft excludes resources with pending FACTUAL proposals",
  queueFile !== null && /if \(entry\.pendingFactualCount > 0\) return false;/.test(queueFile),
);
assert("pendingFactualCount computed from non-translation pending proposals", queueFile !== null && /proposalSource !== "translation"\)\.length/.test(queueFile));

// ---------- ES-6F: cost guard preserved ----------
assert(
  "pending-translation cost guard preserved (generateSpanishTranslationProposals still self-guards before any AI call)",
  translationGenFile !== null && /dbListPendingResourceChangeProposalsForResource/.test(translationGenFile) && /proposalSource === "translation"/.test(translationGenFile),
);
assert("bulk eligibility also excludes pendingTranslationCount > 0 (belt-and-suspenders, not relying on the inner guard alone)", queueFile !== null && /if \(entry\.pendingTranslationCount > 0\) return false;/.test(queueFile));

// ---------- ES-6E: high-risk stays individually reviewed ----------
assert(
  "high-risk resources are NOT excluded from bulk draft GENERATION (isEligibleForBulkTranslationDraft has no highRisk check)",
  queueFile !== null && (() => {
    const fnMatch = queueFile.match(/export function isEligibleForBulkTranslationDraft[\s\S]*?\n}/);
    return fnMatch ? !/highRisk/.test(fnMatch[0]) : false;
  })(),
);
assert("high-risk badge rendered on the queue page (individually flagged, never silently bulk-approved)", espanolPageFile !== null && /ALTO RIESGO/.test(espanolPageFile));
assert("bulk action never touches proposal STATUS at all (approval stays a separate, individual Cambios action)", bulkActionsFile !== null && !/status:\s*"accepted"/.test(bulkActionsFile));

// ---------- No auto-approval / no public behavior change ----------
assert("no dbUpdateSingleResourceField import anywhere in ES-6 files (bulk draft never accepts/publishes)", ![bulkActionsFile, queueFile, espanolPageFile].some((f) => f && /dbUpdateSingleResourceField/.test(f)));
const publicQueryFile = read("app/lib/recursos/server/communityResourcesPublicQueries.ts");
assert("public query file untouched by this gate (no ES-6 symbols present)", publicQueryFile !== null && !/spanishReconciliation|SpanishReadiness|ES-6/.test(publicQueryFile));
const bilingualFallbackFile = read("app/lib/recursos/recursosBilingualFallback.ts");
assert("public bilingual fallback function body untouched by this gate", bilingualFallbackFile !== null && !/spanishReconciliation|isEligibleForBulkTranslationDraft/.test(bilingualFallbackFile));

// ---------- Bulk DB helpers added correctly ----------
assert("dbListAllCommunityResourceSpanishStatuses added (bulk read, single query, no per-resource N+1)", spanishStatusDbFile !== null && /export async function dbListAllCommunityResourceSpanishStatuses/.test(spanishStatusDbFile));
assert("dbListAllPendingResourceChangeProposals added (uncapped pending-only bulk read)", proposalsDbFile !== null && /export async function dbListAllPendingResourceChangeProposals/.test(proposalsDbFile));
assert("bulk pending read filters status='pending' (not all statuses)", proposalsDbFile !== null && /dbListAllPendingResourceChangeProposals[\s\S]{0,400}\.eq\("status", "pending"\)/.test(proposalsDbFile));
assert("ResourceRecord itself still has no spanishStatus field (spanish status stays out of the general resource type)", communityResourcesDbFile !== null && !/spanishStatus:\s*row\.spanish_status/.test(communityResourcesDbFile));

let passCount = 0;
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} — ${c.name}${c.detail !== undefined && !c.ok ? ` (${JSON.stringify(c.detail)})` : ""}`);
  if (c.ok) passCount++;
}
console.log(`\n${passCount}/${checks.length} checks passed.`);
if (passCount !== checks.length) process.exitCode = 1;
