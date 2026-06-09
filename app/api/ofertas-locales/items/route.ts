import { NextResponse, type NextRequest } from "next/server";

import {
  mapOfertaLocalItemReviewRowToViewModel,
  summarizeOfertaLocalItemReviewCounts,
} from "@/app/lib/ofertas-locales/ofertasLocalesItemReviewMapper";
import { resolveOfertasLocalesOwnerOrAdminAuth } from "@/app/lib/ofertas-locales/ofertasLocalesReviewAuth";
import type {
  OfertaLocalItemDbRow,
  OfertaLocalItemsListApiResponse,
  OfertaLocalScanJobSummary,
} from "@/app/lib/ofertas-locales/ofertasLocalesTypes";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

export const runtime = "nodejs";

function isDbTableMissingError(message: string | undefined): boolean {
  const m = (message ?? "").toLowerCase();
  return m.includes("does not exist") || m.includes("could not find the table");
}

async function assertOfferAccess(
  supabase: ReturnType<typeof getAdminSupabase>,
  ofertaLocalId: string,
  auth: { actorUserId: string; isAdmin: boolean }
): Promise<boolean> {
  const { data, error } = await supabase
    .from("ofertas_locales")
    .select("id, owner_id")
    .eq("id", ofertaLocalId)
    .maybeSingle();

  if (error || !data) return false;
  if (auth.isAdmin) return true;
  return data.owner_id === auth.actorUserId;
}

export async function GET(req: NextRequest) {
  const auth = await resolveOfertasLocalesOwnerOrAdminAuth(req);
  if (!auth) {
    return NextResponse.json<OfertaLocalItemsListApiResponse>(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json<OfertaLocalItemsListApiResponse>(
      { ok: false, error: "supabase_admin_unconfigured" },
      { status: 503 }
    );
  }

  const ofertaLocalId = req.nextUrl.searchParams.get("ofertaLocalId")?.trim() ?? "";
  const scanJobId = req.nextUrl.searchParams.get("scanJobId")?.trim() ?? "";

  if (!ofertaLocalId) {
    return NextResponse.json<OfertaLocalItemsListApiResponse>(
      { ok: false, error: "missing_oferta_local_id" },
      { status: 400 }
    );
  }

  const supabase = getAdminSupabase();

  const hasAccess = await assertOfferAccess(supabase, ofertaLocalId, auth);
  if (!hasAccess) {
    return NextResponse.json<OfertaLocalItemsListApiResponse>(
      { ok: false, error: "forbidden", detail: "Offer not found or not accessible." },
      { status: 403 }
    );
  }

  let itemsQuery = supabase
    .from("oferta_local_items")
    .select("*")
    .eq("oferta_local_id", ofertaLocalId)
    .order("created_at", { ascending: false });

  if (!auth.isAdmin) {
    itemsQuery = itemsQuery.eq("owner_id", auth.actorUserId);
  }

  if (scanJobId) {
    itemsQuery = itemsQuery.eq("scan_job_id", scanJobId);
  }

  const { data: itemRows, error: itemsError } = await itemsQuery;

  if (itemsError) {
    if (isDbTableMissingError(itemsError.message)) {
      return NextResponse.json<OfertaLocalItemsListApiResponse>(
        {
          ok: false,
          error: "items_table_unavailable",
          detail: "AI item tables are not available yet.",
        },
        { status: 503 }
      );
    }
    return NextResponse.json<OfertaLocalItemsListApiResponse>(
      { ok: false, error: "items_query_failed", detail: itemsError.message },
      { status: 500 }
    );
  }

  const items = (itemRows ?? []).map((row) =>
    mapOfertaLocalItemReviewRowToViewModel(row as OfertaLocalItemDbRow)
  );

  let scanJobs: OfertaLocalScanJobSummary[] = [];
  let scanJobsQuery = supabase
    .from("oferta_local_scan_jobs")
    .select("id, status, items_extracted_count, pages_processed, completed_at")
    .eq("oferta_local_id", ofertaLocalId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (!auth.isAdmin) {
    scanJobsQuery = scanJobsQuery.eq("owner_id", auth.actorUserId);
  }

  const { data: scanJobRows, error: scanJobsError } = await scanJobsQuery;

  if (!scanJobsError && scanJobRows) {
    scanJobs = scanJobRows.map((job) => ({
      id: job.id as string,
      status: job.status,
      itemsExtractedCount: job.items_extracted_count ?? 0,
      pagesProcessed: job.pages_processed ?? 0,
      completedAt: job.completed_at ?? null,
    }));
  }

  return NextResponse.json<OfertaLocalItemsListApiResponse>({
    ok: true,
    items,
    scanJobs,
    summary: summarizeOfertaLocalItemReviewCounts(items),
  });
}
