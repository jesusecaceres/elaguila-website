/**
 * Client Discovery & Project Blueprint Engine, Gate 3 — discovery lifecycle transition + meeting
 * link (MD <status_transition>, <meeting_bridge>: "allow linking later"). Never bypasses Gate 1's
 * own transition graph — the repository rejects any jump not in it.
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { linkProjectDiscoveryToMeeting, updateProjectDiscoveryStatus } from "@/app/lib/business/projectDiscovery/repository";
import type { ProjectDiscoveryStatus } from "@/app/lib/business/projectDiscovery/types";

export const runtime = "nodejs";

interface UpdateDiscoveryBody {
  status?: unknown;
  linkMeetingId?: unknown;
}

const VALID_STATUSES: readonly ProjectDiscoveryStatus[] = ["in_progress", "needs_client_information", "needs_leonix_decision", "ready_for_blueprint", "blueprint_created"];

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ businessId: string; discoveryId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess(["manage_project_discovery"]);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId, discoveryId } = await params;
  const body = (await req.json().catch(() => ({}))) as UpdateDiscoveryBody;

  if (typeof body.linkMeetingId === "string" && body.linkMeetingId) {
    const linkResult = await linkProjectDiscoveryToMeeting(businessId, discoveryId, body.linkMeetingId, access.actor);
    if (!linkResult.ok) return NextResponse.json({ ok: false, error: linkResult.reason }, { status: linkResult.reason === "not_found" ? 404 : 400 });
    return NextResponse.json({ ok: true, discovery: linkResult.discovery });
  }

  if (typeof body.status !== "string" || !VALID_STATUSES.includes(body.status as ProjectDiscoveryStatus)) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const result = await updateProjectDiscoveryStatus(businessId, discoveryId, body.status as ProjectDiscoveryStatus, access.actor);
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: result.reason === "not_found" ? 404 : 400 });
  return NextResponse.json({ ok: true, discovery: result.discovery });
}
