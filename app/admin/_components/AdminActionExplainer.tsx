import type { AdminActionContract, AdminActionKey } from "../_lib/adminOsActionRegistry";
import { getAdminActionContract } from "../_lib/adminOsActionRegistry";
import { AdminTruthStatusChip } from "./AdminPagePurposeCard";

function RiskBadge({ risk }: { risk: AdminActionContract["riskLevel"] }) {
  const cls =
    risk === "CRITICAL"
      ? "border-rose-300 bg-rose-50 text-rose-950"
      : risk === "HIGH"
        ? "border-orange-200 bg-orange-50 text-orange-950"
        : risk === "MEDIUM"
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : "border-emerald-200 bg-emerald-50 text-emerald-950";
  return <span className={`rounded-lg border px-2 py-0.5 text-[10px] font-bold uppercase ${cls}`}>{risk} RISK</span>;
}

export function AdminActionExplainer({
  action,
  compact = false,
  className = "",
}: {
  action: AdminActionKey;
  compact?: boolean;
  className?: string;
}) {
  const meta = getAdminActionContract(action);
  return (
    <details
      className={`min-w-0 rounded-xl border border-[#E8DFD0]/85 bg-[#FFFCF7]/95 text-sm text-[#5C5346] ${className}`}
      data-admin-action-explainer={action}
    >
      <summary className="flex min-h-[44px] cursor-pointer list-none flex-wrap items-center gap-2 px-3 py-2.5 font-bold text-[#1E1810] [&::-webkit-details-marker]:hidden">
        <span>{meta.label}</span>
        <AdminTruthStatusChip status={meta.status} />
        <RiskBadge risk={meta.riskLevel} />
      </summary>
      <div className="space-y-3 border-t border-[#E8DFD0]/70 px-3 py-3">
        <p className="leading-relaxed">{meta.description}</p>
        {!compact ? (
          <dl className="grid gap-3 text-xs sm:grid-cols-2">
            <div>
              <dt className="font-bold uppercase tracking-wide text-[#7A7164]">What it does</dt>
              <dd className="mt-1 leading-relaxed text-[#3D3428]">{meta.whatItDoes}</dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-wide text-[#7A7164]">Data touched</dt>
              <dd className="mt-1 leading-relaxed text-[#3D3428]">{meta.dataTouched}</dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-wide text-[#7A7164]">Control checks</dt>
              <dd className="mt-1 leading-relaxed text-[#3D3428]">
                Confirmation: {meta.confirmationRecommended ? "required/recommended" : "not required"} · Audit:{" "}
                {meta.auditRecommended ? "recommended" : "not required"}
              </dd>
            </div>
            <div>
              <dt className="font-bold uppercase tracking-wide text-[#7A7164]">Next gate</dt>
              <dd className="mt-1 leading-relaxed text-[#3D3428]">{meta.nextGate}</dd>
            </div>
          </dl>
        ) : null}
        <p className="rounded-lg border border-[#C9B46A]/40 bg-white/75 px-3 py-2 text-xs font-semibold leading-relaxed text-[#5C4E2E]">
          {meta.helperCopy}
        </p>
      </div>
    </details>
  );
}

export function AdminActionExplainerGrid({ actions }: { actions: AdminActionKey[] }) {
  return (
    <div className="grid min-w-0 gap-2 sm:grid-cols-2" data-admin-action-explainer-grid="true">
      {actions.map((action) => (
        <AdminActionExplainer key={action} action={action} compact />
      ))}
    </div>
  );
}
