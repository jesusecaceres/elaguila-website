/**
 * Client Discovery & Project Blueprint Engine, Gate 3 — "Send to Meeting" bridge for unresolved
 * discovery questions (MD <meeting_bridge>). Mirrors the exact, already-established Growth Plan
 * meeting-bridge idiom (growth/questions/meeting-bridge/route.ts) — same createNote/noteType
 * "unknown" mechanism, same "no_upcoming_meeting" truthful failure, no Meeting v2, no duplicate
 * meeting-question storage.
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { createNote, listMeetingsForBusiness } from "@/app/lib/business/meetingStudio/repository";
import type { MeetingActor } from "@/app/lib/business/meetingStudio/types";

export const runtime = "nodejs";

const OPEN_MEETING_STATUSES = new Set(["planned", "prepared", "in_progress"]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string; discoveryId: string }> }) {
  const access = await requireStaffWorkspaceWriteAccess(["create_project_discovery", "manage_project_discovery"]);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: access.status });

  const { businessId } = await params;
  const body = (await req.json().catch(() => ({}))) as { questions?: unknown };
  const questions = Array.isArray(body.questions) ? body.questions.filter((q): q is string => typeof q === "string" && q.trim().length > 0) : [];
  if (questions.length === 0) return NextResponse.json({ ok: false, error: "no_questions" }, { status: 400 });

  const meetings = await listMeetingsForBusiness(businessId);
  const upcoming = meetings
    .filter((m) => OPEN_MEETING_STATUSES.has(m.status))
    .sort((a, b) => new Date(a.scheduledAt ?? a.createdAt).getTime() - new Date(b.scheduledAt ?? b.createdAt).getTime())[0];
  if (!upcoming) return NextResponse.json({ ok: false, error: "no_upcoming_meeting" }, { status: 409 });

  const meetingActor: MeetingActor = access.actor;

  const created: { ok: boolean }[] = [];
  for (const question of questions.slice(0, 20)) {
    const result = await createNote(
      { meetingId: upcoming.id, businessId, noteType: "unknown", content: question.trim().slice(0, 2000), visibility: "staff_only", sensitivity: "normal" },
      meetingActor,
    );
    created.push({ ok: result.ok });
  }

  const addedCount = created.filter((c) => c.ok).length;
  if (addedCount === 0) return NextResponse.json({ ok: false, error: "create_failed" }, { status: 500 });
  return NextResponse.json({ ok: true, meetingId: upcoming.id, addedCount, requestedCount: questions.length });
}
