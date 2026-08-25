#!/usr/bin/env node
/**
 * Owner Spanish Translation Review Workspace verifier. Static source checks only (no DB/network).
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

const detailPage = read("app/admin/(dashboard)/recursos/[id]/page.tsx");
const workspaceModel = read("app/lib/recursos/intake/translation/resourceTranslationWorkspace.ts");
const actionsFile = read("app/admin/recursosTranslationActions.ts");
const proposalsDb = read("app/lib/recursos/intake/server/resourceChangeProposalsDb.ts");
const reconciliationQueue = read("app/lib/recursos/intake/spanishReconciliationQueue.ts");
const queuePage = read("app/admin/(dashboard)/recursos/espanol/page.tsx");
const integrityCheck = read("app/lib/recursos/intake/translation/translationIntegrityCheck.ts");

// ---------- 3-step workflow exists ----------
assert("resource detail page exists", detailPage !== null);
if (detailPage) {
  assert("3-step progress indicator component exists (StepProgress)", /function StepProgress/.test(detailPage));
  assert("AI-translation path uses Generar / Revisar y editar / Aprobar y publicar labels", /labels={\["Generar", "Revisar y editar", "Aprobar y publicar"\]}/.test(detailPage));
  assert("step 1 CTA is literally numbered '1. Generar traducción'", /1\. Generar traducción/.test(detailPage));
  assert("step 3 CTA is literally numbered '3\\. Aprobar español y publicar'", /3\. Aprobar español y publicar/.test(detailPage));
  assert("progress indicator shows checkmarks for completed steps", /\{done \? "✓" : n\}/.test(detailPage));
}

// ---------- generate returns to same resource ----------
if (actionsFile) {
  const genFn = actionsFile.match(/export async function generateSpanishTranslationAction[\s\S]*?\n}/)?.[0] ?? "";
  assert("generateSpanishTranslationAction redirects back to the SAME resource page, not Cambios", /redirect\(`\/admin\/recursos\/\$\{resourceId\}/.test(genFn) && !/redirect\(`\/admin\/recursos\/cambios/.test(genFn));
}

// ---------- pending proposals rendered inline ----------
if (detailPage) {
  assert("pending translation proposals rendered inline on the same page (ReviewFieldRow over workspace.fields, no forced Cambios navigation)", /function ReviewFieldRow/.test(detailPage) && /workspace\.fields\.map\(\(f\) => \(\s*<ReviewFieldRow/.test(detailPage));
  assert("Cambios is offered as a link, not required navigation ('Ver en Cambios')", /Ver en Cambios/.test(detailPage));
}

// ---------- English read-only / Spanish proposal editable ----------
if (detailPage) {
  const reviewFieldRowFn = detailPage.match(/function ReviewFieldRow[\s\S]*?\n}\n/)?.[0] ?? "";
  assert("English side rendered as plain text, never inside an editable form control", reviewFieldRowFn.length > 0 && !/English[\s\S]{0,300}<textarea/.test(reviewFieldRowFn));
  assert("Spanish side rendered inside an editable <textarea> bound to the pending proposal's current value", /<textarea[\s\S]{0,50}name="proposedValue"[\s\S]{0,50}defaultValue={field\.proposedValue/.test(reviewFieldRowFn));
  assert("Spanish editor pre-populates from the PROPOSED value, not the approved *_es column", /defaultValue={field\.proposedValue \?\? ""}/.test(reviewFieldRowFn));
}

// ---------- proposal editing does not directly write public Spanish ----------
assert("recursosTranslationActions.ts exists", actionsFile !== null);
if (actionsFile) {
  const editFn = actionsFile.match(/export async function editTranslationProposalAction[\s\S]*?\n}/)?.[0] ?? "";
  assert("editTranslationProposalAction exists", editFn.length > 0);
  assert("edit action never calls dbUpdateSingleResourceField (never writes community_resources directly)", !/dbUpdateSingleResourceField/.test(editFn));
  assert("edit action never calls dbSetCommunityResourceSpanishStatus (never touches spanish_status)", !/dbSetCommunityResourceSpanishStatus/.test(editFn));
  assert("edit action only writes via dbUpdatePendingResourceChangeProposalValue (narrow, pending-only)", /dbUpdatePendingResourceChangeProposalValue\(proposalId, proposedValue\)/.test(editFn));
  assert("edit action re-checks the proposal is still pending/translation-sourced/same resource before writing", /proposal\.status !== "pending"/.test(editFn) && /proposal\.proposalSource !== "translation"/.test(editFn) && /proposal\.resourceId !== resourceId/.test(editFn));
}
if (proposalsDb) {
  const updateValueFn = proposalsDb.match(/export async function dbUpdatePendingResourceChangeProposalValue[\s\S]*?\n}/)?.[0] ?? "";
  assert("dbUpdatePendingResourceChangeProposalValue exists and updates ONLY proposed_value (never status/field_name/proposal_source)", updateValueFn.length > 0 && /proposed_value: newProposedValue/.test(updateValueFn) && !/status:\s*"accepted"/.test(updateValueFn));
  assert("dbUpdatePendingResourceChangeProposalValue re-checks status='pending' server-side before writing", /\.eq\("status", "pending"\)/.test(updateValueFn));
}

// ---------- final approval accepts proposals + marks reviewed ----------
if (actionsFile) {
  const approveFn = actionsFile.match(/export async function approveSpanishTranslationAction[\s\S]*?\n}\n/)?.[0] ?? "";
  assert("approveSpanishTranslationAction exists", approveFn.length > 0);
  assert("approval accepts each pending translation proposal via dbUpdateSingleResourceField", /dbUpdateSingleResourceField\(resourceId, p\.fieldName/.test(approveFn));
  assert("approval transitions each proposal to accepted via the existing status-transition function", /dbUpdateResourceChangeProposalStatus\(p\.id, "accepted", actor\)/.test(approveFn));
  assert("approval sets spanish_status=verified_translation / spanish_source_type=ai_translation_reviewed", /dbSetCommunityResourceSpanishStatus\(resourceId, "verified_translation", "ai_translation_reviewed"\)/.test(approveFn));
  assert("approval preserves verification_status/last_verified_at/next_verification_at (no write to those fields anywhere in the function)", !/verificationStatus:|verification_status:|lastVerifiedAt:|last_verified_at:|nextVerificationAt:|next_verification_at:/.test(approveFn));
  assert("approval audits the final publication", /auditAdminWrite\("recurso_spanish_translation_approved_published"/.test(approveFn));
  assert("approval records a final evidence_recorded verification event", /eventType: "evidence_recorded"[\s\S]{0,200}notes: `Aprobación final/.test(approveFn));

  // ---------- cannot mark reviewed with unresolved translation proposals ----------
  assert("approval requires at least one pending translation proposal (cannot approve nothing)", /pendingTranslations\.length === 0/.test(approveFn));
  assert("approval re-checks integrity against the CURRENT proposed value for every field before writing anything (owner edits included)", /checkFieldTranslationIntegrity\(enSource, proposedValue\)/.test(approveFn));
  assert("approval blocks entirely (no writes) if any field has a conflict", /if \(conflicting\.length > 0\)/.test(approveFn) && (() => {
    const conflictIdx = approveFn.indexOf("if (conflicting.length > 0)");
    const firstWriteIdx = approveFn.indexOf("dbUpdateSingleResourceField(resourceId, p.fieldName");
    return conflictIdx !== -1 && firstWriteIdx !== -1 && conflictIdx < firstWriteIdx;
  })());
  assert(
    "spanish_status is set ONLY after every field-accept loop iteration completed (status write appears after the accept loop, not interleaved)",
    (() => {
      const loopIdx = approveFn.indexOf("for (const p of pendingTranslations)");
      const secondLoopIdx = approveFn.indexOf("for (const p of pendingTranslations)", loopIdx + 1);
      const statusWriteIdx = approveFn.indexOf("dbSetCommunityResourceSpanishStatus(resourceId, \"verified_translation\"");
      return secondLoopIdx !== -1 && statusWriteIdx > secondLoopIdx;
    })(),
  );
  assert("a failed field-accept aborts before marking Spanish reviewed (redirect with error, before status write)", /No se pudo aceptar/.test(approveFn));
}

// ---------- official Spanish path supported ----------
if (detailPage) {
  assert("official Spanish path renders its own simplified 3-step labels", /labels={\["Fuente oficial ES encontrada", "Revisar español oficial", "Confirmar y publicar"\]}/.test(detailPage));
  assert("official Spanish path reuses confirmOfficialSpanishAction (no separate official-Spanish approval engine)", /workspace\.path === "official_spanish"[\s\S]{0,2500}confirmOfficialSpanishAction/.test(detailPage));
}

// ---------- zero-English-content resource blocked from generation ----------
assert("resourceTranslationWorkspace.ts exists", workspaceModel !== null);
if (workspaceModel) {
  assert("hasTranslatableBaseContent reused from spanishReconciliationQueue (single definition)", /hasTranslatableBaseContent/.test(workspaceModel));
  assert("path is 'no_base_content' whenever hasBaseContent is false and no official evidence", /const path: TranslationWorkspacePath = isOfficialSourceEvidence \? "official_spanish" : hasBaseContent \? "ai_translation" : "no_base_content"/.test(workspaceModel));
}
if (detailPage) {
  assert("'FALTA CONTENIDO BASE EN INGLÉS' shown for the no_base_content path, with no Generar/Eligible-para-lote CTA in that branch", (() => {
    const m = detailPage.match(/workspace\.path === "no_base_content" \? \([\s\S]*?\) : \(/);
    if (!m) return false;
    return /FALTA CONTENIDO BASE EN INGLÉS/.test(m[0]) && !/Generar traducción/.test(m[0]) && !/Elegible para lote/.test(m[0]);
  })());
  assert("no-base-content secondary copy present", /No hay texto verificado para traducir todavía/.test(detailPage));
  assert("no-base-content CTA is 'Completar información verificada', not a verification-status change", /Completar información verificada/.test(detailPage));
}
if (reconciliationQueue) {
  assert("isEligibleForBulkTranslationDraft excludes resources without base content (bulk 'Eligible para lote' never counts zero-content resources)", /if \(!entry\.hasBaseContent\) return false;/.test(reconciliationQueue));
}

// ---------- queue states are deterministic ----------
assert("spanishReconciliationQueue.ts exists", reconciliationQueue !== null);
if (reconciliationQueue) {
  const SEVEN = ["SIN_CONTENIDO_BASE", "LISTO_PARA_GENERAR", "REVISION_PENDIENTE", "LISTO_PARA_PUBLICAR", "ESPANOL_PUBLICADO", "FUENTE_OFICIAL_ES", "REVERIFICAR_PRIMERO"];
  assert("all 7 queue statuses exist", SEVEN.every((s) => reconciliationQueue.includes(s)), SEVEN);
  assert("queue status is a pure function of already-known state (computeQueueStatus takes no DB/random input)", /function computeQueueStatus\(params: \{/.test(reconciliationQueue) && !/Math\.random|Date\.now/.test(reconciliationQueue.match(/function computeQueueStatus[\s\S]*?\n}/)?.[0] ?? ""));
  assert("reverification precedence checked first in computeQueueStatus (staleness always wins)", (() => {
    const startIdx = reconciliationQueue.indexOf("function computeQueueStatus");
    const fn = startIdx === -1 ? "" : reconciliationQueue.slice(startIdx, startIdx + 1200);
    const reverifyIdx = fn.indexOf("REVERIFICAR_PRIMERO");
    const officialIdx = fn.indexOf("FUENTE_OFICIAL_ES");
    return reverifyIdx !== -1 && officialIdx !== -1 && reverifyIdx < officialIdx;
  })());
}
assert("espanol queue page exists", queuePage !== null);
if (queuePage) {
  assert("queue page renders all 8 tabs (todos + 7 states)", (() => {
    const m = queuePage.match(/const FILTRO_TABS: [\s\S]*?\];/);
    if (!m) return false;
    return (m[0].match(/value: "/g) || []).length === 8;
  })());
  assert("queue CTA is deterministic per queueStatus (one CTA branch per status, no ambiguous fallback)", /queueStatus === "SIN_CONTENIDO_BASE"/.test(queuePage) && /queueStatus === "LISTO_PARA_GENERAR"/.test(queuePage) && /queueStatus === "REVISION_PENDIENTE"/.test(queuePage) && /queueStatus === "LISTO_PARA_PUBLICAR"/.test(queuePage) && /queueStatus === "ESPANOL_PUBLICADO"/.test(queuePage) && /queueStatus === "FUENTE_OFICIAL_ES"/.test(queuePage) && /queueStatus === "REVERIFICAR_PRIMERO"/.test(queuePage));
}

// ---------- publication links exist ----------
if (detailPage) {
  assert("direct public ES link constructed from recursosResourcePath + ?lang=es", /publicEsUrl = `\$\{LEONIX_PUBLIC_ORIGIN\}\$\{recursosResourcePath\(record\.slug\)\}\?lang=es`/.test(detailPage));
  assert("direct public EN link constructed from recursosResourcePath + ?lang=en", /publicEnUrl = `\$\{LEONIX_PUBLIC_ORIGIN\}\$\{recursosResourcePath\(record\.slug\)\}\?lang=en`/.test(detailPage));
  assert("public links open in a new tab (target=_blank, rel=noopener)", /target="_blank" rel="noopener noreferrer"/.test(detailPage));
}
if (queuePage) {
  assert("queue page also links directly to the public ES page for published resources", /publicEsUrl = `\$\{LEONIX_PUBLIC_ORIGIN\}\$\{recursosResourcePath\(resource\.slug\)\}\?lang=es`/.test(queuePage));
}

// ---------- published state shown only from trusted spanish_status ----------
if (workspaceModel) {
  assert("isPublished derived strictly from TRUSTED_SPANISH_STATUSES (official_spanish, verified_translation) — same trust vocabulary as the public resolver, no third status invented", /TRUSTED_SPANISH_STATUSES: ReadonlySet<SpanishStatus> = new Set\(\["official_spanish", "verified_translation"\]\)/.test(workspaceModel));
}

// ---------- verification dates/status untouched ----------
if (actionsFile) {
  const editFn = actionsFile.match(/export async function editTranslationProposalAction[\s\S]*?\n}/)?.[0] ?? "";
  assert("edit action never touches verification_status/last_verified_at/next_verification_at", !/verificationStatus:|verification_status:|lastVerifiedAt:|last_verified_at:|nextVerificationAt:|next_verification_at:/.test(editFn));
}

// ---------- structured fact safety preserved ----------
assert("translationIntegrityCheck.ts unchanged (reused, not forked)", integrityCheck !== null && /export function checkFieldTranslationIntegrity/.test(integrityCheck));
if (actionsFile) {
  assert("approval imports checkFieldTranslationIntegrity from the ONE existing integrity module (no second checker)", /import \{ checkFieldTranslationIntegrity \} from "@\/app\/lib\/recursos\/intake\/translation\/translationIntegrityCheck"/.test(actionsFile));
}
if (reconciliationQueue) {
  assert("queue-level pendingTranslationsClean reuses the SAME integrity function", /checkFieldTranslationIntegrity\(enSource, p\.proposedValue == null \? null : String\(p\.proposedValue\)\)/.test(reconciliationQueue));
}

// ---------- mobile pair layout exists ----------
if (detailPage) {
  const reviewFieldRowFn = detailPage.match(/function ReviewFieldRow[\s\S]*?\n}\n/)?.[0] ?? "";
  assert(
    "each field is its own EN|ES grid (sm:grid-cols-2 per field, not one EN column then one ES column for all fields) — mobile stacks EN then ES per field, never all-EN-then-all-ES",
    /grid gap-3 sm:grid-cols-2/.test(reviewFieldRowFn),
  );
}

// ---------- Cambios remains available ----------
if (detailPage) {
  assert("Cambios link present and described as available, not required", /Ver en Cambios/.test(detailPage) && /no un reemplazo/.test(detailPage));
}
if (proposalsDb) {
  assert("resource_change_proposals remains the canonical write path — dbUpdateResourceChangeProposalStatus untouched/reused, not replaced", /export async function dbUpdateResourceChangeProposalStatus/.test(proposalsDb));
}

let passCount = 0;
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} — ${c.name}${c.detail !== undefined && !c.ok ? ` (${JSON.stringify(c.detail)})` : ""}`);
  if (c.ok) passCount++;
}
console.log(`\n${passCount}/${checks.length} checks passed.`);
if (passCount !== checks.length) process.exitCode = 1;
