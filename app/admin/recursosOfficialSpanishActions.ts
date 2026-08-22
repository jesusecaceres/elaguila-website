"use server";

/**
 * Existing Resource Official-Spanish Bridge (Gate ES-9). Two actions:
 *
 *   attachOfficialSpanishSourceAction  — single resource: records an official Spanish/bilingual
 *     source and creates pending resource_change_proposals (proposal_source='official_spanish')
 *     for the supplied fields. Never publishes anything by itself.
 *
 *   approveOfficialSpanishBatchAction  — up to MAX_BULK_SPANISH_DRAFT_BATCH resources at once:
 *     re-validates each resource live (never trusts the snapshot alone), accepts its pending
 *     official_spanish proposals, then calls the SAME confirmOfficialSpanishCore every
 *     single-resource confirmation already uses. One resource failing never blocks the others —
 *     every resource still gets its own independent audit/event trail.
 *
 * Both require can_manage_recursos, same as every other Recursos write action. Neither ever
 * writes a structured fact (phone/address/hours/is24Hours/cost/verification_status) — only the
 * four *_es presentation fields and the two spanish_status/spanish_source_type columns.
 */
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { getAdminOperatorEmailFromCookies } from "@/app/lib/supabase/adminSession";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";
import { dbGetCommunityResourceById } from "@/app/lib/recursos/server/communityResourcesDb";
import { resolveEffectiveVerificationStatus } from "@/app/lib/recursos/verificationStatus";
import { isHighRiskResourceForTranslation } from "@/app/lib/recursos/intake/resourceChangeDetection";
import {
  prepareOfficialSpanishProposals,
  buildOfficialSpanishStructuredFacts,
  relatedEnTextForOfficialSpanishField,
  type OfficialSpanishSourceType,
} from "@/app/lib/recursos/intake/translation/prepareOfficialSpanishProposals";
import { checkOfficialSpanishFieldIntegrity } from "@/app/lib/recursos/intake/translation/translationIntegrityCheck";
import {
  dbListPendingResourceChangeProposalsForResource,
  dbUpdateResourceChangeProposalStatus,
} from "@/app/lib/recursos/intake/server/resourceChangeProposalsDb";
import { dbUpdateSingleResourceField } from "@/app/lib/recursos/intake/server/resourceFieldAcceptDb";
import { dbGetCommunityResourceSpanishStatus } from "@/app/lib/recursos/intake/server/resourceSpanishStatusDb";
import { insertVerificationEvent } from "@/app/lib/recursos/intake/server/verificationEventsDb";
import { confirmOfficialSpanishCore } from "@/app/admin/recursosTranslationActions";
import { loadSpanishReconciliationSnapshot, isEligibleForOfficialSpanishBatchApproval, MAX_BULK_SPANISH_DRAFT_BATCH } from "@/app/lib/recursos/intake/spanishReconciliationQueue";

async function actorEmail(): Promise<string | null> {
  const c = await cookies();
  return getAdminOperatorEmailFromCookies(c);
}

function str(f: FormData, k: string): string {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
}

function optionalStr(f: FormData, k: string): string | null {
  const v = str(f, k);
  return v.length > 0 ? v : null;
}

export async function attachOfficialSpanishSourceAction(formData: FormData): Promise<void> {
  await requireLeonixAdminPermission("can_manage_recursos");
  const resourceId = str(formData, "resourceId");
  if (!resourceId) redirect("/admin/recursos?error=unknown_resource");

  const sourceUrl = str(formData, "sourceUrl");
  const sourceTypeRaw = str(formData, "sourceType");
  const sourceType: OfficialSpanishSourceType | null =
    sourceTypeRaw === "official_spanish_source" || sourceTypeRaw === "official_bilingual_source" ? sourceTypeRaw : null;

  if (!sourceType) {
    redirect(`/admin/recursos/${resourceId}?error=${encodeURIComponent("Tipo de fuente en español inválido.")}`);
  }

  const resource = await dbGetCommunityResourceById(resourceId);
  if (!resource) redirect("/admin/recursos?error=unknown_resource");

  const actor = await actorEmail();
  const result = await prepareOfficialSpanishProposals(resource!, actor, {
    sourceUrl,
    sourceType: sourceType!,
    shortDescriptionEs: optionalStr(formData, "shortDescriptionEs"),
    detailsEs: optionalStr(formData, "detailsEs"),
    eligibilityEs: optionalStr(formData, "eligibilityEs"),
    hoursNoteEs: optionalStr(formData, "hoursNoteEs"),
  });

  if (!result.ok) {
    redirect(`/admin/recursos/${resourceId}?error=${encodeURIComponent(result.reason)}`);
  }

  auditAdminWrite("recurso_official_spanish_source_attached", "community_resources", resourceId, {
    actorEmail: actor,
    sourceUrl,
    sourceType,
    createdCount: result.createdCount,
    skippedDuplicateFields: result.skippedDuplicateFields,
    skippedIntegrityFields: result.skippedIntegrityFields,
  });

  revalidatePath(`/admin/recursos/${resourceId}`);
  revalidatePath("/admin/recursos/espanol");

  const note =
    result.skippedIntegrityFields.length > 0
      ? `saved=1&warning=${encodeURIComponent(`Excluido por integridad: ${result.skippedIntegrityFields.join(", ")}`)}`
      : "saved=1";
  redirect(`/admin/recursos/${resourceId}?${note}`);
}

export type OfficialSpanishBatchItemResult = { resourceId: string; organizationName: string; reason: string };
export type OfficialSpanishBatchSummary = {
  requested: number;
  processed: number;
  published: number;
  skipped: OfficialSpanishBatchItemResult[];
  failed: OfficialSpanishBatchItemResult[];
};

/**
 * Re-validates and confirms ONE resource's pending official_spanish proposals. Never partially
 * publishes: if any pending field fails a live re-check, the whole resource is skipped and NONE
 * of its fields are accepted — the caller must not retry piecemeal. Mirrors
 * approveSpanishTranslationAction's own "re-check everything, then write, or write nothing" shape.
 */
async function approveOneResourceOfficialSpanish(resourceId: string, organizationName: string, actor: string | null): Promise<{ ok: true } | { ok: false; reason: string }> {
  const resource = await dbGetCommunityResourceById(resourceId);
  if (!resource) return { ok: false, reason: "Recurso desconocido." };

  if (resolveEffectiveVerificationStatus(resource.verification) !== "verified") {
    return { ok: false, reason: "El recurso ya no está verificado (con verificación vigente)." };
  }

  const highRisk = isHighRiskResourceForTranslation({
    primaryCategory: resource.primaryCategory,
    crisisPhone: resource.contact.crisisPhone,
    is24Hours: resource.contact.is24Hours,
  });
  if (highRisk) return { ok: false, reason: "Este recurso es de alto riesgo — excluido estructuralmente." };

  const spanishRow = await dbGetCommunityResourceSpanishStatus(resourceId);
  const sourceType = spanishRow?.spanishSourceType;
  if (sourceType !== "official_spanish_source" && sourceType !== "official_bilingual_source") {
    return { ok: false, reason: "No hay evidencia de fuente oficial en español registrada." };
  }
  if (spanishRow?.spanishStatus === "official_spanish") {
    return { ok: false, reason: "Ya estaba publicado como español oficial." };
  }

  const pending = await dbListPendingResourceChangeProposalsForResource(resourceId);
  const pendingOfficialSpanish = pending.filter((p) => p.proposalSource === "official_spanish");
  if (pendingOfficialSpanish.length === 0) {
    return { ok: false, reason: "No hay propuestas de español oficial pendientes." };
  }
  const conflictingTranslation = pending.some((p) => p.proposalSource === "translation" && pendingOfficialSpanish.some((o) => o.fieldName === p.fieldName));
  if (conflictingTranslation) {
    return { ok: false, reason: "Existe una propuesta de traducción en conflicto sobre el mismo campo." };
  }

  // Live re-check against CURRENT structured facts — never trust the value captured at attach time.
  const facts = buildOfficialSpanishStructuredFacts(resource);
  for (const p of pendingOfficialSpanish) {
    const relatedEnText = relatedEnTextForOfficialSpanishField(p.fieldName, resource);
    const integrity = checkOfficialSpanishFieldIntegrity({ ...facts, relatedVerifiedEnText: relatedEnText }, p.proposedValue == null ? null : String(p.proposedValue));
    if (!integrity.ok) {
      return { ok: false, reason: `Verificación de integridad fallida en "${p.fieldName}": ${integrity.invented.join(", ")}.` };
    }
  }

  const acceptedFieldNames: string[] = [];
  for (const p of pendingOfficialSpanish) {
    const fieldResult = await dbUpdateSingleResourceField(resourceId, p.fieldName, p.proposedValue == null ? "" : String(p.proposedValue), actor);
    if (!fieldResult.ok) {
      return {
        ok: false,
        reason: `No se pudo aceptar "${p.fieldName}": ${fieldResult.error}. Campos ya aceptados en este intento: ${acceptedFieldNames.join(", ") || "ninguno"}.`,
      };
    }
    await dbUpdateResourceChangeProposalStatus(p.id, "accepted", actor);
    await insertVerificationEvent({
      resourceId,
      eventType: "field_accepted",
      actorEmail: actor,
      sourceType: "official_spanish",
      previousValue: p.oldValue as string | null,
      accepted: p.proposedValue as string | null,
      notes: `field=${p.fieldName} (aprobación en lote de español oficial)`,
    });
    acceptedFieldNames.push(p.fieldName);
  }

  // Same confirmation core the single-resource "Confirmar español oficial" button uses — one
  // implementation, never two divergent copies (Gate ES-9F).
  const confirmResult = await confirmOfficialSpanishCore(resourceId, actor);
  if (!confirmResult.ok) {
    return { ok: false, reason: `Campos aceptados pero no se pudo confirmar español oficial: ${confirmResult.error}.` };
  }

  auditAdminWrite("recurso_official_spanish_batch_approved", "community_resources", resourceId, { actorEmail: actor, organizationName, acceptedFieldNames });
  return { ok: true };
}

export async function approveOfficialSpanishBatchAction(formData: FormData): Promise<void> {
  await requireLeonixAdminPermission("can_manage_recursos");
  const actor = await actorEmail();

  const selectedIds = formData.getAll("resourceId").filter((v): v is string => typeof v === "string" && v.length > 0);

  const snapshot = await loadSpanishReconciliationSnapshot();
  if (snapshot.unavailable) {
    redirect(`/admin/recursos/espanol?error=${encodeURIComponent("Supabase no está disponible — no se pudo cargar la cola de reconciliación.")}`);
  }

  const eligible = snapshot.entries.filter(isEligibleForOfficialSpanishBatchApproval);
  const candidates = selectedIds.length > 0 ? eligible.filter((e) => selectedIds.includes(e.resource.id)) : eligible;
  const batch = candidates.slice(0, MAX_BULK_SPANISH_DRAFT_BATCH);

  const summary: OfficialSpanishBatchSummary = { requested: batch.length, processed: 0, published: 0, skipped: [], failed: [] };

  for (const entry of batch) {
    summary.processed++;
    try {
      const result = await approveOneResourceOfficialSpanish(entry.resource.id, entry.resource.organizationName, actor);
      if (result.ok) {
        summary.published++;
      } else {
        summary.skipped.push({ resourceId: entry.resource.id, organizationName: entry.resource.organizationName, reason: result.reason });
      }
    } catch (e) {
      // No retries — one failed item never aborts the rest of the batch (same doctrine as generateSpanishDraftsBatchAction).
      summary.failed.push({
        resourceId: entry.resource.id,
        organizationName: entry.resource.organizationName,
        reason: e instanceof Error ? e.message : "Error inesperado.",
      });
    }
  }

  auditAdminWrite("recurso_official_spanish_batch_gesture", "community_resources", "batch", {
    actorEmail: actor,
    requested: summary.requested,
    published: summary.published,
    skippedCount: summary.skipped.length,
    failedCount: summary.failed.length,
  });

  revalidatePath("/admin/recursos/espanol");
  revalidatePath("/admin/recursos/cambios");
  redirect(`/admin/recursos/espanol?oficial_batch_summary=${encodeURIComponent(JSON.stringify(summary))}`);
}
