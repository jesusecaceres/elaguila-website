"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { BusinessProposal } from "@/app/lib/business/proposals/types";

export function ProposalTransitionButtons({
  businessId, proposalId, currentStatus, canReview, canRecord,
}: {
  businessId: string;
  proposalId: string;
  currentStatus: string;
  canReview: boolean;
  canRecord: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function transition(status: string) {
    setSaving(true);
    await fetch(`/api/admin/businesses/${businessId}/proposals/${proposalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setSaving(false);
    router.refresh();
  }

  const transitions: Record<string, { label: string; to: string; requires: "review" | "record" | null }[]> = {
    draft: [{ label: "Send to staff review", to: "staff_review", requires: null }, { label: "Cancel", to: "cancelled", requires: null }],
    staff_review: [{ label: "Send to owner", to: "owner_review", requires: "review" }, { label: "Back to draft", to: "draft", requires: null }],
    owner_review: [{ label: "Accept", to: "accepted", requires: "record" }, { label: "Decline", to: "declined", requires: "record" }],
    accepted: [],
    declined: [],
    expired: [],
    superseded: [],
    cancelled: [],
  };

  const buttons = transitions[currentStatus] ?? [];

  return (
    <div className="flex flex-wrap gap-2">
      {buttons.map((btn) => {
        const permitted = btn.requires === "review" ? canReview : btn.requires === "record" ? canRecord : true;
        if (!permitted) return null;
        return (
          <button
            key={btn.to}
            onClick={() => transition(btn.to)}
            disabled={saving}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold disabled:opacity-50 ${
              btn.to === "cancelled" ? "border border-red-300 text-red-700" :
              btn.to === "accepted" ? "bg-emerald-600 text-white" :
              btn.to === "declined" ? "border border-red-400 text-red-700" :
              "bg-[#7A1E2C] text-white"
            }`}
          >
            {btn.label}
          </button>
        );
      })}
    </div>
  );
}

export function ProposalDetailPanel({
  businessId, proposal, canReview, canRecord,
}: {
  businessId: string;
  proposal: BusinessProposal;
  canReview: boolean;
  canRecord: boolean;
}) {
  return (
    <div className="rounded-lg border border-[#E8DFD0] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-[#1E1810]">Proposal v{proposal.version}</span>
        <span className="rounded-full bg-[#EDE6D6] px-2 py-0.5 text-[10px] font-bold text-[#3D3428]">{proposal.status}</span>
      </div>
      <p className="mt-1 text-xs text-[#3D3428]">{proposal.verifiedNeedEn}</p>
      <p className="mt-1 text-xs text-[#7A7164]">Intervention: {proposal.recommendedIntervention}</p>
      {proposal.pricingSnapshot ? (
        <p className="mt-1 text-[10px] text-[#9A9184]">
          Pricing: {proposal.pricingSnapshot.packageLabel ?? "—"} · {proposal.pricingSnapshot.priceCents != null ? `$${(proposal.pricingSnapshot.priceCents / 100).toFixed(2)}` : "—"} · source: {proposal.pricingSnapshot.pricingSource}
        </p>
      ) : (
        <p className="mt-1 text-[10px] text-[#9A9184]">No pricing snapshot.</p>
      )}
      <div className="mt-2">
        <ProposalTransitionButtons
          businessId={businessId}
          proposalId={proposal.id}
          currentStatus={proposal.status}
          canReview={canReview}
          canRecord={canRecord}
        />
      </div>
    </div>
  );
}
