"use server";

/**
 * Recursos Spanish Bridge — Gate ES-3/ES-4 admin actions. Every action requires
 * can_manage_recursos server-side, re-reads the resource fresh (never trusts client state), and
 * never writes community_resources directly except the narrow spanish_status/spanish_source_type
 * columns in markSpanishReviewedAction — content fields only ever change through the existing
 * Cambios accept flow.
 */
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { getAdminOperatorEmailFromCookies } from "@/app/lib/supabase/adminSession";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";
import { dbGetCommunityResourceById } from "@/app/lib/recursos/server/communityResourcesDb";
import { resolveEffectiveVerificationStatus } from "@/app/lib/recursos/verificationStatus";
import { generateSpanishTranslationProposals } from "@/app/lib/recursos/intake/translation/generateSpanishTranslationProposals";
import { dbListPendingResourceChangeProposalsForResource, dbUpdateResourceChangeProposalStatus } from "@/app/lib/recursos/intake/server/resourceChangeProposalsDb";
import { dbSetCommunityResourceSpanishStatus, dbGetCommunityResourceSpanishStatus } from "@/app/lib/recursos/intake/server/resourceSpanishStatusDb";
import { insertVerificationEvent } from "@/app/lib/recursos/intake/server/verificationEventsDb";

async function actorEmail(): Promise<string | null> {
  const c = await cookies();
  return getAdminOperatorEmailFromCookies(c);
}

function str(f: FormData, k: string): string {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
}

export async function generateSpanishTranslationAction(formData: FormData): Promise<void> {
  await requireLeonixAdminPermission("can_manage_recursos");
  const resourceId = str(formData, "resourceId");
  if (!resourceId) redirect("/admin/recursos?error=unknown_resource");

  const resource = await dbGetCommunityResourceById(resourceId);
  if (!resource) redirect("/admin/recursos?error=unknown_resource");

  const actor = await actorEmail();
  const result = await generateSpanishTranslationProposals(resource!, actor);

  if (!result.ok) {
    redirect(`/admin/recursos/${resourceId}?error=${encodeURIComponent(result.reason)}`);
  }
  if (result.alreadyPending) {
    redirect(`/admin/recursos/${resourceId}?error=${encodeURIComponent("Ya existen traducciones pendientes de revisión.")}`);
  }

  auditAdminWrite("recurso_spanish_translation_generated", "community_resources", resourceId, {
    actorEmail: actor,
    createdCount: result.createdCount,
    skippedIntegrityFields: result.skippedIntegrityFields,
  });

  revalidatePath(`/admin/recursos/${resourceId}`);
  revalidatePath("/admin/recursos/cambios");
  redirect(`/admin/recursos/cambios?tipo=traducciones&status_saved=1`);
}

/**
 * Explicit fresh-draft action (ES-3F/ES-4D). Unlike "Generar traducción", this is allowed to run
 * even when pending translation proposals already exist: it first supersedes them (transitions
 * to 'rejected' with a note, reusing the existing status-transition function — never a second
 * proposal engine, never an uncontrolled duplicate pending row) and then generates a fresh draft.
 * If accepted Spanish already exists, this still only ever creates NEW proposals against the
 * current *_es columns — it never overwrites accepted content directly.
 */
export async function regenerateSpanishTranslationAction(formData: FormData): Promise<void> {
  await requireLeonixAdminPermission("can_manage_recursos");
  const resourceId = str(formData, "resourceId");
  if (!resourceId) redirect("/admin/recursos?error=unknown_resource");

  const resource = await dbGetCommunityResourceById(resourceId);
  if (!resource) redirect("/admin/recursos?error=unknown_resource");

  const actor = await actorEmail();

  const pending = await dbListPendingResourceChangeProposalsForResource(resourceId);
  const pendingTranslations = pending.filter((p) => p.proposalSource === "translation");
  for (const p of pendingTranslations) {
    await dbUpdateResourceChangeProposalStatus(p.id, "rejected", actor);
  }

  const result = await generateSpanishTranslationProposals(resource!, actor);
  if (!result.ok) {
    redirect(`/admin/recursos/${resourceId}?error=${encodeURIComponent(result.reason)}`);
  }

  auditAdminWrite("recurso_spanish_translation_regenerated", "community_resources", resourceId, {
    actorEmail: actor,
    supersededCount: pendingTranslations.length,
    createdCount: result.ok && !result.alreadyPending ? result.createdCount : 0,
  });

  revalidatePath(`/admin/recursos/${resourceId}`);
  revalidatePath("/admin/recursos/cambios");
  redirect(`/admin/recursos/cambios?tipo=traducciones&status_saved=1`);
}

/**
 * Final resource-level Spanish certification gesture (ES-4E). Deliberately narrow: only ever
 * writes spanish_status/spanish_source_type via dbSetCommunityResourceSpanishStatus (Phase A),
 * never verification_status/last_verified_at/next_verification_at — translation approval is not
 * factual reverification.
 */
export async function markSpanishReviewedAction(formData: FormData): Promise<void> {
  await requireLeonixAdminPermission("can_manage_recursos");
  const resourceId = str(formData, "resourceId");
  if (!resourceId) redirect("/admin/recursos?error=unknown_resource");

  const resource = await dbGetCommunityResourceById(resourceId);
  if (!resource) redirect("/admin/recursos?error=unknown_resource");

  if (resolveEffectiveVerificationStatus(resource!.verification) !== "verified") {
    redirect(`/admin/recursos/${resourceId}?error=${encodeURIComponent("El recurso debe estar verificado antes de marcar el español como revisado.")}`);
  }

  const pending = await dbListPendingResourceChangeProposalsForResource(resourceId);
  if (pending.some((p) => p.proposalSource === "translation")) {
    redirect(`/admin/recursos/${resourceId}?error=${encodeURIComponent("Quedan propuestas de traducción pendientes — revísalas antes de marcar el español como revisado.")}`);
  }

  const hasSpanishContent = Boolean(
    resource!.shortDescriptionEs?.trim() || resource!.detailsEs?.trim() || resource!.eligibilityEs?.trim() || resource!.contact.hoursNoteEs?.trim(),
  );
  if (!hasSpanishContent) {
    redirect(`/admin/recursos/${resourceId}?error=${encodeURIComponent("No hay ningún campo en español para aprobar todavía.")}`);
  }

  const actor = await actorEmail();
  const result = await dbSetCommunityResourceSpanishStatus(resourceId, "verified_translation", "ai_translation_reviewed");
  if (!result.ok) {
    redirect(`/admin/recursos/${resourceId}?error=${encodeURIComponent(result.error)}`);
  }

  auditAdminWrite("recurso_spanish_marked_reviewed", "community_resources", resourceId, { actorEmail: actor, spanishStatus: "verified_translation", spanishSourceType: "ai_translation_reviewed" });

  revalidatePath(`/admin/recursos/${resourceId}`);
  redirect(`/admin/recursos/${resourceId}?saved=1`);
}

/**
 * Official Spanish certification gesture (Gate ES-5H). Distinct from markSpanishReviewedAction:
 * this confirms Spanish that came directly from an official source (extracted, not AI-translated)
 * — spanish_source_type must already be official_spanish_source/official_bilingual_source
 * (set at promotion time, ES-5G) BEFORE this action can run; it is never set here, only
 * preserved. Like markSpanishReviewedAction, never touches verification_status/last_verified_at/
 * next_verification_at — translation/source approval is not factual reverification.
 */
export async function confirmOfficialSpanishAction(formData: FormData): Promise<void> {
  await requireLeonixAdminPermission("can_manage_recursos");
  const resourceId = str(formData, "resourceId");
  if (!resourceId) redirect("/admin/recursos?error=unknown_resource");

  const resource = await dbGetCommunityResourceById(resourceId);
  if (!resource) redirect("/admin/recursos?error=unknown_resource");

  if (resolveEffectiveVerificationStatus(resource!.verification) !== "verified") {
    redirect(`/admin/recursos/${resourceId}?error=${encodeURIComponent("El recurso debe estar verificado antes de confirmar el español oficial.")}`);
  }

  const hasSpanishContent = Boolean(
    resource!.shortDescriptionEs?.trim() || resource!.detailsEs?.trim() || resource!.eligibilityEs?.trim() || resource!.contact.hoursNoteEs?.trim(),
  );
  if (!hasSpanishContent) {
    redirect(`/admin/recursos/${resourceId}?error=${encodeURIComponent("No hay ningún campo en español para confirmar todavía.")}`);
  }

  const spanishRow = await dbGetCommunityResourceSpanishStatus(resourceId);
  const sourceType = spanishRow?.spanishSourceType;
  if (sourceType !== "official_spanish_source" && sourceType !== "official_bilingual_source") {
    redirect(`/admin/recursos/${resourceId}?error=${encodeURIComponent("Este recurso no tiene evidencia de fuente oficial en español registrada — no se puede confirmar como español oficial.")}`);
  }

  // Unresolved relevant conflicts: any pending proposal (translation OR url_recheck) touching a
  // Spanish field must be resolved first — confirming while a change to that same content is
  // still under review would certify text that's about to change out from under it.
  const SPANISH_FIELDS = new Set(["shortDescriptionEs", "detailsEs", "eligibilityEs", "hoursNoteEs"]);
  const pending = await dbListPendingResourceChangeProposalsForResource(resourceId);
  if (pending.some((p) => SPANISH_FIELDS.has(p.fieldName))) {
    redirect(`/admin/recursos/${resourceId}?error=${encodeURIComponent("Quedan propuestas pendientes sobre campos en español — revísalas antes de confirmar el español oficial.")}`);
  }

  const actor = await actorEmail();
  const result = await dbSetCommunityResourceSpanishStatus(resourceId, "official_spanish", sourceType);
  if (!result.ok) {
    redirect(`/admin/recursos/${resourceId}?error=${encodeURIComponent(result.error)}`);
  }

  // ES-5N: evidence_recorded, sourceType matches the actual preserved source_type — no new event type.
  await insertVerificationEvent({
    resourceId,
    eventType: "evidence_recorded",
    actorEmail: actor,
    sourceType,
    notes: "Español oficial confirmado por un humano.",
  });
  auditAdminWrite("recurso_official_spanish_confirmed", "community_resources", resourceId, { actorEmail: actor, spanishSourceType: sourceType });

  revalidatePath(`/admin/recursos/${resourceId}`);
  redirect(`/admin/recursos/${resourceId}?saved=1`);
}
