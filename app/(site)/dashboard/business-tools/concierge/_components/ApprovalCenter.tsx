"use client";

/** TODAY-2 — owner-facing Approval Center. Nothing here is auto-approved; the owner may only
 * withdraw their own paid-service requests — approving/declining those is staff-only. */
import type { ConciergeLang } from "../conciergeCopy";

export type ApprovalData = {
  id: string;
  requestType: string;
  requestedDecision: string;
  status: string;
  requestedAt: string;
  decidedAt: string | null;
  ownerNote: string | null;
};

const REQUEST_TYPE_LABELS: Record<string, { es: string; en: string }> = {
  action_completion_confirmation: { es: "Confirmación de acción completada", en: "Action completion confirmation" },
  owner_correction_confirmation: { es: "Confirmación de corrección", en: "Correction confirmation" },
  concierge_guidance_request: { es: "Solicitud de orientación (Guíame)", en: "Guidance request (Guide Me)" },
  managed_service_request: { es: "Solicitud de servicio administrado", en: "Managed-service request" },
  postponement_review: { es: "Revisión de pausa", en: "Postponement review" },
  resume_decision: { es: "Decisión de reanudar", en: "Resume decision" },
  content_draft_approval: { es: "Aprobación de borrador", en: "Content draft approval" },
};

const STATUS_LABELS: Record<string, { es: string; en: string }> = {
  pending: { es: "Pendiente", en: "Pending" },
  approved: { es: "Aprobado", en: "Approved" },
  declined: { es: "Rechazado", en: "Declined" },
  withdrawn: { es: "Retirado", en: "Withdrawn" },
  expired: { es: "Expirado", en: "Expired" },
  superseded: { es: "Reemplazado", en: "Superseded" },
};

const COPY = {
  en: { title: "Approval Center", empty: "No pending approvals right now.", withdraw: "Withdraw" },
  es: { title: "Centro de aprobaciones", empty: "No hay aprobaciones pendientes por ahora.", withdraw: "Retirar" },
} as const;

export function ApprovalCenter({
  approvals,
  lang,
  onWithdraw,
  busy,
}: {
  approvals: ApprovalData[];
  lang: ConciergeLang;
  onWithdraw: (approvalId: string) => void;
  busy: boolean;
}) {
  const t = COPY[lang];
  return (
    <div className="rounded-2xl border border-[#E8DFD0] bg-white p-4">
      <h2 className="text-sm font-bold text-[#1E1810]">{t.title}</h2>
      {approvals.length === 0 ? (
        <p className="mt-2 text-sm text-[#7A7164]">{t.empty}</p>
      ) : (
        <ul className="mt-2 space-y-3">
          {approvals.map((a) => (
            <li key={a.id} className="min-w-0 rounded-xl bg-[#FAF7F2] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="break-words text-sm font-semibold text-[#3D3428]">
                  {REQUEST_TYPE_LABELS[a.requestType]?.[lang] ?? a.requestType}
                </p>
                <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-[#5C5346]">
                  {STATUS_LABELS[a.status]?.[lang] ?? a.status}
                </span>
              </div>
              {a.ownerNote ? <p className="mt-1 break-words text-sm text-[#5C5346]">{a.ownerNote}</p> : null}
              {a.status === "pending" ? (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => onWithdraw(a.id)}
                  className="mt-2 min-h-11 rounded-xl border border-[#E8DFD0] px-3 text-xs font-semibold text-[#3D3428] disabled:opacity-50"
                >
                  {t.withdraw}
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
