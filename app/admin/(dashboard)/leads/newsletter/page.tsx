import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnSecondary, adminCardBase, adminTableWrap } from "@/app/admin/_components/adminTheme";
import { LEAD_LIST_DEFAULT_LIMIT, listNewsletterSubscribersForAdmin } from "@/app/admin/_lib/leonixLeadsData";

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

export default async function AdminNewsletterLeadsPage() {
  const list = await listNewsletterSubscribersForAdmin(LEAD_LIST_DEFAULT_LIMIT);

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Launch newsletter leads"
        subtitle="Read-only inbox for Coming Soon / newsletter signups stored in Supabase."
        helperText={`Showing newest ${LEAD_LIST_DEFAULT_LIMIT} of ${list.total} subscriber(s). Export includes all rows (up to 10,000).`}
      />

      <div className="flex flex-wrap gap-3">
        <Link href="/api/admin/leads/newsletter/export" className={adminBtnSecondary}>
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
          <strong>Could not load subscribers.</strong> {list.error}
        </div>
      ) : null}

      <div className={adminTableWrap}>
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-left text-sm">
            <thead className="border-b border-[#E8DFD0] bg-[#FAF7F2]/90 text-xs font-bold uppercase tracking-wide text-[#5C5346]">
              <tr>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">City</th>
                <th className="px-4 py-3">ZIP</th>
                <th className="px-4 py-3">Pref. lang</th>
                <th className="px-4 py-3">Interests</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Lang</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {list.rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-[#7A7164]">
                    No newsletter subscribers yet.
                  </td>
                </tr>
              ) : (
                list.rows.map((row) => (
                  <tr key={row.id} className="border-b border-[#F0E8D8]/90 bg-white/60">
                    <td className="px-4 py-3 text-xs text-[#5C5346] whitespace-nowrap">
                      {formatWhen(row.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium text-[#1E1810] break-all">{row.email}</td>
                    <td className="px-4 py-3 text-[#3D3629]">{clip(row.name, 48)}</td>
                    <td className="px-4 py-3 text-[#5C5346]">{clip(row.city, 32)}</td>
                    <td className="px-4 py-3 text-[#5C5346]">{clip(row.zip_code, 16)}</td>
                    <td className="px-4 py-3 text-xs">{row.preferred_language}</td>
                    <td className="px-4 py-3 text-xs text-[#5C5346] max-w-[200px]" title={row.interests}>
                      {clip(row.interests, 80)}
                    </td>
                    <td className="px-4 py-3 text-xs font-mono">{row.source}</td>
                    <td className="px-4 py-3 text-xs uppercase">{row.lang}</td>
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
