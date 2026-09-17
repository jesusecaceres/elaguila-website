import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminCardBase, adminReadOnlyBadgeClass } from "../../_components/adminTheme";
import { buildAdminSystemHealthSnapshot } from "../../_lib/adminSystemHealth";

export const dynamic = "force-dynamic";

function stateBadgeClass(state: string): string {
  switch (state) {
    case "HEALTHY":
      return "border-emerald-200 bg-emerald-50 text-emerald-900";
    case "DEGRADED":
      return "border-amber-300 bg-amber-50 text-amber-900";
    case "UNAVAILABLE":
      return "border-red-300 bg-red-50 text-red-900";
    case "NOT_CONFIGURED":
      return "border-[#E8DFD0] bg-[#FAF7F2] text-[#7A7164]";
    default:
      return "border-[#E8DFD0] bg-[#FAF7F2] text-[#9A9084]";
  }
}

function stateLabel(state: string): string {
  switch (state) {
    case "HEALTHY":
      return "Healthy";
    case "DEGRADED":
      return "Degraded";
    case "UNAVAILABLE":
      return "Unavailable";
    case "NOT_CONFIGURED":
      return "Not configured";
    default:
      return "Unknown";
  }
}

export default async function AdminSystemHealthPage() {
  const snapshot = await buildAdminSystemHealthSnapshot();

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <span className={adminReadOnlyBadgeClass}>Real signals only — never a fake green</span>
      </div>
      <AdminPageHeader
        title="System Health"
        subtitle="Operational dependencies this Admin relies on, checked live on this page load."
        helperText="Config-only checks show as “Not configured” — this is expected on deployments that don’t use that feature. No secret values are ever shown here."
      />

      <div className={`${adminCardBase} mb-6 p-4`}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase text-[#7A7164]">Overall</span>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-bold uppercase ${stateBadgeClass(snapshot.overall)}`}
          >
            {stateLabel(snapshot.overall)}
          </span>
          <span className="text-xs text-[#9A9084]">
            Checked {new Date(snapshot.generatedAt).toLocaleString("en-US")}
          </span>
        </div>
        {snapshot.limitations.length > 0 ? (
          <ul className="mt-3 space-y-1 text-xs text-[#7A7164]">
            {snapshot.limitations.map((l) => (
              <li key={l}>· {l}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {snapshot.components.map((c) => (
          <div key={c.key} className={`${adminCardBase} p-4`}>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[#1E1810]">{c.label}</p>
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${stateBadgeClass(c.state)}`}
              >
                {stateLabel(c.state)}
              </span>
            </div>
            {c.ownerMessage ? <p className="mt-1.5 text-xs text-[#7A7164]">{c.ownerMessage}</p> : null}
          </div>
        ))}
      </div>
    </div>
  );
}
