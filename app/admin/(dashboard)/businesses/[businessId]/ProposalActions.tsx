"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { isTerminalProposalHistoryStatus, previousCurrentShouldBecomeSuperseded } from "@/app/lib/business/proposals/logic";
import type { BusinessProposal } from "@/app/lib/business/proposals/types";

function readApiError(data: { error?: string }, fallback: string): string {
  if (data.error === "staff_roster_required") {
    return "A staff roster assignment is required to record this decision.";
  }
  if (typeof data.error === "string" && data.error.trim()) return data.error;
  return fallback;
}

function statusMeaning(status: string): string {
  switch (status) {
    case "draft":
      return "Draft — not ready for a client decision.";
    case "staff_review":
      return "Staff review — not a client decision.";
    case "owner_review":
      return "Ready for a client decision. Recording Accepted means the client accepted this proposal.";
    case "accepted":
      return "Client accepted this proposal. Not signed, not paid, not published.";
    case "declined":
      return "Client declined this proposal. History is preserved. The relationship is not automatically archived.";
    case "expired":
      return "Expired — not a client decision.";
    case "superseded":
      return "Superseded by a later version.";
    case "cancelled":
      return "Cancelled.";
    default:
      return status.replace(/_/g, " ");
  }
}

export function ProposalTransitionButtons({
  businessId, proposalId, currentStatus, canReview, canRecord, canRecordDecision,
}: {
  businessId: string;
  proposalId: string;
  currentStatus: string;
  canReview: boolean;
  canRecord: boolean;
  canRecordDecision: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<"accepted" | "declined" | "needs_changes" | null>(null);

  async function transition(status: string, changeReason?: string) {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/businesses/${businessId}/proposals/${proposalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, changeReason: changeReason ?? null }),
    });
    const data = await res.json().catch(() => ({} as { error?: string }));
    setSaving(false);
    if (!res.ok) {
      setPending(null);
      setError(readApiError(data, status === "accepted" ? "Could not record Accepted." : status === "declined" ? "Could not record Declined." : status === "staff_review" ? "Could not return this proposal for revision." : "Could not update the proposal."));
      return;
    }
    setPending(null);
    router.refresh();
  }

  const workflow: { label: string; to: string; requires: "review" | null }[] = currentStatus === "draft"
    ? [{ label: "Send to staff review", to: "staff_review", requires: null }, { label: "Cancel", to: "cancelled", requires: null }]
    : currentStatus === "staff_review"
      ? [{ label: "Send to owner review", to: "owner_review", requires: "review" }, { label: "Back to draft", to: "draft", requires: null }]
      : [];

  const showClientDecision = currentStatus === "owner_review";

  return (
    <div className="space-y-3">
      {workflow.length > 0 ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {workflow.map((btn) => {
            const permitted = btn.requires === "review" ? canReview : true;
            if (!permitted) return null;
            return (
              <button
                key={btn.to}
                type="button"
                onClick={() => void transition(btn.to)}
                disabled={saving}
                className={`inline-flex min-h-[44px] items-center justify-center rounded-lg px-4 py-2 text-xs font-bold disabled:opacity-50 ${
                  btn.to === "cancelled" ? "border border-red-300 text-red-700" : "bg-[#7A1E2C] text-white"
                }`}
              >
                {btn.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {showClientDecision ? (
        <div className="rounded-lg border border-[#C9A84A]/40 bg-[#FFFDF7] p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Client Decision</p>
          <p className="mt-1 text-xs text-[#3D3428]">
            Accepted means a staff member records that the <span className="font-semibold">client</span> accepted this proposal.
            It does not mean opportunity approval, Creative approval, signed contract, payment, or publication.
          </p>
          {!canRecord || !canRecordDecision ? (
            <p className="mt-2 text-xs text-[#7A7164]">
              {canRecord
                ? "A staff roster assignment is required to record Accepted or Declined."
                : "Recording a client decision remains a manager / super-admin action."}
            </p>
          ) : pending === "accepted" || pending === "declined" ? (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold text-[#1E1810]">
                {pending === "accepted"
                  ? "Confirm: the client accepted this proposal. Downstream contract, DocuSign, Stripe, and publication still remain."
                  : "Confirm: the client declined this proposal. History stays. The business is not archived."}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void transition(pending)}
                  className={`inline-flex min-h-[44px] items-center justify-center rounded-lg px-4 py-2 text-xs font-bold text-white disabled:opacity-50 ${
                    pending === "accepted" ? "bg-[#1F3A2D]" : "bg-[#7A1E2C]"
                  }`}
                >
                  {saving ? "Saving…" : pending === "accepted" ? "Confirm Accepted" : "Confirm Declined"}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setPending(null)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E8DFD0] px-4 py-2 text-xs font-semibold text-[#3D3428] disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : pending === "needs_changes" ? (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-semibold text-[#1E1810]">
                Confirm: the client/owner review requires changes before a decision. This returns the current proposal to staff review. It is not Declined, not Follow Up Later, and not Accepted. It does not create a new proposal version.
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void transition("staff_review", "needs_changes")}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Confirm Needs Changes"}
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setPending(null)}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E8DFD0] px-4 py-2 text-xs font-semibold text-[#3D3428] disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                disabled={saving}
                onClick={() => setPending("accepted")}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#1F3A2D] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
              >
                Accepted
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => setPending("declined")}
                className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-red-200 px-4 py-2 text-xs font-semibold text-red-800 disabled:opacity-50"
              >
                Declined
              </button>
              {canReview ? (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setPending("needs_changes")}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-[#FFFDF7] px-4 py-2 text-xs font-semibold text-[#1E1810] disabled:opacity-50"
                >
                  Needs Changes
                </button>
              ) : (
                <p className="text-xs text-[#7A7164]">Returning a proposal for revision remains a manager / super-admin action.</p>
              )}
            </div>
          )}
        </div>
      ) : null}

      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

function FollowUpLaterForm({
  businessId,
  proposalVersion,
  canWriteFollowUp,
}: {
  businessId: string;
  proposalVersion: number;
  canWriteFollowUp: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [purpose, setPurpose] = useState("");

  if (!canWriteFollowUp) {
    return (
      <p className="text-xs text-[#7A7164]">
        Owner bootstrap cannot create roster-attributed follow-ups. A staff roster assignment is required.
      </p>
    );
  }

  async function schedule() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/businesses/${businessId}/follow-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduledDate,
        purpose: purpose.trim() || `Follow up later on proposal v${proposalVersion}`,
      }),
    });
    const data = await res.json().catch(() => ({} as { error?: string }));
    setSaving(false);
    if (!res.ok) {
      setError(data.error === "owner_bootstrap_cannot_write_follow_ups"
        ? "A staff roster assignment is required to schedule follow-up."
        : "Could not schedule the follow-up.");
      return;
    }
    setScheduledDate("");
    setPurpose("");
    router.refresh();
  }

  return (
    <form
      className="space-y-2"
      onSubmit={(event) => {
        event.preventDefault();
        void schedule();
      }}
    >
      <p className="text-xs text-[#7A7164]">
        Follow Up Later does not change proposal status. It uses the canonical sales follow-up. A business has one current follow-up.
      </p>
      <input
        type="date"
        required
        value={scheduledDate}
        onChange={(e) => setScheduledDate(e.target.value)}
        className="min-h-[44px] w-full rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs text-[#1E1810]"
      />
      <input
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
        placeholder="Why later? e.g. discuss with spouse, budget in October"
        className="min-h-[44px] w-full rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs text-[#1E1810]"
      />
      <button
        type="submit"
        disabled={saving || !scheduledDate}
        className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#C9A84A]/70 bg-[#FFFDF7] px-4 py-2 text-xs font-semibold text-[#1E1810] disabled:opacity-50"
      >
        {saving ? "Saving…" : "Follow Up Later"}
      </button>
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
    </form>
  );
}

export function ProposalDetailPanel({
  businessId, proposal, canReview, canRecord, canRecordDecision, canWriteFollowUp, hasCurrentFollowUp,
}: {
  businessId: string;
  proposal: BusinessProposal;
  canReview: boolean;
  canRecord: boolean;
  canRecordDecision: boolean;
  canWriteFollowUp: boolean;
  hasCurrentFollowUp: boolean;
}) {
  const acceptedLabel = proposal.acceptedByEmail
    ? `${proposal.acceptedByEmail}${proposal.acceptedByRole ? ` · ${proposal.acceptedByRole}` : ""}`
    : null;

  return (
    <article className="space-y-3 rounded-2xl border border-[#C9A84A]/40 bg-[#FFFDF7] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-[#1E1810]">Proposal v{proposal.version}</p>
          <p className="mt-1 text-[10px] uppercase tracking-wide text-[#8A6B1F]">
            {proposal.isCurrent ? "Current" : "Not current"} · {proposal.recommendedIntervention.replace(/_/g, " ")}
          </p>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
          proposal.status === "accepted" ? "bg-emerald-100 text-emerald-900" :
          proposal.status === "declined" ? "bg-[#EDE6D6] text-[#3D3428]" :
          proposal.status === "owner_review" ? "bg-amber-100 text-amber-900" :
          "bg-[#EDE6D6] text-[#3D3428]"
        }`}>{proposal.status.replace(/_/g, " ")}</span>
      </div>
      <p className="text-xs text-[#3D3428]">{statusMeaning(proposal.status)}</p>
      <p className="break-words text-xs text-[#3D3428]">{proposal.verifiedNeedEn}</p>
      {proposal.pricingSnapshot ? (
        <p className="break-words text-[10px] text-[#7A7164]">
          Pricing snapshot: {proposal.pricingSnapshot.packageLabel ?? "—"} · {proposal.pricingSnapshot.priceCents != null ? `$${(proposal.pricingSnapshot.priceCents / 100).toFixed(2)}` : "—"} · {proposal.pricingSnapshot.pricingSource}. Snapshot is not payment.
        </p>
      ) : (
        <p className="text-[10px] text-[#7A7164]">No pricing snapshot.</p>
      )}

      {proposal.status === "accepted" ? (
        <div className="rounded-lg border border-[#1F3A2D]/20 bg-white p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#1F3A2D]">Accepted — client decision</p>
          <p className="mt-1 break-words text-xs text-[#3D3428]">
            Recorded {proposal.acceptedAt ? new Date(proposal.acceptedAt).toLocaleString() : "—"}
            {acceptedLabel ? ` by ${acceptedLabel}` : ""}.
          </p>
          <p className="mt-1 text-xs text-[#7A7164]">Owner Handoff next: contract/payment/publication remain downstream and are not complete.</p>
          <a href="#promises" className="mt-2 inline-flex min-h-[44px] items-center text-xs font-semibold text-[#7A1E2C] underline">Commitments</a>
        </div>
      ) : null}

      {proposal.status === "declined" ? (
        <div className="rounded-lg border border-[#E8DFD0] bg-white p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Declined — client decision</p>
          <p className="mt-1 text-xs text-[#3D3428]">
            Recorded {proposal.declinedAt ? new Date(proposal.declinedAt).toLocaleString() : "—"}. Notes, meetings, creative, and commitments are not deleted.
          </p>
          <a href="#outreach" className="mt-2 inline-flex min-h-[44px] items-center text-xs font-semibold text-[#7A1E2C] underline">Outreach</a>
        </div>
      ) : null}

      {proposal.isCurrent ? (
        <ProposalTransitionButtons
          businessId={businessId}
          proposalId={proposal.id}
          currentStatus={proposal.status}
          canReview={canReview}
          canRecord={canRecord}
          canRecordDecision={canRecordDecision}
        />
      ) : null}

      {proposal.isCurrent && (proposal.status === "owner_review" || proposal.status === "declined" || proposal.status === "accepted") ? (
        <div className="rounded-lg border border-[#E8DFD0] bg-white p-3">
          <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Follow Up Later</p>
          {hasCurrentFollowUp ? <p className="mt-1 text-xs text-[#7A7164]">A current follow-up already exists. Saving a new date replaces it.</p> : <p className="mt-1 text-xs text-[#7A7164]">No follow-up is scheduled.</p>}
          <div className="mt-2">
            <FollowUpLaterForm businessId={businessId} proposalVersion={proposal.version} canWriteFollowUp={canWriteFollowUp} />
          </div>
        </div>
      ) : null}
    </article>
  );
}

export type ProposalRecommendationPrefill = {
  id: string;
  verifiedNeedEn: string;
  verifiedNeedEs: string;
  recommendedIntervention: string;
  ownerGoalEn: string | null;
  ownerGoalEs: string | null;
  freeOptionEn: string | null;
  freeOptionEs: string | null;
  successMetricEn: string;
  successMetricEs: string;
  reviewDate: string | null;
};

const fieldClass = "min-h-[44px] w-full rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs text-[#1E1810]";

export function CreateProposalForm({
  businessId,
  canCreate,
  hasCurrentProposal,
  currentProposal,
  recommendation,
}: {
  businessId: string;
  canCreate: boolean;
  hasCurrentProposal: boolean;
  currentProposal: BusinessProposal | null;
  recommendation: ProposalRecommendationPrefill | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(!hasCurrentProposal);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const source = currentProposal;
  const [recommendedIntervention, setRecommendedIntervention] = useState(source?.recommendedIntervention || recommendation?.recommendedIntervention || "");
  const [verifiedNeedEn, setVerifiedNeedEn] = useState(source?.verifiedNeedEn || recommendation?.verifiedNeedEn || "");
  const [verifiedNeedEs, setVerifiedNeedEs] = useState(source?.verifiedNeedEs || recommendation?.verifiedNeedEs || "");
  const [ownerGoalEn, setOwnerGoalEn] = useState(source?.ownerGoalEn || recommendation?.ownerGoalEn || "");
  const [ownerGoalEs, setOwnerGoalEs] = useState(source?.ownerGoalEs || recommendation?.ownerGoalEs || "");
  const [scopeEn, setScopeEn] = useState(source?.scopeEn || "");
  const [scopeEs, setScopeEs] = useState(source?.scopeEs || "");
  const [deliverablesEn, setDeliverablesEn] = useState(source?.deliverablesEn || "");
  const [deliverablesEs, setDeliverablesEs] = useState(source?.deliverablesEs || "");
  const [responsibilitiesEn, setResponsibilitiesEn] = useState(source?.responsibilitiesEn || "");
  const [responsibilitiesEs, setResponsibilitiesEs] = useState(source?.responsibilitiesEs || "");
  const [timelineEn, setTimelineEn] = useState(source?.timelineEn || "");
  const [timelineEs, setTimelineEs] = useState(source?.timelineEs || "");
  const [successMetricEn, setSuccessMetricEn] = useState(source?.successMetricEn || recommendation?.successMetricEn || "");
  const [successMetricEs, setSuccessMetricEs] = useState(source?.successMetricEs || recommendation?.successMetricEs || "");
  const [freeOptionEn, setFreeOptionEn] = useState(source?.freeOptionEn || recommendation?.freeOptionEn || "");
  const [freeOptionEs, setFreeOptionEs] = useState(source?.freeOptionEs || recommendation?.freeOptionEs || "");
  const [exclusionsEn, setExclusionsEn] = useState(source?.exclusionsEn || "");
  const [exclusionsEs, setExclusionsEs] = useState(source?.exclusionsEs || "");
  const [reviewDate, setReviewDate] = useState((source?.reviewDate || recommendation?.reviewDate || "").slice(0, 10));

  if (!canCreate) {
    return (
      <p className="text-sm text-[#7A7164]">
        Your role can view Client Decision. Creating a proposal remains a manager / super-admin action.
      </p>
    );
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/businesses/${businessId}/proposals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sourceRecommendationId: source?.sourceRecommendationId || recommendation?.id || null,
        recommendedIntervention,
        verifiedNeedEn,
        verifiedNeedEs,
        ownerGoalEn: ownerGoalEn || null,
        ownerGoalEs: ownerGoalEs || null,
        scopeEn,
        scopeEs,
        deliverablesEn,
        deliverablesEs,
        responsibilitiesEn,
        responsibilitiesEs,
        timelineEn,
        timelineEs,
        successMetricEn,
        successMetricEs,
        freeOptionEn: freeOptionEn || null,
        freeOptionEs: freeOptionEs || null,
        exclusionsEn: exclusionsEn || null,
        exclusionsEs: exclusionsEs || null,
        reviewDate: reviewDate || null,
      }),
    });
    const data = await res.json().catch(() => ({} as { error?: string }));
    setSaving(false);
    if (!res.ok) {
      setError(readApiError(data, "Could not create the proposal."));
      return;
    }
    setOpen(false);
    router.refresh();
  }

  const replacingWorking = Boolean(hasCurrentProposal && currentProposal && previousCurrentShouldBecomeSuperseded(currentProposal.status));
  const replacingTerminal = Boolean(hasCurrentProposal && currentProposal && isTerminalProposalHistoryStatus(currentProposal.status));
  const title = !hasCurrentProposal ? "Create Proposal" : replacingTerminal ? "Create New Proposal" : "Create next proposal version";
  const actionLabel = !hasCurrentProposal ? "Create Proposal" : replacingWorking ? "Create Next Version" : "Create New Proposal";
  const help = !hasCurrentProposal
    ? "Human-triggered. A recommendation does not create a proposal automatically."
    : replacingTerminal
      ? "This creates a new current draft. The previous proposal keeps its historical status (accepted, declined, expired, or cancelled) and is no longer current. Status records what happened; current records which proposal is active."
      : "This creates a new draft version. The previous in-flight proposal is marked superseded and is no longer current. Needs Changes returns the same row to staff review without creating a version.";

  return (
    <div className="rounded-lg border border-[#C9A84A]/40 bg-white p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">{title}</p>
      <p className="mt-1 text-xs text-[#7A7164]">{help}</p>
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2 text-xs font-bold text-white"
        >
          {actionLabel}
        </button>
      ) : (
        <form className="mt-3 space-y-2" onSubmit={(event) => void submit(event)}>
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Recommended intervention</label>
          <input className={fieldClass} required value={recommendedIntervention} onChange={(e) => setRecommendedIntervention(e.target.value)} />
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Verified need (EN)</label>
          <textarea className={fieldClass} required rows={2} value={verifiedNeedEn} onChange={(e) => setVerifiedNeedEn(e.target.value)} />
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Verified need (ES)</label>
          <textarea className={fieldClass} rows={2} value={verifiedNeedEs} onChange={(e) => setVerifiedNeedEs(e.target.value)} />
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Owner goal (EN)</label>
          <textarea className={fieldClass} rows={2} value={ownerGoalEn} onChange={(e) => setOwnerGoalEn(e.target.value)} />
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Owner goal (ES)</label>
          <textarea className={fieldClass} rows={2} value={ownerGoalEs} onChange={(e) => setOwnerGoalEs(e.target.value)} />
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Scope (EN)</label>
          <textarea className={fieldClass} required rows={2} value={scopeEn} onChange={(e) => setScopeEn(e.target.value)} />
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Scope (ES)</label>
          <textarea className={fieldClass} rows={2} value={scopeEs} onChange={(e) => setScopeEs(e.target.value)} />
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Deliverables (EN)</label>
          <textarea className={fieldClass} required rows={2} value={deliverablesEn} onChange={(e) => setDeliverablesEn(e.target.value)} />
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Deliverables (ES)</label>
          <textarea className={fieldClass} rows={2} value={deliverablesEs} onChange={(e) => setDeliverablesEs(e.target.value)} />
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Responsibilities (EN)</label>
          <textarea className={fieldClass} required rows={2} value={responsibilitiesEn} onChange={(e) => setResponsibilitiesEn(e.target.value)} />
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Responsibilities (ES)</label>
          <textarea className={fieldClass} rows={2} value={responsibilitiesEs} onChange={(e) => setResponsibilitiesEs(e.target.value)} />
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Timeline (EN)</label>
          <input className={fieldClass} required value={timelineEn} onChange={(e) => setTimelineEn(e.target.value)} />
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Timeline (ES)</label>
          <input className={fieldClass} value={timelineEs} onChange={(e) => setTimelineEs(e.target.value)} />
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Success metric (EN)</label>
          <input className={fieldClass} required value={successMetricEn} onChange={(e) => setSuccessMetricEn(e.target.value)} />
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Success metric (ES)</label>
          <input className={fieldClass} value={successMetricEs} onChange={(e) => setSuccessMetricEs(e.target.value)} />
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Free option (EN)</label>
          <input className={fieldClass} value={freeOptionEn} onChange={(e) => setFreeOptionEn(e.target.value)} />
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Free option (ES)</label>
          <input className={fieldClass} value={freeOptionEs} onChange={(e) => setFreeOptionEs(e.target.value)} />
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Exclusions (EN)</label>
          <input className={fieldClass} value={exclusionsEn} onChange={(e) => setExclusionsEn(e.target.value)} />
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Exclusions (ES)</label>
          <input className={fieldClass} value={exclusionsEs} onChange={(e) => setExclusionsEs(e.target.value)} />
          <label className="block text-[10px] font-bold uppercase tracking-wide text-[#8A6B1F]">Review date</label>
          <input className={fieldClass} type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} />
          {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="submit" disabled={saving} className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
              {saving ? "Saving…" : actionLabel}
            </button>
            {hasCurrentProposal ? (
              <button type="button" disabled={saving} onClick={() => setOpen(false)} className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E8DFD0] px-4 py-2 text-xs font-semibold text-[#3D3428] disabled:opacity-50">
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      )}
    </div>
  );
}
