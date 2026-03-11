import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import { requireAdminCookie } from "@/app/lib/supabase/server";
import AdminReportsTable from "./AdminReportsTable";

type ReportRow = {
  id: string;
  listing_id: string;
  reporter_id: string | null;
  reason: string;
  created_at: string;
  status: string;
};

export default async function AdminReportesPage() {
  const cookieStore = await cookies();
  if (!requireAdminCookie(cookieStore)) {
    redirect("/admin/login");
  }

  const supabase = getAdminSupabase();
  const { data: reports, error } = await supabase
    .from("listing_reports")
    .select("id, listing_id, reporter_id, reason, created_at, status")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <main className="min-h-screen bg-black text-white">
      <header className="border-b border-white/10 py-6 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-semibold text-yellow-400">
            Reportes de anuncios
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Revisar y marcar reportes como revisados o descartados.
          </p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {error ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error.message}
          </div>
        ) : (
          <AdminReportsTable reports={(reports ?? []) as ReportRow[]} />
        )}
      </div>
    </main>
  );
}
