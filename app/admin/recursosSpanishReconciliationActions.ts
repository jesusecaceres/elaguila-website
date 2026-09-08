"use server";

/**
 * Recursos Spanish Bridge — Gate ES-6D/E/F/G/H/I bulk draft action. Never approves anything —
 * this only ever creates resource_change_proposals rows (proposalSource:'translation') via the
 * existing generateSpanishTranslationProposals(), the same single-resource function ES-4's
 * "Generar traducción" button already calls. No second translator, no direct community_resources
 * write anywhere in this file.
 */
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { getAdminOperatorEmailFromCookies } from "@/app/lib/supabase/adminSession";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";
import {
  loadSpanishReconciliationSnapshot,
  isEligibleForBulkTranslationDraft,
  MAX_BULK_SPANISH_DRAFT_BATCH,
  type BulkSpanishDraftSummary,
} from "@/app/lib/recursos/intake/spanishReconciliationQueue";
import { generateSpanishTranslationProposals } from "@/app/lib/recursos/intake/translation/generateSpanishTranslationProposals";

async function actorEmail(): Promise<string | null> {
  const c = await cookies();
  return getAdminOperatorEmailFromCookies(c);
}

/**
 * "Generar borradores ES" — ES-6K: an explicit `resourceId` list (checkboxes) means "generate only
 * these" (still filtered through the exact same eligibility rule, never a bypass); with no
 * selection, batches the first MAX_BULK_SPANISH_DRAFT_BATCH resources currently eligible under
 * NEEDS_SPANISH_TRANSLATION. Either way, eligibility is decided by isEligibleForBulkTranslationDraft
 * — the same predicate the queue page uses to render the "Generar traducción" action per row, so
 * a resource can never be bulk-drafted while its own UI says that action isn't valid for it.
 */
export async function generateSpanishDraftsBatchAction(formData: FormData): Promise<void> {
  await requireLeonixAdminPermission("can_manage_recursos");
  const actor = await actorEmail();

  const selectedIds = formData.getAll("resourceId").filter((v): v is string => typeof v === "string" && v.length > 0);

  const snapshot = await loadSpanishReconciliationSnapshot();
  if (snapshot.unavailable) {
    redirect(`/admin/recursos/espanol?error=${encodeURIComponent("Supabase no está disponible — no se pudo cargar la cola de reconciliación.")}`);
  }

  const entryById = new Map(snapshot.entries.map((e) => [e.resource.id, e]));
  const eligible = snapshot.entries.filter(isEligibleForBulkTranslationDraft);
  const eligibleIds = new Set(eligible.map((e) => e.resource.id));

  const candidates = selectedIds.length > 0 ? eligible.filter((e) => selectedIds.includes(e.resource.id)) : eligible;
  const batch = candidates.slice(0, MAX_BULK_SPANISH_DRAFT_BATCH);

  let proposalsCreated = 0;
  let skippedPending = 0;
  let failed = 0;

  for (const entry of batch) {
    try {
      // ES-6F: re-check immediately before each call — another admin action could have created a
      // pending translation proposal for this resource between the snapshot read above and now.
      // generateSpanishTranslationProposals() already performs this exact check internally.
      const result = await generateSpanishTranslationProposals(entry.resource, actor);
      if (!result.ok) {
        failed++;
        continue;
      }
      if (result.alreadyPending) {
        skippedPending++;
        continue;
      }
      proposalsCreated += result.createdCount;
    } catch {
      // No retries (ES-6F) — one failed item never aborts the rest of the batch.
      failed++;
    }
  }

  let skippedNotVerified = 0;
  if (selectedIds.length > 0) {
    for (const id of selectedIds) {
      if (eligibleIds.has(id)) continue;
      const entry = entryById.get(id);
      if (!entry || entry.pendingTranslationCount === 0) skippedNotVerified++;
      else skippedPending++;
    }
  }

  const summary: BulkSpanishDraftSummary = {
    requested: selectedIds.length > 0 ? selectedIds.length : eligible.length,
    processed: batch.length,
    proposalsCreated,
    skippedPending,
    skippedNotVerified,
    failed,
  };

  auditAdminWrite("recurso_spanish_bulk_drafts_generated", "community_resources", "batch", { actorEmail: actor, ...summary });

  revalidatePath("/admin/recursos/espanol");
  revalidatePath("/admin/recursos");
  revalidatePath("/admin/recursos/cambios");

  redirect(`/admin/recursos/espanol?batch_summary=${encodeURIComponent(JSON.stringify(summary))}`);
}
