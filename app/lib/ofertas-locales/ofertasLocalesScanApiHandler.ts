import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { normalizeDocumentAiResultToOfertaLocalItems } from "./ofertasLocalesAiNormalizer";
import {
  mapOfertaLocalSearchableItemDraftToDbInsert,
  mapOfertaLocalScanJobRecordDraftToDbInsert,
} from "./ofertasLocalesAiDbMapper";
import {
  getMissingOfertaLocalDocumentAiEnvLabels,
  isOfertaLocalDocumentAiConfigured,
} from "./ofertasLocalesDocumentAiConfig";
import {
  OFERTA_LOCAL_DOCUMENT_AI_MAX_BYTES,
  OfertaLocalDocumentAiNotConfiguredError,
  processOfertaLocalAssetWithDocumentAi,
} from "./ofertasLocalesDocumentAiClient";
import { resolveOfertasLocalesOwnerOrAdminAuth } from "./ofertasLocalesReviewAuth";
import {
  isSupabaseSchemaCacheMissingTableError,
  ofertasLocalesAiSchemaMissingDetail,
} from "./ofertasLocalesSupabaseSchema";
import type {
  OfertaLocalPublishStatus,
  OfertaLocalScanApiRequest,
  OfertaLocalScanApiResponse,
} from "./ofertasLocalesTypes";
import { getAdminSupabase, isSupabaseAdminConfigured } from "@/app/lib/supabase/server";

const ALLOWED_MIMES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const SCAN_BLOCKED_PARENT_STATUSES: ReadonlySet<OfertaLocalPublishStatus> = new Set([
  "rejected",
  "archived",
]);

function isScanRequest(v: unknown): v is OfertaLocalScanApiRequest {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.ofertaLocalId === "string" &&
    typeof o.assetId === "string" &&
    (o.assetKind === "flyer" || o.assetKind === "coupon") &&
    typeof o.assetUrl === "string" &&
    typeof o.storagePath === "string" &&
    typeof o.mimeType === "string"
  );
}

async function fetchAssetBytes(assetUrl: string): Promise<Buffer> {
  const url = assetUrl.trim();
  if (!url.startsWith("https://")) {
    throw new Error("Asset URL must be a secure HTTPS URL.");
  }

  const res = await fetch(url, { method: "GET", cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Could not download asset (HTTP ${res.status}).`);
  }

  const len = Number(res.headers.get("content-length") ?? "0");
  if (len > OFERTA_LOCAL_DOCUMENT_AI_MAX_BYTES) {
    throw new Error("Asset file exceeds the maximum scan size.");
  }

  const arrayBuffer = await res.arrayBuffer();
  if (arrayBuffer.byteLength > OFERTA_LOCAL_DOCUMENT_AI_MAX_BYTES) {
    throw new Error("Asset file exceeds the maximum scan size.");
  }
  if (arrayBuffer.byteLength < 1) {
    throw new Error("Asset file is empty.");
  }

  return Buffer.from(arrayBuffer);
}

export async function handleOfertaLocalScanPost(
  req: NextRequest,
  pathOfertaLocalId?: string
): Promise<NextResponse<OfertaLocalScanApiResponse>> {
  const auth = await resolveOfertasLocalesOwnerOrAdminAuth(req);
  if (!auth) {
    return NextResponse.json<OfertaLocalScanApiResponse>(
      { ok: false, error: "unauthorized", configurationMissing: false },
      { status: 401 }
    );
  }

  if (!isOfertaLocalDocumentAiConfigured()) {
    const missing = getMissingOfertaLocalDocumentAiEnvLabels();
    return NextResponse.json<OfertaLocalScanApiResponse>(
      {
        ok: false,
        error: "document_ai_not_configured",
        detail: `Missing server configuration: ${missing.join(", ")}`,
        configurationMissing: true,
        message: "Google Document AI is not configured on the server.",
      },
      { status: 503 }
    );
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json<OfertaLocalScanApiResponse>(
      {
        ok: false,
        error: "supabase_admin_unconfigured",
        detail: "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
        configurationMissing: false,
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json<OfertaLocalScanApiResponse>(
      { ok: false, error: "invalid_json", configurationMissing: false },
      { status: 400 }
    );
  }

  if (!isScanRequest(body)) {
    return NextResponse.json<OfertaLocalScanApiResponse>(
      { ok: false, error: "bad_request", configurationMissing: false },
      { status: 400 }
    );
  }

  if (pathOfertaLocalId?.trim() && body.ofertaLocalId.trim() !== pathOfertaLocalId.trim()) {
    return NextResponse.json<OfertaLocalScanApiResponse>(
      { ok: false, error: "id_mismatch", configurationMissing: false },
      { status: 400 }
    );
  }

  const mimeType = body.mimeType.trim().toLowerCase();
  const storagePath = body.storagePath.trim();
  if (!storagePath) {
    return NextResponse.json<OfertaLocalScanApiResponse>(
      {
        ok: false,
        error: "missing_storage_path",
        detail: "Uploaded storage metadata is required. External URLs cannot be scanned.",
        configurationMissing: false,
      },
      { status: 400 }
    );
  }

  if (!ALLOWED_MIMES.has(mimeType)) {
    return NextResponse.json<OfertaLocalScanApiResponse>(
      { ok: false, error: "unsupported_mime", configurationMissing: false },
      { status: 400 }
    );
  }

  const supabase = getAdminSupabase();
  const now = new Date().toISOString();

  const tableProbe = await supabase.from("oferta_local_scan_jobs").select("id").limit(1);
  if (tableProbe.error && isSupabaseSchemaCacheMissingTableError(tableProbe.error.message, tableProbe.error.code)) {
    return NextResponse.json<OfertaLocalScanApiResponse>(
      {
        ok: false,
        error: "ai_scan_schema_not_applied",
        detail: ofertasLocalesAiSchemaMissingDetail("oferta_local_scan_jobs"),
        configurationMissing: false,
        message: ofertasLocalesAiSchemaMissingDetail("oferta_local_scan_jobs"),
      },
      { status: 503 }
    );
  }

  const { data: parentOffer, error: parentError } = await supabase
    .from("ofertas_locales")
    .select(
      "id, owner_id, status, business_name, address, city, state, zip_code, valid_from, valid_until"
    )
    .eq("id", body.ofertaLocalId)
    .maybeSingle();

  if (parentError) {
    if (isSupabaseSchemaCacheMissingTableError(parentError.message, parentError.code)) {
      return NextResponse.json<OfertaLocalScanApiResponse>(
        {
          ok: false,
          error: "ai_scan_schema_not_applied",
          detail: ofertasLocalesAiSchemaMissingDetail("ofertas_locales"),
          configurationMissing: false,
          message: ofertasLocalesAiSchemaMissingDetail("ofertas_locales"),
        },
        { status: 503 }
      );
    }
    return NextResponse.json<OfertaLocalScanApiResponse>(
      {
        ok: false,
        error: "parent_lookup_failed",
        detail: parentError.message,
        configurationMissing: false,
      },
      { status: 500 }
    );
  }

  if (!parentOffer) {
    return NextResponse.json<OfertaLocalScanApiResponse>(
      {
        ok: false,
        error: "not_found",
        detail: "Parent offer not found.",
        configurationMissing: false,
      },
      { status: 404 }
    );
  }

  const parentStatus = parentOffer.status as OfertaLocalPublishStatus;
  if (SCAN_BLOCKED_PARENT_STATUSES.has(parentStatus)) {
    return NextResponse.json<OfertaLocalScanApiResponse>(
      {
        ok: false,
        error: "parent_not_scannable",
        detail: `Cannot scan offers with status ${parentStatus}.`,
        configurationMissing: false,
      },
      { status: 403 }
    );
  }

  if (!auth.isAdmin && parentOffer.owner_id !== auth.actorUserId) {
    return NextResponse.json<OfertaLocalScanApiResponse>(
      {
        ok: false,
        error: "forbidden",
        detail: "Offer not found or not owned by you.",
        configurationMissing: false,
      },
      { status: 403 }
    );
  }

  const ownerId = parentOffer.owner_id as string;

  const scanInsert = mapOfertaLocalScanJobRecordDraftToDbInsert(
    {
      id: "",
      ofertaLocalId: body.ofertaLocalId,
      ownerId,
      sourceAssetId: body.assetId,
      sourceAssetType: body.assetKind === "flyer" ? "flyer_pdf" : "coupon_pdf",
      sourceAssetUrl: body.assetUrl,
      provider: "google_document_ai",
      normalizerProvider: "leonix_normalizer",
      status: "processing",
      startedAt: now,
      completedAt: "",
      rawResultStoragePath: "",
      normalizedResultStoragePath: "",
      errorMessage: "",
      pagesProcessed: 0,
      itemsExtractedCount: 0,
      confidenceAverage: null,
    },
    ownerId,
    body.ofertaLocalId
  );

  const { data: scanJob, error: scanInsertError } = await supabase
    .from("oferta_local_scan_jobs")
    .insert({
      ...scanInsert,
      source_asset_url: body.assetUrl,
      source_asset_type: body.assetKind,
      source_storage_path: storagePath,
      source_mime_type: mimeType,
      source_asset_kind: body.assetKind,
      status: "processing",
      started_at: now,
      updated_at: now,
    })
    .select("id")
    .single();

  if (scanInsertError || !scanJob) {
    if (isSupabaseSchemaCacheMissingTableError(scanInsertError?.message, scanInsertError?.code)) {
      return NextResponse.json<OfertaLocalScanApiResponse>(
        {
          ok: false,
          error: "ai_scan_schema_not_applied",
          detail: ofertasLocalesAiSchemaMissingDetail("oferta_local_scan_jobs"),
          configurationMissing: false,
          message: ofertasLocalesAiSchemaMissingDetail("oferta_local_scan_jobs"),
        },
        { status: 503 }
      );
    }
    return NextResponse.json<OfertaLocalScanApiResponse>(
      {
        ok: false,
        error: "scan_job_insert_failed",
        detail: scanInsertError?.message ?? "unknown",
        configurationMissing: false,
      },
      { status: 500 }
    );
  }

  const scanJobId = scanJob.id as string;

  try {
    const fileBuffer = await fetchAssetBytes(body.assetUrl);
    const extraction = await processOfertaLocalAssetWithDocumentAi({
      fileBuffer,
      mimeType,
      assetId: body.assetId,
      ofertaLocalId: body.ofertaLocalId,
      ownerId,
    });

    const normalized = normalizeDocumentAiResultToOfertaLocalItems({
      extraction,
      sourceAssetId: body.assetId,
      sourceAssetUrl: body.assetUrl,
      sourceFileName: storagePath.split("/").pop() ?? body.assetId,
      assetKind: body.assetKind,
      businessName: parentOffer.business_name ?? "",
      businessAddress: parentOffer.address ?? "",
      businessCity: parentOffer.city ?? "",
      businessState: parentOffer.state ?? "",
      businessZipCode: parentOffer.zip_code ?? "",
      validFrom: parentOffer.valid_from ?? undefined,
      validUntil: parentOffer.valid_until ?? undefined,
    });

    const itemRows = normalized.items.map((item) =>
      mapOfertaLocalSearchableItemDraftToDbInsert(item, ownerId, body.ofertaLocalId, scanJobId)
    );

    if (itemRows.length > 0) {
      const { error: itemsError } = await supabase.from("oferta_local_items").insert(
        itemRows.map((row) => ({
          ...row,
          review_status: "needs_review",
          is_active: false,
          is_sponsored: false,
          created_at: now,
          updated_at: now,
        }))
      );
      if (itemsError) {
        throw new Error(itemsError.message);
      }
    }

    const completedAt = new Date().toISOString();
    await supabase
      .from("oferta_local_scan_jobs")
      .update({
        status: "needs_review",
        completed_at: completedAt,
        pages_processed: extraction.pagesProcessed,
        items_extracted_count: itemRows.length,
        confidence_average: extraction.confidenceAverage,
        raw_result_storage_path: `pending-object-storage://${scanJobId}`,
        normalized_result_storage_path: `inline-summary://${scanJobId}`,
        raw_ocr_summary: {
          textLength: extraction.text.length,
          pagesProcessed: extraction.pagesProcessed,
          pageLineCount: extraction.pageLines.length,
          entityCount: extraction.entities.length,
          mimeType,
          assetKind: body.assetKind,
        },
        error_message: null,
        updated_at: completedAt,
      })
      .eq("id", scanJobId);

    return NextResponse.json<OfertaLocalScanApiResponse>({
      ok: true,
      scanJobId,
      status: "needs_review",
      pagesProcessed: extraction.pagesProcessed,
      itemsExtractedCount: itemRows.length,
      message: normalized.note,
      configurationMissing: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed.";
    const configurationMissing = err instanceof OfertaLocalDocumentAiNotConfiguredError;
    const completedAt = new Date().toISOString();

    await supabase
      .from("oferta_local_scan_jobs")
      .update({
        status: "failed",
        completed_at: completedAt,
        error_message: message.slice(0, 2000),
        updated_at: completedAt,
      })
      .eq("id", scanJobId);

    return NextResponse.json<OfertaLocalScanApiResponse>(
      {
        ok: false,
        scanJobId,
        status: "failed",
        error: configurationMissing ? "document_ai_not_configured" : "scan_failed",
        detail: message,
        message,
        configurationMissing,
      },
      { status: configurationMissing ? 503 : 500 }
    );
  }
}
