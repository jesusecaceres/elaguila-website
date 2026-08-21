"use server";

/**
 * Recursos Intake OS — Gate 6G/6I reverification actions. "Iniciar reverificación" reuses the
 * Gate 3 URL intake engine (via reverifyResourceViaUrl) against a known resource. "Marcar
 * reverificación completada" is intentionally just setVerificationStatusAction called with
 * verificationStatus="verified" — that action already validates, sets last_verified_at/
 * next_verification_at, appends a `reverified` event, and audits (Gate 6F), so reverification
 * completion needs no new state-transition code, only this UI entry point.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { getAdminOperatorEmailFromCookies } from "@/app/lib/supabase/adminSession";
import { dbGetCommunityResourceById } from "@/app/lib/recursos/server/communityResourcesDb";
import { reverifyResourceViaUrl } from "@/app/lib/recursos/intake/reverifyResourceViaUrl";

export async function startUrlReverificationAction(formData: FormData): Promise<void> {
  await requireLeonixAdminPermission("can_manage_recursos");
  const resourceId = String(formData.get("resourceId") ?? "").trim();
  if (!resourceId) redirect("/admin/recursos/reverificacion?error=unknown_resource");

  const resource = await dbGetCommunityResourceById(resourceId);
  if (!resource) redirect("/admin/recursos/reverificacion?error=unknown_resource");

  const c = await cookies();
  const actorEmail = getAdminOperatorEmailFromCookies(c);

  const result = await reverifyResourceViaUrl(resource!, actorEmail);
  if (!result.ok) {
    redirect(`/admin/recursos/${resourceId}?error=${encodeURIComponent(result.reason)}`);
  }

  redirect(`/admin/recursos/${resourceId}?reverify_changes=${result.changeCount}`);
}
