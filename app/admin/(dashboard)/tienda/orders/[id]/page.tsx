import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import { adminCardBase, adminTableWrap } from "@/app/admin/_components/adminTheme";
import { AdminTiendaOrderOpsPanel } from "@/app/admin/_components/tienda/AdminTiendaOrderOpsPanel";
import { AdminTiendaOrderStatusBadge } from "@/app/admin/_components/tienda/AdminTiendaOrderStatusBadge";
import {
  getTiendaOrderDetailForAdmin,
  markTiendaOrderAsRead,
} from "@/app/admin/_lib/tiendaOrdersData";
import type { TiendaOrderSubmissionPayload } from "@/app/tienda/types/orderSubmission";

export const dynamic = "force-dynamic";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function formatWhen(iso: string): string {
  try {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return "—";
    return d.toLocaleString("es-MX", { dateStyle: "full", timeStyle: "short" });
  } catch {
    return "—";
  }
}

function formatBytes(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function assetRoleStaffLabel(role: string, source: string): string {
  switch (role) {
    case "business-card-front":
      return "Business card — front (PNG visual export, not press PDF)";
    case "business-card-back":
      return "Business card — back (PNG visual export)";
    case "design-json-snapshot":
      return "Builder JSON snapshot";
    case "upload-front":
      return source === "print-upload" ? "Original upload — front" : "Upload — front";
    case "upload-back":
      return source === "print-upload" ? "Original upload — back" : "Upload — back";
    default:
      return role;
  }
}

function safePayload(raw: unknown): TiendaOrderSubmissionPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as TiendaOrderSubmissionPayload;
  if (p.v !== 2 || !p.orderId) return null;
  return p;
}

export default async function AdminTiendaOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_REGEX.test(id)) notFound();

  const { order, assets, error } = await getTiendaOrderDetailForAdmin(id);
  if (error) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Tienda order" subtitle="Could not load this order." />
        <div className={`${adminCardBase} border-rose-200 bg-rose-50/90 p-4 text-sm`}>{error}</div>
        <Link href="/admin/tienda/orders" className="text-sm font-bold text-[#6B5B2E] underline">
          ← Back to inbox
        </Link>
      </div>
    );
  }

  if (!order) notFound();

  let orderView = order;
  if (orderView.unread_admin) {
    await markTiendaOrderAsRead(orderView.id);
    orderView = { ...orderView, unread_admin: false };
  }

  const payload = safePayload(orderView.order_payload);
  const specs = Array.isArray(orderView.specs_snapshot)
    ? (orderView.specs_snapshot as Array<{ es?: string; en?: string }>)
    : [];
  const warnings = Array.isArray(orderView.warnings_snapshot)
    ? (orderView.warnings_snapshot as Array<{ es?: string; en?: string }>)
    : [];
  const sidedness = orderView.sidedness_summary as { es?: string; en?: string } | null;

  const emailOk = orderView.email_delivery_status === "sent";
  const emailFailed = orderView.email_delivery_status === "failed";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <AdminPageHeader
          title={`Order ${orderView.order_ref}`}
          subtitle={`Internal ID ${orderView.id} · Source ${orderView.source_type}`}
        />
        <Link href="/admin/tienda/orders" className="text-sm font-bold text-[#6B5B2E] underline">
          ← Inbox
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className={`${adminCardBase} p-5 space-y-3`}>
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Overview</h2>
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <span className="text-[#7A7164]">Created</span>
                <div className="font-medium">{formatWhen(orderView.created_at)}</div>
              </div>
              <div>
                <span className="text-[#7A7164]">Updated</span>
                <div className="font-medium">{formatWhen(orderView.updated_at)}</div>
              </div>
              <div>
                <span className="text-[#7A7164]">Status</span>
                <div className="mt-1">
                  <AdminTiendaOrderStatusBadge status={orderView.status} />
                </div>
              </div>
              <div>
                <span className="text-[#7A7164]">Unread</span>
                <div className="font-medium">{orderView.unread_admin ? "Yes" : "No"}</div>
              </div>
              <div className="sm:col-span-2">
                <span className="text-[#7A7164]">Email delivery</span>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                      emailOk
                        ? "bg-emerald-100 text-emerald-900"
                        : emailFailed
                          ? "bg-rose-100 text-rose-900"
                          : "bg-stone-100 text-stone-800"
                    }`}
                  >
                    {orderView.email_delivery_status}
                  </span>
                  {orderView.email_last_error ? (
                    <span className="text-xs text-rose-800">Last error: {orderView.email_last_error}</span>
                  ) : null}
                </div>
              </div>
            </div>
          </section>

          <section className={`${adminCardBase} p-5 space-y-3`}>
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Customer</h2>
            <dl className="grid gap-2 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[#7A7164]">Name</dt>
                <dd className="font-medium">{orderView.customer_name}</dd>
              </div>
              <div>
                <dt className="text-[#7A7164]">Business</dt>
                <dd className="font-medium">{orderView.business_name || "—"}</dd>
              </div>
              <div>
                <dt className="text-[#7A7164]">Email</dt>
                <dd className="font-medium break-all">
                  <a className="text-[#6B5B2E] underline" href={`mailto:${orderView.customer_email}`}>
                    {orderView.customer_email}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-[#7A7164]">Phone</dt>
                <dd className="font-medium">{orderView.customer_phone}</dd>
              </div>
              {orderView.customer_user_id ? (
                <div className="sm:col-span-2">
                  <dt className="text-[#7A7164]">User</dt>
                  <dd>
                    <Link
                      href={`/admin/usuarios/${orderView.customer_user_id}`}
                      className="font-mono text-sm font-bold text-[#6B5B2E] underline"
                    >
                      {orderView.customer_user_id}
                    </Link>
                  </dd>
                </div>
              ) : (
                <div className="sm:col-span-2 text-xs text-[#9A9084]">No linked Supabase user id (guest checkout).</div>
              )}
              <div className="sm:col-span-2">
                <dt className="text-[#7A7164]">Notes</dt>
                <dd className="whitespace-pre-wrap text-[#2C2416]">{orderView.notes || "—"}</dd>
              </div>
            </dl>
          </section>

          <section className={`${adminCardBase} p-5 space-y-3`}>
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Product & specs</h2>
            <p className="text-sm">
              <span className="font-semibold">{orderView.product_title}</span>
              <span className="text-[#7A7164]"> · {orderView.product_slug}</span>
            </p>
            <p className="text-xs text-[#7A7164]">Category: {orderView.category_slug || "—"}</p>
            {sidedness?.en || sidedness?.es ? (
              <p className="text-sm">
                <strong>Sidedness:</strong> {sidedness.en} / <em>{sidedness.es}</em>
              </p>
            ) : null}
            <p className="text-sm">
              <strong>Fulfillment:</strong> {orderView.fulfillment_preference}
            </p>
            <div>
              <p className="text-xs font-bold uppercase text-[#5C5346] mb-1">Specs</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                {specs.length === 0 ? <li className="text-[#9A9084]">No specs snapshot</li> : null}
                {specs.map((s, i) => (
                  <li key={i}>
                    {s.en ?? "—"} — <em>{s.es ?? "—"}</em>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className={`${adminCardBase} p-5 space-y-3`}>
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">Approval & warnings</h2>
            <p className="text-sm">
              Configurator approval complete:{" "}
              <strong>{orderView.approval_complete ? "Yes" : "No — verify in snapshots"}</strong>
            </p>
            <details className="rounded-xl border border-[#E8DFD0] bg-[#FAF7F2]/80 p-3">
              <summary className="cursor-pointer text-sm font-semibold">Approval snapshot (JSON)</summary>
              <pre className="mt-2 max-h-64 overflow-auto text-xs">{JSON.stringify(orderView.approval_snapshot, null, 2)}</pre>
            </details>
            <div>
              <p className="text-xs font-bold uppercase text-[#5C5346] mb-1">Warnings at submit</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                {warnings.length === 0 ? <li className="text-[#9A9084]">None</li> : null}
                {warnings.map((w, i) => (
                  <li key={i}>
                    {w.en} — <em>{w.es}</em>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className={`${adminCardBase} p-5 space-y-3`}>
            <h2 className="text-sm font-bold uppercase tracking-wide text-[#5C5346]">
              Production assets ({assets.length})
            </h2>
            <p className="text-xs text-[#7A7164]">
              Links point to Vercel Blob URLs. If a link 404s, the blob may have been removed outside Leonix.
            </p>
            <div className={adminTableWrap}>
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-[#E8DFD0] bg-[#FAF7F2] text-xs font-bold uppercase text-[#5C5346]">
                  <tr>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">File</th>
                    <th className="px-3 py-2">MIME / size</th>
                    <th className="px-3 py-2">Dims</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {assets.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-[#9A9084]">
                        No asset rows (data inconsistency).
                      </td>
                    </tr>
                  ) : (
                    assets.map((a) => (
                      <tr key={a.id} className="border-b border-[#F0E8D8]/90">
                        <td className="px-3 py-2 align-top">
                          <div className="font-mono text-xs">{a.asset_role}</div>
                          <div className="text-[11px] text-[#7A7164] max-w-[220px]">
                            {assetRoleStaffLabel(a.asset_role, orderView.source_type)}
                          </div>
                        </td>
                        <td className="px-3 py-2 align-top break-all text-xs">{a.original_filename}</td>
                        <td className="px-3 py-2 align-top text-xs">
                          {a.mime_type}
                          <div className="text-[#7A7164]">{formatBytes(Number(a.size_bytes))}</div>
                        </td>
                        <td className="px-3 py-2 align-top text-xs">
                          {a.width_px != null && a.height_px != null ? `${a.width_px}×${a.height_px}` : "—"}
                        </td>
                        <td className="px-3 py-2 align-top">
                          <a
                            href={a.asset_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs font-bold text-[#6B5B2E] underline"
                          >
                            Open
                          </a>
                          <div className="text-[10px] text-[#9A9084] break-all max-w-[140px]" title={a.storage_key}>
                            {a.storage_key.split("/").pop()}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {payload ? (
            <details className={`${adminCardBase} p-5`}>
              <summary className="cursor-pointer text-sm font-bold text-[#5C5346]">Full submission payload (v2)</summary>
              <pre className="mt-3 max-h-[480px] overflow-auto text-xs">{JSON.stringify(payload, null, 2)}</pre>
            </details>
          ) : (
            <div className={`${adminCardBase} border-amber-200 bg-amber-50/80 p-4 text-sm`}>
              Stored payload could not be parsed as Tienda v2 — see raw JSON in database tools if needed.
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <AdminTiendaOrderOpsPanel orderId={orderView.id} currentStatus={orderView.status} unread={orderView.unread_admin} />
          <div className={`${adminCardBase} p-4 text-xs text-[#7A7164]`}>
            <strong className="text-[#5C5346]">Activity log:</strong> status changes are not yet written to{' '}
            <code className="rounded bg-white/80 px-1">admin_audit_log</code> — see TODO in{' '}
            <code className="rounded bg-white/80 px-1">tiendaOrderActions.ts</code>.
          </div>
        </aside>
      </div>
    </div>
  );
}
