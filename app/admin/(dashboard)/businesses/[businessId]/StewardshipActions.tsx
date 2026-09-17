"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { humanizeStaffWriteError } from "@/app/admin/_lib/staffWriteErrorMessages";

async function postJson(url: string, method: string, body: unknown): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (res.ok) return { ok: true };
  const data = await res.json().catch(() => ({} as { error?: string }));
  return { ok: false, error: typeof data.error === "string" && data.error.trim() ? data.error : undefined };
}

export function CreateRecommendationButton({ businessId }: { businessId: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setSubmitting(true);
    setError(null);
    const result = await postJson(`/api/admin/businesses/${businessId}/recommendations`, "POST", {});
    setSubmitting(false);
    if (!result.ok) {
      setError(humanizeStaffWriteError(result.error, "No se pudo evaluar un Próximo paso correcto (es posible que la preparación no esté lista). / Could not evaluate a Next Right Move (readiness may not be ready)."));
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <button
        type="button"
        disabled={submitting}
        onClick={() => void run()}
        className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
      >
        {submitting ? "Evaluando… / Evaluating…" : "Evaluar Próximo paso correcto / Evaluate Next Right Move"}
      </button>
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
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
    const result = await postJson(`/api/admin/businesses/${businessId}/recommendations/${recommendationId}`, "PATCH", { action });
    setSubmitting(false);
    if (!result.ok) {
      setError(humanizeStaffWriteError(result.error, "No se pudo completar esta transición. / Could not complete this transition."));
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      {status === "draft" && canCreate ? (
        <button type="button" disabled={submitting} onClick={() => void act("submit_for_review")} className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-[#E8DFD0] px-4 py-2 text-xs font-semibold text-[#3D3428] disabled:opacity-50">
          Enviar para revisión / Submit for review
        </button>
      ) : null}
      {status === "review_required" && canApprove ? (
        <button type="button" disabled={submitting} onClick={() => void act("approve")} className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#1F3A2D] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
          Aprobar / Approve
        </button>
      ) : null}
      {status === "approved" && canApprove ? (
        <button type="button" disabled={submitting} onClick={() => void act("share")} className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-[#7A1E2C] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
          Compartir con el propietario / Share with owner
        </button>
      ) : null}
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
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
      setError("Se requiere un motivo y una métrica de éxito actualizada. / A reason and an updated success metric are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const result = await postJson(`/api/admin/businesses/${businessId}/recommendations/${recommendationId}/override`, "POST", {
      reason: reason.trim(),
      patch: { successMetricEn: successMetricEn.trim() },
    });
    setSubmitting(false);
    if (!result.ok) {
      setError(humanizeStaffWriteError(result.error, "No se pudo registrar la anulación. / Could not record the override."));
      return;
    }
    setReason("");
    setSuccessMetricEn("");
    router.refresh();
  }

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-3">
      <p className="text-xs font-bold text-amber-900">Anulación de gerente (requiere un motivo no vacío; regresa a review_required) / Manager override (requires a non-empty reason; returns to review_required)</p>
      <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="Reason (required)" className="w-full rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs" />
      <input value={successMetricEn} onChange={(e) => setSuccessMetricEn(e.target.value)} placeholder="Updated success metric (EN)" className="w-full rounded-lg border border-[#E8DFD0] px-3 py-2 text-xs" />
      <button type="button" disabled={submitting} onClick={() => void submit()} className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-amber-600 px-4 py-2 text-xs font-semibold text-amber-900 disabled:opacity-50">
        Registrar anulación / Record override
      </button>
      {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
