"use server";

/**
 * Recursos Intake OS — Gate 3 URL intake server action. Enforces can_manage_recursos
 * server-side before performing any fetch or write — never trusts client permission state.
 */
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";
import { getAdminOperatorEmailFromCookies } from "@/app/lib/supabase/adminSession";
import { cookies } from "next/headers";
import { runUrlIntake } from "@/app/lib/recursos/intake/urlIntakeOrchestrator";

export async function analyzeUrlIntakeAction(formData: FormData): Promise<void> {
  await requireLeonixAdminPermission("can_manage_recursos");

  const rawUrl = String(formData.get("url") ?? "").trim();
  const c = await cookies();
  const actorEmail = getAdminOperatorEmailFromCookies(c);

  const result = await runUrlIntake(rawUrl, actorEmail);

  if (!result.ok) {
    const params = new URLSearchParams({ error: result.reason });
    if (result.jobId) params.set("jobId", result.jobId);
    redirect(`/admin/recursos/intake?${params.toString()}`);
  }

  revalidatePath("/admin/recursos/candidatos");
  revalidatePath("/admin/recursos");
  redirect(`/admin/recursos/intake/resultado/${result.jobId}?candidateId=${encodeURIComponent(result.candidateId)}`);
}
