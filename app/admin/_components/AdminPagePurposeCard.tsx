import type { ReactNode } from "react";
import { adminCardBase } from "./adminTheme";

export type AdminTruthStatus = "real" | "partial" | "planned" | "needs live proof" | "needs schema gate";

const STATUS_META: Record<AdminTruthStatus, { label: string; className: string }> = {
  real: {
    label: "REAL",
    className: "border-emerald-200 bg-emerald-50 text-emerald-950",
  },
  partial: {
    label: "PARTIAL",
    className: "border-amber-200 bg-amber-50 text-amber-950",
  },
  planned: {
    label: "PLANNED",
    className: "border-[#C9B46A]/60 bg-[#FFFCF7] text-[#5C4E2E]",
  },
  "needs live proof": {
    label: "NEEDS LIVE PROOF",
    className: "border-orange-200 bg-orange-50 text-orange-950",
  },
  "needs schema gate": {
    label: "NEEDS SCHEMA GATE",
    className: "border-rose-200 bg-rose-50 text-rose-950",
  },
};

function InfoBlock({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A7164]">{label}</p>
      <div className="mt-1 break-words text-sm leading-relaxed text-[#3D3428]">{children}</div>
    </div>
  );
}

export function AdminTruthStatusChip({ status }: { status: AdminTruthStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-flex rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${meta.className}`}>
      {meta.label}
    </span>
  );
}

export function AdminPagePurposeCard({
  title,
  purpose,
  dataSource,
  status,
  safeActions,
  nextGate,
  warningNote,
  className = "",
}: {
  title: string;
  purpose: string;
  dataSource: string;
  status: AdminTruthStatus;
  safeActions: string[];
  nextGate: string;
  warningNote?: string;
  className?: string;
}) {
  return (
    <section
      className={`${adminCardBase} mb-6 min-w-0 overflow-hidden border-[#C9B46A]/35 bg-[#FFFCF7]/95 p-4 sm:p-5 ${className}`}
      data-admin-purpose-card="true"
      aria-label={`${title} page purpose`}
    >
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#A67C52]">Admin OS purpose card</p>
          <h2 className="mt-1 text-lg font-bold leading-tight text-[#1E1810]">{title}</h2>
          <p className="mt-2 max-w-4xl text-sm leading-relaxed text-[#5C5346]">{purpose}</p>
        </div>
        <div className="shrink-0">
          <AdminTruthStatusChip status={status} />
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <InfoBlock label="Data source">{dataSource}</InfoBlock>
        <InfoBlock label="Safe actions">
          <ul className="space-y-1">
            {safeActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </InfoBlock>
        <InfoBlock label="Next gate">{nextGate}</InfoBlock>
      </div>

      {warningNote ? (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs leading-relaxed text-amber-950">
          {warningNote}
        </p>
      ) : null}
    </section>
  );
}
