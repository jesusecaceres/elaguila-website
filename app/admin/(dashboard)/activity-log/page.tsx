import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminCardBase, adminStubBadgeClass } from "../../_components/adminTheme";
import { fetchAdminAuditLogRecent, type AdminAuditLogRow } from "../../_lib/adminAuditLogServer";
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

export default async function AdminActivityLogPage() {
  const lang = await getAdminLang();
  const m = adminMessages(lang);
  const audit = await fetchAdminAuditLogRecent(80);

  const showLive = audit.mode === "live" && audit.rows.length > 0;
  const showEmptyLive = audit.mode === "empty";
  const showUnavailable = audit.mode === "unavailable";

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
          <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase text-sky-900">
            {m("activityLog.badgeEmptyTable")}
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

      <div className={`${adminCardBase} overflow-hidden`}>
        <div className="border-b border-[#E8DFD0]/80 bg-[#FFF8F0]/90 px-4 py-3 text-xs text-[#5C5346]">
          {showLive ? m("activityLog.bannerLive") : m("activityLog.bannerOther")}
        </div>
        <div className="overflow-x-auto">
          {displayRows.length === 0 && showEmptyLive ? (
            <p className="p-6 text-sm text-[#5C5346]">{m("activityLog.emptyLive")}</p>
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
