import Link from "next/link";
import { AdminPageHeader } from "../_components/AdminPageHeader";
import { AdminQuickActionsRail } from "../_components/AdminQuickActionsRail";
import { AdminSectionCard } from "../_components/AdminSectionCard";
import { AdminStatCard } from "../_components/AdminStatCard";
import { adminCardBase, adminCtaChip, adminCtaChipSecondary } from "../_components/adminTheme";
import { getAdminDashboardSnapshot } from "../_lib/adminDashboardData";
import { getClasificadosCategoryRegistryMerged, summarizeRegistryForDashboard } from "../_lib/clasificadosCategoryRegistry";
import { AdminTiendaOrderStatusBadge } from "../_components/tienda/AdminTiendaOrderStatusBadge";
import { tiendaOrderFlowLabel } from "../_lib/tiendaOrderFlowLabel";
import { getAdminTiendaDashboardCounts, getRecentTiendaOrdersPreview } from "../_lib/tiendaOrdersData";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const [snap, tiendaDash, tiendaRecent, registry] = await Promise.all([
    getAdminDashboardSnapshot(),
    getAdminTiendaDashboardCounts(),
    getRecentTiendaOrdersPreview(6),
    getClasificadosCategoryRegistryMerged(),
  ]);
  const regSum = summarizeRegistryForDashboard(registry);

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
      <div className="min-w-0">
        <AdminPageHeader
          title="Leonix Dashboard"
          subtitle="Welcome back — here’s what’s happening today in operations."
          helperText="La barra lateral es administración global. Para editar secciones del sitio (home, clasificados, tienda…), abre Website sections abajo o en el pie del menú."
        />

        <div className="mb-6 rounded-2xl border border-[#C9B46A]/35 bg-[#FFFCF7]/95 p-4 text-sm text-[#5C5346] sm:p-5">
          <p className="text-base font-bold text-[#1E1810]">Website editing (sections)</p>
          <p className="mt-1.5 text-xs leading-relaxed text-[#7A7164]">
            Public pages are grouped under workspaces — not the same links as the live site menu. Global toggles that cross many pages live in site-wide settings.
          </p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-stretch sm:gap-3">
            <Link
              href="/admin/workspace"
              className={`${adminCtaChip} w-full justify-center sm:w-auto`}
              title="Workspaces de contenido público (home, clasificados, tienda, revista…)"
            >
              Website sections →
            </Link>
            <Link
              href="/admin/site-settings"
              className={`${adminCtaChip} w-full justify-center sm:w-auto`}
              title="Avisos globales, toggles y contenido que cruza varias páginas"
            >
              Ajustes globales del sitio →
            </Link>
            <Link
              href="/admin/ops"
              className={`${adminCtaChip} w-full justify-center sm:w-auto`}
              title="Buscar cuenta, anuncios, pedidos Tienda y reportes en una sola búsqueda"
            >
              Customer ops search →
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          <AdminStatCard
            title="Tienda — new orders"
            value={tiendaDash.dataUnavailable ? "—" : tiendaDash.newOrders}
            hint={
              tiendaDash.dataUnavailable
                ? tiendaDash.dataUnavailableNote ?? "Run migrations for tienda_orders."
                : "Self-serve print / business card submissions."
            }
            icon="🛒"
            actionLabel="Open Tienda inbox"
            actionHref="/admin/tienda/orders"
            actionTitle="Abre la bandeja de pedidos de impresión / self-serve (tienda_orders)"
            accent="amber"
          />
          <AdminStatCard
            title="Tienda — unread"
            value={tiendaDash.dataUnavailable ? "—" : tiendaDash.unreadCount}
            hint="Orders not yet marked read by staff."
            icon="✉️"
            actionLabel="Unread inbox"
            actionHref="/admin/tienda/orders?unread=1"
            actionTitle="Solo pedidos marcados como no leídos por el equipo"
          />
          <AdminStatCard
            title="Tienda — ready to fulfill"
            value={tiendaDash.dataUnavailable ? "—" : tiendaDash.readyToFulfill}
            hint="Orders in ready_to_fulfill status."
            icon="📦"
            actionLabel="View inbox"
            actionHref="/admin/tienda/orders?status=ready_to_fulfill"
            actionTitle="Pedidos listos para producción / cumplimiento"
          />
          <AdminStatCard
            title="Tienda — in review"
            value={tiendaDash.dataUnavailable ? "—" : tiendaDash.inReview}
            hint="Staff marked as reviewing."
            icon="🔍"
            actionLabel="Filter reviewing"
            actionHref="/admin/tienda/orders?status=reviewing"
            actionTitle="Pedidos en revisión de arte o especificaciones"
          />
          <AdminStatCard
            title="Tienda — total"
            value={tiendaDash.dataUnavailable ? "—" : tiendaDash.totalOrders}
            hint={`Unread (new to staff): ${tiendaDash.dataUnavailable ? "—" : tiendaDash.unreadCount}`}
            icon="∑"
            actionLabel="All Tienda orders"
            actionHref="/admin/tienda/orders"
            actionTitle="Bandeja completa de pedidos Tienda"
          />
        </div>

        <div className="mt-8">
          <AdminSectionCard
            title="Recent Tienda orders"
            subtitle="Newest persisted submissions — Supabase-backed inbox (not email)."
          >
            <ul className="space-y-3">
              {tiendaRecent.length === 0 ? (
                <li className="text-sm text-[#5C5346]/90">
                  {tiendaDash.dataUnavailable
                    ? "Tienda table unavailable or no rows yet."
                    : "No Tienda orders yet."}
                </li>
              ) : (
                tiendaRecent.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 truncate font-semibold font-mono text-[#1E1810]">
                        {row.order_ref}
                        {row.unread_admin ? (
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-900">
                            Unread
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-[#7A7164]">
                        {row.customer_name} · {row.product_slug}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <AdminTiendaOrderStatusBadge status={row.status} />
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#9A9084]">
                          {tiendaOrderFlowLabel(row.order_payload)}
                        </span>
                      </div>
                    </div>
                    <Link
                      href={`/admin/tienda/orders/${row.id}`}
                      className="shrink-0 text-xs font-bold text-[#6B5B2E] underline"
                      title="Abrir detalle del pedido, archivos y estado de cumplimiento"
                    >
                      Ver pedido
                    </Link>
                  </li>
                ))
              )}
            </ul>
            <Link href="/admin/tienda/orders" className={`${adminCtaChipSecondary} mt-4 inline-flex`}>
              Full Tienda inbox →
            </Link>
          </AdminSectionCard>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            title="Pending ads review"
            value={snap.pendingListingsReview}
            hint={snap.listingsQueryFallback ? "Count may need DB status alignment." : "Listings in pending/flagged review."}
            icon="📣"
            actionLabel="Review ads"
            actionHref="/admin/workspace/clasificados"
            actionTitle="Cola administrativa de anuncios Clasificados (moderación)"
            accent="rose"
          />
          <AdminStatCard
            title="Users needing help (proxy)"
            value={snap.usersNeedingHelpProxy}
            hint={snap.usersNeedingHelpNote}
            icon="🆘"
            actionLabel="View users"
            actionHref="/admin/usuarios"
            actionTitle="Lista de perfiles (búsqueda y ficha de cliente)"
          />
          <AdminStatCard
            title="Magazine (featured)"
            value={snap.magazineFeaturedLabel ?? "—"}
            hint={
              snap.magazineUpdated
                ? `Última actualización en manifiesto: ${snap.magazineUpdated}`
                : "Resuelto vía API (DB si hay números publicados; si no, editions.json)."
            }
            icon="📰"
            actionLabel="Manage magazines"
            actionHref="/admin/workspace/revista"
            actionTitle="Números de revista, PDF/flipbook y número actual en portada"
          />
          <AdminStatCard
            title="Reports / complaints"
            value={snap.pendingReports}
            hint="Pending rows in listing_reports"
            icon="⚠️"
            actionLabel="View reports"
            actionHref="/admin/reportes"
            actionTitle="Cola de reportes de anuncios (listing_reports)"
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
                      rel="noopener noreferrer"
                      className="shrink-0 text-xs font-bold text-[#6B5B2E] underline"
                      title="Abre el anuncio en el sitio público (nueva pestaña)"
                    >
                      Ver público
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
                        title="Ficha del vendedor en Leonix admin"
                      >
                        Ficha vendedor
                      </Link>
                    ) : null}
                    <Link
                      href={`/clasificados/anuncio/${row.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-900"
                      title="Vista pública del anuncio (nueva pestaña)"
                    >
                      Ver público
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
            subtitle={`Efectivo en admin (código + overlay Supabase): live ${regSum.live} · staged ${regSum.staged} · coming soon ${regSum.comingSoon}. Público aún usa código hasta integración.`}
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {registry.slice(0, 8).map((c) => (
                <div key={c.slug} className={`${adminCardBase} p-4`}>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xl">{c.emoji}</span>
                    <div className="flex flex-col items-end gap-1">
                      <span className="rounded-full bg-[#FBF7EF] px-2 py-0.5 text-[10px] font-bold uppercase text-[#5C4E2E]">
                        {c.operationalStatus}
                      </span>
                      {c.configLayer === "database" ? (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[9px] font-bold uppercase text-emerald-900">
                          DB
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-2 font-bold text-[#1E1810]">{c.displayNameEs}</p>
                  <p className="text-xs text-[#7A7164]">{c.slug}</p>
                </div>
              ))}
            </div>
            <Link href="/admin/categories" className={`${adminCtaChipSecondary} mt-4 inline-flex`}>
              Manage categories →
            </Link>
          </AdminSectionCard>

          <AdminSectionCard
            title="Revista — número destacado"
            subtitle="El hub /magazine lee el manifiesto público (prioridad: números en Supabase; respaldo editions.json)."
          >
            <div className={`${adminCardBase} p-4`}>
              <p className="text-sm font-semibold text-[#1E1810]">{snap.magazineFeaturedLabel ?? "Sin número destacado"}</p>
              <p className="mt-1 text-xs text-[#7A7164]">
                {snap.magazineUpdated ? `Actualizado: ${snap.magazineUpdated}` : "Sin fecha en manifiesto."}
              </p>
              <p className="mt-3 text-xs text-[#5C5346]/90">
                Métricas de lectura no están en este panel; usa analítica del sitio cuando aplique.
              </p>
              <Link href="/admin/workspace/revista" className={`${adminCtaChipSecondary} mt-3 inline-flex`}>
                Gestionar números →
              </Link>
            </div>
          </AdminSectionCard>
        </div>

        <div className="mt-8 rounded-2xl border border-dashed border-[#C9B46A]/50 bg-[#FFF8F0]/80 p-4 text-xs text-[#7A7164]">
          <strong className="text-[#5C5346]">Data honesty:</strong> Pending counts use live Supabase where columns exist. “Users
          needing help” is a disabled-account proxy until a support queue exists. Expiring ads require duration fields —
          see queue subtitle. Tienda dashboard counts need{" "}
          <code className="rounded bg-white/80 px-1">tienda_orders</code> migration applied.
        </div>
      </div>

      <aside className="mt-10 min-w-0 lg:mt-0">
        <div className="rounded-3xl border border-[#E8DFD0]/90 bg-[#FFF8F0]/95 p-4 shadow-inner sm:p-5 lg:sticky lg:top-32 lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto">
          <AdminQuickActionsRail />
        </div>
      </aside>
    </div>
  );
}
