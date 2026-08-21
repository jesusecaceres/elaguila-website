/**
 * Package A, Gate 10 — bounded, opt-in OpenAI image generation.
 *
 * Reconciliation finding: business_creative_assets already models AI-generated imagery
 * end-to-end (asset_kind="ai_illustrative" + rights_source="ai_generated" +
 * authenticity_classification="AI_ILLUSTRATIVE" + approval_state defaulting to "pending", all
 * enforced by DB CHECK constraints — see supabase/migrations/20260810160000_...sql) and Vercel
 * Blob is the repository's established asset-storage convention (see
 * app/api/admin/field-discovery/assets/upload/route.ts). No schema migration was required.
 *
 * This route is intentionally NOT wired to any UI button in this package — see
 * providerTypes.isImageGenerationLive(), which requires an explicit
 * OPENAI_IMAGE_GENERATION_ENABLED opt-in on top of a configured OPENAI_API_KEY. Until that flag
 * is set, this route truthfully reports the capability as not live rather than generating.
 *
 * Generated images are ALWAYS inserted with approval_state="pending" — never auto-approved,
 * never auto-published, never eligible for final approval until a human reviews them
 * (see assetTypes.canAssetReachFinalApproval).
 */
import { put } from "@vercel/blob";
import { NextResponse, type NextRequest } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { createGeneratedImageAsset, createProviderRun, getJobById, getLastProviderRunForJob, type CreativeActor } from "@/app/lib/business/creativeStudio/repository";
import { isImageGenerationLive } from "@/app/lib/business/creativeStudio/providerTypes";
import { resolveCreativeProvider } from "@/app/lib/business/creativeStudio/providerRegistry";

const GENERATION_COOLDOWN_MS = 15_000;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; jobId: string }> },
) {
  const { businessId, jobId } = await params;

  if (!isImageGenerationLive()) {
    return NextResponse.json(
      { ok: false, error: "image_generation_not_live", detail: "OpenAI image generation is not enabled on this server (requires OPENAI_API_KEY and an explicit OPENAI_IMAGE_GENERATION_ENABLED opt-in)." },
      { status: 501 },
    );
  }

  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "generate_creative_draft")) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    return NextResponse.json({ ok: false, error: "blob_unconfigured" }, { status: 503 });
  }

  const job = await getJobById(businessId, jobId);
  if (!job) {
    return NextResponse.json({ ok: false, error: "job_not_found" }, { status: 404 });
  }

  const lastRun = await getLastProviderRunForJob(businessId, jobId);
  if (lastRun && Date.now() - new Date(lastRun.createdAt).getTime() < GENERATION_COOLDOWN_MS) {
    return NextResponse.json({ ok: false, error: "cooldown_active" }, { status: 429 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }
  const prompt = typeof body.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) {
    return NextResponse.json({ ok: false, error: "prompt_required" }, { status: 400 });
  }

  const actor: CreativeActor = {
    type: "staff",
    rosterId: access.actor.rosterId,
    authUserId: access.actor.authUserId,
    email: access.actor.email,
    role: access.actor.role,
  };

  const provider = await resolveCreativeProvider("openai");
  if (!provider?.generateImage) {
    return NextResponse.json({ ok: false, error: "provider_unavailable" }, { status: 503 });
  }

  const startedAt = Date.now();
  const imageResult = await provider.generateImage({ prompt });
  const latencyMs = Date.now() - startedAt;

  if (!imageResult.ok || !imageResult.imageBase64) {
    await createProviderRun(
      businessId, jobId,
      {
        versionId: null,
        providerKey: provider.providerKey,
        modelKey: provider.modelKey,
        templateVersion: "v1",
        schemaVersion: "image-v1",
        // Image runs still require a snapshot reference per the provider_runs FK; reuse the job's
        // most recent snapshot if one exists, otherwise this run cannot be recorded — fail closed.
        inputSnapshotId: job.inputSnapshotId ?? "",
        status: "failed",
        errorState: `${imageResult.failureCode ?? "unknown"}: ${imageResult.failureReason ?? ""}`.slice(0, 500),
        latencyMs,
        costMetadata: null,
      },
      actor,
    ).catch(() => null);
    return NextResponse.json({ ok: false, error: imageResult.failureCode ?? "provider_failed", detail: imageResult.failureReason }, { status: 502 });
  }

  const imageBuffer = Buffer.from(imageResult.imageBase64, "base64");
  const pathname = `creative-studio/${businessId}/${jobId}/ai-illustrative-${Date.now()}.png`;
  const uploaded = await put(pathname, imageBuffer, { access: "public", token, addRandomSuffix: false, contentType: "image/png" });

  const asset = await createGeneratedImageAsset(
    businessId, jobId,
    {
      storageRef: uploaded.pathname ?? pathname,
      originalFilename: `ai-illustrative-${Date.now()}.png`,
      mimeType: "image/png",
      pixelWidth: null,
      pixelHeight: null,
      fileSizeBytes: imageBuffer.byteLength,
    },
    actor,
  );

  if (!asset) {
    return NextResponse.json({ ok: false, error: "asset_persist_failed" }, { status: 500 });
  }

  if (job.inputSnapshotId) {
    await createProviderRun(
      businessId, jobId,
      {
        versionId: null,
        providerKey: provider.providerKey,
        modelKey: provider.modelKey,
        templateVersion: "v1",
        schemaVersion: "image-v1",
        inputSnapshotId: job.inputSnapshotId,
        status: "success",
        errorState: null,
        latencyMs,
        costMetadata: { revisedPrompt: imageResult.revisedPrompt ?? null },
      },
      actor,
    ).catch(() => null);
  }

  return NextResponse.json({ ok: true, asset, publicUrl: uploaded.url });
}
