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
  // Owner Spanish Translation Review Workspace rewrite: the 6-value classification-based tab set
  // was replaced by the richer 8-value queueStatus tab set (adds Sin contenido base / Listo para
  // publicar / Español publicado as distinct operational states) — see
  // verify-recursos-owner-spanish-workspace.mjs for full coverage of the new model.
  const TABS = ["Todos", "Sin contenido base", "Listo para generar", "Revisión pendiente", "Listo para publicar", "Español publicado", "Fuente oficial ES", "Reverificar primero"];
  assert("all 8 filter tabs present (queueStatus model)", TABS.every((t) => espanolPageFile.includes(t)), TABS);
  const ROW_FIELDS = ["organizationName", "primaryCategory", "urgencyLevel", "verification", "spanishStatus", "spanishSourceType", "hasOfficialSourceUrl", "highRisk", "pendingTranslationCount"];
  assert("row shows org/category/urgency/verification/spanish_status/spanish_source_type/official-URL/high-risk/pending-count", ROW_FIELDS.every((f) => espanolPageFile.includes(f)), ROW_FIELDS);
  // Generar/Revisar/Publicar route to the resource-level one-page workspace (Link, not a direct
  // form action). Gate ES-QA1: individual FUENTE_OFICIAL_ES confirmation was ALSO moved to route
  // there instead of firing confirmOfficialSpanishAction directly on this page — the batch
  // checkbox and a per-row direct-confirm button lived on the exact same row, which let an owner
  // confirm everything individually and then hit the batch button expecting it to do something
  // (it correctly reported 0/0, but read as broken). The single confirmOfficialSpanishCore
  // implementation is still the only place spanish_status flips to official_spanish — it's just
  // reached via the resource page now for the individual path, same as it always was for the
  // batch path (approveOfficialSpanishBatchAction calls the identical core).
  const idPageFile = read("app/admin/(dashboard)/recursos/[id]/page.tsx");
  assert("Generar/Revisar/Publicar route to the resource-level one-page workspace, not fired directly from the queue row", /Link href={`\/admin\/recursos\/\$\{resource\.id\}`} className={`\$\{adminCtaChip\} \$\{adminCtaChipCompact\}`}>\s*Generar/.test(espanolPageFile));
  assert(
    "FUENTE_OFICIAL_ES individual confirmation routes to the resource page (not a duplicate direct form action on this row)",
    /queueStatus === "FUENTE_OFICIAL_ES" && !eligibleForOfficialSpanishBatch/.test(espanolPageFile),
  );
  assert(
    "confirmOfficialSpanishAction is still wired somewhere reachable from this queue (the resource-detail page it now links to)",
    idPageFile !== null && /confirmOfficialSpanishAction/.test(idPageFile),
  );
  assert("Ver recurso link present", /Ver recurso/.test(espanolPageFile));
  assert("Reverificar link present, gated on REVERIFICAR_PRIMERO queue status", /queueStatus === "REVERIFICAR_PRIMERO"[\s\S]{0,300}Reverificar/.test(espanolPageFile));
  assert("actions are conditionally rendered per queueStatus (one branch per state, no ambiguous fallback)", /queueStatus === "SIN_CONTENIDO_BASE"/.test(espanolPageFile) && /queueStatus === "FUENTE_OFICIAL_ES"/.test(espanolPageFile));
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
// Owner Spanish Translation Review Workspace rewrite: officialSpanishAwaitingConfirmation now
// resolves straight to queueStatus="FUENTE_OFICIAL_ES" (see computeQueueStatus's precedence,
// checked before LISTO_PARA_GENERAR), so a "Generar" CTA is structurally never reachable for an
// official-source resource — not merely hidden by a separate boolean flag.
assert(
  "queue page hides Generar when official Spanish is awaiting confirmation (officialSpanishAwaitingConfirmation resolves to FUENTE_OFICIAL_ES before LISTO_PARA_GENERAR can ever be considered)",
  queueFile !== null && /if \(params\.officialSpanishAwaitingConfirmation\) return "FUENTE_OFICIAL_ES";/.test(queueFile),
);

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
// Existing Resource Official-Spanish Bridge (Gate ES-9G) widened the binary translation/factual
// split into a three-way split (translation / official_spanish / factual). Asserting the intended
// GUARD BEHAVIOR — both exclusions present near the pendingFactualCount definition — rather than
// one brittle exact-source regex, so a harmless future refactor of this line's exact formatting
// doesn't fail this check for no semantic reason.
assert(
  "pendingFactualCount excludes translation-sourced pending proposals",
  queueFile !== null &&
    (() => {
      const m = queueFile.match(/const pendingFactualCount = pending\.filter\([\s\S]{0,160}?\)\.length;/);
      return m ? /proposalSource !== "translation"/.test(m[0]) : false;
    })(),
);
assert(
  "pendingFactualCount ALSO excludes official_spanish-sourced pending proposals (Gate ES-9G — official Spanish is Spanish-presentation content, not a structured factual change)",
  queueFile !== null &&
    (() => {
      const m = queueFile.match(/const pendingFactualCount = pending\.filter\([\s\S]{0,160}?\)\.length;/);
      return m ? /proposalSource !== "official_spanish"/.test(m[0]) : false;
    })(),
);
assert(
  "pendingOfficialSpanish proposal rows are exposed on the reconciliation entry (owner workspace can render an EN↔ES paired preview)",
  queueFile !== null && /pendingOfficialSpanish: ResourceChangeProposalRow\[\]/.test(queueFile) && /pendingOfficialSpanishCount: number/.test(queueFile),
);
assert(
  "isEligibleForOfficialSpanishBatchApproval exported and structurally excludes high-risk resources",
  queueFile !== null &&
    (() => {
      const fnMatch = queueFile.match(/export function isEligibleForOfficialSpanishBatchApproval[\s\S]*?\n}/);
      return fnMatch ? /highRisk/.test(fnMatch[0]) : false;
    })(),
);
assert(
  "official_spanish and translation pending proposals are computed as structurally distinct buckets (queue never conflates them into one list)",
  queueFile !== null &&
    /const pendingTranslations = pending\.filter\(\(p\) => p\.proposalSource === "translation"\);/.test(queueFile) &&
    /const pendingOfficialSpanish = pending\.filter\(\(p\) => p\.proposalSource === "official_spanish"\);/.test(queueFile),
);

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
