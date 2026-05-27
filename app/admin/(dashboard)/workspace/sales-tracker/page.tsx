import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { requireAdminCookie } from "@/app/lib/supabase/server";
import { formatMoneyCents } from "@/app/lib/listingPlans/packagePricingRules";
import { AdminI18nProvider } from "@/app/admin/_components/AdminI18nProvider";
import { resolveAdminLangFromCookieJar } from "@/app/admin/_lib/adminI18nCookie";
import { adminTr } from "@/app/admin/_lib/adminStrings";
import {
  getCurrentAdminAccessContext,
  getSalesRepScopeForAdmin,
  isSalesRepRole,
} from "@/app/admin/_lib/adminAccessControl";
import { fetchSalesTrackerSnapshot, type SalesRepSummary, type SalesTrackerActivity } from "@/app/admin/_lib/salesTrackerData";

function statusChip(status: string) {
  const s = status.toLowerCase();
  if (s === "active") return "bg-emerald-100 text-emerald-900";
  if (s === "expired") return "bg-amber-100 text-amber-900";
  if (s === "revoked") return "bg-red-100 text-red-900";
  if (s === "redeemed") return "bg-sky-100 text-sky-900";
  if (s === "scheduled") return "bg-blue-100 text-blue-900";
  return "bg-stone-100 text-stone-800";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default async function AdminSalesTrackerPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const c = await cookies();
  if (!requireAdminCookie(c)) redirect("/admin/login");

  const lang = resolveAdminLangFromCookieJar(c);
  const t = (key: string, vars?: Record<string, string | number>) => adminTr(lang, key, vars);

  const access = await getCurrentAdminAccessContext();
  const salesScope = getSalesRepScopeForAdmin(access);
  const salesRepLocked = isSalesRepRole(access.normalizedRole);

  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const salesRepId = salesRepLocked && salesScope
    ? salesScope.salesRepId
    : typeof params.sales_rep_id === "string"
      ? params.sales_rep_id
      : "";
  const statusFilter = typeof params.status === "string" ? params.status : "";
  const categoryFilter = typeof params.category === "string" ? params.category : "";
  const packageTierFilter = typeof params.package_tier === "string" ? params.package_tier : "";
  const codeTypeFilter = typeof params.code_type === "string" ? params.code_type : "";

  const snapshot = await fetchSalesTrackerSnapshot({
    q: q || undefined,
    sales_rep_id: salesRepId || undefined,
    status: statusFilter || undefined,
    category: categoryFilter || undefined,
    package_tier: packageTierFilter || undefined,
    code_type: codeTypeFilter || undefined,
  });

  const isEn = lang === "en";

  return (
    <AdminI18nProvider lang={lang}>
      <div className="space-y-8">
        <header>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E1810] sm:text-3xl">
            {salesRepLocked
              ? isEn
                ? "Your sales tracker"
                : "Tu seguimiento de ventas"
              : isEn
                ? "Sales Tracker"
                : "Seguimiento de Ventas"}
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-[#5C5346]/95">
            {salesRepLocked
              ? isEn
                ? "Your promo codes and package entitlements only. Commission is preview-only until payment clears."
                : "Solo tus códigos promo y paquetes. La comisión es vista previa hasta que el pago se liquide."
              : isEn
                ? "Track promo codes and package entitlements by sales rep. Commission is preview-only until payment clears."
                : "Seguimiento de códigos promo y paquetes por representante de ventas. Comisión es solo vista previa hasta que el pago se liquide."}
          </p>
          <div className="mt-3 rounded-xl border border-amber-200/90 bg-amber-50/80 p-3 text-sm text-amber-950">
            <strong>{isEn ? "Important:" : "Importante:"}</strong>{" "}
            {isEn
              ? "No payments are collected here. No commission is payable until payment clears. Stripe Checkout comes later."
              : "No se cobran pagos aquí. La comisión no es pagable hasta que el pago se confirme. Stripe Checkout viene después."}
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
                placeholder={isEn ? "Code, business, customer…" : "Código, negocio, cliente…"}
                className="mt-1 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm outline-none"
              />
            </div>
            {salesRepLocked && salesScope ? (
              <input type="hidden" name="sales_rep_id" value={salesScope.salesRepId} />
            ) : (
              <div className="min-w-[140px]">
                <label className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">
                  {isEn ? "Sales rep ID" : "ID representante"}
                </label>
                <input
                  name="sales_rep_id"
                  defaultValue={salesRepId}
                  placeholder="REP001"
                  className="mt-1 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm outline-none"
                />
              </div>
            )}
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
                <option value="active">{isEn ? "Active" : "Activo"}</option>
                <option value="expired">{isEn ? "Expired" : "Expirado"}</option>
                <option value="revoked">{isEn ? "Revoked" : "Revocado"}</option>
                <option value="redeemed">{isEn ? "Redeemed" : "Redimido"}</option>
              </select>
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
                {isEn ? "Package tier" : "Paquete"}
              </label>
              <select
                name="package_tier"
                defaultValue={packageTierFilter}
                className="mt-1 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm outline-none"
              >
                <option value="">{isEn ? "All tiers" : "Todos"}</option>
                {["premium", "full_page", "half_page", "quarter_page", "classified_print", "digital_only"].map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div className="min-w-[120px]">
              <label className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">
                {isEn ? "Code type" : "Tipo código"}
              </label>
              <select
                name="code_type"
                defaultValue={codeTypeFilter}
                className="mt-1 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm outline-none"
              >
                <option value="">{isEn ? "All types" : "Todos"}</option>
                {["entitlement", "discount", "sales_rep", "contract", "founding_partner", "owner_override"].map((t) => (
                  <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                ))}
              </select>
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
            {isEn ? "Data unavailable." : "Datos no disponibles."}{" "}
            {snapshot.note ?? ""}
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                label={isEn ? "Active codes" : "Códigos activos"}
                value={snapshot.totalActiveCodes}
              />
              <SummaryCard
                label={isEn ? "Active entitlements" : "Entitlements activos"}
                value={snapshot.totalActiveEntitlements}
              />
              <SummaryCard
                label={isEn ? "Expiring soon" : "Por vencer"}
                value={snapshot.totalExpiringSoon}
                tone="warn"
              />
              <SummaryCard
                label={isEn ? "Revoked / expired" : "Revocados / vencidos"}
                value={snapshot.totalRevokedOrExpired}
                tone="muted"
              />
            </div>

            {snapshot.totalEstimatedContractCents > 0 || snapshot.totalCommissionEligibleCount > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <SummaryCard
                  label={isEn ? "Est. contract total" : "Total contrato est."}
                  value={formatMoneyCents(snapshot.totalEstimatedContractCents)}
                />
                <SummaryCard
                  label={isEn ? "Commission eligible" : "Elegibles comisión"}
                  value={snapshot.totalCommissionEligibleCount}
                />
                <SummaryCard
                  label={isEn ? "Est. commission (preview)" : "Comisión est. (preview)"}
                  value={formatMoneyCents(snapshot.totalEstimatedCommissionCents)}
                  tone="info"
                />
              </div>
            ) : null}

            {/* Sales reps table — owner/admin and sales_manager only */}
            {!salesRepLocked && snapshot.reps.length > 0 ? (
              <section>
                <h2 className="text-lg font-bold text-[#1E1810]">
                  {isEn ? "Sales reps" : "Representantes de ventas"} ({snapshot.reps.length})
                </h2>
                <div className="mt-3 overflow-x-auto rounded-2xl border border-[#E8DFD0]/90">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-[#E8DFD0] bg-[#FAF7F2]/90 text-xs uppercase text-[#7A7164]">
                      <tr>
                        <th className="px-4 py-3">{isEn ? "Rep" : "Rep"}</th>
                        <th className="px-4 py-3">{isEn ? "Active codes" : "Códigos"}</th>
                        <th className="px-4 py-3">{isEn ? "Active entitlements" : "Entitlements"}</th>
                        <th className="px-4 py-3">{isEn ? "Expiring" : "Por vencer"}</th>
                        <th className="px-4 py-3">{isEn ? "Revoked/Exp" : "Rev/Exp"}</th>
                        <th className="px-4 py-3">{isEn ? "Est. total" : "Total est."}</th>
                        <th className="px-4 py-3">{isEn ? "Commission (preview)" : "Comisión (preview)"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8DFD0]/60">
                      {snapshot.reps.map((rep) => (
                        <RepRow key={rep.salesRepId} rep={rep} isEn={isEn} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : !salesRepLocked ? (
              <div className="rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2]/80 p-6 text-center text-sm text-[#5C5346]">
                {isEn
                  ? "No sales reps found with codes or entitlements matching filters."
                  : "No se encontraron representantes con códigos o paquetes que coincidan."}
              </div>
            ) : null}

            {/* Recent activity */}
            {snapshot.recentActivity.length > 0 ? (
              <section>
                <h2 className="text-lg font-bold text-[#1E1810]">
                  {isEn ? "Recent activity" : "Actividad reciente"} ({snapshot.recentActivity.length})
                </h2>
                <div className="mt-3 overflow-x-auto rounded-2xl border border-[#E8DFD0]/90">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-[#E8DFD0] bg-[#FAF7F2]/90 text-xs uppercase text-[#7A7164]">
                      <tr>
                        <th className="px-4 py-3">{isEn ? "Code" : "Código"}</th>
                        <th className="px-4 py-3">{isEn ? "Source" : "Fuente"}</th>
                        <th className="px-4 py-3">{isEn ? "Customer" : "Cliente"}</th>
                        <th className="px-4 py-3">{isEn ? "Sales rep" : "Rep ventas"}</th>
                        <th className="px-4 py-3">{isEn ? "Package / category" : "Paquete / categoría"}</th>
                        <th className="px-4 py-3">{isEn ? "Status" : "Estado"}</th>
                        <th className="px-4 py-3">{isEn ? "Ends" : "Fin"}</th>
                        <th className="px-4 py-3">{isEn ? "Est. total" : "Total est."}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8DFD0]/60">
                      {snapshot.recentActivity.map((a) => (
                        <ActivityRow key={`${a.source}-${a.id}`} activity={a} isEn={isEn} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ) : null}

            {/* Cross-links */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/workspace/promo-codes"
                className="rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416] hover:bg-[#FAF7F2]"
              >
                {isEn ? "Promo Codes →" : "Códigos promo →"}
              </Link>
              <Link
                href="/admin/workspace/package-entitlements"
                className="rounded-xl border border-[#E8DFD0] bg-white px-4 py-2 text-sm font-semibold text-[#2C2416] hover:bg-[#FAF7F2]"
              >
                {isEn ? "Package Entitlements →" : "Paquetes →"}
              </Link>
            </div>
          </>
        )}
      </div>
    </AdminI18nProvider>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone?: "warn" | "muted" | "info";
}) {
  const border =
    tone === "warn"
      ? "border-amber-200/80"
      : tone === "muted"
        ? "border-stone-200/80"
        : tone === "info"
          ? "border-sky-200/80"
          : "border-[#C9B46A]/30";
  return (
    <div className={`rounded-2xl border ${border} bg-[#FFFCF7]/95 p-4 shadow-sm`}>
      <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-[#1E1810]">{value}</p>
    </div>
  );
}

function RepRow({ rep, isEn }: { rep: SalesRepSummary; isEn: boolean }) {
  return (
    <tr className="bg-white/80 hover:bg-[#FAF7F2]">
      <td className="px-4 py-3 font-semibold text-[#1E1810]">
        <Link
          href={`/admin/workspace/sales-tracker?sales_rep_id=${encodeURIComponent(rep.salesRepId)}`}
          className="underline decoration-[#C9B46A]/60 underline-offset-2 hover:text-[#6B5B2E]"
        >
          {rep.salesRepName}
        </Link>
        <span className="ml-2 text-xs text-[#7A7164]">({rep.salesRepId})</span>
      </td>
      <td className="px-4 py-3 tabular-nums">{rep.activeCodes}</td>
      <td className="px-4 py-3 tabular-nums">{rep.activeEntitlements}</td>
      <td className="px-4 py-3 tabular-nums">{rep.expiringSoon}</td>
      <td className="px-4 py-3 tabular-nums">{rep.revokedOrExpired}</td>
      <td className="px-4 py-3 tabular-nums">
        {rep.estimatedContractTotalCents > 0 ? formatMoneyCents(rep.estimatedContractTotalCents) : "—"}
      </td>
      <td className="px-4 py-3 text-xs text-[#5C5346]">
        {rep.commissionEligibleCount > 0
          ? `${rep.commissionEligibleCount} ${isEn ? "eligible" : "elegibles"} · ≈ ${formatMoneyCents(rep.estimatedCommissionCents)}`
          : isEn ? "pending" : "pendiente"}
      </td>
    </tr>
  );
}

function ActivityRow({ activity: a, isEn }: { activity: SalesTrackerActivity; isEn: boolean }) {
  return (
    <tr className="bg-white/80 hover:bg-[#FAF7F2]">
      <td className="px-4 py-3 font-mono text-xs font-semibold text-[#1E1810]">{a.code || "—"}</td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
            a.source === "promo" ? "bg-violet-100 text-violet-900" : "bg-teal-100 text-teal-900"
          }`}
        >
          {a.source}
        </span>
      </td>
      <td className="px-4 py-3 text-[#5C5346]">{a.customerLine || "—"}</td>
      <td className="px-4 py-3 text-[#5C5346]">{a.salesRepLine || "—"}</td>
      <td className="px-4 py-3">
        <span className="text-[#1E1810]">{a.packageTier?.replace(/_/g, " ") || "—"}</span>
        {a.category ? <span className="ml-1 text-xs text-[#7A7164]">({a.category})</span> : null}
      </td>
      <td className="px-4 py-3">
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusChip(a.status)}`}>
          {a.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-[#5C5346]">{formatDate(a.endsAt)}</td>
      <td className="px-4 py-3 text-xs tabular-nums text-[#5C5346]">{a.pricingLine || "—"}</td>
    </tr>
  );
}
