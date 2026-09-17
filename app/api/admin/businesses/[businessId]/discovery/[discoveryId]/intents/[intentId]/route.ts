/**
 * Client Discovery & Project Blueprint Engine, Gate 3 — project intent lifecycle transition.
 * Never bypasses Gate 1's own transition graph.
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { updateProjectDiscoveryIntentStatus } from "@/app/lib/business/projectDiscovery/repository";
import type { ProjectDiscoveryIntentStatus } from "@/app/lib/business/projectDiscovery/types";

export const runtime = "nodejs";

const VALID_STATUSES: readonly ProjectDiscoveryIntentStatus[] = ["candidate", "confirmed", "declined", "converted_to_project"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ businessId: string; intentId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess(["manage_project_discovery"]);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId, intentId } = await params;
  const body = (await req.json().catch(() => ({}))) as { status?: unknown };
  if (typeof body.status !== "string" || !VALID_STATUSES.includes(body.status as ProjectDiscoveryIntentStatus)) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const result = await updateProjectDiscoveryIntentStatus(businessId, intentId, body.status as ProjectDiscoveryIntentStatus, access.actor);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: result.reason === "not_found" ? 404 : 400 });
  return NextResponse.json({ ok: true, intent: result.intent });
}
