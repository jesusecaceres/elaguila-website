"use server";

/**
 * Recursos Intake OS — Gate 7 partner update-request actions. V1 is strictly admin-entered: a
 * request never writes to community_resources directly. Convert-to-proposals reuses the Gate 5
 * change-proposal engine via convertPartnerRequestToProposals.ts. Resolving/rejecting a request
 * only changes the request's own status — it never itself accepts or rejects any change proposal
 * (those remain separate, existing Gate 5 actions on the Cambios page).
 */
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { getAdminOperatorEmailFromCookies } from "@/app/lib/supabase/adminSession";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";
import {
  dbCreatePartnerUpdateRequest,
  dbGetPartnerUpdateRequest,
  dbUpdatePartnerUpdateRequestStatus,
} from "@/app/lib/recursos/intake/server/partnerUpdateRequestsDb";
import { dbGetCommunityResourceById } from "@/app/lib/recursos/server/communityResourcesDb";
import { convertPartnerRequestToProposals } from "@/app/lib/recursos/intake/convertPartnerRequestToProposals";
import { isValidPartnerRequestType, REQUEST_TYPE_FIELDS } from "@/app/lib/recursos/intake/partnerRequestFieldMap";

async function actorEmail(): Promise<string | null> {
  const c = await cookies();
  return getAdminOperatorEmailFromCookies(c);
}

function str(f: FormData, k: string): string {
  const v = f.get(k);
  return typeof v === "string" ? v.trim() : "";
}

export async function createPartnerUpdateRequestAction(formData: FormData): Promise<void> {
  await requireLeonixAdminPermission("can_manage_recursos");

  const requestType = str(formData, "requestType");
  if (!isValidPartnerRequestType(requestType)) {
    redirect(`/admin/recursos/solicitudes/nueva?error=${encodeURIComponent("Tipo de solicitud inválido.")}`);
  }

  const resourceId = str(formData, "resourceId") || null;
  const organizationName = str(formData, "organizationName") || null;
  const submittedContactName = str(formData, "submittedContactName") || null;
  const submittedContactEmail = str(formData, "submittedContactEmail") || null;
  const sourceNotes = str(formData, "sourceNotes") || null;

  if (!resourceId && !organizationName) {
    redirect(`/admin/recursos/solicitudes/nueva?error=${encodeURIComponent("Selecciona un recurso existente o escribe el nombre de la organización.")}`);
  }

  // Only ever reads formData under the exact allow-listed field keys for this request type —
  // never trusts an arbitrary client-supplied field name (Gate 7G).
  const requestedChanges: Record<string, string> = {};
  for (const field of REQUEST_TYPE_FIELDS[requestType as keyof typeof REQUEST_TYPE_FIELDS]) {
    const value = str(formData, `field_${field}`);
    if (value) requestedChanges[field] = value;
  }

  const actor = await actorEmail();
  const result = await dbCreatePartnerUpdateRequest({
    resourceId,
    organizationName,
    submittedContactName,
    submittedContactEmail,
    requestType,
    requestedChanges,
    sourceNotes,
    createdBy: actor,
  });
  if (!result.ok) {
    redirect(`/admin/recursos/solicitudes/nueva?error=${encodeURIComponent(result.error)}`);
  }

  auditAdminWrite("recurso_partner_request_created", "partner_update_request", result!.id, {
    actorEmail: actor,
    resourceId,
    requestType,
    fieldsReported: Object.keys(requestedChanges),
  });

  revalidatePath("/admin/recursos/solicitudes");
  redirect(`/admin/recursos/solicitudes/${result!.id}?created=1`);
}

export async function markPartnerRequestReviewingAction(formData: FormData): Promise<void> {
  await requireLeonixAdminPermission("can_manage_recursos");
  const id = str(formData, "requestId");
  const request = id ? await dbGetPartnerUpdateRequest(id) : null;
  if (!request) redirect("/admin/recursos/solicitudes?error=unknown_request");

  const actor = await actorEmail();
  const result = await dbUpdatePartnerUpdateRequestStatus(id, "reviewing", actor, ["pending"]);
  if (!result.ok) redirect(`/admin/recursos/solicitudes/${id}?error=${encodeURIComponent(result.error)}`);

  auditAdminWrite("recurso_partner_request_review_started", "partner_update_request", id, { actorEmail: actor });
  revalidatePath(`/admin/recursos/solicitudes/${id}`);
  revalidatePath("/admin/recursos/solicitudes");
  redirect(`/admin/recursos/solicitudes/${id}?status_saved=1`);
}

export async function rejectPartnerRequestAction(formData: FormData): Promise<void> {
  await requireLeonixAdminPermission("can_manage_recursos");
  const id = str(formData, "requestId");
  const request = id ? await dbGetPartnerUpdateRequest(id) : null;
  if (!request) redirect("/admin/recursos/solicitudes?error=unknown_request");
  if (request!.status === "resolved" || request!.status === "rejected") {
    redirect(`/admin/recursos/solicitudes/${id}?error=${encodeURIComponent("Esta solicitud ya fue cerrada.")}`);
  }

  const actor = await actorEmail();
  // Never touches community_resources or any change proposal — only this request's own status.
  const result = await dbUpdatePartnerUpdateRequestStatus(id, "rejected", actor, ["pending", "reviewing"]);
  if (!result.ok) redirect(`/admin/recursos/solicitudes/${id}?error=${encodeURIComponent(result.error)}`);

  auditAdminWrite("recurso_partner_request_rejected", "partner_update_request", id, { actorEmail: actor });
  revalidatePath(`/admin/recursos/solicitudes/${id}`);
  revalidatePath("/admin/recursos/solicitudes");
  redirect(`/admin/recursos/solicitudes/${id}?status_saved=1`);
}

export async function resolvePartnerRequestAction(formData: FormData): Promise<void> {
  await requireLeonixAdminPermission("can_manage_recursos");
  const id = str(formData, "requestId");
  const request = id ? await dbGetPartnerUpdateRequest(id) : null;
  if (!request) redirect("/admin/recursos/solicitudes?error=unknown_request");
  if (request!.status === "resolved" || request!.status === "rejected") {
    redirect(`/admin/recursos/solicitudes/${id}?error=${encodeURIComponent("Esta solicitud ya fue cerrada.")}`);
  }

  const actor = await actorEmail();
  // Resolving closes the REQUEST workflow only — it never itself accepts/rejects a proposal
  // (Gate 7J). Whatever proposals were or weren't accepted stays entirely on the Cambios page.
  const result = await dbUpdatePartnerUpdateRequestStatus(id, "resolved", actor, ["pending", "reviewing"]);
  if (!result.ok) redirect(`/admin/recursos/solicitudes/${id}?error=${encodeURIComponent(result.error)}`);

  auditAdminWrite("recurso_partner_request_resolved", "partner_update_request", id, { actorEmail: actor });
  revalidatePath(`/admin/recursos/solicitudes/${id}`);
  revalidatePath("/admin/recursos/solicitudes");
  redirect(`/admin/recursos/solicitudes/${id}?status_saved=1`);
}

export async function convertPartnerRequestToProposalsAction(formData: FormData): Promise<void> {
  await requireLeonixAdminPermission("can_manage_recursos");
  const id = str(formData, "requestId");
  const request = id ? await dbGetPartnerUpdateRequest(id) : null;
  if (!request) redirect("/admin/recursos/solicitudes?error=unknown_request");
  if (request!.status === "resolved" || request!.status === "rejected") {
    redirect(`/admin/recursos/solicitudes/${id}?error=${encodeURIComponent("Esta solicitud ya fue cerrada.")}`);
  }
  if (!request!.resourceId) {
    redirect(`/admin/recursos/solicitudes/${id}?error=${encodeURIComponent("Esta solicitud no está vinculada a un recurso existente.")}`);
  }

  const resource = await dbGetCommunityResourceById(request!.resourceId!);
  if (!resource) redirect(`/admin/recursos/solicitudes/${id}?error=${encodeURIComponent("El recurso vinculado ya no existe.")}`);

  const actor = await actorEmail();
  const result = await convertPartnerRequestToProposals(request!, resource!, actor);
  if (!result.ok) redirect(`/admin/recursos/solicitudes/${id}?error=${encodeURIComponent(result.reason)}`);

  auditAdminWrite("recurso_partner_request_converted", "partner_update_request", id, {
    actorEmail: actor,
    resourceId: resource!.id,
    createdCount: result!.createdCount,
    skippedDuplicateCount: result!.skippedDuplicateCount,
  });

  revalidatePath(`/admin/recursos/solicitudes/${id}`);
  revalidatePath("/admin/recursos/cambios");
  redirect(`/admin/recursos/solicitudes/${id}?converted=${result!.createdCount}&skipped=${result!.skippedDuplicateCount}`);
}
