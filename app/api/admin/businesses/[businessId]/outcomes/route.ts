/**
 * Program 7 — Admin API route for listing and recording business outcomes.
 * Dynamic [businessId] repair of the encoded %5BbusinessId%5D folder.
 *
 * POST (WHOLE-PRODUCT PARTIAL-CLOSURE, AL_OUTCOMES / BV_MEASUREMENT) — the smallest bridge from
 * the Growth Engine into the canonical Program 7 Outcomes domain: reuses createOutcome() exactly
 * as recommendation/commitment/creative-job outcomes already do, only adding the optional
 * growthCampaignId/growthSolutionId linkage columns. Never a second, Growth-only outcomes table.
 * Gated on manage_growth_campaigns since a campaign's own measurement is the same staff
 * responsibility as managing that campaign — no new capability invented for this bridge.
 */
import { NextResponse } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess, requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { isOutcomesEnabled } from "@/app/lib/business/outcomes/featureFlag";
import { createOutcome, listBusinessOutcomes } from "@/app/lib/business/outcomes/repository";
import { getGrowthCampaignById, getGrowthSolutionById } from "@/app/lib/business/growthEngine/repository";
import type { MeasurementSource } from "@/app/lib/business/outcomes/types";

const MEASUREMENT_SOURCES: readonly MeasurementSource[] = ["manual_entry", "system_derived", "staff_observation", "owner_reported", "external_source"];

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) {
    return NextResponse.json({ error: access.reason }, { status: denialStatusCode(access.reason) });
  }
  if (!actorHasCapability(access.actor, "view_business_detail")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!(await isOutcomesEnabled())) {
    return NextResponse.json({ error: "feature_disabled" }, { status: 404 });
  }

  const { businessId } = await params;
  const outcomes = await listBusinessOutcomes(businessId);
  return NextResponse.json({ outcomes });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ businessId: string }> },
) {
  const access = await requireStaffWorkspaceWriteAccess("manage_growth_campaigns");
  if (!access.ok) {
    return NextResponse.json({ error: access.reason }, { status: access.status });
  }
  if (!(await isOutcomesEnabled())) {
    return NextResponse.json({ error: "feature_disabled" }, { status: 404 });
  }

  const { businessId } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const metricKey = typeof body.metricKey === "string" ? body.metricKey.trim() : "";
  const metricLabelEs = typeof body.metricLabelEs === "string" ? body.metricLabelEs.trim() : "";
  const metricLabelEn = typeof body.metricLabelEn === "string" ? body.metricLabelEn.trim() : "";
  if (!metricKey || !metricLabelEs || !metricLabelEn) {
    return NextResponse.json({ error: "metric_required" }, { status: 400 });
  }

  const measurementSource = typeof body.measurementSource === "string" && MEASUREMENT_SOURCES.includes(body.measurementSource as MeasurementSource)
    ? (body.measurementSource as MeasurementSource)
    : null;
  if (!measurementSource) {
    return NextResponse.json({ error: "bad_measurement_source" }, { status: 400 });
  }

  // Never accept an invented growth campaign/solution id from the client — both must already
  // exist for this same business (same composite-FK discipline the DB constraint enforces).
  const growthCampaignId = typeof body.growthCampaignId === "string" ? body.growthCampaignId : null;
  if (growthCampaignId && !(await getGrowthCampaignById(businessId, growthCampaignId))) {
    return NextResponse.json({ error: "bad_growth_campaign" }, { status: 400 });
  }
  const growthSolutionId = typeof body.growthSolutionId === "string" ? body.growthSolutionId : null;
  if (growthSolutionId && !(await getGrowthSolutionById(businessId, growthSolutionId))) {
    return NextResponse.json({ error: "bad_growth_solution" }, { status: 400 });
  }

  const outcome = await createOutcome(
    businessId,
    {
      growthCampaignId,
      growthSolutionId,
      metricKey,
      metricLabelEs,
      metricLabelEn,
      baselineValue: typeof body.baselineValue === "string" ? body.baselineValue.trim() || null : null,
      baselineUnit: typeof body.baselineUnit === "string" ? body.baselineUnit.trim() || null : null,
      measuredValue: typeof body.measuredValue === "string" ? body.measuredValue.trim() || null : null,
      measuredUnit: typeof body.measuredUnit === "string" ? body.measuredUnit.trim() || null : null,
      measurementSource,
      measuredAt: typeof body.measuredAt === "string" && body.measuredAt ? body.measuredAt : null,
    },
    access.actor,
  );
  if (!outcome) return NextResponse.json({ error: "create_failed" }, { status: 500 });

  return NextResponse.json({ outcome });
}
