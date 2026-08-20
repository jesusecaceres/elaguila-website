"use server";

/**
 * Globalization Build 03 (Gate 24) — minimal admin capability for Leonix Community Trust.
 * Mirrors `deleteListingAction`'s exact shape (`app/admin/actions.ts`) — same permission gate,
 * same service-role client, same audit-log convention. No new logging/permission system invented.
 *
 * Endorsements are controlled labels (a fixed registry), never free text, so moderation risk is
 * inherently smaller than a comments system — the only admin capability needed is removing a
 * single abusive/fraudulent vote row. There is no admin path to edit a count directly; counts are
 * always derived by counting real rows.
 */
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { auditAdminWrite } from "@/app/admin/_lib/auditAdminWrite";
import { requireLeonixAdminPermission } from "@/app/admin/_lib/leonixAdminGate";

export async function removeLeonixEndorsementVoteAction(voteId: string, reason?: string) {
  await requireLeonixAdminPermission("can_manage_ads");
  const supabase = getAdminSupabase();

  const { data: row, error: readError } = await supabase
    .from("leonix_endorsement_votes")
    .select("id, target_type, target_id, category, endorsement_key, user_id")
    .eq("id", voteId)
    .maybeSingle();
  if (readError) throw new Error(readError.message);
  if (!row) return { ok: false as const, error: "vote_not_found" as const };

  const { error } = await supabase.from("leonix_endorsement_votes").delete().eq("id", voteId);
  if (error) throw new Error(error.message);

  auditAdminWrite("community_endorsement_vote_removed_by_admin", "leonix_endorsement_votes", voteId, {
    target_type: row.target_type,
    target_id: row.target_id,
    category: row.category,
    endorsement_key: row.endorsement_key,
    reason: reason ?? null,
  });

  return { ok: true as const };
}

/**
 * Read-only aggregate inspection for one target — reuses the same public read RPC the app itself
 * uses, no separate admin-only query engine.
 */
export async function inspectLeonixEndorsementAggregateAction(targetType: string, targetId: string) {
  await requireLeonixAdminPermission("can_manage_ads");
  const supabase = getAdminSupabase();
  const { data, error } = await supabase.rpc("get_leonix_endorsement_summary", {
    p_target_type: targetType,
    p_target_id: targetId,
    p_user_id: null,
  });
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<{ endorsement_key: string; vote_count: number; user_voted: boolean }>;
}
