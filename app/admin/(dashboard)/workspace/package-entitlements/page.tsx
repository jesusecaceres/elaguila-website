import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import {
  adminBtnPrimary,
  adminBtnSecondary,
  adminCardBase,
  adminInputClass,
  adminPartialBadgeClass,
} from "@/app/admin/_components/adminTheme";
import {
  PACKAGE_ENTITLEMENT_CATEGORIES,
  PACKAGE_ENTITLEMENT_CONTRACT_TERMS,
  PACKAGE_ENTITLEMENT_LISTING_SOURCES,
  PACKAGE_ENTITLEMENT_PLACEMENT_SCOPES,
  PACKAGE_ENTITLEMENT_PRINT_PLACEMENT_TYPES,
  PACKAGE_ENTITLEMENT_PROMO_CODE_TYPES,
  PACKAGE_ENTITLEMENT_STATUS_FILTERS,
  PACKAGE_ENTITLEMENT_TIERS,
  PACKAGE_ENTITLEMENT_TRACKER_FETCH_LIMIT,
  PREMIUM_INVENTORY_SOFT_CAP,
} from "@/app/admin/_lib/packageEntitlementConstants";
import {
  filterEntitlementsForAccess,
  getCurrentAdminAccessContext,
  getSalesRepScopeForAdmin,
  isSalesRepRole,
} from "@/app/admin/_lib/adminAccessControl";
import {
  benefitLabels,
  effectiveEntitlementStatus,
  entitlementPricingBadges,
  fetchPackageEntitlementsForTracker,
  formatCreatorAttribution,
  formatEntitlementCommissionPreviewLine,
  formatEntitlementListingHeadline,
  formatEntitlementListingIdLine,
  formatEntitlementPricingPromoLine,
  formatSalesRepAttribution,
} from "@/app/admin/_lib/packageEntitlementData";
import { PackageEntitlementSalesPreview } from "./PackageEntitlementSalesPreview";
import { getPackageEntitlementBenefits } from "@/app/lib/listingPlans/packageEntitlements";
import {
  attachListingToPackageEntitlementAction,
  createPackageEntitlementAction,
  extendPackageEntitlementAction,
  revokePackageEntitlementAction,
} from "./actions";

export const dynamic = "force-dynamic";

function defaultStartLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function defaultEndLocal(): string {
  const d = new Date();
  d.setMonth(d.getMonth() + 3);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function toLocalDatetimeValue(iso: string): string {
  try {
    const d = new Date(iso);
    if (!Number.isFinite(d.getTime())) return defaultEndLocal();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  } catch {
    return defaultEndLocal();
  }
}

function fmt(iso: string) {
  try {
    const d = new Date(iso);
    return Number.isFinite(d.getTime())
      ? d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
      : iso;
  } catch {
    return iso;
  }
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-950";
    case "scheduled":
      return "bg-amber-100 text-amber-950";
    case "expired":
      return "bg-stone-200 text-stone-800";
    case "revoked":
      return "bg-rose-100 text-rose-950";
    default:
      return "bg-[#F4F0E8] text-[#5C5346]";
  }
}

function alertFromSearch(sp: Record<string, string | undefined>) {
  if (sp.created === "1") {
    return { kind: "ok" as const, text: `Package created. Code: ${sp.code ?? "—"}` };
  }
  if (sp.revoked === "1") return { kind: "ok" as const, text: "Package revoked (record not deleted)." };
  if (sp.extended === "1") return { kind: "ok" as const, text: "End date updated." };
  if (sp.attached === "1") return { kind: "ok" as const, text: "Listing ID attached. Does not activate public sorting yet." };
  if (sp.error === "premium_cap") {
    return {
      kind: "warn" as const,
      text: `Soft Premium inventory cap reached (~${sp.warn ?? PREMIUM_INVENTORY_SOFT_CAP}). Review active entitlements before granting more Premium.`,
    };
  }
  if (sp.error === "duplicate_code") {
    return { kind: "err" as const, text: "Entitlement code already exists. Use another code or leave the field empty to generate one." };
  }
  if (sp.error === "duplicate_active_entitlement") {
    return {
      kind: "err" as const,
      text: "This listing already has an active or scheduled package entitlement for the same category/source. Revoke or expire it before creating another.",
    };
  }
  if (sp.error) {
    return { kind: "err" as const, text: `Could not complete action (${sp.error}${sp.detail ? `: ${sp.detail}` : ""}).` };
  }
  return null;
}

function preserveFilterHiddenFields(sp: Record<string, string | undefined>, exclude?: string[]) {
  const skip = new Set(exclude ?? []);
  return Object.entries(sp)
    .filter(([k, v]) => v && !skip.has(k) && !k.startsWith("error") && !["created", "revoked", "extended", "attached", "code", "warn", "detail"].includes(k))
    .map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />);
}

export default async function AdminPackageEntitlementsPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const spRaw = props.searchParams ? await props.searchParams : {};
  const sp: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(spRaw)) {
    sp[k] = Array.isArray(v) ? v[0] : v;
  }
  const alert = alertFromSearch(sp);
  const access = await getCurrentAdminAccessContext();
  const salesScope = getSalesRepScopeForAdmin(access);
  const salesRepLocked = isSalesRepRole(access.normalizedRole);

  const filterQ = sp.q?.trim() ?? "";
  const filterCategory = sp.category?.trim() ?? "";
  const filterTier = sp.tier?.trim() ?? "";
  const filterStatus = sp.status?.trim() ?? "";

  const { rows: rawRows, unavailable, note, totalFetched } = await fetchPackageEntitlementsForTracker({
    q: filterQ || undefined,
    category: filterCategory || undefined,
    package_tier: filterTier || undefined,
    status: filterStatus || undefined,
    limit: PACKAGE_ENTITLEMENT_TRACKER_FETCH_LIMIT,
  });
  const rows = filterEntitlementsForAccess(rawRows, access);

  return (
    <div className="max-w-5xl space-y-6">
      <AdminPageHeader
        eyebrow="Workspace · Monetization · Tracker"
        title="Package entitlements"
        subtitle={
          salesRepLocked
            ? "Limited view: only your packages attributed to your sales rep ID."
            : "Create, search, and manage Print-to-Digital package codes with price and promo preview (G1.6E)."
        }
        helperText="Pricing model from packagePricingRules.ts. No Stripe billing or public redemption."
        rightSlot={
          <Link href="/admin/workspace/cupones" className={adminBtnSecondary}>
            CMS cupones →
          </Link>
        }
      />

      <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950">
        <p className="font-bold">Important</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed">
          <li>Does not charge customers or activate Stripe Checkout (metadata reserved for future gate).</li>
          <li>Does not publish sorting in results until category gates.</li>
          <li>Optional listing ID on create: deliver the code to the customer before the ad exists.</li>
          <li>Attaching listing ID here only updates the row — does not activate public visibility yet.</li>
          <li>Sales rep attribution is stored in metadata for future commission (after payment).</li>
        </ul>
      </div>

      {alert ? (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            alert.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
              : alert.kind === "warn"
                ? "border-amber-300 bg-amber-50 text-amber-950"
                : "border-rose-200 bg-rose-50 text-rose-950"
          }`}
        >
          {alert.text}
        </div>
      ) : null}

      {unavailable ? (
        <div className={`${adminCardBase} border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950`}>
          <p className="font-bold">Table unavailable</p>
          <p className="mt-1 text-xs">{note ?? "Apply the listing_package_entitlements migration in Supabase."}</p>
        </div>
      ) : null}

      <section className={`${adminCardBase} p-4 sm:p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Search & filter</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          Search by code, contract, business, customer, listing ID, sales rep, or Leonix ad ID (metadata). Up to{" "}
          {PACKAGE_ENTITLEMENT_TRACKER_FETCH_LIMIT} filas recientes.
        </p>
        <form method="get" className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-[#5C5346] sm:col-span-2">
            Search
            <input
              name="q"
              defaultValue={filterQ}
              className={`${adminInputClass} mt-1`}
              placeholder="LX-ENT-…, business, customer, sales rep…"
            />
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Category
            <select name="category" className={`${adminInputClass} mt-1`} defaultValue={filterCategory}>
              <option value="">All</option>
              {PACKAGE_ENTITLEMENT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Package / tier
            <select name="tier" className={`${adminInputClass} mt-1`} defaultValue={filterTier}>
              <option value="">All</option>
              {PACKAGE_ENTITLEMENT_TIERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346] sm:col-span-2">
            Status
            <select name="status" className={`${adminInputClass} mt-1`} defaultValue={filterStatus}>
              {PACKAGE_ENTITLEMENT_STATUS_FILTERS.map((s) => (
                <option key={s.value || "all"} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <button type="submit" className={adminBtnPrimary}>
              Apply filters
            </button>
            <Link href="/admin/workspace/package-entitlements" className={adminBtnSecondary}>
              Clear
            </Link>
          </div>
        </form>
        <p className="mt-3 text-[10px] text-[#7A7164]">
          Showing {rows.length} result(s)
          {totalFetched > rows.length ? ` (filtered from ${totalFetched} loaded)` : ""}.
        </p>
      </section>

      <form
        id="package-entitlement-create-form"
        action={createPackageEntitlementAction}
        className={`${adminCardBase} space-y-4 p-4 sm:p-6`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-bold text-[#1E1810]">Create entitlement</h2>
          <span className={adminPartialBadgeClass}>Admin manual</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-[#5C5346]">
            Package / tier
            <select name="package_tier" required className={`${adminInputClass} mt-1`} defaultValue="half_page">
              {PACKAGE_ENTITLEMENT_TIERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Contract term / plazo
            <select name="contract_term" required className={`${adminInputClass} mt-1`} defaultValue="month_to_month">
              {PACKAGE_ENTITLEMENT_CONTRACT_TERMS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Promo / code type
            <select name="promo_code_type" required className={`${adminInputClass} mt-1`} defaultValue="entitlement">
              {PACKAGE_ENTITLEMENT_PROMO_CODE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Category
            <select name="category" required className={`${adminInputClass} mt-1`} defaultValue="servicios">
              {PACKAGE_ENTITLEMENT_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Listing source (table)
            <select name="listing_source" required className={`${adminInputClass} mt-1`} defaultValue="servicios_public_listings">
              {PACKAGE_ENTITLEMENT_LISTING_SOURCES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-[10px] font-normal text-[#7A7164]">
              Bienes Raíces / Rentas / En Venta: use <span className="font-mono">listings</span> with category{" "}
              <span className="font-mono">bienes-raices</span> (or rentas). Full-page → results priority; Premium → Destacados.
            </span>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Listing ID (optional)
            <input
              name="listing_id"
              className={`${adminInputClass} mt-1 font-mono text-xs`}
              placeholder="Optional — attach after ad is created"
            />
            <span className="mt-1 block text-[10px] font-normal text-[#7A7164]">
              Leave blank when generating a code before the ad exists.
            </span>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Business (optional)
            <input name="business_name" className={`${adminInputClass} mt-1`} />
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Customer (optional)
            <input name="customer_name" className={`${adminInputClass} mt-1`} />
          </label>
          {salesRepLocked && salesScope ? (
            <div className="sm:col-span-2 rounded-xl border border-amber-200/80 bg-amber-50/80 p-3 text-sm text-amber-950">
              <p className="font-semibold">Your sales attribution (automatic)</p>
              <p className="mt-1 text-xs">
                {salesScope.salesRepName} · <span className="font-mono">{salesScope.salesRepId}</span>
              </p>
              <input type="hidden" name="sales_rep_id" value={salesScope.salesRepId} />
              <input type="hidden" name="sales_rep_name" value={salesScope.salesRepName} />
            </div>
          ) : (
            <>
              <label className="block text-xs font-semibold text-[#5C5346]">
                Sales rep / employee ID (optional)
                <input name="sales_rep_id" className={`${adminInputClass} mt-1 font-mono text-xs`} placeholder="Internal sales ID" />
              </label>
              <label className="block text-xs font-semibold text-[#5C5346]">
                Sales rep name (optional)
                <input name="sales_rep_name" className={`${adminInputClass} mt-1`} placeholder="Rep name" />
              </label>
            </>
          )}
          <label className="block text-xs font-semibold text-[#5C5346]">
            Start
            <input type="datetime-local" name="starts_at" required className={`${adminInputClass} mt-1`} defaultValue={defaultStartLocal()} />
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            End
            <input type="datetime-local" name="ends_at" required className={`${adminInputClass} mt-1`} defaultValue={defaultEndLocal()} />
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Entitlement code (optional)
            <input
              name="entitlement_code"
              className={`${adminInputClass} mt-1 font-mono text-xs uppercase`}
              placeholder="Empty = generate LX-ENT-…"
            />
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Contract code (optional)
            <input name="contract_code" className={`${adminInputClass} mt-1 font-mono text-xs`} />
          </label>
        </div>

        <fieldset>
          <legend className="text-xs font-semibold text-[#5C5346]">Placement scope</legend>
          <div className="mt-2 flex flex-wrap gap-3">
            {PACKAGE_ENTITLEMENT_PLACEMENT_SCOPES.map((s) => (
              <label key={s.value} className="flex items-center gap-2 text-xs text-[#3D3428]">
                <input type="checkbox" name="placement_scope" value={s.value} defaultChecked={s.value !== "results"} />
                {s.label}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="text-xs font-semibold text-[#5C5346]">Magazine placement (G2A.5)</legend>
          <p className="mt-1 text-[10px] text-[#7A7164]">
            Controls Destacados order and print-priority tie-breakers. Back cover = highest priority, then by page number.
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <label className="block text-xs font-semibold text-[#5C5346]">
              Magazine issue / cycle
              <input
                name="magazine_issue"
                className={`${adminInputClass} mt-1`}
                placeholder="e.g. June 2026"
              />
            </label>
            <label className="block text-xs font-semibold text-[#5C5346]">
              Magazine page number
              <input
                name="magazine_page_number"
                type="number"
                min="1"
                className={`${adminInputClass} mt-1`}
                placeholder="Optional"
              />
            </label>
            <label className="block text-xs font-semibold text-[#5C5346]">
              Print placement type
              <select name="print_placement_type" className={`${adminInputClass} mt-1`} defaultValue="">
                <option value="">— None —</option>
                {PACKAGE_ENTITLEMENT_PRINT_PLACEMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 self-end text-xs text-[#3D3428]">
              <input type="checkbox" name="reserved_internal" value="1" />
              Reserved / internal (Leonix, event, partner)
            </label>
          </div>
          <label className="mt-2 block text-xs font-semibold text-[#5C5346]">
            Placement notes (optional)
            <input
              name="placement_notes"
              className={`${adminInputClass} mt-1`}
              placeholder="e.g. Next to restaurant section"
            />
          </label>
        </fieldset>

        <label className="block text-xs font-semibold text-[#5C5346]">
          Notes (optional)
          <textarea name="notes" rows={2} className={`${adminInputClass} mt-1`} />
        </label>

        <p className="text-[10px] text-[#7A7164]">
          Creator: recorded as Admin (leonix_admin cookie does not expose staff email yet).
        </p>

        <PackageEntitlementSalesPreview />

        <details className="rounded-xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 p-3 text-xs text-[#5C5346]">
          <summary className="cursor-pointer font-bold text-[#1E1810]">Benefits preview by tier</summary>
          <ul className="mt-2 space-y-1">
            {PACKAGE_ENTITLEMENT_TIERS.map((t) => {
              const def = getPackageEntitlementBenefits(t.value);
              return (
                <li key={t.value}>
                  <strong>{t.label}:</strong> {benefitLabels(def.benefits).join(", ") || "—"}
                  {def.eligibleForDestacadosModule ? " · Destacados" : ""}
                  {def.eligibleForResultsPriority ? " · Results priority" : ""}
                </li>
              );
            })}
          </ul>
        </details>

        <button type="submit" className={adminBtnPrimary} disabled={unavailable}>
          Create package entitlement
        </button>
      </form>

      <section className={`${adminCardBase} p-4 sm:p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Tracker — entitlements</h2>
        <p className="mt-1 text-xs text-[#7A7164]">Revoke, extend end date, or attach listing. Revoke does not delete the row.</p>

        {rows.length === 0 ? (
          <p className="mt-4 text-sm text-[#5C5346]/90">No results. Adjust filters or create an entitlement.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {rows.map((row) => {
              const effective = effectiveEntitlementStatus(row);
              const labels = benefitLabels(row.benefits);
              const salesRep = formatSalesRepAttribution(row.metadata);
              const creator = formatCreatorAttribution(row.metadata);
              const pricingLine = formatEntitlementPricingPromoLine(row.metadata);
              const commissionLine = formatEntitlementCommissionPreviewLine(row.metadata);
              const pricingBadges = entitlementPricingBadges(row.metadata);
              const canManage = effective !== "revoked";

              return (
                <li
                  key={row.id}
                  className="rounded-2xl border border-[#E8DFD0]/80 bg-[#FFFCF7]/90 p-3 text-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs font-bold text-[#1E1810]">{row.entitlement_code ?? "—"}</p>
                      <p className="mt-0.5 font-semibold text-[#1E1810]">{formatEntitlementListingHeadline(row)}</p>
                      <p className="text-xs text-[#7A7164]">
                        {row.package_tier} · {row.category} · {row.listing_source}
                        {!row.listing_id ? (
                          <span className="ml-1 rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-950">
                            Pending listing
                          </span>
                        ) : null}
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-[#5C5346]">{formatEntitlementListingIdLine(row.listing_id)}</p>
                      {pricingLine ? <p className="mt-1 text-xs font-medium text-[#3D3428]">{pricingLine}</p> : null}
                      {pricingBadges.length > 0 ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {pricingBadges.map((b) => (
                            <span
                              key={b}
                              className="rounded-full bg-[#E8DFD0]/80 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#5C5346]"
                            >
                              {b}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      {(() => {
                        const pp = row.metadata?.print_placement as Record<string, unknown> | undefined;
                        if (!pp) return null;
                        const parts: string[] = [];
                        if (pp.magazine_issue) parts.push(String(pp.magazine_issue));
                        if (pp.print_placement_type) parts.push(String(pp.print_placement_type).replace(/_/g, " "));
                        if (pp.magazine_page_number != null) parts.push(`p.${pp.magazine_page_number}`);
                        if (pp.digital_placement_priority != null) parts.push(`priority: ${pp.digital_placement_priority}`);
                        if (pp.reserved_internal === true) parts.push("reserved/internal");
                        return parts.length ? (
                          <p className="mt-1 text-xs font-medium text-indigo-900">
                            Magazine: {parts.join(" · ")}
                          </p>
                        ) : null;
                      })()}
                      {salesRep ? <p className="mt-1 text-xs text-[#5C5346]">Sales rep: {salesRep}</p> : null}
                      {commissionLine ? (
                        <p className="mt-0.5 text-[10px] text-amber-900">{commissionLine}</p>
                      ) : null}
                      <p className="mt-0.5 text-[10px] text-[#7A7164]">Created by: {creator}</p>
                      {row.contract_code ? (
                        <p className="mt-0.5 font-mono text-[10px] text-[#5C5346]">Contract: {row.contract_code}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-[#5C5346]">
                        {fmt(row.starts_at)} → {fmt(row.ends_at)}
                      </p>
                      <p className="mt-1 text-xs text-[#5C5346]">
                        Benefits: {labels.length ? labels.join(" · ") : "—"}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadgeClass(effective)}`}>
                      {effective}
                    </span>
                  </div>

                  {canManage ? (
                    <div className="mt-3 space-y-2 border-t border-[#E8DFD0]/60 pt-3">
                      {!row.listing_id ? (
                        <form action={attachListingToPackageEntitlementAction} className="flex flex-wrap items-end gap-2">
                          {preserveFilterHiddenFields(sp)}
                          <input type="hidden" name="id" value={row.id} />
                          <label className="min-w-0 flex-1 text-xs font-semibold text-[#5C5346]">
                            Attach listing ID
                            <input
                              name="listing_id"
                              required
                              className={`${adminInputClass} mt-1 font-mono text-xs`}
                              placeholder="UUID del anuncio publicado"
                            />
                          </label>
                          <button type="submit" className={`${adminBtnSecondary} shrink-0 text-xs`}>
                            Attach
                          </button>
                        </form>
                      ) : null}

                      <form action={extendPackageEntitlementAction} className="flex flex-wrap items-end gap-2">
                        {preserveFilterHiddenFields(sp)}
                        <input type="hidden" name="id" value={row.id} />
                        <label className="min-w-0 flex-1 text-xs font-semibold text-[#5C5346]">
                          Extend end date
                          <input
                            type="datetime-local"
                            name="ends_at"
                            required
                            className={`${adminInputClass} mt-1`}
                            defaultValue={toLocalDatetimeValue(row.ends_at)}
                          />
                        </label>
                        <button type="submit" className={`${adminBtnSecondary} shrink-0 text-xs`}>
                          Extend
                        </button>
                      </form>

                      <form action={revokePackageEntitlementAction} className="inline">
                        {preserveFilterHiddenFields(sp)}
                        <input type="hidden" name="id" value={row.id} />
                        <button type="submit" className={`${adminBtnSecondary} text-xs text-rose-900`}>
                          Revoke / cancel
                        </button>
                      </form>
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-rose-800">Revoked — read only.</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <Link href="/admin" className={`${adminBtnSecondary} inline-flex`}>
        ← Dashboard
      </Link>
    </div>
  );
}
