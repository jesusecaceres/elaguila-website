import Link from "next/link";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import {
  adminCardBase,
  adminBtnSecondary,
  adminInputClass,
  adminReadOnlyBadgeClass,
  adminStubBadgeClass,
} from "../../_components/adminTheme";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { adminMessages, getAdminLang } from "../../_lib/adminI18n";

export const dynamic = "force-dynamic";

const TIENDA_STATUSES = [
  "new",
  "reviewing",
  "ready_to_fulfill",
  "ordered",
  "completed",
  "needs_customer_followup",
  "failed_submission",
] as const;

type TiendaAgg = {
  unavailable: boolean;
  total: number;
  byStatus: Record<string, number>;
  unreadAdmin: number;
  emailDeliveryFailed: number;
  approvalIncomplete: number;
};

async function fetchTiendaOrderAggregates(): Promise<TiendaAgg> {
  try {
    const supabase = getAdminSupabase();
    const [statusResults, unreadRes, emailFailRes, approvalRes] = await Promise.all([
      Promise.all(
        TIENDA_STATUSES.map((status) =>
          supabase.from("tienda_orders").select("id", { count: "exact", head: true }).eq("status", status)
        )
      ),
      supabase.from("tienda_orders").select("id", { count: "exact", head: true }).eq("unread_admin", true),
      supabase.from("tienda_orders").select("id", { count: "exact", head: true }).eq("email_delivery_status", "failed"),
      supabase.from("tienda_orders").select("id", { count: "exact", head: true }).eq("approval_complete", false),
    ]);
    const byStatus: Record<string, number> = {};
    let total = 0;
    for (let i = 0; i < TIENDA_STATUSES.length; i++) {
      const r = statusResults[i];
      if (r.error) {
        return {
          unavailable: true,
          total: 0,
          byStatus: {},
          unreadAdmin: 0,
          emailDeliveryFailed: 0,
          approvalIncomplete: 0,
        };
      }
      const c = typeof r.count === "number" ? r.count : 0;
      byStatus[TIENDA_STATUSES[i]] = c;
      total += c;
    }
    const count = (x: { count?: number | null; error?: unknown }) =>
      x.error ? null : typeof x.count === "number" ? x.count : 0;
    return {
      unavailable: false,
      total,
      byStatus,
      unreadAdmin: count(unreadRes) ?? 0,
      emailDeliveryFailed: count(emailFailRes) ?? 0,
      approvalIncomplete: count(approvalRes) ?? 0,
    };
  } catch {
    return {
      unavailable: true,
      total: 0,
      byStatus: {},
      unreadAdmin: 0,
      emailDeliveryFailed: 0,
      approvalIncomplete: 0,
    };
  }
}

export default async function AdminPaymentsPage() {
  const lang = await getAdminLang();
  const m = adminMessages(lang);
  const tienda = await fetchTiendaOrderAggregates();
  const pipeline =
    (tienda.byStatus.new ?? 0) +
    (tienda.byStatus.reviewing ?? 0) +
    (tienda.byStatus.ready_to_fulfill ?? 0) +
    (tienda.byStatus.ordered ?? 0);
  const stripeDashboardUrl = (process.env.STRIPE_DASHBOARD_URL ?? "").trim();

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {tienda.unavailable ? (
          <span className={adminStubBadgeClass}>{m("paymentsPage.badgeUnavailable")}</span>
        ) : (
          <span className={adminReadOnlyBadgeClass}>{m("paymentsPage.badgeMeta")}</span>
        )}
        <span className={adminStubBadgeClass}>{m("paymentsPage.badgePsp")}</span>
      </div>
      <AdminPageHeader title="Payments" subtitle={m("paymentsPage.subtitle")} helperText={m("paymentsPage.helperText")} />

      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950">
        {m("paymentsPage.pciBanner")}
      </div>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <div className={`${adminCardBase} p-5`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">{m("paymentsPage.cardTiendaRows")}</p>
          <p className="mt-2 text-3xl font-bold text-[#1E1810]">{tienda.unavailable ? "—" : tienda.total}</p>
          <p className="mt-1 text-xs text-[#7A7164]">
            <code className="rounded bg-[#FAF7F2] px-1">tienda_orders</code> — {m("paymentsPage.cardTiendaRowsBody")}
          </p>
          <Link href="/admin/tienda/orders" className={`${adminBtnSecondary} mt-3 inline-flex text-xs`}>
            {m("paymentsPage.openTiendaInbox")}
          </Link>
        </div>
        <div className={`${adminCardBase} p-5`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">{m("paymentsPage.cardPipeline")}</p>
          <p className="mt-2 text-3xl font-bold text-[#1E1810]">{tienda.unavailable ? "—" : pipeline}</p>
          <p className="mt-1 text-xs text-[#7A7164]">{m("paymentsPage.cardPipelineBody")}</p>
        </div>
        <div className={`${adminCardBase} p-5`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">{m("paymentsPage.cardAttention")}</p>
          <p className="mt-2 text-3xl font-bold text-[#1E1810]">
            {tienda.unavailable
              ? "—"
              : (tienda.byStatus.needs_customer_followup ?? 0) + (tienda.byStatus.failed_submission ?? 0)}
          </p>
          <p className="mt-1 text-xs text-[#7A7164]">{m("paymentsPage.cardAttentionBody")}</p>
        </div>
      </div>

      {!tienda.unavailable ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className={`${adminCardBase} p-5`}>
            <p className="text-xs font-bold uppercase text-[#7A7164]">{m("paymentsPage.cardUnread")}</p>
            <p className="mt-2 text-3xl font-bold text-[#1E1810]">{tienda.unreadAdmin}</p>
            <p className="mt-1 text-xs text-[#7A7164]">{m("paymentsPage.cardUnreadBody")}</p>
          </div>
          <div className={`${adminCardBase} p-5`}>
            <p className="text-xs font-bold uppercase text-[#7A7164]">{m("paymentsPage.cardEmailFailed")}</p>
            <p className="mt-2 text-3xl font-bold text-[#1E1810]">{tienda.emailDeliveryFailed}</p>
            <p className="mt-1 text-xs text-[#7A7164]">{m("paymentsPage.cardEmailFailedBody")}</p>
          </div>
          <div className={`${adminCardBase} p-5`}>
            <p className="text-xs font-bold uppercase text-[#7A7164]">{m("paymentsPage.cardApproval")}</p>
            <p className="mt-2 text-3xl font-bold text-[#1E1810]">{tienda.approvalIncomplete}</p>
            <p className="mt-1 text-xs text-[#7A7164]">{m("paymentsPage.cardApprovalBody")}</p>
          </div>
        </div>
      ) : null}

      {!tienda.unavailable ? (
        <div className={`${adminCardBase} mb-8 mt-6 p-5`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">{m("paymentsPage.statusBreakdown")}</p>
          <ul className="mt-3 grid gap-1 text-sm text-[#5C5346] sm:grid-cols-2">
            {TIENDA_STATUSES.map((s) => (
              <li key={s}>
                <span className="font-mono text-xs">{s}</span>:{" "}
                <strong className="text-[#1E1810]">{tienda.byStatus[s] ?? 0}</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className={`${adminCardBase} p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">{m("paymentsPage.futureTitle")}</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-[#7A7164]">
          <li>{m("paymentsPage.futureLi1")}</li>
          <li>{m("paymentsPage.futureLi2")}</li>
          <li>{m("paymentsPage.futureLi3")}</li>
        </ul>
        <p className="mt-3 text-xs text-[#7A7164]">
          {m("paymentsPage.futureFoot")}{" "}
          <Link href="/admin/tienda/orders" className="font-bold text-[#6B5B2E] underline">
            {m("paymentsPage.futureFootLink")}
          </Link>
          .
        </p>
      </div>

      <div className={`${adminCardBase} mt-6 p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">{m("paymentsPage.processorTitle")}</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          {m("paymentsPage.processorHintBefore")}{" "}
          <code className="rounded bg-[#FAF7F2] px-1">STRIPE_DASHBOARD_URL</code> {m("paymentsPage.processorHintAfter")}
        </p>
        {stripeDashboardUrl ? (
          <a
            href={stripeDashboardUrl}
            target="_blank"
            rel="noreferrer"
            className={`${adminBtnSecondary} mt-4 inline-flex`}
          >
            {m("paymentsPage.openStripe")}
          </a>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <input className={`${adminInputClass} max-w-md`} disabled placeholder="Configure STRIPE_DASHBOARD_URL" />
            <span className={`${adminStubBadgeClass} inline-flex`}>{m("paymentsPage.noStripeUrl")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
