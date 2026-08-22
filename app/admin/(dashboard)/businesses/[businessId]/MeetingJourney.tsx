import { CreateMeetingForm, MeetingDetailPanel } from "./MeetingStudioActions";
import type {
  BusinessMeeting,
  CockpitBriefing,
  MeetingAttendee,
  MeetingConsentRecord,
  MeetingNote,
  MeetingTranscriptImport,
} from "@/app/lib/business/meetingStudio/types";

type MeetingWithDetails = {
  meeting: BusinessMeeting;
  attendees: MeetingAttendee[];
  consents: MeetingConsentRecord[];
  notes: MeetingNote[];
  transcripts: MeetingTranscriptImport[];
};

type MeetingJourneyProps = {
  businessId: string;
  briefing: CockpitBriefing;
  meetings: BusinessMeeting[];
  meetingsWithDetails: MeetingWithDetails[];
  canPrepareMeeting: boolean;
  canReviewNotes: boolean;
  relationship: {
    statusLabel: string;
    lastContactedAt: string | null;
    followUp: { scheduledDate: string; displayStatus: string } | null;
  };
  followThrough: {
    canViewCommitments: boolean;
    hasCurrentProposal: boolean;
    hasRecommend: boolean;
    hasOpportunity: boolean;
    opportunityCount: number | null;
    hasCreative: boolean;
  };
};

const ACTIVE_STATUSES = new Set(["planned", "prepared", "in_progress"]);

function meetingTypeLabel(meetingType: string): string {
  switch (meetingType) {
    case "discovery":
      return "Discovery";
    case "check_in":
      return "Check-in";
    case "proposal_review":
      return "Proposal review";
    case "follow_up":
      return "Follow-up";
    case "intake":
      return "Intake";
    default:
      return meetingType;
  }
}

function staffPrepPrompts(briefing: CockpitBriefing): string[] {
  const prompts = ["What is the owner trying to accomplish?", "What concerns are blocking progress?"];
  const openUnknowns = briefing.truthClasses.unknown.filter((item) => item.value === "Open");
  if (openUnknowns.length > 0) prompts.push("What does Leonix still need to verify?");
  if (briefing.recommendation) prompts.push("What services/products are they most interested in?");
  prompts.push("What timeline matters to them?");
  prompts.push("Who is the decision-maker?");
  if (briefing.truthClasses.contradiction.length > 0 || briefing.whatNotToSell.length > 0) {
    prompts.push("What should we NOT assume?");
  }
  return prompts;
}

function BriefingList({
  title,
  items,
  tone,
  empty,
}: {
  title: string;
  items: { key: string; label: string; value: string }[];
  tone: string;
  empty?: string;
}) {
  return (
    <div className="rounded-lg border border-[#E8DFD0] bg-white p-3">
      <p className={`text-[10px] font-bold uppercase tracking-wide ${tone}`}>{title}</p>
      <ul className="mt-1 space-y-0.5">
        {items.slice(0, 6).map((item) => (
          <li key={item.key} className="text-[11px] text-[#5C5346]">
            <span className="font-semibold">{item.label}</span>: {item.value}
          </li>
        ))}
        {items.length === 0 && empty ? <li className="text-[11px] text-[#7A7164]">{empty}</li> : null}
      </ul>
    </div>
  );
}

export function MeetingJourney({
  businessId,
  briefing,
  meetings,
  meetingsWithDetails,
  canPrepareMeeting,
  canReviewNotes,
  relationship,
  followThrough,
}: MeetingJourneyProps) {
  const activeMeetings = meetingsWithDetails.filter((row) => ACTIVE_STATUSES.has(row.meeting.status));
  const reviewMeetings = meetingsWithDetails.filter((row) => row.meeting.status === "completed");
  const preparedCount = meetings.filter((m) => m.status === "prepared").length;
  const prompts = staffPrepPrompts(briefing);
  const openUnknowns = briefing.truthClasses.unknown.filter((item) => item.value === "Open");
  const openContradictions = briefing.truthClasses.contradiction.filter((item) => item.value === "open" || item.value === "Open");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-lg font-bold text-[#1E1810]">Meetings</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          Prepare → conduct → review → follow through. Meeting notes stay meeting notes until a human promotes them.
        </p>
      </div>

      <section className="rounded-2xl border border-[#C9A84A]/50 bg-[#FBF7EF] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">1. Meeting Prep</p>
        <h3 className="mt-1 font-serif text-lg font-bold text-[#1E1810]">Lion&apos;s Cockpit</h3>
        <p className="mt-1 text-xs text-[#7A7164]">
          Executive briefing before speaking with this business. Deterministic existing truth only — no invented facts, no AI advisor, no live recorder.
        </p>
        {preparedCount === 0 ? (
          <p className="mt-2 text-xs text-[#7A7164]">No meeting is currently being prepared.</p>
        ) : (
          <p className="mt-2 text-xs text-[#1F3A2D]">
            {preparedCount} meeting{preparedCount === 1 ? "" : "s"} currently in prepared status.
          </p>
        )}

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <BriefingList
            title="What we know"
            items={briefing.truthClasses.confirmed}
            tone="text-emerald-800"
            empty="No confirmed Living Book facts yet."
          />
          {briefing.truthClasses.ownerStated.length > 0 ? (
            <BriefingList title="Owner-stated (not yet confirmed)" items={briefing.truthClasses.ownerStated} tone="text-[#3D3428]" />
          ) : null}
          {briefing.truthClasses.staffObservation.length > 0 ? (
            <BriefingList title="Evidence / staff observation" items={briefing.truthClasses.staffObservation} tone="text-[#3D3428]" />
          ) : null}
          <BriefingList
            title="What we don't know"
            items={openUnknowns.length > 0 ? openUnknowns : briefing.truthClasses.unknown}
            tone="text-amber-800"
            empty="No open unknowns on file."
          />
          {briefing.truthClasses.contradiction.length > 0 ? (
            <BriefingList
              title="Contradictions / cautions"
              items={openContradictions.length > 0 ? openContradictions : briefing.truthClasses.contradiction}
              tone="text-red-700"
            />
          ) : null}
          {briefing.truthClasses.aiInference.length > 0 ? (
            <BriefingList title="AI inference (not a confirmed fact)" items={briefing.truthClasses.aiInference} tone="text-purple-700" />
          ) : null}
          {briefing.truthClasses.systemDerived.length > 0 ? (
            <BriefingList title="System-derived" items={briefing.truthClasses.systemDerived} tone="text-[#3D3428]" />
          ) : null}
        </div>

        {briefing.healthMap ? (
          <div className="mt-3 rounded-lg border border-[#E8DFD0] bg-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Business health context</p>
            <p className="mt-1 text-xs text-[#3D3428]">
              Strong: {briefing.healthMap.strongCount} · Needs attention: {briefing.healthMap.needsAttentionCount} · Insufficient info: {briefing.healthMap.insufficientInfoCount} · Blocked: {briefing.healthMap.contradictionBlockedCount}
            </p>
          </div>
        ) : null}

        <div className="mt-3 rounded-lg border border-[#E8DFD0] bg-white p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Current relationship / follow-up</p>
          <p className="mt-1 text-xs font-semibold text-[#1E1810]">{relationship.statusLabel}</p>
          <p className="mt-1 text-xs text-[#7A7164]">
            Last contacted: {relationship.lastContactedAt ? new Date(relationship.lastContactedAt).toLocaleString("en-US") : "not recorded"}
          </p>
          {relationship.followUp ? (
            <p className="mt-1 text-xs text-[#3D3428]">
              Sales follow-up {relationship.followUp.scheduledDate} · {relationship.followUp.displayStatus}
            </p>
          ) : (
            <p className="mt-1 text-xs text-[#7A7164]">No sales follow-up scheduled. Relationship follow-up lives in Outreach, not Promise Keeper.</p>
          )}
          <a href="#outreach" className="mt-2 inline-flex min-h-[44px] items-center text-xs font-semibold text-[#7A1E2C] underline">
            Open Outreach
          </a>
        </div>

        {briefing.recommendation ? (
          <div className="mt-3 rounded-lg border border-[#E8DFD0] bg-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Open recommendations</p>
            <p className="mt-1 text-xs font-semibold text-[#1E1810]">{briefing.recommendation.candidateKey}</p>
            <p className="mt-1 text-xs text-[#3D3428]">{briefing.recommendation.verifiedNeedEn}</p>
            <p className="mt-1 text-[10px] text-[#7A7164]">
              {briefing.recommendation.primaryIntervention} · effort: {briefing.recommendation.expectedEffort} · cost: {briefing.recommendation.costBand}
            </p>
            {briefing.recommendation.rejectedHigherCostReasonEn ? (
              <p className="mt-1 text-[10px] text-[#7A7164]">Why not higher-cost: {briefing.recommendation.rejectedHigherCostReasonEn}</p>
            ) : null}
          </div>
        ) : null}

        {briefing.whatNotToSell.length > 0 ? (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-red-700">Cautions — what not to sell</p>
            <ul className="mt-1 space-y-0.5">
              {briefing.whatNotToSell.map((warning, index) => (
                <li key={`${index}-${warning.slice(0, 24)}`} className="text-[11px] text-red-800">{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {briefing.commitments ? (
          <div className="mt-3 rounded-lg border border-[#E8DFD0] bg-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Open promises / commitments</p>
            <p className="mt-1 text-xs text-[#3D3428]">
              Active: {briefing.commitments.activeCount} · Blocked: {briefing.commitments.blockedCount}
              {briefing.commitments.nextDueDate ? ` · Next due: ${new Date(briefing.commitments.nextDueDate).toLocaleDateString("en-US")}` : ""}
            </p>
            {briefing.commitments.activeCount === 0 ? (
              <p className="mt-1 text-xs text-[#7A7164]">No open Promise Keeper commitments.</p>
            ) : null}
          </div>
        ) : null}

        {followThrough.hasOpportunity && followThrough.opportunityCount !== null ? (
          <div className="mt-3 rounded-lg border border-[#E8DFD0] bg-white p-3">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Open opportunities</p>
            <p className="mt-1 text-xs text-[#3D3428]">{followThrough.opportunityCount} on file. Navigation only — meetings do not auto-create opportunities.</p>
            <a href="#opportunity" className="mt-2 inline-flex min-h-[44px] items-center text-xs font-semibold text-[#7A1E2C] underline">
              Review Opportunities
            </a>
          </div>
        ) : null}

        <div className="mt-3 rounded-lg border border-[#E8DFD0] bg-white p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Questions to ask</p>
          <p className="mt-1 text-[10px] text-[#7A7164]">Staff prompts only. They are not AI-generated facts and are not stored as a prompt database.</p>
          <ul className="mt-2 list-disc space-y-1 pl-4">
            {prompts.map((prompt) => (
              <li key={prompt} className="text-xs text-[#3D3428]">{prompt}</li>
            ))}
          </ul>
          {briefing.suggestedTopics.length > 0 ? (
            <>
              <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Lion&apos;s Cockpit suggested topics</p>
              <ul className="mt-1 space-y-0.5">
                {briefing.suggestedTopics.map((topic) => (
                  <li key={topic.en} className="text-[11px] text-[#3D3428]">{topic.en}</li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">2. Meeting</p>
        <h3 className="mt-1 text-sm font-bold text-[#1E1810]">Meeting Studio</h3>
        <p className="mt-1 text-xs text-[#7A7164]">
          Canonical conduct surface: create or open a meeting record, track attendees, capture notes, record existing consent types, and import a transcript if needed. Live meeting recording is not currently available.
        </p>
        {canPrepareMeeting ? <CreateMeetingForm businessId={businessId} /> : null}

        {meetings.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Meeting history</p>
            <ul className="mt-2 space-y-1">
              {meetings.slice(0, 12).map((meeting) => (
                <li key={meeting.id} className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-[#E8DFD0] bg-[#FFFDF7] px-3 py-2 text-xs">
                  <span className="font-semibold text-[#1E1810]">{meetingTypeLabel(meeting.meetingType)}</span>
                  <span className="text-[#7A7164]">{meeting.status}</span>
                  <span className="text-[#9A9184]">
                    {meeting.scheduledAt ? new Date(meeting.scheduledAt).toLocaleString("en-US") : new Date(meeting.createdAt).toLocaleString("en-US")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-4 space-y-3">
          {activeMeetings.map((row) => (
            <MeetingDetailPanel
              key={row.meeting.id}
              businessId={businessId}
              meeting={row.meeting}
              attendees={row.attendees}
              consents={row.consents}
              notes={row.notes}
              transcripts={row.transcripts}
              canReviewNotes={canReviewNotes}
              surface="conduct"
            />
          ))}
          {meetings.length === 0 ? <p className="text-sm text-[#7A7164]">No meetings recorded yet.</p> : null}
          {meetings.length > 0 && activeMeetings.length === 0 ? (
            <p className="text-sm text-[#7A7164]">No active meeting. Create one above or review completed meetings below.</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-2xl border border-[#E8DFD0] bg-[#FFFDF7] p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">3. Meeting Review</p>
        <h3 className="mt-1 text-sm font-bold text-[#1E1810]">Human review</h3>
        <p className="mt-1 text-xs text-[#7A7164]">
          Decide intentionally: what becomes a Living Book fact, what stays evidence, what remains unknown, what contradiction needs resolution, what promise was made, and whether a sales follow-up is needed. Nothing here auto-promotes.
        </p>
        <ul className="mt-3 grid grid-cols-1 gap-2 text-[11px] text-[#3D3428] sm:grid-cols-2">
          <li className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2"><span className="font-bold text-emerald-800">Fact</span> — confirmed canonical business truth after human promotion.</li>
          <li className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2"><span className="font-bold">Evidence</span> — supporting observation/source/note. Not a fact.</li>
          <li className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2"><span className="font-bold text-amber-800">Unknown</span> — missing information requiring resolution.</li>
          <li className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2"><span className="font-bold text-red-700">Contradiction</span> — conflicting truth needing human resolution.</li>
          <li className="rounded-lg border border-[#E8DFD0] bg-white px-3 py-2 sm:col-span-2"><span className="font-bold">Meeting note</span> — meeting record context until explicitly promoted.</li>
        </ul>
        <div className="mt-4 space-y-3">
          {reviewMeetings.map((row) => (
            <MeetingDetailPanel
              key={row.meeting.id}
              businessId={businessId}
              meeting={row.meeting}
              attendees={row.attendees}
              consents={row.consents}
              notes={row.notes}
              transcripts={row.transcripts}
              canReviewNotes={canReviewNotes}
              surface="review"
            />
          ))}
          {reviewMeetings.length === 0 ? <p className="text-sm text-[#7A7164]">No meeting is awaiting review.</p> : null}
        </div>
      </section>

      <section className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8A6B1F]">4. Follow through</p>
        <h3 className="mt-1 text-sm font-bold text-[#1E1810]">Intentional next steps</h3>
        <p className="mt-1 text-xs text-[#7A7164]">
          Human-triggered navigation only. Meetings do not auto-create commitments, sales follow-ups, proposals, recommendations, opportunities, or creative jobs.
        </p>
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {followThrough.canViewCommitments ? (
            <a href="#promises" className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2 text-xs font-semibold text-white">
              Record a Promise Keeper commitment
            </a>
          ) : null}
          <a href="#outreach" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-[#FFFDF7] px-4 py-2 text-xs font-semibold text-[#1E1810]">
            Schedule a sales follow-up
          </a>
          {followThrough.hasCurrentProposal ? (
            <a href="#decide" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-[#FFFDF7] px-4 py-2 text-xs font-semibold text-[#1E1810]">
              Open proposal
            </a>
          ) : followThrough.canViewCommitments ? (
            <a href="#decide" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E8DFD0] px-4 py-2 text-xs font-semibold text-[#3D3428]">
              Review proposals
            </a>
          ) : null}
          {followThrough.hasRecommend ? (
            <a href="#recommend" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E8DFD0] px-4 py-2 text-xs font-semibold text-[#3D3428]">
              Next Right Move
            </a>
          ) : null}
          {followThrough.hasOpportunity ? (
            <a href="#opportunity" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E8DFD0] px-4 py-2 text-xs font-semibold text-[#3D3428]">
              Review Opportunities
            </a>
          ) : null}
          {followThrough.hasCreative ? (
            <a href="#creative" className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E8DFD0] px-4 py-2 text-xs font-semibold text-[#3D3428]">
              Creative Studio
            </a>
          ) : null}
        </div>
      </section>
    </div>
  );
}
