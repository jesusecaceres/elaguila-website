"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

async function postJson(url: string, method: string, body: unknown): Promise<boolean> {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return res.ok;
}

export function CreateRecommendationButton({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setSubmitting(true);
    setError(null);
    const ok = await postJson(`/api/admin/businesses/${businessId}/recommendations`, "POST", {});
    setSubmitting(false);
    if (!ok) {
      setError("Could not evaluate a Next Right Move (readiness may not be ready).");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={submitting}
        onClick={() => void run()}
        className="min-h-[40px] rounded-lg bg-[#7A1E2C] px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
      >
        {submitting ? "Evaluating…" : "Evaluate Next Right Move"}
      </button>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

export function RecommendationTransitionButtons({
  businessId, recommendationId, status, canCreate, canApprove,
}: { businessId: string; recommendationId: string; status: string; canCreate: boolean; canApprove: boolean }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function act(action: string) {
    setSubmitting(true);
    setError(null);
    const ok = await postJson(`/api/admin/businesses/${businessId}/recommendations/${recommendationId}`, "PATCH", { action });
    setSubmitting(false);
    if (!ok) {
      setError("Could not complete this transition.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {status === "draft" && canCreate ? (
        <button type="button" disabled={submitting} onClick={() => void act("submit_for_review")} className="min-h-[36px] rounded-lg border border-[#E8DFD0] px-3 py-1.5 text-xs font-semibold text-[#3D3428] disabled:opacity-50">
          Submit for review
        </button>
      ) : null}
      {status === "review_required" && canApprove ? (
        <button type="button" disabled={submitting} onClick={() => void act("approve")} className="min-h-[36px] rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
          Approve
        </button>
      ) : null}
      {status === "approved" && canApprove ? (
        <button type="button" disabled={submitting} onClick={() => void act("share")} className="min-h-[36px] rounded-lg bg-[#7A1E2C] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50">
          Share with owner
        </button>
      ) : null}
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

export function OverrideForm({ businessId, recommendationId }: { businessId: string; recommendationId: string }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [successMetricEn, setSuccessMetricEn] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!reason.trim() || !successMetricEn.trim()) {
      setError("A reason and an updated success metric are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const ok = await postJson(`/api/admin/businesses/${businessId}/recommendations/${recommendationId}/override`, "POST", {
      reason: reason.trim(),
      patch: { successMetricEn: successMetricEn.trim() },
    });
    setSubmitting(false);
    if (!ok) {
      setError("Could not record the override.");
      return;
    }
    setReason("");
    setSuccessMetricEn("");
    router.refresh();
  }

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3">
      <p className="text-xs font-bold text-amber-900">Manager override (requires a non-empty reason; returns to review_required)</p>
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Reason (required)" className="w-full rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs" />
      <input value={successMetricEn} onChange={(e) => setSuccessMetricEn(e.target.value)} placeholder="Updated success metric (EN)" className="w-full rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs" />
      <button type="button" disabled={submitting} onClick={() => void submit()} className="min-h-[36px] rounded-lg border border-amber-600 px-3 py-1.5 text-xs font-semibold text-amber-900 disabled:opacity-50">
        Record override
      </button>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
