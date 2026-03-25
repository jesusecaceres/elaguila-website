import Link from "next/link";
import { AdminPageHeader } from "../_components/AdminPageHeader";
import { AdminQuickActionsRail } from "../_components/AdminQuickActionsRail";
import { AdminSectionCard } from "../_components/AdminSectionCard";
import { AdminStatCard } from "../_components/AdminStatCard";
import { adminCardBase } from "../_components/adminTheme";
import { getAdminDashboardSnapshot } from "../_lib/adminDashboardData";
import { getClasificadosCategoryRegistry, summarizeRegistryForDashboard } from "../_lib/clasificadosCategoryRegistry";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const snap = await getAdminDashboardSnapshot();
  const registry = getClasificadosCategoryRegistry();
  const regSum = summarizeRegistryForDashboard(registry);

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
      <div className="min-w-0">
        <AdminPageHeader
          title="Leonix Dashboard"
          subtitle="Welcome back — here’s what’s happening today in operations."
        />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            title="Pending ads review"
            value={snap.pendingListingsReview}
            hint={snap.listingsQueryFallback ? "Count may need DB status alignment." : "Listings in pending/flagged review."}
            icon="📣"
            actionLabel="Review ads"
            actionHref="/admin/clasificados"
            accent="rose"
          />
          <AdminStatCard
            title="Users needing help (proxy)"
            value={snap.usersNeedingHelpProxy}
            hint={snap.usersNeedingHelpNote}
            icon="🆘"
            actionLabel="View users"
            actionHref="/admin/usuarios"
          />
          <AdminStatCard
            title="Magazine (featured)"
            value={snap.magazineFeaturedLabel ?? "—"}
            hint={snap.magazineUpdated ? `Manifest updated: ${snap.magazineUpdated}` : "From public/magazine/editions.json"}
            icon="📰"
            actionLabel="Manage magazines"
            actionHref="/admin/magazine"
          />
          <AdminStatCard
            title="Reports / complaints"
            value={snap.pendingReports}
            hint="Pending rows in listing_reports"
            icon="⚠️"
            actionLabel="View reports"
            actionHref="/admin/reportes"
            accent="amber"
          />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <AdminSectionCard
            title="Expiring & moderation queue"
            subtitle={snap.expiringNote}
          >
            <ul className="space-y-3">
              {snap.recentQueueItems.length === 0 ? (
                <li className="text-sm text-[#5C5346]/90">No listings loaded.</li>
              ) : (
                snap.recentQueueItems.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#1E1810]">{row.title ?? "—"}</p>
                      <p className="text-xs text-[#7A7164]">
                        {row.category ?? "—"} · {row.status ?? "—"}
                      </p>
                    </div>
                    <Link
                      href={`/clasificados/anuncio/${row.id}`}
                      target="_blank"
                      className="shrink-0 text-xs font-bold text-[#6B5B2E] underline"
                    >
                      Open
                    </Link>
                  </li>
                ))
              )}
            </ul>
          </AdminSectionCard>

          <AdminSectionCard title="Ads pending review" subtitle="Newest items in pending/flagged or recent fallback.">
            <ul className="space-y-3">
              {snap.pendingReviewItems.map((row) => (
                <li
                  key={row.id}
                  className="rounded-2xl border border-[#E8DFD0]/80 bg-white/90 px-3 py-2 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-[#1E1810]">{row.title ?? "—"}</span>
                    <span className="rounded-full bg-[#FBF7EF] px-2 py-0.5 text-[10px] font-bold uppercase text-[#5C4E2E]">
                      {row.status ?? "—"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {row.owner_id ? (
                      <Link
                        href={`/admin/usuarios/${row.owner_id}`}
                        className="rounded-xl border border-[#E8DFD0] bg-[#FAF7F2] px-2 py-1 text-xs font-semibold text-[#2C2416]"
                      >
                        Owner
                      </Link>
                    ) : null}
                    <Link
                      href={`/clasificados/anuncio/${row.id}`}
                      target="_blank"
                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-900"
                    >
                      View live
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </AdminSectionCard>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <AdminSectionCard
            title="Categories (registry)"
            subtitle={`Live: ${regSum.live} · Staged: ${regSum.staged} · Coming soon: ${regSum.comingSoon}`}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {registry.slice(0, 8).map((c) => (
                <div key={c.slug} className={`${adminCardBase} p-4`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xl">{c.emoji}</span>
                    <span className="rounded-full bg-[#FBF7EF] px-2 py-0.5 text-[10px] font-bold uppercase text-[#5C4E2E]">
                      {c.operationalStatus}
                    </span>
                  </div>
                  <p className="mt-2 font-bold text-[#1E1810]">{c.displayNameEs}</p>
                  <p className="text-xs text-[#7A7164]">{c.slug}</p>
                </div>
              ))}
            </div>
            <Link href="/admin/categories" className="mt-4 inline-flex text-sm font-bold text-[#2A2620] underline">
              Manage categories →
            </Link>
          </AdminSectionCard>

          <AdminSectionCard
            title="Latest magazine activity"
            subtitle="Manifest-driven; admin actions stubbed until storage wiring."
          >
            <div className={`${adminCardBase} p-4`}>
              <p className="text-sm font-semibold text-[#1E1810]">{snap.magazineFeaturedLabel ?? "No featured issue"}</p>
              <p className="mt-1 text-xs text-[#7A7164]">
                Stats: not tracked in DB yet — use public analytics later.
              </p>
              <p className="mt-3 text-xs text-[#5C5346]/90">
                Admin activity feed: use Activity Log when audit table exists. Placeholder entries only.
              </p>
              <Link href="/admin/magazine" className="mt-3 inline-flex text-sm font-bold text-[#6B5B2E] underline">
                Open magazine ops →
              </Link>
            </div>
          </AdminSectionCard>
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-[#C9B46A]/50 bg-[#FFF8F0]/80 p-4 text-xs text-[#7A7164]">
          <strong className="text-[#5C5346]">Data honesty:</strong> Pending counts use live Supabase where columns exist. “Users
          needing help” is a disabled-account proxy until a support queue exists. Expiring ads require duration fields —
          see queue subtitle.
        </div>
      </div>

      <aside className="mt-10 lg:mt-0">
        <div className="sticky top-24 rounded-3xl border border-[#E8DFD0]/90 bg-[#FFF8F0]/95 p-5 shadow-inner">
          <AdminQuickActionsRail />
        </div>
      </aside>
    </div>
  );
}
