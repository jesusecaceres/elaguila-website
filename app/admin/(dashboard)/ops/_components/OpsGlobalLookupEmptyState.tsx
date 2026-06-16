import Link from "next/link";
import { AdminDashboardCta } from "@/app/admin/_components/AdminDashboardCta";
import { adminCardBase, adminCardMuted, adminDashboardMetricChip } from "@/app/admin/_components/adminTheme";
import { adminMessages, type AdminLang } from "@/app/admin/_lib/adminI18n";

export function OpsGlobalLookupEmptyState({ lang }: { lang: AdminLang }) {
  const m = adminMessages(lang);

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden" data-testid="ops-global-lookup-empty-state">
      <section className={`${adminCardBase} p-5 sm:p-6`}>
        <h2 className="text-base font-bold text-[#1E1810]">{m("opsPage.emptyTitle")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[#5C5346]">{m("opsPage.emptyIntro")}</p>
        <p className="mt-3 text-xs leading-relaxed text-[#7A7164]">{m("opsPage.emptyScopeNote")}</p>

        <div className="mt-4">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{m("opsPage.emptySearchTargetsTitle")}</p>
          <ul className="mt-2 grid gap-1.5 text-sm text-[#5C5346] sm:grid-cols-2">
            {(
              [
                "opsPage.emptyTargetName",
                "opsPage.emptyTargetEmail",
                "opsPage.emptyTargetPhone",
                "opsPage.emptyTargetUuid",
                "opsPage.emptyTargetLeonixId",
                "opsPage.emptyTargetListingId",
                "opsPage.emptyTargetOrderId",
                "opsPage.emptyTargetReportId",
              ] as const
            ).map((key) => (
              <li key={key} className="flex items-start gap-2">
                <span className={adminDashboardMetricChip}>·</span>
                <span>{m(key)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{m("opsPage.examplesTitle")}</p>
          <ul className="mt-2 space-y-1 font-mono text-xs text-[#5C5346]">
            <li>{m("opsPage.exampleEmail")}</li>
            <li>{m("opsPage.exampleLeonixId")}</li>
            <li>{m("opsPage.examplePhone")}</li>
            <li>{m("opsPage.exampleUuid")}</li>
          </ul>
        </div>
      </section>

      <section className={`${adminCardMuted} p-5`}>
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{m("opsPage.emptyActionsTitle")}</p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link
            href="/admin/usuarios"
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg border border-[#1E4A7A] bg-[#1E4A7A] px-4 py-3 text-sm font-semibold text-white hover:bg-[#173A61] sm:min-h-[42px]"
          >
            {m("opsPage.emptyOpenUsers")}
          </Link>
          <AdminDashboardCta href="/admin/leads/inbox" label={m("opsPage.emptyOpenLeads")} variant="primary" />
          <AdminDashboardCta href="/admin/workspace/clasificados?status=flagged#queue" label={m("opsPage.emptyOpenClasificados")} variant="view" />
          <AdminDashboardCta href="/admin/reportes" label={m("opsPage.emptyOpenReports")} variant="neutral" />
          <AdminDashboardCta href="/admin/tienda/orders" label={m("opsPage.emptyOpenTienda")} variant="active" />
        </div>
      </section>

      <section className={`${adminCardBase} border-dashed border-[#C9B46A]/50 bg-[#FFFCF7]/90 p-4 text-xs leading-relaxed text-[#5C5346]`}>
        <p className="font-bold text-[#1E1810]">{m("opsPage.rolesTitle")}</p>
        <ul className="mt-2 space-y-1.5">
          <li>{m("opsPage.roleDashboard")}</li>
          <li>{m("opsPage.roleLeads")}</li>
          <li>{m("opsPage.roleUsers")}</li>
          <li>{m("opsPage.roleOps")}</li>
        </ul>
      </section>
    </div>
  );
}
