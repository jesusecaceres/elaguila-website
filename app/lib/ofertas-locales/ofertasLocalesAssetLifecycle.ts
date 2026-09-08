import type { SupabaseClient } from "@supabase/supabase-js";

import type { OfertaLocalPublishedAssetMetadata } from "./ofertasLocalesTypes";

export type OfertaLocalSourceAssetLifecycleStatus =
  | "pending_review"
  | "active"
  | "superseded"
  | "removed"
  | "scan_failed";

export type OfertaLocalSourceAssetReviewState = "needs_review" | "approved" | "rejected";

export type OfertaLocalSourceAssetRow = {
  id: string;
  oferta_local_id: string;
  owner_id: string;
  version_number: number;
  asset_kind: "flyer" | "coupon";
  source_asset_id: string;
  storage_path: string | null;
  public_url: string | null;
  original_file_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  page_count: number | null;
  scan_job_id: string | null;
  review_state: OfertaLocalSourceAssetReviewState;
  lifecycle_status: OfertaLocalSourceAssetLifecycleStatus;
  replacement_reason: string | null;
  cleanup_status: string;
  created_at: string;
  updated_at: string;
};

export const OFERTAS_LOCALES_SOURCE_ASSET_SELECT =
  "id, oferta_local_id, owner_id, version_number, asset_kind, source_asset_id, storage_path, public_url, original_file_name, mime_type, size_bytes, page_count, scan_job_id, review_state, lifecycle_status, replacement_reason, cleanup_status, created_at, updated_at";

export function mapPublishedAssetToSourceVersionSeed(input: {
  ofertaLocalId: string;
  ownerId: string;
  versionNumber: number;
  assetKind: "flyer" | "coupon";
  asset: OfertaLocalPublishedAssetMetadata;
  replacementReason?: string | null;
}) {
  return {
    oferta_local_id: input.ofertaLocalId,
    owner_id: input.ownerId,
    version_number: input.versionNumber,
    asset_kind: input.assetKind,
    source_asset_id: input.asset.id,
    storage_path: input.asset.storagePath || null,
    public_url: input.asset.url || null,
    original_file_name: input.asset.fileName || null,
    mime_type: input.asset.mimeType || null,
    size_bytes: input.asset.sizeBytes,
    page_count: input.asset.pageNumber ?? null,
    review_state: "needs_review",
    lifecycle_status: "pending_review",
    replacement_reason: input.replacementReason?.trim() || null,
  } as const;
}

export function isOfertaLocalSourceAssetPubliclyUsable(
  row: Pick<OfertaLocalSourceAssetRow, "review_state" | "lifecycle_status"> | null | undefined,
): boolean {
  return Boolean(row && row.review_state === "approved" && row.lifecycle_status === "active");
}

export function sourceAssetRequiresReview(
  row: Pick<OfertaLocalSourceAssetRow, "review_state" | "lifecycle_status"> | null | undefined,
): boolean {
  return Boolean(row && row.lifecycle_status === "pending_review" && row.review_state === "needs_review");
}

export async function listOfertaLocalSourceAssetVersions(
  supabase: SupabaseClient,
  ofertaLocalId: string,
): Promise<OfertaLocalSourceAssetRow[]> {
  const { data, error } = await supabase
    .from("ofertas_local_source_assets")
    .select(OFERTAS_LOCALES_SOURCE_ASSET_SELECT)
    .eq("oferta_local_id", ofertaLocalId)
    .order("version_number", { ascending: false });
  if (error || !data) return [];
  return data as OfertaLocalSourceAssetRow[];
}

export async function getNextOfertaLocalSourceVersionNumber(
  supabase: SupabaseClient,
  ofertaLocalId: string,
): Promise<number> {
  const { data } = await supabase
    .from("ofertas_local_source_assets")
    .select("version_number")
    .eq("oferta_local_id", ofertaLocalId)
    .order("version_number", { ascending: false })
    .limit(1);
  const latest = Array.isArray(data) && data[0]?.version_number ? Number(data[0].version_number) : 0;
  return Number.isFinite(latest) ? latest + 1 : 1;
}

export async function createOfertaLocalReplacementSourceVersion(input: {
  supabase: SupabaseClient;
  ofertaLocalId: string;
  ownerId: string;
  assetKind: "flyer" | "coupon";
  asset: OfertaLocalPublishedAssetMetadata;
  uploadedBy: string;
  reason?: string | null;
}): Promise<{ ok: true; sourceAsset: OfertaLocalSourceAssetRow } | { ok: false; error: string; detail?: string }> {
  const versionNumber = await getNextOfertaLocalSourceVersionNumber(input.supabase, input.ofertaLocalId);
  const row = {
    ...mapPublishedAssetToSourceVersionSeed({
      ofertaLocalId: input.ofertaLocalId,
      ownerId: input.ownerId,
      versionNumber,
      assetKind: input.assetKind,
      asset: input.asset,
      replacementReason: input.reason,
    }),
    uploaded_by: input.uploadedBy,
  };

  const { data, error } = await input.supabase
    .from("ofertas_local_source_assets")
    .insert(row)
    .select(OFERTAS_LOCALES_SOURCE_ASSET_SELECT)
    .single();
  if (error || !data) {
    return { ok: false, error: "source_asset_version_insert_failed", detail: error?.message };
  }
  return { ok: true, sourceAsset: data as OfertaLocalSourceAssetRow };
}

export async function createOfertaLocalSourceVersion(input: {
  supabase: SupabaseClient;
  ofertaLocalId: string;
  ownerId: string;
  assetKind: "flyer" | "coupon";
  asset: OfertaLocalPublishedAssetMetadata;
  uploadedBy: string;
  reason?: string | null;
}) {
  return createOfertaLocalReplacementSourceVersion(input);
}

export async function markOfertaLocalSourceVersionActive(input: {
  supabase: SupabaseClient;
  ofertaLocalId: string;
  sourceAssetId: string;
  nowIso?: string;
}): Promise<{ ok: true } | { ok: false; error: string; detail?: string }> {
  const now = input.nowIso ?? new Date().toISOString();
  const { error: rpcError } = await input.supabase.rpc("activate_oferta_local_source_version", {
    p_oferta_local_id: input.ofertaLocalId,
    p_source_asset_version_id: input.sourceAssetId,
  });
  if (!rpcError) return { ok: true };

  const { error: oldError } = await input.supabase
    .from("ofertas_local_source_assets")
    .update({ lifecycle_status: "superseded", superseded_at: now, updated_at: now })
    .eq("oferta_local_id", input.ofertaLocalId)
    .eq("lifecycle_status", "active")
    .neq("id", input.sourceAssetId);
  if (oldError) return { ok: false, error: "source_asset_supersede_failed", detail: oldError.message };

  const { error: activeError } = await input.supabase
    .from("ofertas_local_source_assets")
    .update({ lifecycle_status: "active", review_state: "approved", activated_at: now, updated_at: now })
    .eq("id", input.sourceAssetId)
    .eq("oferta_local_id", input.ofertaLocalId);
  if (activeError) return { ok: false, error: "source_asset_activate_failed", detail: activeError.message };

  const { error: itemError } = await input.supabase
    .from("oferta_local_items")
    .update({ source_lifecycle_status: "superseded", is_active: false, updated_at: now })
    .eq("oferta_local_id", input.ofertaLocalId)
    .neq("source_asset_version_id", input.sourceAssetId);
  if (itemError) return { ok: false, error: "source_items_supersede_failed", detail: itemError.message };

  const { error: parentError } = await input.supabase
    .from("ofertas_locales")
    .update({
      active_source_asset_id: input.sourceAssetId,
      public_source_asset_id: input.sourceAssetId,
      asset_lifecycle_status: "current",
      asset_replacement_required_review: false,
      updated_at: now,
    })
    .eq("id", input.ofertaLocalId);
  if (parentError) return { ok: false, error: "parent_source_switch_failed", detail: parentError.message };

  return { ok: true };
}

export async function queueOfertaLocalAssetCleanup(input: {
  supabase: SupabaseClient;
  ofertaLocalId: string;
  sourceAssetId?: string | null;
  storagePath: string;
  cleanupType?: "source_asset_removed" | "crop_superseded" | "scan_artifact_superseded";
  requestedBy?: string | null;
  reason?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string; detail?: string }> {
  const storagePath = input.storagePath.trim();
  if (!storagePath) return { ok: false, error: "cleanup_storage_path_required" };
  const { error } = await input.supabase.from("ofertas_local_asset_cleanup_queue").insert({
    oferta_local_id: input.ofertaLocalId,
    source_asset_version_id: input.sourceAssetId || null,
    storage_path: storagePath,
    cleanup_type: input.cleanupType ?? "source_asset_removed",
    status: "pending",
    requested_by: input.requestedBy || null,
    reason: input.reason?.trim().slice(0, 1000) || null,
  });
  return error ? { ok: false, error: "cleanup_queue_insert_failed", detail: error.message } : { ok: true };
}

export async function markOfertaLocalSourceVersionRemoved(input: {
  supabase: SupabaseClient;
  ofertaLocalId: string;
  sourceAssetId: string;
  actorUserId: string;
  reason: string;
  nowIso?: string;
}): Promise<{ ok: true } | { ok: false; error: string; detail?: string }> {
  const now = input.nowIso ?? new Date().toISOString();
  const { error } = await input.supabase
    .from("ofertas_local_source_assets")
    .update({
      lifecycle_status: "removed",
      removed_at: now,
      removed_by: input.actorUserId,
      removal_reason: input.reason.trim().slice(0, 1000),
      cleanup_status: "queued",
      updated_at: now,
    })
    .eq("id", input.sourceAssetId)
    .eq("oferta_local_id", input.ofertaLocalId);
  if (error) return { ok: false, error: "source_asset_remove_failed", detail: error.message };
  const { data: sourceAsset } = await input.supabase
    .from("ofertas_local_source_assets")
    .select("storage_path")
    .eq("id", input.sourceAssetId)
    .eq("oferta_local_id", input.ofertaLocalId)
    .maybeSingle();
  const storagePath = String(sourceAsset?.storage_path ?? "").trim();
  if (storagePath) {
    await queueOfertaLocalAssetCleanup({
      supabase: input.supabase,
      ofertaLocalId: input.ofertaLocalId,
      sourceAssetId: input.sourceAssetId,
      storagePath,
      cleanupType: "source_asset_removed",
      requestedBy: input.actorUserId,
      reason: input.reason,
    });
  }
  return { ok: true };
}
