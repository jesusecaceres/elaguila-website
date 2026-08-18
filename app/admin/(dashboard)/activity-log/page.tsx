import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import { getCurrentAdminAccessContext, requireActivityLogAccess } from "@/app/admin/_lib/adminAccessControl";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminCardBase, adminStubBadgeClass } from "../../_components/adminTheme";
import { fetchAdminAuditLogFiltered, type AdminAuditLogRow } from "../../_lib/adminAuditLogServer";
import { adminMessages, getAdminLang } from "../../_lib/adminI18n";

export const dynamic = "force-dynamic";

function summarizeMeta(meta: Record<string, unknown>): string {
  try {
    const s = JSON.stringify(meta);
    return s.length > 120 ? `${s.slice(0, 117)}…` : s;
  } catch {
    return "—";
  }
}

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(v: string | string[] | undefined): string {
  return typeof v === "string" ? v : Array.isArray(v) ? (v[0] ?? "") : "";
}

export default async function AdminActivityLogPage(props: PageProps) {
  const cookieStore = await cookies();
  if (!requireAdminCookie(cookieStore)) redirect("/admin/login");
  const access = await getCurrentAdminAccessContext();
  requireActivityLogAccess(access);

  const lang = await getAdminLang();
  const m = adminMessages(lang);

  // Package E Build E3, Gate 3 — narrow, truthful filters over the SAME admin_audit_log reader
  // (no actor filter: the schema has no actor column anywhere, so one is not offered).
  const sp = props.searchParams ? await props.searchParams : {};
  const actionFilter = firstParam(sp.action).trim();
  const targetTypeFilter = firstParam(sp.targetType).trim();
  const targetIdFilter = firstParam(sp.targetId).trim();

  const audit = await fetchAdminAuditLogFiltered({
    action: actionFilter || undefined,
    targetType: targetTypeFilter || undefined,
    targetId: targetIdFilter || undefined,
    limit: 80,
  });

  const showLive = audit.mode === "live" && audit.rows.length > 0;
  const showEmptyLive = audit.mode === "empty";
  const showUnavailable = audit.mode === "unavailable";
  const hasFilters = Boolean(actionFilter || targetTypeFilter || targetIdFilter);

  const displayRows: Array<{
    id: string;
    createdAt: string;
    actor: string;
    action: string;
    targetType: string;
    targetId: string;
    summary: string;
  }> = showLive
    ? audit.rows.map((r: AdminAuditLogRow) => ({
        id: r.id,
        createdAt: r.created_at,
        actor: "server",
        action: r.action,
        targetType: r.target_type ?? "—",
        targetId: r.target_id ?? "—",
        summary: summarizeMeta((r.meta as Record<string, unknown>) ?? {}),
      }))
    : [];

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {showLive ? (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-900">
            {m("activityLog.badgeLive")}
          </span>
        ) : showEmptyLive ? (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase text-amber-900">
            {hasFilters ? "No matching events" : m("activityLog.badgeEmptyTable")}
          </span>
        ) : showUnavailable ? (
          <span className={adminStubBadgeClass}>{m("activityLog.badgeUnavailable")}</span>
        ) : (
          <span className={adminStubBadgeClass}>{m("activityLog.badgeNoEvents")}</span>
        )}
      </div>
      <AdminPageHeader
        title="Activity log"
        subtitle={
          showLive
            ? m("activityLog.subtitleLive")
            : showEmptyLive
              ? m("activityLog.subtitleEmpty")
              : showUnavailable
                ? m("activityLog.subtitleUnavailable")
                : m("activityLog.subtitleUnknown")
        }
        helperText={
          audit.detail ? `${m("activityLog.detailPrefix")} ${audit.detail}` : m("activityLog.helperNoSecrets")
        }
      />

      <form method="get" className={`${adminCardBase} mb-4 flex flex-wrap items-end gap-3 p-4`}>
        <label className="flex flex-col gap-1 text-xs font-semibold text-[#5C5346]">
          Action
          <input
            type="text"
            name="action"
            defaultValue={actionFilter}
            placeholder="e.g. client_account_updated"
            className="rounded-lg border border-[#E8DFD0] bg-white px-2.5 py-1.5 text-xs"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-[#5C5346]">
          Target type
          <input
            type="text"
            name="targetType"
            defaultValue={targetTypeFilter}
            placeholder="e.g. profiles"
            className="rounded-lg border border-[#E8DFD0] bg-white px-2.5 py-1.5 text-xs"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-[#5C5346]">
          Target / entity id
          <input
            type="text"
            name="targetId"
            defaultValue={targetIdFilter}
            placeholder="uuid"
            className="rounded-lg border border-[#E8DFD0] bg-white px-2.5 py-1.5 text-xs"
          />
        </label>
        <button type="submit" className="rounded-lg bg-[#2A2620] px-3 py-2 text-xs font-bold text-white">
          Filter
        </button>
        {hasFilters ? (
          <a href="/admin/activity-log" className="text-xs font-semibold text-[#6B5B2E] underline">
            Clear filters
          </a>
        ) : null}
        <p className="w-full text-[10px] text-[#7A7164]">
          No actor/operator filter — the audit table does not record who performed each action (a
          confirmed schema gap, not hidden here).
        </p>
      </form>

      <div className={`${adminCardBase} overflow-hidden`}>
        <div className="border-b border-[#E8DFD0]/80 bg-[#FFF8F0]/90 px-4 py-3 text-xs text-[#5C5346]">
          {showLive ? m("activityLog.bannerLive") : m("activityLog.bannerOther")}
        </div>
        <div className="overflow-x-auto">
          {displayRows.length === 0 && showEmptyLive ? (
            <p className="p-6 text-sm text-[#5C5346]">
              {hasFilters ? "No events matched these filters." : m("activityLog.emptyLive")}
            </p>
          ) : displayRows.length === 0 && showUnavailable ? (
            <p className="p-6 text-sm text-[#5C5346]">
              {m("activityLog.unavailableP1")}{" "}
              <code className="rounded bg-white/80 px-1">listing_audit_event</code> {m("activityLog.unavailableP2")}
            </p>
          ) : (
            <table className="min-w-full border-collapse text-sm">
              <thead className="bg-[#FBF7EF]/90 text-left text-xs font-bold uppercase tracking-wide text-[#7A7164]">
                <tr>
                  <th className="p-3">Time</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Id</th>
                  <th className="p-3">Summary</th>
                </tr>
              </thead>
              <tbody>
                {displayRows.map((r) => (
                  <tr key={r.id} className="border-t border-[#E8DFD0]/80">
                    <td className="whitespace-nowrap p-3 text-xs text-[#5C5346]">{new Date(r.createdAt).toLocaleString()}</td>
                    <td className="p-3 font-medium text-[#1E1810]">{r.actor}</td>
                    <td className="p-3 font-mono text-xs">{r.action}</td>
                    <td className="p-3 text-xs">{r.targetType}</td>
                    <td className="p-3 font-mono text-xs">{r.targetId}</td>
                    <td className="max-w-md p-3 text-xs text-[#5C5346]/95">{r.summary}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
