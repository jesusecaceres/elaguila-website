import Link from "next/link";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import AdminReportsTable from "./AdminReportsTable";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminCardBase, adminInputClass, adminBtnSecondary } from "../../_components/adminTheme";

export const dynamic = "force-dynamic";

type ReportRow = {
  id: string;
  listing_id: string;
  reporter_id: string | null;
  reason: string;
  created_at: string;
  status: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(s: string): boolean {
  return UUID_RE.test(s.trim());
}

function escapeIlike(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/%/g, "\\%").replace(/_/g, "\\_");
}

type PageProps = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function AdminReportesPage(props: PageProps) {
  const sp = props.searchParams ? await props.searchParams : {};
  const qRaw = typeof sp.q === "string" ? sp.q.trim() : "";
  const safeIlike = escapeIlike(qRaw.toLowerCase());

  const supabase = getAdminSupabase();
  let query = supabase
    .from("listing_reports")
    .select("id, listing_id, reporter_id, reason, created_at, status")
    .order("created_at", { ascending: false })
    .limit(200);

  if (qRaw) {
    if (isUuid(qRaw)) {
      query = query.or(`id.eq.${qRaw},reporter_id.eq.${qRaw},listing_id.eq.${qRaw}`);
    } else {
      query = query.ilike("reason", `%${safeIlike}%`);
    }
  }

  const { data: reports, error } = await query;

  const list = (reports ?? []) as ReportRow[];
  const pending = list.filter((r) => r.status === "pending").length;
  const reviewed = list.filter((r) => r.status === "reviewed").length;
  const dismissed = list.filter((r) => r.status === "dismissed").length;
  const highlightId = qRaw && isUuid(qRaw) && list.some((r) => r.id === qRaw) ? qRaw : null;

  return (
    <>
      <AdminPageHeader
        title="Reports & complaints"
        subtitle="listing_reports — revisar o descartar desde la tabla (acciones reales en base)."
        eyebrow="Trust & safety"
        helperText={
          qRaw
            ? "Filtro activo: UUID busca por id de reporte, listing o reporter; texto busca en el motivo."
            : "Usa ?q= en la URL para acotar (también desde Ops o ficha de usuario)."
        }
      />

      <form method="get" className={`${adminCardBase} mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-end`}>
        <div className="min-w-[200px] flex-1">
          <label htmlFor="reportes-q" className="text-xs font-bold uppercase text-[#5C5346]">
            Buscar
          </label>
          <input
            id="reportes-q"
            name="q"
            defaultValue={qRaw}
            placeholder="UUID (reporte / listing / reporter) o texto en motivo…"
            className={`${adminInputClass} mt-1`}
          />
        </div>
        <button type="submit" className={`${adminBtnSecondary} min-h-[44px] sm:min-h-0`}>
          Aplicar
        </button>
        {qRaw ? (
          <Link href="/admin/reportes" className={`${adminBtnSecondary} min-h-[44px] text-center sm:min-h-0`}>
            Limpiar
          </Link>
        ) : null}
      </form>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Pending", value: pending, tone: "rose" },
          { label: "Reviewed", value: reviewed, tone: "default" },
          { label: "Dismissed", value: dismissed, tone: "default" },
        ].map((x) => (
          <div key={x.label} className={`${adminCardBase} p-4`}>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#7A7164]">{x.label}</p>
            <p className="mt-2 text-2xl font-bold text-[#1E1810]">{x.value}</p>
            {qRaw ? (
              <p className="mt-1 text-[10px] text-[#9A9084]">Sobre resultados filtrados</p>
            ) : null}
          </div>
        ))}
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error.message}</div>
      ) : (
        <AdminReportsTable reports={list} highlightReportId={highlightId} />
      )}

      <div className="mt-8">
        <Link href="/admin" className="text-sm font-semibold text-[#2A2620] underline">
          ← Dashboard
        </Link>
      </div>
    </>
  );
}
