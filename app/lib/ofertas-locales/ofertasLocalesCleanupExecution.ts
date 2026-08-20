import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

const OFERTAS_STORAGE_PREFIXES = [
  "ofertas-locales/",
  "ofertas_locales/",
  "tienda/ofertas-locales/",
] as const;

export type OfertaLocalCleanupExecutionMode = "dry_run" | "adapter_required";

export function validateOfertaLocalCleanupStoragePath(storagePath: string): boolean {
  const path = String(storagePath ?? "").trim();
  if (!path || path.includes("..") || path.startsWith("/") || /^[a-z]+:\/\//i.test(path)) return false;
  return OFERTAS_STORAGE_PREFIXES.some((prefix) => path.startsWith(prefix));
}
export async function claimOfertaLocalCleanupTasks(input: {
  supabase: SupabaseClient;
  batchSize?: number;
  leaseMinutes?: number;
  now?: Date;
}): Promise<{ ok: true; leaseId: string; claimed: number } | { ok: false; error: string; detail?: string }> {
  const now = input.now ?? new Date();
  const leaseId = crypto.randomUUID();
  const batchSize = Math.max(1, Math.min(25, Math.floor(input.batchSize ?? 10)));
  const leaseExpiresAt = new Date(now.getTime() + Math.max(1, input.leaseMinutes ?? 15) * 60 * 1000).toISOString();

  const { data: candidates, error: lookupError } = await input.supabase
    .from("ofertas_local_asset_cleanup_queue")
    .select("id, storage_path, attempt_count, max_attempts")
    .in("status", ["pending", "failed"])
    .or(`retry_after_at.is.null,retry_after_at.lte.${now.toISOString()}`)
    .order("created_at", { ascending: true })
    .limit(batchSize);
  if (lookupError) return { ok: false, error: "cleanup_lookup_failed", detail: lookupError.message };

  const ids = (candidates ?? [])
    .filter((row) => validateOfertaLocalCleanupStoragePath(String(row.storage_path ?? "")))
    .filter((row) => Number(row.attempt_count ?? 0) < Number(row.max_attempts ?? 5))
    .map((row) => row.id);
  if (ids.length === 0) return { ok: true, leaseId, claimed: 0 };

  let claimed = 0;
  for (const row of candidates ?? []) {
    if (!ids.includes(row.id)) continue;
    const { error } = await input.supabase
      .from("ofertas_local_asset_cleanup_queue")
      .update({
        status: "processing",
        processing_lease_id: leaseId,
        lease_expires_at: leaseExpiresAt,
        attempt_count: Number(row.attempt_count ?? 0) + 1,
        last_attempt_at: now.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq("id", row.id)
      .in("status", ["pending", "failed"]);
    if (error) return { ok: false, error: "cleanup_claim_failed", detail: error.message };
    claimed += 1;
  }
  return { ok: true, leaseId, claimed };
}
export async function markOfertaLocalCleanupTaskFailed(input: {
  supabase: SupabaseClient;
  taskId: string;
  leaseId: string;
  reason: string;
  retryAfterMinutes?: number;
  now?: Date;
}): Promise<{ ok: true } | { ok: false; error: string; detail?: string }> {
  const now = input.now ?? new Date();
  const retryAfter = new Date(now.getTime() + Math.max(5, input.retryAfterMinutes ?? 60) * 60 * 1000);
  const { error } = await input.supabase
    .from("ofertas_local_asset_cleanup_queue")
    .update({
      status: "failed",
      attempt_count: undefined,
      retry_after_at: retryAfter.toISOString(),
      failure_reason: input.reason.trim().slice(0, 1000),
      last_error: input.reason.trim().slice(0, 1000),
      processing_lease_id: null,
      lease_expires_at: null,
      updated_at: now.toISOString(),
    })
    .eq("id", input.taskId)
    .eq("processing_lease_id", input.leaseId);
  if (error) return { ok: false, error: "cleanup_fail_update_failed", detail: error.message };
  return { ok: true };
}

export async function releaseExpiredOfertaLocalCleanupLeases(input: {
  supabase: SupabaseClient;
  now?: Date;
}): Promise<{ ok: true } | { ok: false; error: string; detail?: string }> {
  const now = input.now ?? new Date();
  const { error } = await input.supabase
    .from("ofertas_local_asset_cleanup_queue")
    .update({
      status: "failed",
      processing_lease_id: null,
      lease_expires_at: null,
      failure_reason: "Processing lease expired before storage deletion adapter confirmed completion.",
      last_error: "cleanup_processing_lease_expired",
      updated_at: now.toISOString(),
    })
    .eq("status", "processing")
    .lt("lease_expires_at", now.toISOString());
  if (error) return { ok: false, error: "cleanup_lease_release_failed", detail: error.message };
  return { ok: true };
}

export function describeOfertaLocalCleanupExecutionMode(): {
  mode: OfertaLocalCleanupExecutionMode;
  physicalDeletionPerformed: false;
  externalStorageCalled: false;
} {
  return {
    mode: "adapter_required",
    physicalDeletionPerformed: false,
    externalStorageCalled: false,
  };
}
