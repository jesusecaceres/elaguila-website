/**
 * Client Discovery & Project Blueprint Engine, Gate 6 — record a project-intent dependency
 * (explicit, or a system suggestion staff explicitly accepted). Gated on manage_project_discovery
 * — the same capability that already governs everyday discovery management, reused rather than a
 * new capability (MD <capabilities>: "avoid capability explosion").
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { createIntentDependency } from "@/app/lib/business/projectDiscovery/projectDependencyRepository";
import type { DependencyType } from "@/app/lib/business/projectDiscovery/projectDependencyEngine";
import { listProjectDiscoveryIntents } from "@/app/lib/business/projectDiscovery/repository";

export const runtime = "nodejs";

const VALID_TYPES: readonly DependencyType[] = ["explicit", "system_suggested"];

interface Body {
  dependentIntentId?: unknown;
  dependsOnIntentId?: unknown;
  dependencyType?: unknown;
  reasonEs?: unknown;
  reasonEn?: unknown;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string; discoveryId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess(["manage_project_discovery"]);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId, discoveryId } = await params;
  const body = (await req.json().catch(() => ({}))) as Body;
  const dependentIntentId = typeof body.dependentIntentId === "string" ? body.dependentIntentId : "";
  const dependsOnIntentId = typeof body.dependsOnIntentId === "string" ? body.dependsOnIntentId : "";
  const dependencyType = VALID_TYPES.includes(body.dependencyType as DependencyType) ? (body.dependencyType as DependencyType) : "explicit";
  const reasonEs = typeof body.reasonEs === "string" && body.reasonEs.trim() ? body.reasonEs.trim() : "Dependencia registrada por el personal.";
  const reasonEn = typeof body.reasonEn === "string" && body.reasonEn.trim() ? body.reasonEn.trim() : "Dependency recorded by staff.";

  if (!dependentIntentId || !dependsOnIntentId || dependentIntentId === dependsOnIntentId) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  // Both intents must genuinely belong to this discovery+business — never trust client-provided IDs blindly.
  const intents = await listProjectDiscoveryIntents(discoveryId, businessId);
  if (!intents.some((i) => i.id === dependentIntentId) || !intents.some((i) => i.id === dependsOnIntentId)) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const result = await createIntentDependency({ businessId, discoveryId, dependentIntentId, dependsOnIntentId, dependencyType, reasonEs, reasonEn }, access.actor);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: result.reason === "already_exists" ? 409 : 400 });
  return NextResponse.json({ ok: true, dependency: result.dependency });
}
