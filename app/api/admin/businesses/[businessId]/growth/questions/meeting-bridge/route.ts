/**
 * Business Development & Growth Engine, Gate C — "Add Selected to Meeting" bridge for Growth Plan
 * client questions. Uses the EXISTING Meeting Studio note model (createNote) rather than a new
 * question-storage domain — a batch-added question becomes a business_meeting_notes row with
 * noteType "unknown" (the exact existing semantic for "a thing we don't know and should ask
 * about"), attached to the business's next non-completed meeting. No new table was added.
 *
 * If no upcoming (planned/prepared/in_progress) meeting exists, this truthfully fails with
 * "no_upcoming_meeting" rather than inventing a placeholder meeting or silently dropping the
 * questions — the operator schedules a meeting first (existing Meeting Studio flow).
 */
import { NextResponse, type NextRequest } from "next/server";

import { requireStaffWorkspaceWriteAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { createNote, listMeetingsForBusiness } from "@/app/lib/business/meetingStudio/repository";
import type { MeetingActor } from "@/app/lib/business/meetingStudio/types";

export const runtime = "nodejs";

const OPEN_MEETING_STATUSES = new Set(["planned", "prepared", "in_progress"]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  // manage_growth_roadmap is the closest existing "operator is actively working the Growth Plan"
  // capability short of a dedicated one; the actual write goes through Meeting Studio's own
  // record_meeting_notes-equivalent path (createNote), so the meaningful gate is really "does this
  // actor have a real staff/owner identity" — enforced by requireStaffWorkspaceWriteAccess itself.
  const access = await requireStaffWorkspaceWriteAccess("manage_growth_roadmap");
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

  // Matches the established bridge idiom (see the opportunity -> Creative Studio creative-request
  // route): the resolver's own StaffWriteActor is structurally compatible with the target domain's
  // actor type, so it is passed through directly rather than re-literal-constructed.
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
