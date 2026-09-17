/**
 * EXEC-REPORTS-01 — compact Command Center surface. Navigation only.
 */
import { AdminDashboardCta } from "@/app/admin/_components/AdminDashboardCta";
import { AdminSectionCard } from "@/app/admin/_components/AdminSectionCard";
import { adminCardBase } from "@/app/admin/_components/adminTheme";
import type { LeoExecutiveReportingSnapshot, LeoExecutiveSignal } from "@/app/leo/_lib/leoExecutiveReportingTypes";

function SignalRow({ signal }: { signal: LeoExecutiveSignal }) {
  const href = signal.deepLink;
  return (
    <li className="flex min-w-0 flex-col gap-1 rounded-xl border border-[#E8DFD0]/80 bg-white/95 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-[#1E1810]">{signal.title}</p>
        <p className="mt-0.5 text-xs leading-snug text-[#5C5346]">{signal.summary}</p>
      </div>
      {href ? (
        <AdminDashboardCta
          href={href}
          label="Open"
          variant={signal.ownerAttentionRequired ? "warning" : "view"}
          className="!min-h-[40px] !w-auto !shrink-0 !px-3 !py-1.5 !text-xs"
        />
      ) : null}
    </li>
  );
}

export function AdminExecutiveReportsPanel({
  snapshot,
}: {
  snapshot: LeoExecutiveReportingSnapshot | null;
}) {
  if (!snapshot) {
    return (
      <AdminSectionCard title="Executive Reports" subtitle="Company signals from live admin sources.">
        <p className="text-sm text-[#5C5346]">Executive reporting is temporarily unavailable. This is not an all-clear.</p>
      </AdminSectionCard>
    );
  }

  const attention = snapshot.attention.slice(0, 6);
  const operations = snapshot.operations.slice(0, 4);
  const performance = snapshot.performance.slice(0, 4);
  const system = snapshot.systemHealth.slice(0, 4);

  return (
    <AdminSectionCard
      title="Executive Reports"
      subtitle="Reports show the company. Alerts surface changes that need you."
    >
      <p className="mb-2 text-xs font-medium text-[#5C5346]">
        Executive Reports is the company-wide picture. LEO alerts are the smaller proactive subset — not every report becomes an alert.
      </p>
      <p className="mb-3 text-xs text-[#7A7164]" data-testid="admin-exec-report-sources">
        Reporting sources: {snapshot.coverage.totalRegisteredDomains} registered domains
        {" · "}
        {snapshot.coverage.available} available
        {snapshot.coverage.partial ? ` · ${snapshot.coverage.partial} partial` : ""}
        {snapshot.coverage.unavailable ? ` · ${snapshot.coverage.unavailable} unavailable` : ""}
        {snapshot.coverage.notImplemented ? ` · ${snapshot.coverage.notImplemented} not built yet` : ""}
        {snapshot.coverage.empty ? ` · ${snapshot.coverage.empty} empty` : ""}
        {" · "}
        {snapshot.coverage.watchEnabledDomains} watch-enabled
      </p>
      <details className="mb-4 rounded-xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/80 px-3 py-2 text-xs text-[#5C5346]">
        <summary className="cursor-pointer font-semibold text-[#1E1810]">Source detail</summary>
        <ul className="mt-2 space-y-1">
          {snapshot.adapterHealth.map((h) => (
            <li key={h.domain}>
              {h.label}: {h.availability.toLowerCase().replace(/_/g, " ")}
              {h.limitation ? ` — ${h.limitation}` : ""}
            </li>
          ))}
        </ul>
      </details>
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-bold text-[#1E1810]">Needs your attention</h3>
          <ul className="mt-2 space-y-2">
            {attention.length === 0 ? (
              <li className="text-sm text-[#5C5346]">No owner-attention queues from available sources.</li>
            ) : (
              attention.map((s) => <SignalRow key={s.signalId} signal={s} />)
            )}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#1E1810]">Operations</h3>
          <ul className="mt-2 space-y-2">
            {operations.length === 0 ? (
              <li className="text-sm text-[#5C5346]">No extra operational notices.</li>
            ) : (
              operations.map((s) => <SignalRow key={s.signalId} signal={s} />)
            )}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#1E1810]">Performance</h3>
          <ul className="mt-2 space-y-2">
            {performance.length === 0 ? (
              <li className="text-sm text-[#5C5346]">No proven metrics in this pass.</li>
            ) : (
              performance.map((s) => <SignalRow key={s.signalId} signal={s} />)
            )}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#1E1810]">System health</h3>
          <ul className="mt-2 space-y-2">
            {system.length === 0 ? (
              <li className="text-sm text-[#5C5346]">No system probes in this pass.</li>
            ) : (
              system.map((s) => <SignalRow key={s.signalId} signal={s} />)
            )}
          </ul>
        </div>
      </div>
      <div className={`${adminCardBase} mt-4 border-dashed p-3 text-[11px] text-[#7A7164]`}>
        Reporting is read-only. Opening a queue does not approve, reject, publish, charge, or message a customer.
      </div>
    </AdminSectionCard>
  );
}
