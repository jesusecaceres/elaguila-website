import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireAdminCookie } from "@/app/lib/supabase/server";
import { formatMoneyCents } from "@/app/lib/listingPlans/packagePricingRules";
import { formatPaymentStatusLabel } from "@/app/lib/listingPlans/paymentTracking";
import { AdminWorkspaceNav } from "@/app/admin/_components/AdminWorkspaceNav";
import { AdminI18nProvider } from "@/app/admin/_components/AdminI18nProvider";
import { resolveAdminLangFromCookieJar } from "@/app/admin/_lib/adminI18nCookie";
import { adminTr } from "@/app/admin/_lib/adminStrings";
import { fetchPaymentTrackerSnapshot, type LeonixPaymentRecordRow } from "@/app/admin/_lib/paymentTrackerData";

function statusChip(status: string) {
  const s = status.toLowerCase();
  if (s === "paid" || s === "succeeded") return "bg-emerald-100 text-emerald-900";
  if (s === "pending" || s === "unpaid" || s === "requires_action") return "bg-amber-100 text-amber-900";
  if (s === "failed") return "bg-red-100 text-red-900";
  if (s === "canceled") return "bg-stone-100 text-stone-800";
  if (s === "refunded") return "bg-sky-100 text-sky-900";
  if (s === "disputed") return "bg-orange-100 text-orange-900";
  return "bg-stone-100 text-stone-800";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default async function AdminPaymentTrackerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const c = await cookies();
  if (!requireAdminCookie(c)) redirect("/admin/login");

  const lang = resolveAdminLangFromCookieJar(c);
  const t = (key: string, vars?: Record<string, string | number>) => adminTr(lang, key, vars);
  const isEn = lang === "en";

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const statusFilter = typeof params.status === "string" ? params.status : "";
  const salesRepFilter = typeof params.sales_rep_id === "string" ? params.sales_rep_id : "";
  const categoryFilter = typeof params.category === "string" ? params.category : "";
  const promoCodeFilter = typeof params.promo_code === "string" ? params.promo_code : "";

  const snapshot = await fetchPaymentTrackerSnapshot({
    q: q || undefined,
    status: statusFilter || undefined,
    sales_rep_id: salesRepFilter || undefined,
    category: categoryFilter || undefined,
    promo_code: promoCodeFilter || undefined,
  });

  return (
    <AdminI18nProvider lang={lang}>
      <AdminWorkspaceNav />

      <div className="space-y-8">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">
            {isEn ? "Payment Tracker" : "Seguimiento de Pagos"}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-[#5C5346]/95">
            {isEn
              ? "Global payment tracker for package entitlements, promo codes, sales reps, and future Stripe Checkout. This does not collect payments yet."
              : "Seguimiento global de pagos para paquetes, códigos promo, representantes de ventas y futuro Stripe Checkout. Aún no se cobran pagos aquí."}
          </p>
          <div className="mt-3 rounded-xl border border-amber-200/90 bg-amber-50/80 p-3 text-sm text-amber-950">
            <strong>{isEn ? "Important:" : "Importante:"}</strong>{" "}
            {isEn
              ? "No payment is collected here yet. Stripe Checkout will create and update these records later. Commission payout is a later gate."
              : "Aún no se cobran pagos aquí. Stripe Checkout creará y actualizará estos registros después. El pago de comisión es una etapa posterior."}
          </div>
        </header>

        {/* Filters */}
        <form className="rounded-2xl border border-[#E8DFD0]/90 bg-[#FFFCF7]/95 p-4 shadow-inner">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[160px] flex-1">
              <label className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">
                {isEn ? "Search" : "Buscar"}
              </label>
              <input
                name="q"
                defaultValue={q}
                placeholder={isEn ? "Code, business, session ID…" : "Código, negocio, session ID…"}
                className="mt-1 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm outline-none"
              />
            </div>
            <div className="min-w-[120px]">
              <label className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">
                {isEn ? "Status" : "Estado"}
              </label>
              <select
                name="status"
                defaultValue={statusFilter}
                className="mt-1 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm outline-none"
              >
                <option value="">{t("common.allStatuses")}</option>
                {["pending", "unpaid", "paid", "succeeded", "failed", "canceled", "refunded", "disputed"].map((s) => (
                  <option key={s} value={s}>{formatPaymentStatusLabel(s)}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[120px]">
              <label className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">
                {isEn ? "Sales rep" : "Rep ventas"}
              </label>
              <input
                name="sales_rep_id"
                defaultValue={salesRepFilter}
                placeholder="REP001"
                className="mt-1 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm outline-none"
              />
            </div>
            <div className="min-w-[120px]">
              <label className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">
                {isEn ? "Category" : "Categoría"}
              </label>
              <select
                name="category"
                defaultValue={categoryFilter}
                className="mt-1 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm outline-none"
              >
                <option value="">{t("common.allCategories")}</option>
                {["servicios", "restaurantes", "autos", "bienes-raices", "rentas"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[120px]">
              <label className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">
                {isEn ? "Promo code" : "Código promo"}
              </label>
              <input
                name="promo_code"
                defaultValue={promoCodeFilter}
                placeholder="LX-PROMO-..."
                className="mt-1 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm outline-none"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-[#2A2620] px-5 py-2 text-sm font-semibold text-[#FAF7F2] hover:bg-[#1a1814]"
            >
              {t("common.apply")}
            </button>
          </div>
        </form>

        {snapshot.unavailable ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-900">
            <p className="font-semibold">{isEn ? "Table not available yet" : "Tabla aún no disponible"}</p>
            <p className="mt-1 text-xs">{snapshot.note ?? (isEn ? "Apply the leonix_payment_records migration in Supabase." : "Aplica la migración leonix_payment_records en Supabase.")}</p>
            <p className="mt-2 text-xs text-amber-800">
              {isEn
                ? "This is expected before the migration is applied. Stripe Checkout will populate this table in a later gate."
                : "Esto es esperado antes de aplicar la migración. Stripe Checkout poblará esta tabla en una etapa posterior."}
            </p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <SummaryCard label={isEn ? "Pending" : "Pendientes"} value={snapshot.pendingCount} tone="warn" />
              <SummaryCard label={isEn ? "Paid / succeeded" : "Pagados"} value={snapshot.paidCount} />
              <SummaryCard label={isEn ? "Failed / canceled / refunded" : "Fallidos / cancelados"} value={snapshot.failedCanceledRefundedCount} tone="muted" />
              <SummaryCard label={isEn ? "Commission eligible" : "Elegibles comisión"} value={snapshot.commissionEligibleCount} tone="info" />
              <SummaryCard
                label={isEn ? "Est. paid total" : "Total pagado est."}
                value={snapshot.estimatedPaidTotalCents > 0 ? formatMoneyCents(snapshot.estimatedPaidTotalCents) : "—"}
              />
            </div>

            {/* Payment records table */}
            {snapshot.rows.length > 0 ? (
              <section>
                <h2 className="text-lg font-bold text-[#1E1810]">
                  {isEn ? "Payment records" : "Registros de pago"} ({snapshot.rows.length})
                </h2>
                <div className="mt-3 overflow-x-auto rounded-2xl border border-[#E8DFD0]/90">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-[#E8DFD0] bg-[#FAF7F2]/90 text-xs uppercase text-[#7A7164]">
                      <tr>
                        <th className="px-4 py-3">{isEn ? "Customer" : "Cliente"}</th>
                        <th className="px-4 py-3">{isEn ? "Package" : "Paquete"}</th>
                        <th className="px-4 py-3">{isEn ? "Promo" : "Promo"}</th>
                        <th className="px-4 py-3">{isEn ? "Sales rep" : "Rep"}</th>
                        <th className="px-4 py-3">{isEn ? "Status" : "Estado"}</th>
                        <th className="px-4 py-3">{isEn ? "Amount" : "Monto"}</th>
                        <th className="px-4 py-3">{isEn ? "Commission" : "Comisión"}</th>
                        <th className="px-4 py-3">{isEn ? "Source" : "Fuente"}</th>
                        <th className="px-4 py-3">{isEn ? "Stripe" : "Stripe"}</th>
                        <th className="px-4 py-3">{isEn ? "Paid" : "Pagado"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8DFD0]/60">
                      {snapshot.rows.map((row) => (
                        <PaymentRow key={row.id} row={row} isEn={isEn} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : (
              <div className="rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2]/80 p-6 text-center text-sm text-[#5C5346]">
                {isEn
                  ? "No payment records yet. Stripe Checkout will create records when payments are processed."
                  : "Aún no hay registros de pago. Stripe Checkout creará registros cuando se procesen pagos."}
              </div>
            )}

            {/* Cross-links */}
            <div className="flex flex-wrap gap-3">
              <Link href="/admin/workspace/promo-codes" className="rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416] hover:bg-[#FAF7F2]">
                {isEn ? "Promo Codes →" : "Códigos promo →"}
              </Link>
              <Link href="/admin/workspace/package-entitlements" className="rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416] hover:bg-[#FAF7F2]">
                {isEn ? "Package Entitlements →" : "Paquetes →"}
              </Link>
              <Link href="/admin/workspace/sales-tracker" className="rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416] hover:bg-[#FAF7F2]">
                {isEn ? "Sales Tracker →" : "Seguimiento ventas →"}
              </Link>
            </div>
          </>
        )}
      </div>
    </AdminI18nProvider>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string | number; tone?: "warn" | "muted" | "info" }) {
  const border = tone === "warn" ? "border-amber-200/80" : tone === "muted" ? "border-stone-200/80" : tone === "info" ? "border-sky-200/80" : "border-[#C9B46A]/30";
  return (
    <div className={`rounded-2xl border ${border} bg-[#FFFCF7]/95 p-4 shadow-sm`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-[#1E1810]">{value}</p>
    </div>
  );
}

function PaymentRow({ row, isEn }: { row: LeonixPaymentRecordRow; isEn: boolean }) {
  const customerLine = row.business_name?.trim() || row.customer_name?.trim() || row.customer_email?.trim() || "—";
  const amountLine = row.amount_paid_cents != null ? formatMoneyCents(row.amount_paid_cents) : row.amount_total_cents != null ? `${formatMoneyCents(row.amount_total_cents)}` : "—";
  const repLine = row.sales_rep_name ? `${row.sales_rep_name}${row.sales_rep_id ? ` (${row.sales_rep_id})` : ""}` : row.sales_rep_id || "—";
  const commissionLine = row.commission_eligible
    ? row.estimated_commission_cents != null ? `≈ ${formatMoneyCents(row.estimated_commission_cents)}` : (isEn ? "Eligible" : "Elegible")
    : row.commission_status === "pending_payment" ? (isEn ? "Pending" : "Pendiente")
    : "—";
  const stripeLine = row.stripe_checkout_session_id
    ? row.stripe_checkout_session_id.slice(0, 16) + "…"
    : row.stripe_payment_intent_id
      ? row.stripe_payment_intent_id.slice(0, 16) + "…"
      : "—";

  return (
    <tr className="bg-white/80 hover:bg-[#FAF7F2]">
      <td className="px-4 py-3 text-[#1E1810]">{customerLine}</td>
      <td className="px-4 py-3 text-xs">
        {row.package_tier?.replace(/_/g, " ") || "—"}
        {row.category ? <span className="ml-1 text-[#7A7164]">({row.category})</span> : null}
      </td>
      <td className="px-4 py-3 font-mono text-xs">{row.promo_code || "—"}</td>
      <td className="px-4 py-3 text-xs text-[#5C5346]">{repLine}</td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusChip(row.payment_status)}`}>
          {formatPaymentStatusLabel(row.payment_status)}
        </span>
      </td>
      <td className="px-4 py-3 tabular-nums text-xs">{amountLine}</td>
      <td className="px-4 py-3 text-xs text-[#5C5346]">{commissionLine}</td>
      <td className="px-4 py-3 text-xs text-[#7A7164]">{row.source.replace(/_/g, " ")}</td>
      <td className="px-4 py-3 font-mono text-[10px] text-[#7A7164]">{stripeLine}</td>
      <td className="px-4 py-3 text-xs text-[#5C5346]">{formatDate(row.paid_at)}</td>
    </tr>
  );
}
