/**
 * Package A — real Creative Studio generation execution route.
 *
 * The first real, callable generation loop: verified truth snapshot + creative brief + contextual
 * Leonix doctrine + format spec are compiled into one provider-neutral instruction (see
 * generationCompiler.ts), executed against the requested provider (Gemini default, OpenAI
 * opt-in — see providerRegistry.ts), and persisted as an append-only CreativeJobVersion +
 * CreativeProviderRun. This never bypasses human review: the job status only ever reaches
 * "generated", never "approved" — approval remains a separate, human staff/owner action via the
 * existing transitionJobStatus() status machine (constants.ts).
 */
import { NextResponse, type NextRequest } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess, salesActorToCreativeActor } from "@/app/admin/_lib/businessWorkspaceAccess";
import {
  createInputSnapshot, createJobVersion, createProviderRun, getJobById, getLastProviderRunForJob,
  getLatestBriefForJob, transitionJobStatus,
} from "@/app/lib/business/creativeStudio/repository";
import { assembleResearchPacket } from "@/app/lib/business/creativeStudio/researchPacketAssembler";
import { compileDoctrineForJob, inferCreativeFamilyFromAssetType } from "@/app/lib/business/creativeStudio/doctrine";
import { compileGenerationInput } from "@/app/lib/business/creativeStudio/generationCompiler";
import { getPrintFormat } from "@/app/lib/business/creativeStudio/printSpecs";
import { getDefaultCreativeProvider, isKnownCreativeProviderKey, resolveCreativeProvider } from "@/app/lib/business/creativeStudio/providerRegistry";

/** Package A, Gate 12 — smallest appropriate cost/rate guard: bounded cooldown between generation attempts per job. */
const GENERATION_COOLDOWN_MS = 15_000;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; jobId: string }> },
) {
  const { businessId, jobId } = await params;
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "generate_creative_draft")) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const job = await getJobById(businessId, jobId);
  if (!job) {
    return NextResponse.json({ ok: false, error: "job_not_found" }, { status: 404 });
  }

  const lastRun = await getLastProviderRunForJob(businessId, jobId);
  if (lastRun && Date.now() - new Date(lastRun.createdAt).getTime() < GENERATION_COOLDOWN_MS) {
    return NextResponse.json({ ok: false, error: "cooldown_active", detail: "Please wait before generating again." }, { status: 429 });
  }

  const brief = await getLatestBriefForJob(businessId, jobId);
  if (!brief) {
    return NextResponse.json({ ok: false, error: "brief_required", detail: "Create a creative brief for this job before generating." }, { status: 400 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    // Body is optional — providerKey defaults to the job's stored provider or the global default.
  }

  const actor = salesActorToCreativeActor(access.actor);

  // 1. Assemble a fresh verified truth snapshot and persist it (append-only).
  const packet = await assembleResearchPacket(businessId);
  const snapshot = await createInputSnapshot(businessId, jobId, packet.categories, actor);
  if (!snapshot) {
    return NextResponse.json({ ok: false, error: "snapshot_persist_failed" }, { status: 500 });
  }

  // 2. Compile the doctrine subset relevant to this job only.
  const doctrine = compileDoctrineForJob({
    assetType: job.assetType,
    riskClass: job.riskClass,
    creativeLane: job.creativeLane,
    language: job.language,
    family: inferCreativeFamilyFromAssetType(job.assetType),
  });

  // 3. Compile the provider-neutral generation input.
  const formatSpec = job.format ? getPrintFormat(job.format) : null;
  const requestInstructionRaw = body.requestInstruction;
  const requestInstruction = typeof requestInstructionRaw === "string" && requestInstructionRaw.trim()
    ? requestInstructionRaw.trim()
    : `Generate ${job.assetType.replace(/_/g, " ")} copy for this business, matching the brief and doctrine above.`;

  const providerInput = compileGenerationInput({
    snapshotCategories: snapshot.categories,
    brief,
    doctrine,
    formatSpec,
    requestInstruction,
  });

  // 4. Resolve the requested provider — never an invisible switch. Falls back to the job's stored
  // provider, then the global default (Gemini) if neither is specified.
  const requestedProviderKey = typeof body.providerKey === "string" ? body.providerKey : job.providerKey;
  const providerKey = requestedProviderKey && isKnownCreativeProviderKey(requestedProviderKey) ? requestedProviderKey : null;
  const provider = providerKey ? await resolveCreativeProvider(providerKey) : await getDefaultCreativeProvider();

  if (!provider) {
    return NextResponse.json({ ok: false, error: "unknown_provider", detail: `Provider "${requestedProviderKey}" is not registered.` }, { status: 400 });
  }

  const configured = await provider.isConfigured();
  const startedAt = Date.now();

  if (!configured) {
    await createProviderRun(
      businessId, jobId,
      {
        versionId: null,
        providerKey: provider.providerKey,
        modelKey: provider.modelKey,
        templateVersion: "v1",
        schemaVersion: doctrine.doctrineVersion,
        inputSnapshotId: snapshot.id,
        status: "failed",
        errorState: "provider_unavailable",
        latencyMs: Date.now() - startedAt,
        costMetadata: null,
      },
      actor,
    );
    return NextResponse.json({ ok: false, error: "provider_unavailable", detail: `Provider "${provider.providerKey}" is not configured on the server.` }, { status: 503 });
  }

  const result = await provider.generateText(providerInput);
  const latencyMs = Date.now() - startedAt;

  if (!result.ok) {
    await createProviderRun(
      businessId, jobId,
      {
        versionId: null,
        providerKey: provider.providerKey,
        modelKey: provider.modelKey,
        templateVersion: "v1",
        schemaVersion: doctrine.doctrineVersion,
        inputSnapshotId: snapshot.id,
        status: "failed",
        errorState: `${result.failureCode ?? "unknown"}: ${result.failureReason ?? ""}`.slice(0, 500),
        latencyMs,
        costMetadata: null,
      },
      actor,
    );
    return NextResponse.json({ ok: false, error: result.failureCode ?? "provider_failed", detail: result.failureReason }, { status: 502 });
  }

  const output = result.output ?? {};
  const headlines = Array.isArray(output.headlines) ? output.headlines.map(String) : [];
  const bodyCopy = Array.isArray(output.bodyCopy) ? output.bodyCopy.map(String) : [];
  const cta = typeof output.cta === "string" ? output.cta : null;
  const disclaimer = typeof output.disclaimer === "string" ? output.disclaimer : null;

  const version = await createJobVersion(
    businessId, jobId,
    {
      snapshotId: snapshot.id,
      briefId: brief.id,
      generatedCopy: output,
      generatedHeadlines: headlines,
      generatedBodyCopy: bodyCopy,
      generatedCta: cta,
      generatedDisclaimer: disclaimer,
    },
    actor,
  );

  if (!version) {
    return NextResponse.json({ ok: false, error: "version_persist_failed" }, { status: 500 });
  }

  await createProviderRun(
    businessId, jobId,
    {
      versionId: version.id,
      providerKey: provider.providerKey,
      modelKey: provider.modelKey,
      templateVersion: "v1",
      schemaVersion: doctrine.doctrineVersion,
      inputSnapshotId: snapshot.id,
      status: "success",
      errorState: null,
      latencyMs,
      costMetadata: { doctrineVersion: doctrine.doctrineVersion },
    },
    actor,
  );

  // Best-effort status transition — never fails the response if the job is in a status that
  // cannot legally move to "generated" yet (e.g. still "draft"); the version/run are already
  // durably recorded either way.
  await transitionJobStatus(businessId, jobId, "generated", actor).catch(() => null);

  return NextResponse.json({
    ok: true,
    version,
    providerKey: provider.providerKey,
    modelKey: provider.modelKey,
    doctrineVersion: doctrine.doctrineVersion,
  });
}
