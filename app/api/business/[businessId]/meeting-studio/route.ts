/**
 * Program 5 — Owner-safe API for meetings. Exposes only meetings and notes
 * marked shared_with_owner. Never exposes staff_only notes, internal observations,
 * or staff-only cockpit briefing data. Owner can see their commitments and proposals
 * in owner_review status.
 */
import { NextRequest, NextResponse } from "next/server";
import { resolveMeetingStudioOwnerAccess } from "@/app/lib/business/meetingStudio/ownerAccess";
import { listMeetingsForBusiness, listNotesForMeeting, listAttendeesForMeeting, listConsentsForMeeting } from "@/app/lib/business/meetingStudio/repository";
import { listCommitmentsForBusiness } from "@/app/lib/business/promiseKeeper/repository";
import { listProposalsForBusiness } from "@/app/lib/business/proposals/repository";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = await params;
  const access = await resolveMeetingStudioOwnerAccess(_req, businessId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  if (!access.meetingStudioFlagAvailable) {
    return NextResponse.json({ error: "feature_not_available" }, { status: 403 });
  }

  const [meetings, commitments, proposals] = await Promise.all([
    listMeetingsForBusiness(businessId),
    listCommitmentsForBusiness(businessId),
    listProposalsForBusiness(businessId),
  ]);

  const ownerMeetings = await Promise.all(
    meetings.map(async (m) => {
      const [attendees, consents, notes] = await Promise.all([
        listAttendeesForMeeting(m.id, businessId),
        listConsentsForMeeting(m.id, businessId),
        listNotesForMeeting(m.id, businessId),
      ]);
      return {
        id: m.id,
        meetingType: m.meetingType,
        status: m.status,
        language: m.language,
        scheduledAt: m.scheduledAt,
        recapEs: m.recapEs,
        recapEn: m.recapEn,
        attendees: attendees.map((a) => ({ displayName: a.displayName, attendeeType: a.attendeeType, attendanceState: a.attendanceState })),
        consents: consents.map((c) => ({ consentType: c.consentType, state: c.state, method: c.method })),
        notes: notes.filter((n) => n.visibility === "shared_with_owner").map((n) => ({ noteType: n.noteType, content: n.content, createdAt: n.createdAt })),
      };
    }),
  );

  const ownerCommitments = commitments
    .filter((c) => c.responsibleParty === "owner" || c.responsibleParty === "shared")
    .map((c) => ({
      id: c.id,
      titleEs: c.titleEs,
      titleEn: c.titleEn,
      status: c.status,
      dueAt: c.dueAt,
      smallestNextStep: c.smallestNextStep,
      blocker: c.blocker,
      helpRequested: c.helpRequested,
    }));

  const ownerProposals = proposals
    .filter((p) => p.isCurrent && (p.status === "owner_review" || p.status === "accepted" || p.status === "declined"))
    .map((p) => ({
      id: p.id,
      version: p.version,
      status: p.status,
      ownerGoalEn: p.ownerGoalEn,
      ownerGoalEs: p.ownerGoalEs,
      verifiedNeedEn: p.verifiedNeedEn,
      verifiedNeedEs: p.verifiedNeedEs,
      scopeEn: p.scopeEn,
      scopeEs: p.scopeEs,
      deliverablesEn: p.deliverablesEn,
      deliverablesEs: p.deliverablesEs,
      timelineEn: p.timelineEn,
      timelineEs: p.timelineEs,
      pricingSnapshot: p.pricingSnapshot,
      successMetricEn: p.successMetricEn,
      successMetricEs: p.successMetricEs,
    }));

  return NextResponse.json({
    meetings: ownerMeetings,
    commitments: ownerCommitments,
    proposals: ownerProposals,
  });
}
