import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnSecondary, adminCardBase, adminTableWrap } from "@/app/admin/_components/adminTheme";
import { LEAD_LIST_DEFAULT_LIMIT, listMediaKitLeadsForAdmin } from "@/app/admin/_lib/leonixLeadsData";

export const dynamic = "force-dynamic";

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return "—";
    return d.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function clip(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t || "—";
  return `${t.slice(0, max)}…`;
}

export default async function AdminMediaKitLeadsPage() {
  const list = await listMediaKitLeadsForAdmin(LEAD_LIST_DEFAULT_LIMIT);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Media kit leads"
        subtitle="Read-only inbox for media kit requests from /media-kit."
        helperText={`Showing newest ${LEAD_LIST_DEFAULT_LIMIT} of ${list.total} lead(s). Export includes all rows (up to 10,000).`}
      />

      <div className="flex flex-wrap gap-3">
        <Link href="/api/admin/leads/media-kit/export" className={adminBtnSecondary}>
          Export CSV
        </Link>
      </div>

      {list.dataUnavailable ? (
        <div className={`${adminCardBase} border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}>
          <strong>Data unavailable.</strong> {list.dataUnavailableNote}
        </div>
      ) : null}

      {list.error && !list.dataUnavailable ? (
        <div className={`${adminCardBase} border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-950`}>
          <strong>Could not load leads.</strong> {list.error}
        </div>
      ) : null}

      <div className={adminTableWrap}>
        <div className="overflow-x-auto">
          <table className="min-w-[1000px] w-full text-left text-sm">
            <thead className="border-b border-[#E8DFD0] bg-[#FAF7F2]/90 text-xs font-bold uppercase tracking-wide text-[#5C5346]">
              <tr>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Business</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Lang</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.rows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-[#7A7164]">
                    No media kit leads yet.
                  </td>
                </tr>
              ) : (
                list.rows.map((row) => (
                  <tr key={row.id} className="border-b border-[#F0E8D8]/90 bg-white/60">
                    <td className="px-4 py-3 text-xs text-[#5C5346] whitespace-nowrap">
                      {formatWhen(row.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1E1810]">{clip(row.name, 48)}</td>
                    <td className="px-4 py-3 break-all text-[#3D3629]">{row.email}</td>
                    <td className="px-4 py-3 text-xs text-[#5C5346]">{clip(row.phone, 24)}</td>
                    <td className="px-4 py-3 text-[#5C5346]">{clip(row.business, 40)}</td>
                    <td className="px-4 py-3 text-xs text-[#5C5346] max-w-[240px]" title={row.message}>
                      {clip(row.message, 100)}
                    </td>
                    <td className="px-4 py-3 text-xs uppercase">{row.lang}</td>
                    <td className="px-4 py-3 text-xs font-mono">{row.source}</td>
                    <td className="px-4 py-3 text-xs font-semibold">{row.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
