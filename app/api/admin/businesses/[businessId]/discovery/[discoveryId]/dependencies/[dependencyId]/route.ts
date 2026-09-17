/**
 * Client Discovery & Project Blueprint Engine, Gate 6 — remove an incorrect/no-longer-relevant
 * project-intent dependency. Gated on manage_project_discovery (same reuse rationale as the create
 * route).
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { removeIntentDependency } from "@/app/lib/business/projectDiscovery/projectDependencyRepository";

export const runtime = "nodejs";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ businessId: string; discoveryId: string; dependencyId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess(["manage_project_discovery"]);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId, dependencyId } = await params;
  const result = await removeIntentDependency(businessId, dependencyId);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: result.reason === "not_found" ? 404 : 400 });
  return NextResponse.json({ ok: true });
}
