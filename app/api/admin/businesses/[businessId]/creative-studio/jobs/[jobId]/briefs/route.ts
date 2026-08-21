/**
 * Package A — minimal Creative Brief creation route.
 *
 * The full multi-step Creative Studio brief-authoring wizard (see
 * app/admin/(dashboard)/businesses/[businessId]/CreativeStudioActions.tsx, still a stub) is not
 * part of this package. This route is the smallest necessary persistence path so a real brief can
 * exist for a job before /generate is called — without it, generation would have no CreativeBrief
 * to compile against, and Package A would be "demo-only" as explicitly disallowed.
 */
import { NextResponse, type NextRequest } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { createBrief, getJobById, type CreateBriefInput, type CreativeActor } from "@/app/lib/business/creativeStudio/repository";
import { CREATIVE_LANES, RISK_CLASSES } from "@/app/lib/business/creativeStudio/constants";

function requireNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string; jobId: string }> },
) {
  const { businessId, jobId } = await params;
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "approve_creative_brief") && !actorHasCapability(access.actor, "create_creative_job")) {
    return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });
  }

  const job = await getJobById(businessId, jobId);
  if (!job) {
    return NextResponse.json({ ok: false, error: "job_not_found" }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  const required: (keyof CreateBriefInput)[] = [
    "businessGoal", "campaignObjective", "readerNeed", "targetAudience", "primaryMessage", "cta", "contactPath", "imageStrategy", "desiredAction",
  ];
  for (const key of required) {
    if (!requireNonEmptyString(body[key])) {
      return NextResponse.json({ ok: false, error: "missing_field", field: key }, { status: 400 });
    }
  }
  if (!CREATIVE_LANES.includes(String(body.creativeLane))) {
    return NextResponse.json({ ok: false, error: "bad_creative_lane" }, { status: 400 });
  }
  if (body.riskClass && !RISK_CLASSES.includes(String(body.riskClass))) {
    return NextResponse.json({ ok: false, error: "bad_risk_class" }, { status: 400 });
  }

  const actor: CreativeActor = {
    type: "staff",
    rosterId: access.actor.rosterId,
    authUserId: access.actor.authUserId,
    email: access.actor.email,
    role: access.actor.role,
  };

  const input: CreateBriefInput = {
    businessGoal: String(body.businessGoal),
    campaignObjective: String(body.campaignObjective),
    readerNeed: String(body.readerNeed),
    targetAudience: String(body.targetAudience),
    primaryLanguage: (body.primaryLanguage as CreateBriefInput["primaryLanguage"]) ?? job.language,
    secondaryLanguage: (body.secondaryLanguage as CreateBriefInput["secondaryLanguage"]) ?? null,
    primaryMessage: String(body.primaryMessage),
    supportingMessage: requireNonEmptyString(body.supportingMessage) ? String(body.supportingMessage) : null,
    offer: requireNonEmptyString(body.offer) ? String(body.offer) : null,
    cta: String(body.cta),
    contactPath: String(body.contactPath),
    qrTarget: requireNonEmptyString(body.qrTarget) ? String(body.qrTarget) : null,
    keyServices: Array.isArray(body.keyServices) ? body.keyServices.map(String) : [],
    trustEvidence: Array.isArray(body.trustEvidence) ? body.trustEvidence.map(String) : [],
    requiredDisclaimers: Array.isArray(body.requiredDisclaimers) ? body.requiredDisclaimers.map(String) : [],
    prohibitedClaims: Array.isArray(body.prohibitedClaims) ? body.prohibitedClaims.map(String) : [],
    creativeLane: body.creativeLane as CreateBriefInput["creativeLane"],
    archetype: (body.archetype as CreateBriefInput["archetype"]) ?? job.archetype,
    format: (body.format as CreateBriefInput["format"]) ?? job.format,
    layoutOptions: (Array.isArray(body.layoutOptions) && body.layoutOptions.length > 0
      ? body.layoutOptions.map(String)
      : [job.layoutVariant]) as CreateBriefInput["layoutOptions"],
    imageStrategy: String(body.imageStrategy),
    mustUseAssetIds: Array.isArray(body.mustUseAssetIds) ? body.mustUseAssetIds.map(String) : [],
    optionalAssetIds: Array.isArray(body.optionalAssetIds) ? body.optionalAssetIds.map(String) : [],
    missingAssetDescriptions: Array.isArray(body.missingAssetDescriptions) ? body.missingAssetDescriptions.map(String) : [],
    sourceRecommendationId: requireNonEmptyString(body.sourceRecommendationId) ? String(body.sourceRecommendationId) : null,
    desiredAction: String(body.desiredAction),
    riskClass: (body.riskClass as CreateBriefInput["riskClass"]) ?? job.riskClass,
    reviewRequirements: Array.isArray(body.reviewRequirements) ? body.reviewRequirements.map(String) : [],
  };

  const brief = await createBrief(businessId, jobId, input, actor);
  if (!brief) {
    return NextResponse.json({ ok: false, error: "create_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, brief });
}
