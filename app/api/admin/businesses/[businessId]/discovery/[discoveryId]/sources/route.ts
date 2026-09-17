/**
 * Client Discovery & Project Blueprint Engine, Gate 3 — attach a source/reference (MD
 * <asset_workflow>, <visual_references>, <notes_and_dictation>). One route backs three UI
 * surfaces that are all, structurally, "attach a reference to this discovery":
 *   - Meeting Notes: sourceType "manual", no file/url, free text in `notes` (the smallest bridge
 *     the mission allows — Gate 1's own sources table already carries actor + timestamp + text,
 *     so no new note platform is created; the client-side capture itself reuses DictationButton).
 *   - Assets: sourceType "asset" with an existing business_source_files id (never a new blob
 *     store — attachProjectDiscoverySource itself verifies the file belongs to this business).
 *   - Visual references: sourceType "asset" or "website_url", `label` carries the reference type
 *     (Layout/Typography/Color/...), `notes` carries the likes/dislikes/inspiration annotation.
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { attachProjectDiscoverySource } from "@/app/lib/business/projectDiscovery/repository";
import type { DiscoverySourceType } from "@/app/lib/business/projectDiscovery/types";

export const runtime = "nodejs";

const VALID_SOURCE_TYPES: readonly DiscoverySourceType[] = [
  "business_fact", "business_unknown", "meeting", "meeting_note", "transcript_import",
  "research_run", "growth_assessment", "growth_solution", "opportunity", "asset", "website_url", "manual",
];

interface AttachSourceBody {
  sourceType?: unknown;
  itemId?: unknown;
  businessSourceFileId?: unknown;
  externalUrl?: unknown;
  label?: unknown;
  notes?: unknown;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string; discoveryId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess(["create_project_discovery", "manage_project_discovery"]);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId, discoveryId } = await params;
  const body = (await req.json().catch(() => ({}))) as AttachSourceBody;

  const sourceType = typeof body.sourceType === "string" ? body.sourceType : "";
  if (!VALID_SOURCE_TYPES.includes(sourceType as DiscoverySourceType)) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }
  if (sourceType === "manual" && typeof body.notes !== "string") {
    return NextResponse.json({ ok: false, error: "note_text_required" }, { status: 400 });
  }
  if (sourceType === "website_url" && typeof body.externalUrl !== "string") {
    return NextResponse.json({ ok: false, error: "url_required" }, { status: 400 });
  }

  const result = await attachProjectDiscoverySource(
    {
      discoveryId,
      businessId,
      itemId: typeof body.itemId === "string" ? body.itemId : null,
      sourceType: sourceType as DiscoverySourceType,
      businessSourceFileId: typeof body.businessSourceFileId === "string" ? body.businessSourceFileId : null,
      externalUrl: typeof body.externalUrl === "string" ? body.externalUrl : null,
      label: typeof body.label === "string" ? body.label : null,
      notes: typeof body.notes === "string" ? body.notes : null,
    },
    access.actor,
  );
  if (!result.ok) return NextResponse.json({ ok: false, error: result.reason }, { status: 400 });
  return NextResponse.json({ ok: true, source: result.source });
}
