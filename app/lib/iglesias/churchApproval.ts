import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export async function approveAndPublishChurch(
  admin: SupabaseClient,
  churchId: string,
  opts?: { reviewedBy?: string | null },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const now = new Date().toISOString();
  const { error } = await admin
    .from("churches")
    .update({
      approval_status: "approved",
      is_active: true,
      published_at: now,
      updated_at: now,
    })
    .eq("id", churchId);
  if (error) return { ok: false, error: error.message };

  const submissionPatch: Record<string, unknown> = {
    reviewed_at: now,
    reject_reason: null,
    updated_at: now,
  };
  if (opts?.reviewedBy) submissionPatch.reviewed_by = opts.reviewedBy;
  await admin.from("church_submissions").update(submissionPatch).eq("church_id", churchId);
  return { ok: true };
}

export async function rejectAndUnpublishChurch(
  admin: SupabaseClient,
  churchId: string,
  opts: { rejectReason: string; reviewedBy?: string | null },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const now = new Date().toISOString();
  const { error } = await admin
    .from("churches")
    .update({
      approval_status: "rejected",
      is_active: false,
      published_at: null,
      updated_at: now,
    })
    .eq("id", churchId);
  if (error) return { ok: false, error: error.message };

  const submissionPatch: Record<string, unknown> = {
    reviewed_at: now,
    reject_reason: opts.rejectReason.slice(0, 240),
    updated_at: now,
  };
  if (opts.reviewedBy) submissionPatch.reviewed_by = opts.reviewedBy;
  await admin.from("church_submissions").update(submissionPatch).eq("church_id", churchId);
  return { ok: true };
}
