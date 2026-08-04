"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

async function postJson(url: string, method: string, body: unknown): Promise<boolean> {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  return res.ok;
}

export function RunAssessmentButton({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setSubmitting(true);
    setError(null);
    const ok = await postJson(`/api/admin/businesses/${businessId}/health`, "POST", { triggerType: "staff_requested" });
    setSubmitting(false);
    if (!ok) {
      setError("Could not run the assessment.");
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
        {submitting ? "Running…" : "Run new assessment"}
      </button>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}

export function MarkHumanReviewForm({ businessId, runId, currentlyRequired }: { businessId: string; runId: string; currentlyRequired: boolean }) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle(nextRequired: boolean) {
    setSubmitting(true);
    setError(null);
    const ok = await postJson(`/api/admin/businesses/${businessId}/health/${runId}`, "PATCH", { required: nextRequired, note: note.trim() || null });
    setSubmitting(false);
    if (!ok) {
      setError("Could not update human review status.");
      return;
    }
    setNote("");
    router.refresh();
  }

  return (
    <div className="mt-2 space-y-2">
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Reviewer note (optional)"
        className="w-full rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs"
      />
      <div className="flex flex-wrap gap-2">
        {!currentlyRequired ? (
          <button type="button" disabled={submitting} onClick={() => void toggle(true)} className="min-h-[36px] rounded-lg border border-amber-600 px-3 py-1.5 text-xs font-semibold text-amber-800 disabled:opacity-50">
            Mark human review required
          </button>
        ) : (
          <button type="button" disabled={submitting} onClick={() => void toggle(false)} className="min-h-[36px] rounded-lg border border-[#E8DFD0] px-3 py-1.5 text-xs font-semibold text-[#3D3428] disabled:opacity-50">
            Clear human review flag
          </button>
        )}
      </div>
      {error ? <p className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
