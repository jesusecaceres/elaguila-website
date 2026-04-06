import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminBtnPrimary, adminCardBase, adminInputClass, adminTableWrap } from "@/app/admin/_components/adminTheme";
import { AdminTiendaOrderStatusBadge } from "@/app/admin/_components/tienda/AdminTiendaOrderStatusBadge";
import { getAdminTiendaDashboardCounts, listTiendaOrdersForAdmin } from "@/app/admin/_lib/tiendaOrdersData";
import {
  TIENDA_ORDER_OPS_STATUSES,
  isTiendaOrderOpsStatus,
  type TiendaOrderOpsStatus,
} from "@/app/lib/tienda/tiendaOrderOperations";
import { tiendaOrderFlowLabel } from "@/app/admin/_lib/tiendaOrderFlowLabel";

export const dynamic = "force-dynamic";

function inboxHref(args: { q: string; status: string; page: number; unreadOnly: boolean }): string {
  const p = new URLSearchParams();
  if (args.q) p.set("q", args.q);
  if (args.status) p.set("status", args.status);
  if (args.unreadOnly) p.set("unread", "1");
  if (args.page > 1) p.set("page", String(args.page));
  const s = p.toString();
  return s ? `/admin/tienda/orders?${s}` : "/admin/tienda/orders";
}

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return "—";
    return d.toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return "—";
  }
}

export default async function AdminTiendaOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; unread?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const statusRaw = (sp.status ?? "").trim();
  const statusFilter: TiendaOrderOpsStatus | "" = isTiendaOrderOpsStatus(statusRaw) ? statusRaw : "";
  const unreadOnly = sp.unread === "1" || sp.unread === "true";
  const page = Math.max(1, parseInt(sp.page ?? "1", 10) || 1);
  const limit = 30;
  const offset = (page - 1) * limit;

  const [counts, list] = await Promise.all([
    getAdminTiendaDashboardCounts(),
    listTiendaOrdersForAdmin({ search: q, status: statusFilter, unreadOnly, limit, offset }),
  ]);

  const totalPages = Math.max(1, Math.ceil(list.total / limit));

  return (
    <div className="space-y-8">
      <AdminPageHeader
        title="Pedidos de Tienda"
        subtitle="Bandeja de cumplimiento: datos en Supabase (no por correo). Busca por referencia, cliente, producto o UUID."
        helperText="Esto es la cola de impresión / self-serve de la tienda. Dudas generales de usuarios siguen en Support en el menú global."
      />

      {counts.dataUnavailable ? (
        <div className={`${adminCardBase} border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950`}>
          <strong>Data unavailable.</strong> {counts.dataUnavailableNote ?? "Check Supabase migrations for tienda_orders."}
        </div>
      ) : null}

      {list.error ? (
        <div className={`${adminCardBase} border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-950`}>
          <strong>Could not load orders.</strong> {list.error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className={`${adminCardBase} p-4`}>
          <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">New</p>
          <p className="mt-1 text-2xl font-bold text-[#1E1810]">{counts.newOrders}</p>
        </div>
        <div className={`${adminCardBase} p-4`}>
          <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">In review</p>
          <p className="mt-1 text-2xl font-bold text-[#1E1810]">{counts.inReview}</p>
        </div>
        <div className={`${adminCardBase} p-4`}>
          <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">Ready to fulfill</p>
          <p className="mt-1 text-2xl font-bold text-[#1E1810]">{counts.readyToFulfill}</p>
        </div>
        <div className={`${adminCardBase} p-4`}>
          <p className="text-xs font-bold uppercase tracking-wide text-[#7A7164]">Total</p>
          <p className="mt-1 text-2xl font-bold text-[#1E1810]">{counts.totalOrders}</p>
          <p className="mt-1 text-xs text-[#7A7164]">Unread: {counts.unreadCount}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        <Link
          href={inboxHref({ q, status: statusFilter, page: 1, unreadOnly: false })}
          className={`rounded-full border px-3 py-1 ${!unreadOnly ? "border-[#6B5B2E] bg-[#FAF3E6] text-[#2C2416]" : "border-[#E8DFD0] text-[#5C5346]"}`}
        >
          All (in filter)
        </Link>
        <Link
          href={inboxHref({ q, status: statusFilter, page: 1, unreadOnly: true })}
          className={`rounded-full border px-3 py-1 ${unreadOnly ? "border-sky-600 bg-sky-50 text-sky-950" : "border-[#E8DFD0] text-[#5C5346]"}`}
        >
          Unread only
        </Link>
        <Link
          href={inboxHref({ q: "", status: "new", page: 1, unreadOnly: false })}
          className="rounded-full border border-[#E8DFD0] px-3 py-1 text-[#5C5346] hover:bg-[#FAF7F2]"
        >
          Quick: status new
        </Link>
      </div>

      <form className={`${adminCardBase} flex flex-col gap-3 p-4 sm:flex-row sm:flex-wrap sm:items-end`} method="get">
        {unreadOnly ? <input type="hidden" name="unread" value="1" /> : null}
        <div className="min-w-[200px] flex-1">
          <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Search</label>
          <input name="q" defaultValue={q} placeholder="Ref, email, name, slug, UUID…" className={adminInputClass} />
        </div>
        <div className="w-full sm:w-48">
          <label className="block text-xs font-bold uppercase tracking-wide text-[#5C5346] mb-1">Status</label>
          <select name="status" defaultValue={statusFilter} className={adminInputClass}>
            <option value="">All</option>
            {TIENDA_ORDER_OPS_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className={adminBtnPrimary}>
          Apply
        </button>
        <Link href="/admin/tienda/orders" className={`${adminBtnPrimary} text-center opacity-90`}>
          Reset
        </Link>
      </form>

      <div className={adminTableWrap}>
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[#E8DFD0] bg-[#FAF7F2]/90 text-xs font-bold uppercase tracking-wide text-[#5C5346]">
            <tr>
              <th className="px-4 py-3">Ref</th>
              <th className="px-4 py-3">When</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Approval</th>
              <th className="px-4 py-3 text-center">Assets</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {list.rows.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-10 text-center text-[#7A7164]">
                  No orders match these filters.
                </td>
              </tr>
            ) : (
              list.rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b border-[#F0E8D8]/90 ${row.unread_admin ? "bg-sky-50/50" : "bg-white/60"}`}
                >
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-[#1E1810]">
                    {row.unread_admin ? (
                      <span className="mr-1 inline-block h-2 w-2 rounded-full bg-sky-500 align-middle" title="Unread" />
                    ) : null}
                    {row.order_ref}
                  </td>
                  <td className="px-4 py-3 text-xs text-[#5C5346]">{formatWhen(row.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#1E1810]">{row.customer_name}</div>
                    <div className="text-xs text-[#7A7164] break-all">{row.customer_email}</div>
                    {row.customer_user_id ? (
                      <div className="text-[10px] font-mono text-[#9A9084]">uid: {row.customer_user_id}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <div className="max-w-[200px] truncate font-medium text-[#1E1810]" title={row.product_title}>
                      {row.product_title}
                    </div>
                    <div className="text-xs text-[#7A7164]">{row.product_slug}</div>
                  </td>
                  <td className="px-4 py-3 text-xs">{row.source_type}</td>
                  <td className="px-4 py-3 text-xs font-medium text-[#3D3629]" title="How the customer produced files">
                    {tiendaOrderFlowLabel(row.order_payload)}
                  </td>
                  <td className="px-4 py-3">
                    <AdminTiendaOrderStatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-xs">{row.approval_complete ? "✓ Complete" : "○ Check"}</td>
                  <td className="px-4 py-3 text-center text-xs font-semibold">{row.asset_count}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/tienda/orders/${row.id}`}
                      className="text-xs font-bold text-[#6B5B2E] underline"
                    >
                      Open
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-[#7A7164]">
            Page {page} / {totalPages} ({list.total} orders)
          </span>
          {page > 1 ? (
            <Link
              className="font-bold text-[#6B5B2E] underline"
              href={inboxHref({ q, status: statusFilter, page: page - 1, unreadOnly })}
            >
              ← Previous
            </Link>
          ) : null}
          {page < totalPages ? (
            <Link
              className="font-bold text-[#6B5B2E] underline"
              href={inboxHref({ q, status: statusFilter, page: page + 1, unreadOnly })}
            >
              Next →
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
