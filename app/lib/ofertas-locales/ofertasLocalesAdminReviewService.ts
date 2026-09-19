import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import { appendAdminAuditLog } from "@/app/admin/_lib/adminAuditLogServer";

import {
  mutateOfertaLocalAdminReview,
  type OfertaLocalAdminReviewAction,
  type OfertaLocalAdminReviewResult,
} from "./ofertasLocalesAdminReviewMutations";

export type OfertaLocalAdminReviewAuditedResult =
  | (Extract<OfertaLocalAdminReviewResult, { ok: true }> & { auditLogged: boolean })
  | Extract<OfertaLocalAdminReviewResult, { ok: false }>;

/**
 * The ONE staff entry point for an Ofertas Locales review action (server action, PATCH row route and the
 * legacy POST review route all call this): the shared mutation (all approve gates intact — paid entitlement or
 * partner courtesy, resolved AI items, scan-ready public source, Leonix Ad ID), then an admin audit row and
 * revalidation. It writes no payment / entitlement field and never fabricates payment.
 */
export async function runOfertaLocalAdminReview(
  sb: SupabaseClient,
  input: { id: string; action: OfertaLocalAdminReviewAction; note?: string | null },
): Promise<OfertaLocalAdminReviewAuditedResult> {
  const result = await mutateOfertaLocalAdminReview(sb, input.id, input.action, input.note ?? null);
  if (!result.ok) return result;

  const note = String(input.note ?? "").trim();
  const audit = await appendAdminAuditLog({
    action: `ofertas_locales_admin_${input.action}`,
    targetType: "ofertas_locales",
    targetId: result.id,
    meta: {
      from_status: result.previousStatus,
      to_status: result.newStatus,
      note: note ? note.slice(0, 500) : null,
    },
  });

  revalidatePath("/clasificados/ofertas-locales");
  revalidatePath("/clasificados/ofertas-locales/results");
  revalidatePath("/admin/workspace/clasificados/ofertas-locales");

  return { ...result, auditLogged: audit.ok };
}
