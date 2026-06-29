import Link from "next/link";
import { getAdminSupabase } from "@/app/lib/supabase/server";
import AdminReportsTable from "./AdminReportsTable";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { AdminPagePurposeCard } from "../../_components/AdminPagePurposeCard";
import { adminCardBase, adminInputClass, adminBtnSecondary } from "../../_components/adminTheme";
import { adminMessages, getAdminLang } from "../../_lib/adminI18n";

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

/** Ring-highlight a row when ?q= is report id, or a single listing/reporter match, or first of several. */
function resolveHighlightReportId(qRaw: string, list: ReportRow[]): string | null {
  if (!qRaw || !isUuid(qRaw) || list.length === 0) return null;
  const q = qRaw.trim();
  if (list.some((r) => r.id === q)) return q;
  const byListing = list.filter((r) => r.listing_id === q);
  const byReporter = list.filter((r) => r.reporter_id === q);
  if (byListing.length === 1) return byListing[0].id;
  if (byReporter.length === 1) return byReporter[0].id;
  if (byListing.length > 0) return byListing[0].id;
  if (byReporter.length > 0) return byReporter[0].id;
  return null;
}

type PageProps = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function AdminReportesPage(props: PageProps) {
  const lang = await getAdminLang();
  const m = adminMessages(lang);
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
  const highlightId = resolveHighlightReportId(qRaw, list);

  return (
    <>
      <AdminPageHeader
        title="Reports & complaints"
        subtitle={m("reportsPage.subtitle")}
        eyebrow="Trust & safety"
        helperText={qRaw ? m("reportsPage.helperFiltered") : m("reportsPage.helperDefault")}
      />
      <AdminPagePurposeCard
        title="Reports & complaints"
        purpose="Inspect user-submitted listing reports and complaint signals without implying moderation actions are complete."
        dataSource="public.listing_reports joined operationally with listing and owner context from admin tools."
        status="partial"
        safeActions={["Search reports", "Open related listing/user", "Review report rows"]}
        nextGate="ADMIN-ACTION-QA-AND-LIVE-SCHEMA-PROOF-01"
        warningNote="Mark reviewed, clear flag, and resolution workflow need action QA before they are treated as complete."
      />

      <form method="get" className={`${adminCardBase} mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-end`}>
        <div className="min-w-[200px] flex-1">
          <label htmlFor="admin-reports-q" className="text-xs font-bold uppercase text-[#5C5346]">
            {m("reportsPage.searchLabel")}
          </label>
          <input
            id="admin-reports-q"
            name="q"
            defaultValue={qRaw}
            placeholder={m("reportsPage.searchPlaceholder")}
            className={`${adminInputClass} mt-1`}
            aria-describedby="admin-reports-search-hint"
            autoComplete="off"
          />
          <p id="admin-reports-search-hint" className="mt-1 text-[10px] leading-snug text-[#7A7164]">
            {m("reportsPage.searchHint")}
          </p>
        </div>
        <button
          type="submit"
          className={`${adminBtnSecondary} min-h-[44px] sm:min-h-0`}
          title={m("reportsPage.applyTitle")}
        >
          {m("reportsPage.apply")}
        </button>
        {qRaw ? (
          <Link
            href="/admin/reportes"
            className={`${adminBtnSecondary} min-h-[44px] text-center sm:min-h-0`}
            title={m("reportsPage.clearTitle")}
          >
            {m("reportsPage.clear")}
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
              <p className="mt-1 text-[10px] text-[#9A9084]">{m("reportsPage.filteredNote")}</p>
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
