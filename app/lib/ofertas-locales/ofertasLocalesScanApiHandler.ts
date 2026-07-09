import "server-only";

import { NextResponse, type NextRequest } from "next/server";

import { runOfertaLocalAiScanExtraction } from "./ofertasLocalesAiScanOrchestrator";
import { applyOfertaLocalScanItemCrops } from "./ofertasLocalesScanCropGenerator";
import { prepareOfertaLocalScanPageImages } from "./ofertasLocalesPdfPageImages";
import {
  mapOfertaLocalItemReviewRowToSearchableDraft,
} from "./ofertasLocalesItemReviewMapper";
import {
  mapOfertaLocalSearchableItemDraftToDbInsert,
  mapOfertaLocalScanJobRecordDraftToDbInsert,
} from "./ofertasLocalesAiDbMapper";
import {
  assertOfertaLocalAiScanSizeWithinLimit,
  getOfertaLocalAiScanMaxBytes,
  OfertaLocalAiScanSizeExceededError,
} from "./ofertasLocalesAiScanSizeLimits";
import {
  getMissingOfertaLocalAiScanEnvLabels,
  isAnyOfertaLocalAiScanProviderConfigured,
  resolveOfertasAiExtractionProvider,
} from "./ofertasLocalesGeminiConfig";
import {
  OfertaLocalDocumentAiNotConfiguredError,
} from "./ofertasLocalesDocumentAiClient";
import { resolveOfertasLocalesOwnerOrAdminAuth } from "./ofertasLocalesReviewAuth";
import {
  isSupabaseSchemaCacheMissingTableError,
  ofertasLocalesAiSchemaMissingDetail,
} from "./ofertasLocalesSupabaseSchema";
import type {
  OfertaLocalItemDbRow,
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

function logAiStage(stage: string, payload: Record<string, unknown>, level: "info" | "warn" = "info") {
  const logger = level === "warn" ? console.warn : console.info;
  logger(`[ofertas-locales-ai] ${stage}`, payload);
}

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

async function fetchAssetBytes(
  assetUrl: string,
  context: { mimeType: string; assetKind: "flyer" | "coupon"; assetId: string }
): Promise<Buffer> {
  const url = assetUrl.trim();
  if (!url.startsWith("https://")) {
    throw new Error("Asset URL must be a secure HTTPS URL.");
  }

  const maxBytes = getOfertaLocalAiScanMaxBytes(context.mimeType);

  const res = await fetch(url, { method: "GET", cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Could not download asset (HTTP ${res.status}).`);
  }

  const len = Number(res.headers.get("content-length") ?? "0");
  if (len > 0) {
    assertOfertaLocalAiScanSizeWithinLimit({
      sizeBytes: len,
      mimeType: context.mimeType,
      assetKind: context.assetKind,
      assetId: context.assetId,
    });
  }

  const arrayBuffer = await res.arrayBuffer();
  assertOfertaLocalAiScanSizeWithinLimit({
    sizeBytes: arrayBuffer.byteLength,
    mimeType: context.mimeType,
    assetKind: context.assetKind,
    assetId: context.assetId,
  });
  if (arrayBuffer.byteLength < 1) {
    throw new Error("Asset file is empty.");
  }

  return Buffer.from(arrayBuffer);
}

function isCropBackfillRequest(v: unknown): v is {
  backfillMissingCrops: true;
  ofertaLocalId: string;
  scanJobId: string;
} {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    o.backfillMissingCrops === true &&
    typeof o.ofertaLocalId === "string" &&
    typeof o.scanJobId === "string"
  );
}

export type OfertaLocalCropBackfillResponse = {
  ok: boolean;
  attempted: number;
  generated: number;
  skipped: number;
  reasons: Record<string, number>;
  error?: string;
  detail?: string;
};

async function handleOfertaLocalCropBackfillPost(
  req: NextRequest,
  body: { ofertaLocalId: string; scanJobId: string }
): Promise<NextResponse<OfertaLocalCropBackfillResponse>> {
  const auth = await resolveOfertasLocalesOwnerOrAdminAuth(req);
  if (!auth) {
    return NextResponse.json(
      { ok: false, attempted: 0, generated: 0, skipped: 0, reasons: {}, error: "unauthorized" },
      { status: 401 }
    );
  }

  if (!isSupabaseAdminConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        attempted: 0,
        generated: 0,
        skipped: 0,
        reasons: { supabase_admin_unconfigured: 1 },
        error: "supabase_admin_unconfigured",
      },
      { status: 503 }
    );
  }

  const ofertaLocalId = body.ofertaLocalId.trim();
  const scanJobId = body.scanJobId.trim();
  if (!ofertaLocalId || !scanJobId) {
    return NextResponse.json(
      {
        ok: false,
        attempted: 0,
        generated: 0,
        skipped: 0,
        reasons: { bad_request: 1 },
        error: "bad_request",
      },
      { status: 400 }
    );
  }

  const supabase = getAdminSupabase();
  const { data: parentOffer, error: parentError } = await supabase
    .from("ofertas_locales")
    .select("id, owner_id, status")
    .eq("id", ofertaLocalId)
    .maybeSingle();

  if (parentError || !parentOffer) {
    return NextResponse.json(
      {
        ok: false,
        attempted: 0,
        generated: 0,
        skipped: 0,
        reasons: { offer_not_found: 1 },
        error: "not_found",
      },
      { status: 404 }
    );
  }

  if (!auth.isAdmin && parentOffer.owner_id !== auth.actorUserId) {
    return NextResponse.json(
      {
        ok: false,
        attempted: 0,
        generated: 0,
        skipped: 0,
        reasons: { forbidden: 1 },
        error: "forbidden",
      },
      { status: 403 }
    );
  }

  const { data: scanJob, error: scanJobError } = await supabase
    .from("oferta_local_scan_jobs")
    .select(
      "id, source_asset_url, source_mime_type, source_asset_id, source_asset_kind, source_storage_path"
    )
    .eq("id", scanJobId)
    .eq("oferta_local_id", ofertaLocalId)
    .maybeSingle();

  if (scanJobError || !scanJob) {
    return NextResponse.json(
      {
        ok: false,
        attempted: 0,
        generated: 0,
        skipped: 0,
        reasons: { scan_job_not_found: 1 },
        error: "scan_job_not_found",
        detail: scanJobError?.message,
      },
      { status: 404 }
    );
  }

  const assetUrl = String(scanJob.source_asset_url ?? "").trim();
  const mimeType = String(scanJob.source_mime_type ?? "application/pdf").trim().toLowerCase();
  const assetId = String(scanJob.source_asset_id ?? "asset").trim();
  const assetKind =
    scanJob.source_asset_kind === "coupon" ? ("coupon" as const) : ("flyer" as const);

  if (!assetUrl.startsWith("https://")) {
    return NextResponse.json(
      {
        ok: false,
        attempted: 0,
        generated: 0,
        skipped: 0,
        reasons: { source_asset_unavailable: 1 },
        error: "source_asset_unavailable",
        detail:
          "Original uploaded asset URL is unavailable. Re-upload the flyer and run a new scan to generate crops.",
      },
      { status: 422 }
    );
  }

  let itemsQuery = supabase
    .from("oferta_local_items")
    .select("*")
    .eq("oferta_local_id", ofertaLocalId)
    .eq("scan_job_id", scanJobId)
    .not("source_bbox", "is", null);

  if (!auth.isAdmin) {
    itemsQuery = itemsQuery.eq("owner_id", auth.actorUserId);
  }

  const { data: itemRows, error: itemsError } = await itemsQuery;
  if (itemsError) {
    return NextResponse.json(
      {
        ok: false,
        attempted: 0,
        generated: 0,
        skipped: 0,
        reasons: { items_query_failed: 1 },
        error: "items_query_failed",
        detail: itemsError.message,
      },
      { status: 500 }
    );
  }

  const missingCropRows = (itemRows ?? []).filter(
    (row) => !String(row.source_crop_url ?? "").trim()
  ) as OfertaLocalItemDbRow[];

  const reasons: Record<string, number> = {};
  const bump = (key: string) => {
    reasons[key] = (reasons[key] ?? 0) + 1;
  };

  if (missingCropRows.length === 0) {
    bump("nothing_to_backfill");
    return NextResponse.json({
      ok: true,
      attempted: 0,
      generated: 0,
      skipped: 0,
      reasons,
    });
  }

  try {
    const fileBuffer = await fetchAssetBytes(assetUrl, {
      mimeType,
      assetKind,
      assetId,
    });
    const prepared = await prepareOfertaLocalScanPageImages({ fileBuffer, mimeType });
    if (prepared.pages.length === 0) {
      bump("page_raster_failed");
      return NextResponse.json(
        {
          ok: false,
          attempted: missingCropRows.length,
          generated: 0,
          skipped: missingCropRows.length,
          reasons,
          error: "page_raster_failed",
          detail: "Could not rasterize source flyer pages for crop backfill.",
        },
        { status: 422 }
      );
    }

    const drafts = missingCropRows.map((row) => mapOfertaLocalItemReviewRowToSearchableDraft(row));
    const cropResult = await applyOfertaLocalScanItemCrops({
      items: drafts,
      ofertaLocalId,
      scanJobId,
      sourceAssetId: assetId,
      pageImages: prepared.pages,
    });

    let generated = 0;
    for (const draft of drafts) {
      const cropUrl = draft.sourceCropUrl?.trim();
      if (!cropUrl || !draft.id) {
        bump("crop_not_generated");
        continue;
      }
      const { error: updateError } = await supabase
        .from("oferta_local_items")
        .update({
          source_crop_url: cropUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", draft.id)
        .eq("oferta_local_id", ofertaLocalId);

      if (updateError) {
        bump("persist_failed");
        console.warn("[ofertas-locales crop] backfill persist failed", {
          ofertaLocalId,
          scanJobId,
          itemId: draft.id,
          error: updateError.message,
        });
        continue;
      }
      generated += 1;
    }

    for (const err of cropResult.cropErrors) {
      bump(err.split(":")[0] ?? err);
    }

    console.info("[ofertas-locales crop] backfill summary", {
      ofertaLocalId,
      scanJobId,
      attempted: missingCropRows.length,
      generated,
      skipped: missingCropRows.length - generated,
      reasons,
      cropErrors: cropResult.cropErrors.slice(0, 10),
    });

    return NextResponse.json({
      ok: generated > 0 || missingCropRows.length === 0,
      attempted: missingCropRows.length,
      generated,
      skipped: missingCropRows.length - generated,
      reasons,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "backfill_failed";
    bump("backfill_failed");
    return NextResponse.json(
      {
        ok: false,
        attempted: missingCropRows.length,
        generated: 0,
        skipped: missingCropRows.length,
        reasons,
        error: "backfill_failed",
        detail: message,
      },
      { status: 500 }
    );
  }
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

  if (!isAnyOfertaLocalAiScanProviderConfigured()) {
    const missing = getMissingOfertaLocalAiScanEnvLabels();
    return NextResponse.json<OfertaLocalScanApiResponse>(
      {
        ok: false,
        error: "ai_scan_not_configured",
        detail: `Missing server configuration: ${missing.join(" ")}`,
        configurationMissing: true,
        message:
          "No Ofertas Locales AI scan provider is configured. Set GEMINI_API_KEY or Google Document AI credentials.",
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

  if (isCropBackfillRequest(body)) {
    return handleOfertaLocalCropBackfillPost(req, body);
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
  const resolvedProvider = resolveOfertasAiExtractionProvider();
  const scanProvider =
    resolvedProvider === "gemini_multimodal" ? "gemini_multimodal" : "google_document_ai";
  const normalizerProvider = resolvedProvider === "gemini_multimodal" ? "gemini" : "leonix_normalizer";

  const scanInsert = mapOfertaLocalScanJobRecordDraftToDbInsert(
    {
      id: "",
      ofertaLocalId: body.ofertaLocalId,
      ownerId,
      sourceAssetId: body.assetId,
      sourceAssetType: body.assetKind === "flyer" ? "flyer_pdf" : "coupon_pdf",
      sourceAssetUrl: body.assetUrl,
      provider: scanProvider,
      normalizerProvider,
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
  const scanStartedMs = Date.now();

  try {
    const fileBuffer = await fetchAssetBytes(body.assetUrl, {
      mimeType,
      assetKind: body.assetKind,
      assetId: body.assetId,
    });
    const sourceFileName = storagePath.split("/").pop() ?? body.assetId;
    const scanResult = await runOfertaLocalAiScanExtraction({
      fileBuffer,
      mimeType,
      assetId: body.assetId,
      assetKind: body.assetKind,
      ofertaLocalId: body.ofertaLocalId,
      ownerId,
      scanJobId,
      sourceAssetUrl: body.assetUrl,
      sourceFileName,
      sourceStoragePath: storagePath,
      businessName: parentOffer.business_name ?? "",
      businessAddress: parentOffer.address ?? "",
      businessCity: parentOffer.city ?? "",
      businessState: parentOffer.state ?? "",
      businessZipCode: parentOffer.zip_code ?? "",
      validFrom: parentOffer.valid_from ?? undefined,
      validUntil: parentOffer.valid_until ?? undefined,
    });

    if (scanResult.pageErrors.length > 0) {
      console.warn("[ofertas-locales ai] scan page errors", {
        scanJobId,
        pageErrors: scanResult.pageErrors.slice(0, 10),
      });
    }

    console.info("[ofertas-locales ai] scan extraction summary", {
      scanJobId,
      providerUsed: scanResult.providerUsed,
      modelUsed: scanResult.modelUsed,
      pagesProcessed: scanResult.pagesProcessed,
      rawCandidateCount: scanResult.rawCandidateCount,
      insertedCount: scanResult.insertedCandidateCount,
      rejectedCount: scanResult.rejectedCount,
      priceRepairsApplied: scanResult.priceRepairsApplied,
      averageConfidence: scanResult.averageConfidence,
    });

    const itemRows = scanResult.items.map((item) =>
      mapOfertaLocalSearchableItemDraftToDbInsert(item, ownerId, body.ofertaLocalId, scanJobId)
    );
    itemRows.forEach((row, itemIndex) => {
      logAiStage("DB_MAPPING_PREPARED", {
        scanJobId,
        pageNumber: row.source_page,
        itemIndex,
        hasSourceBbox: Boolean(row.source_bbox),
        hasSourceCropUrl: Boolean(row.source_crop_url),
        mappedSourceCropUrl: row.source_crop_url ?? null,
      });
    });

    if (itemRows.length > 0) {
      const { data: insertedRows, error: itemsError } = await supabase.from("oferta_local_items").insert(
        itemRows.map((row) => ({
          ...row,
          review_status: "needs_review",
          is_active: false,
          is_sponsored: false,
          created_at: now,
          updated_at: now,
        }))
      ).select("id, source_page, source_crop_url");
      if (itemsError) {
        throw new Error(itemsError.message);
      }

      const persistedCropRows = itemRows.filter((row) => row.source_crop_url?.trim());
      for (const row of persistedCropRows) {
        console.info("[ofertas-locales crop] source_crop_url persisted", {
          scanJobId,
          sourcePage: row.source_page,
          itemName: row.item_name,
        });
      }
      for (const row of insertedRows ?? []) {
        logAiStage("DB_PERSISTENCE_CONFIRMED", {
          scanJobId,
          pageNumber: row.source_page,
          itemId: row.id,
          hasSourceCropUrl: Boolean(row.source_crop_url),
          persistedSourceCropUrl: row.source_crop_url ?? null,
        });
      }
      console.info("[ofertas-locales crop] persistence summary", {
        scanJobId,
        totalItems: itemRows.length,
        persistedCount: persistedCropRows.length,
      });
    }

    const completedAt = new Date().toISOString();
    await supabase
      .from("oferta_local_scan_jobs")
      .update({
        status: "needs_review",
        completed_at: completedAt,
        pages_processed: scanResult.pagesProcessed,
        items_extracted_count: itemRows.length,
        confidence_average: scanResult.confidenceAverage,
        provider: scanResult.providerUsed === "gemini_multimodal" ? "gemini_multimodal" : "google_document_ai",
        normalizer_provider:
          scanResult.providerUsed === "gemini_multimodal" ? "gemini" : "leonix_normalizer",
        raw_result_storage_path: `pending-object-storage://${scanJobId}`,
        normalized_result_storage_path: `inline-summary://${scanJobId}`,
        raw_ocr_summary: {
          ...scanResult.rawOcrSummary,
          mimeType,
          assetKind: body.assetKind,
          pageErrors: scanResult.pageErrors.slice(0, 20),
        },
        error_message: scanResult.pageErrors.length > 0 ? scanResult.pageErrors.join(" | ").slice(0, 2000) : null,
        updated_at: completedAt,
      })
      .eq("id", scanJobId);

    console.info("[ofertas-locales scan] duration ms", {
      scanJobId,
      durationMs: Date.now() - scanStartedMs,
      pagesProcessed: scanResult.pagesProcessed,
      itemsExtractedCount: itemRows.length,
    });

    return NextResponse.json<OfertaLocalScanApiResponse>({
      ok: true,
      scanJobId,
      status: "needs_review",
      pagesProcessed: scanResult.pagesProcessed,
      itemsExtractedCount: itemRows.length,
      message: scanResult.note,
      configurationMissing: false,
    });
  } catch (err) {
    const sizeExceeded = err instanceof OfertaLocalAiScanSizeExceededError;
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
        error: configurationMissing
          ? "ai_scan_not_configured"
          : sizeExceeded
            ? "scan_size_exceeded"
            : "scan_failed",
        detail: message,
        message,
        configurationMissing,
      },
      { status: configurationMissing ? 503 : sizeExceeded ? 413 : 500 }
    );
  }
}
