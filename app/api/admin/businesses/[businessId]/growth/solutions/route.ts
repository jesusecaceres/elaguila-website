/**
 * Business Development & Growth Engine, Gate C — solutions list + create/promote.
 *
 * GET  — list canonical solutions for this business (view_growth_engine).
 * POST — create a canonical business_growth_solutions row (manage_growth_solutions). Used both to
 *        promote an assessment-suggested solution (client sends the suggestion's own fields plus
 *        sourceAssessmentId) and for a staff-authored solution with no assessment source. Either
 *        way the row is created through Gate A's own createGrowthSolution — this route never
 *        writes to business_growth_solutions directly.
 */
import { NextResponse, type NextRequest } from "next/server";

import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess, requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { createGrowthSolution, listGrowthSolutionsForBusiness } from "@/app/lib/business/growthEngine/repository";
import type { GrowthProviderClass, GrowthSolutionPriority, GrowthSolutionReadiness } from "@/app/lib/business/growthEngine/types";

export const runtime = "nodejs";

const PROVIDER_CLASSES: readonly GrowthProviderClass[] = ["leonix_provides", "leonix_coordinates_partner", "external_professional_required"];
const READINESS_VALUES: readonly GrowthSolutionReadiness[] = ["ready", "needs_preparation", "blocked", "needs_more_information"];
const PRIORITY_VALUES: readonly GrowthSolutionPriority[] = ["low", "medium", "high"];

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "view_growth_engine")) return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

  const { businessId } = await params;
  const solutions = await listGrowthSolutionsForBusiness(businessId);
  return NextResponse.json({ ok: true, solutions });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess("manage_growth_solutions");
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const providerClass = typeof body.providerClass === "string" && (PROVIDER_CLASSES as readonly string[]).includes(body.providerClass)
    ? (body.providerClass as GrowthProviderClass)
    : null;
  const titleEs = typeof body.titleEs === "string" ? body.titleEs.trim() : "";
  const titleEn = typeof body.titleEn === "string" ? body.titleEn.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";

  if (!providerClass || !titleEs || !titleEn || !category) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const readiness = typeof body.readiness === "string" && (READINESS_VALUES as readonly string[]).includes(body.readiness)
    ? (body.readiness as GrowthSolutionReadiness)
    : undefined;
  const priority = typeof body.priority === "string" && (PRIORITY_VALUES as readonly string[]).includes(body.priority)
    ? (body.priority as GrowthSolutionPriority)
    : undefined;

  const solution = await createGrowthSolution(
    {
      businessId,
      sourceAssessmentId: typeof body.sourceAssessmentId === "string" ? body.sourceAssessmentId : null,
      providerClass,
      category,
      titleEs,
      titleEn,
      rationaleEs: typeof body.rationaleEs === "string" ? body.rationaleEs.trim() || null : null,
      rationaleEn: typeof body.rationaleEn === "string" ? body.rationaleEn.trim() || null : null,
      evidenceRefs: Array.isArray(body.evidenceRefs) ? body.evidenceRefs.filter((r): r is string => typeof r === "string") : [],
      readiness,
      priority,
    },
    access.actor,
  );

  if (!solution) return NextResponse.json({ ok: false, error: "create_failed" }, { status: 500 });
  return NextResponse.json({ ok: true, solution });
}
