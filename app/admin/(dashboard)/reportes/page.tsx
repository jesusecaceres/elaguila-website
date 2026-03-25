import Link from "next/link";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import AdminReportsTable from "./AdminReportsTable";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminCardBase } from "../../_components/adminTheme";

export const dynamic = "force-dynamic";

type ReportRow = {
  id: string;
  listing_id: string;
  reporter_id: string | null;
  reason: string;
  created_at: string;
  status: string;
};

export default async function AdminReportesPage() {
  const supabase = getAdminSupabase();
  const { data: reports, error } = await supabase
    .from("listing_reports")
    .select("id, listing_id, reporter_id, reason, created_at, status")
    .order("created_at", { ascending: false })
    .limit(200);

  const list = (reports ?? []) as ReportRow[];
  const pending = list.filter((r) => r.status === "pending").length;
  const reviewed = list.filter((r) => r.status === "reviewed").length;
  const dismissed = list.filter((r) => r.status === "dismissed").length;

  return (
    <>
      <AdminPageHeader
        title="Reports & complaints"
        subtitle="listing_reports — approve workflow uses existing server actions."
        eyebrow="Trust & safety"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Pending", value: pending, tone: "rose" },
          { label: "Reviewed", value: reviewed, tone: "default" },
          { label: "Dismissed", value: dismissed, tone: "default" },
        ].map((x) => (
          <div key={x.label} className={`${adminCardBase} p-4`}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{x.label}</p>
            <p className="mt-2 text-2xl font-bold text-[#1E1810]">{x.value}</p>
          </div>
        ))}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error.message}</div>
      ) : (
        <AdminReportsTable reports={list} />
      )}

      <div className="mt-8">
        <Link href="/admin" className="text-sm font-semibold text-[#2A2620] underline">
          ← Dashboard
        </Link>
      </div>
    </>
  );
}
