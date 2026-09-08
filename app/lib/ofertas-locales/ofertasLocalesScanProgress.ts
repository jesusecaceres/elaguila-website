import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  OfertaLocalScanJobStage,
  OfertaLocalScanPageStage,
  OfertaLocalScanPageStatus,
} from "./ofertasLocalesTypes";

type PageSeed = {
  pageNumber: number;
  width?: number | null;
  height?: number | null;
  renderMethod?: string | null;
};

export async function seedOfertaLocalScanPages(input: {
  supabase: SupabaseClient;
  ofertaLocalId: string;
  scanJobId: string;
  ownerId: string;
  sourceAssetVersionId?: string | null;
  pages: PageSeed[];
}) {
  if (!input.pages.length) return { ok: true as const };
  const now = new Date().toISOString();
  const rows = input.pages.map((page) => ({
    oferta_local_id: input.ofertaLocalId,
    scan_job_id: input.scanJobId,
    source_asset_version_id: input.sourceAssetVersionId || null,
    owner_id: input.ownerId,
    page_number: page.pageNumber,
    page_status: "queued",
    stage: "queued",
    width: page.width ?? null,
    height: page.height ?? null,
    render_method: page.renderMethod ?? null,
    created_at: now,
    updated_at: now,
  }));
  const { error } = await input.supabase.from("oferta_local_scan_pages").insert(rows);
  return error ? { ok: false as const, error: error.message } : { ok: true as const };
}

export async function updateOfertaLocalScanJobProgress(input: {
  supabase: SupabaseClient;
  scanJobId: string;
  totalPages?: number;
  completedPages?: number;
  failedPages?: number;
  currentPage?: number | null;
  currentStage: OfertaLocalScanJobStage;
  status?: string;
  failureSummary?: string | null;
}) {
  const now = new Date().toISOString();
  const row: Record<string, unknown> = {
    current_stage: input.currentStage,
    last_activity_at: now,
    updated_at: now,
  };
  if (input.totalPages != null) row.total_pages = input.totalPages;
  if (input.completedPages != null) row.completed_pages = input.completedPages;
  if (input.failedPages != null) row.failed_pages = input.failedPages;
  if (input.currentPage !== undefined) row.current_page = input.currentPage;
  if (input.status) row.status = input.status;
  if (input.failureSummary !== undefined) row.failure_summary = input.failureSummary;
  const { error } = await input.supabase.from("oferta_local_scan_jobs").update(row).eq("id", input.scanJobId);
  return error ? { ok: false as const, error: error.message } : { ok: true as const };
}

export async function updateOfertaLocalScanPageProgress(input: {
  supabase: SupabaseClient;
  scanJobId: string;
  pageNumber: number;
  pageStatus: OfertaLocalScanPageStatus;
  stage: OfertaLocalScanPageStage;
  candidateCount?: number;
  itemCount?: number;
  cropCount?: number;
  errorMessage?: string | null;
}) {
  const now = new Date().toISOString();
  const row: Record<string, unknown> = {
    page_status: input.pageStatus,
    stage: input.stage,
    updated_at: now,
  };
  if (input.pageStatus === "processing" && input.stage !== "queued") row.started_at = now;
  if (input.pageStatus === "completed" || input.pageStatus === "failed" || input.pageStatus === "skipped") {
    row.completed_at = now;
  }
  if (input.candidateCount != null) row.candidate_count = input.candidateCount;
  if (input.itemCount != null) row.item_count = input.itemCount;
  if (input.cropCount != null) row.crop_count = input.cropCount;
  if (input.errorMessage !== undefined) row.error_message = input.errorMessage?.slice(0, 2000) || null;
  const { error } = await input.supabase
    .from("oferta_local_scan_pages")
    .update(row)
    .eq("scan_job_id", input.scanJobId)
    .eq("page_number", input.pageNumber);
  return error ? { ok: false as const, error: error.message } : { ok: true as const };
}
