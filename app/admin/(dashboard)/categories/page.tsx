import Link from "next/link";
import { AdminPageHeader } from "../../_components/AdminPageHeader";
import { adminCardBase, adminReadOnlyBadgeClass } from "../../_components/adminTheme";
import { getClasificadosCategoryRegistry, summarizeRegistryForDashboard } from "../../_lib/clasificadosCategoryRegistry";
import { fetchListingStatsForCategorySlugs } from "../../_lib/adminCategoryListingStats";

export const dynamic = "force-dynamic";

function statusStyle(s: string) {
  switch (s) {
    case "live":
      return "bg-emerald-100 text-emerald-900";
    case "staged":
      return "bg-amber-100 text-amber-900";
    case "coming_soon":
      return "bg-sky-100 text-sky-900";
    case "hidden":
      return "bg-neutral-200 text-neutral-800";
    default:
      return "bg-[#FBF7EF] text-[#5C4E2E]";
  }
}

function readinessStyle(r: string) {
  if (r === "full") return "text-emerald-800";
  if (r === "partial") return "text-amber-800";
  return "text-[#7A7164]";
}

export default async function AdminCategoriesPage() {
  const registry = getClasificadosCategoryRegistry();
  const sum = summarizeRegistryForDashboard(registry);
  const statsRows = await fetchListingStatsForCategorySlugs(registry.map((c) => c.slug));
  const statsBySlug = Object.fromEntries(statsRows.map((s) => [s.slug, s]));

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        <span className={adminReadOnlyBadgeClass}>Registry: code (overlays)</span>
        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase text-emerald-900">
          Live DB counts
        </span>
      </div>
      <AdminPageHeader
        title="Categories — operations"
        subtitle="Registry rows are still defined in code (`categoryConfig`). Listing counts below are live from Supabase — use them to see volume and queue pressure per vertical."
        helperText="Persisted category toggles/order belong in a future `site_category_config` (or similar). Until then, this page is the honest mix: code truth for go-live posture, DB truth for inventory."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className={`${adminCardBase} p-4`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">Live (registry)</p>
          <p className="mt-1 text-2xl font-bold text-[#1E1810]">{sum.live}</p>
        </div>
        <div className={`${adminCardBase} p-4`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">Staged</p>
          <p className="mt-1 text-2xl font-bold text-[#1E1810]">{sum.staged}</p>
        </div>
        <div className={`${adminCardBase} p-4`}>
          <p className="text-xs font-bold uppercase text-[#7A7164]">Coming soon</p>
          <p className="mt-1 text-2xl font-bold text-[#1E1810]">{sum.comingSoon}</p>
        </div>
      </div>

      <div className={`${adminCardBase} mb-6 space-y-2 p-4 text-sm text-[#5C5346]`}>
        <p className="font-semibold text-[#1E1810]">Operational shortcuts</p>
        <div className="flex flex-wrap gap-3 text-xs font-bold">
          <Link href="/admin/workspace/clasificados" className="text-[#6B5B2E] underline">
            Clasificados workspace →
          </Link>
          <Link href="/admin/reportes" className="text-[#6B5B2E] underline">
            Reports queue →
          </Link>
          <Link href="/admin/ops" className="text-[#6B5B2E] underline">
            Customer ops search →
          </Link>
        </div>
      </div>

      <div className={`${adminCardBase} overflow-hidden`}>
        <div className="border-b border-[#E8DFD0]/80 bg-[#FFFCF7]/90 px-4 py-3 text-xs text-[#5C5346]">
          Counts = `listings` rows where <code className="rounded bg-white/80 px-1">category</code> matches the slug. Pending/flagged = same filter + status in pending/flagged.
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-[#FBF7EF]/90 text-left text-xs font-bold uppercase tracking-wide text-[#7A7164]">
              <tr>
                <th className="p-3"> </th>
                <th className="p-3">Slug</th>
                <th className="p-3">Display (ES)</th>
                <th className="p-3">Status</th>
                <th className="p-3">Readiness</th>
                <th className="p-3 whitespace-nowrap">Listings (DB)</th>
                <th className="p-3 whitespace-nowrap">Pending / flagged</th>
                <th className="p-3">Moderation</th>
                <th className="p-3">Landing</th>
                <th className="p-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {registry.map((c) => {
                const st = statsBySlug[c.slug];
                return (
                  <tr key={c.slug} className="border-t border-[#E8DFD0]/80 align-top">
                    <td className="p-3 text-xl">{c.emoji}</td>
                    <td className="p-3 font-mono text-xs text-[#3D3428]">{c.slug}</td>
                    <td className="p-3 font-semibold text-[#1E1810]">{c.displayNameEs}</td>
                    <td className="p-3">
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${statusStyle(c.operationalStatus)}`}>
                        {c.operationalStatus.replace("_", " ")}
                      </span>
                    </td>
                    <td className={`p-3 text-xs font-semibold ${readinessStyle(c.readiness)}`}>{c.readiness}</td>
                    <td className="p-3 text-xs tabular-nums">
                      {st?.queryError ? (
                        <span title={st.queryError} className="text-amber-800">
                          —
                        </span>
                      ) : (
                        st?.totalListings ?? "—"
                      )}
                    </td>
                    <td className="p-3 text-xs tabular-nums">
                      {st?.queryError ? "—" : (st?.pendingOrFlagged ?? "—")}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/admin/workspace/clasificados?category=${encodeURIComponent(c.slug)}`}
                        className="text-xs font-bold text-[#6B5B2E] underline"
                        title="Open admin queue filtered by this category slug"
                      >
                        Queue →
                      </Link>
                    </td>
                    <td className="p-3">
                      <Link href={c.landingTarget} className="text-xs font-bold text-[#6B5B2E] underline" target="_blank">
                        {c.landingTarget}
                      </Link>
                    </td>
                    <td className="max-w-xs p-3 text-xs text-[#5C5346]/95">{c.notes}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-4 text-xs text-[#7A7164]">
        Sort order follows `categoryConfig` for now. Slugs absent from that config never appear here — add them in code first, then future Supabase overrides can extend this table.
      </p>
    </div>
  );
}
