/**
 * Client Discovery & Project Blueprint Engine, Gate 3 — Add Project Need (MD <multi_project_ui>).
 * Adds another project intent to a shared discovery without forcing a separate meeting.
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { createProjectDiscoveryIntent } from "@/app/lib/business/projectDiscovery/repository";
import { isKnownProjectType } from "@/app/lib/business/projectDiscovery/projectTypeRegistry";
import type { ProjectType } from "@/app/lib/business/projectDiscovery/types";

export const runtime = "nodejs";

interface CreateIntentBody {
  title?: unknown;
  projectType?: unknown;
  projectSubtype?: unknown;
  otherLabel?: unknown;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string; discoveryId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess(["create_project_discovery", "manage_project_discovery"]);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId, discoveryId } = await params;
  const body = (await req.json().catch(() => ({}))) as CreateIntentBody;

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const projectType = typeof body.projectType === "string" ? body.projectType : "";
  if (!title || !isKnownProjectType(projectType)) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const result = await createProjectDiscoveryIntent(
    {
      discoveryId,
      businessId,
      title,
      projectType: projectType as ProjectType,
      projectSubtype: typeof body.projectSubtype === "string" ? body.projectSubtype : null,
      otherLabel: typeof body.otherLabel === "string" ? body.otherLabel : null,
    },
    access.actor,
  );
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: 400 });
  return NextResponse.json({ ok: true, intent: result.intent });
}
