"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
  const [pending, setPending] = useState<"accepted" | "declined" | null>(null);

  async function transition(status: string) {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/businesses/${businessId}/proposals/${proposalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json().catch(() => ({} as { error?: string }));
    setSaving(false);
    if (!res.ok) {
      setPending(null);
      setError(readApiError(data, status === "accepted" ? "Could not record Accepted." : status === "declined" ? "Could not record Declined." : "Could not update the proposal."));
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
          ) : pending ? (
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
