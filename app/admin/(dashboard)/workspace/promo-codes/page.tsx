import Link from "next/link";
import { AdminPageHeader } from "@/app/admin/_components/AdminPageHeader";
import {
  adminBtnPrimary,
  adminBtnSecondary,
  adminCardBase,
  adminInputClass,
} from "@/app/admin/_components/adminTheme";
import {
  PROMO_CODE_CATEGORIES,
  PROMO_CODE_CONTRACT_TERMS,
  PROMO_CODE_PACKAGE_SCOPE_OPTIONS,
  PROMO_CODE_PACKAGE_TIERS,
  PROMO_CODE_STATUSES,
  PROMO_CODE_TRACKER_FETCH_LIMIT,
  PROMO_CODE_TYPES,
} from "@/app/admin/_lib/promoCodeConstants";
import {
  filterPromoCodesForAccess,
  getCurrentAdminAccessContext,
  getSalesRepScopeForAdmin,
  isSalesRepRole,
} from "@/app/admin/_lib/adminAccessControl";
import {
  computePromoAttentionFlags,
  computePromoOsSummary,
  computeUsageEntryMismatchFlags,
  effectivePromoCodeStatus,
  fetchPromoCodesForTracker,
  fetchPromoUsageLedgerForCodes,
  formatPromoCategoryScope,
  formatPromoCustomerLine,
  formatPromoDiscountSummary,
  formatPromoPackageScope,
  formatPromoSalesRepLine,
  promoAttentionFlagLabel,
  promoCodeMissingDiscount,
  promoCodeUsageMode,
  type PromoCodeAttentionFlag,
  type PromoCodeUsageEntry,
} from "@/app/admin/_lib/promoCodeData";
import { promoCodeRuleBadges, buildPromoCodeRulePreview } from "@/app/lib/listingPlans/promoCodeLifecycle";
import { createPromoCodeAction, revokePromoCodeAction } from "./actions";
import { PromoCodeLifecyclePreview } from "./PromoCodeLifecyclePreview";
import { PromoCodeQuickCreateControls } from "./PromoCodeQuickCreateControls";

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

function fmt(iso: string | null) {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return Number.isFinite(d.getTime())
      ? d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })
      : iso;
  } catch {
    return iso;
  }
}

function attentionBadgeClass(flag: PromoCodeAttentionFlag): string {
  switch (flag) {
    case "missing_discount":
      return "bg-rose-100 text-rose-950";
    case "expiring_soon":
      return "bg-amber-100 text-amber-950";
    case "max_reached":
      return "bg-stone-200 text-stone-800";
    case "limit_nearly_reached":
      return "bg-orange-100 text-orange-950";
    case "assigned_business_mismatch":
    case "assigned_email_mismatch":
      return "bg-violet-100 text-violet-950";
    default:
      return "bg-[#F4F0E8] text-[#5C5346]";
  }
}

function money(cents: number | null | undefined) {
  if (cents == null || !Number.isFinite(cents)) return "—";
  return `$${(cents / 100).toFixed(2)}`;
}

function truncateId(id: string | null | undefined, len = 8) {
  if (!id) return "—";
  return id.length > len ? `${id.slice(0, len)}…` : id;
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-950";
    case "draft":
      return "bg-amber-100 text-amber-950";
    case "expired":
      return "bg-stone-200 text-stone-800";
    case "revoked":
      return "bg-rose-100 text-rose-950";
    case "redeemed":
      return "bg-violet-100 text-violet-950";
    default:
      return "bg-[#F4F0E8] text-[#5C5346]";
  }
}

function alertFromSearch(sp: Record<string, string | undefined>) {
  if (sp.created === "1") {
    return { kind: "ok" as const, text: `Promo code created: ${sp.code ?? "—"}` };
  }
  if (sp.revoked === "1") return { kind: "ok" as const, text: "Code revoked (record not deleted)." };
  if (sp.error === "duplicate_code") {
    return { kind: "err" as const, text: "Code already exists. Use another or leave the field empty to generate one." };
  }
  if (sp.error) {
    return { kind: "err" as const, text: `Could not complete (${sp.error}${sp.detail ? `: ${sp.detail}` : ""}).` };
  }
  return null;
}

export default async function AdminPromoCodesPage(props: {
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
  const filterType = sp.code_type?.trim() ?? "";
  const filterStatus = sp.status?.trim() ?? "";
  const filterAttention = sp.attention?.trim() ?? "";

  const { rows: rawRows, unavailable, note, totalFetched } = await fetchPromoCodesForTracker({
    q: filterQ || undefined,
    category: filterCategory || undefined,
    code_type: filterType || undefined,
    status: filterStatus || undefined,
    attention: filterAttention || undefined,
    limit: PROMO_CODE_TRACKER_FETCH_LIMIT,
  });
  const rows = filterPromoCodesForAccess(rawRows, access);
  const usageLedger = unavailable
    ? new Map<string, PromoCodeUsageEntry[]>()
    : await fetchPromoUsageLedgerForCodes(rows.map((r) => r.id));
  const osSummary = computePromoOsSummary(rows, usageLedger);

  return (
    <div className="max-w-5xl space-y-6">
      <AdminPageHeader
        eyebrow="Workspace · Revenue OS · Promo Admin OS"
        title="Promo codes"
        subtitle="Admin-only Revenue OS promo-code manager. This is not the public Cupones CMS."
        helperText="Promo codes are validated by Revenue OS checkout. Redemption is finalized only after successful Stripe webhook payment."
        rightSlot={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/workspace/payment-tracker" className={adminBtnSecondary}>
              Payment tracker →
            </Link>
            <Link href="/admin/workspace/package-entitlements" className={adminBtnSecondary}>
              Package entitlements →
            </Link>
            <Link href="/admin/workspace/cupones" className={adminBtnSecondary}>
              CMS cupones →
            </Link>
          </div>
        }
      />

      <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-4 text-sm text-amber-950">
        <p className="font-bold">Leonix Promo Admin OS</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed">
          <li>Promo code = advertiser checkout discount and attribution for Leonix payment.</li>
          <li>Public Cupones / Ofertas Locales = separate customer-facing offers CMS (not this page).</li>
          <li>Validation is category/package scoped via Revenue OS checkout — not by exact business-name match.</li>
          <li>Redemption happens after paid webhook, not when the user clicks Apply.</li>
          <li>Use revocation, expiration, max redemptions, and usage tracking for leak control.</li>
        </ul>
      </div>

      {!unavailable ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Active codes", value: osSummary.activeCount },
            { label: "Redeemed / used", value: osSummary.usedCount },
            { label: "Expiring soon (14d)", value: osSummary.expiringSoonCount },
            { label: "Needs attention", value: osSummary.needsAttentionCount },
          ].map((card) => (
            <div key={card.label} className={`${adminCardBase} p-4`}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">{card.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums text-[#1E1810]">{card.value}</p>
            </div>
          ))}
        </section>
      ) : null}

      {alert ? (
        <div
          className={`rounded-2xl border p-4 text-sm ${
            alert.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-950"
              : "border-rose-200 bg-rose-50 text-rose-950"
          }`}
        >
          {alert.text}
        </div>
      ) : null}

      {unavailable ? (
        <div className={`${adminCardBase} border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-950`}>
          <p className="font-bold">Table unavailable</p>
          <p className="mt-1 text-xs">{note ?? "Apply the leonix_promo_codes migration in Supabase."}</p>
        </div>
      ) : null}

      <section className={`${adminCardBase} p-4 sm:p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Search & filter</h2>
        <form method="get" className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-[#5C5346] sm:col-span-2">
            Search
            <input
              name="q"
              defaultValue={filterQ}
              placeholder="code, business, customer, email, sales rep, entitlement ID…"
              className={`${adminInputClass} mt-1`}
            />
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Category
            <select name="category" defaultValue={filterCategory} className={`${adminInputClass} mt-1`}>
              <option value="">All</option>
              {PROMO_CODE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Code type
            <select name="code_type" defaultValue={filterType} className={`${adminInputClass} mt-1`}>
              <option value="">All</option>
              {PROMO_CODE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Status
            <select name="status" defaultValue={filterStatus} className={`${adminInputClass} mt-1`}>
              {PROMO_CODE_STATUSES.map((s) => (
                <option key={s.value || "all"} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346] sm:col-span-2">
            Attention filter
            <select name="attention" defaultValue={filterAttention} className={`${adminInputClass} mt-1`}>
              <option value="">All codes</option>
              <option value="needs_attention">Needs attention</option>
              <option value="has_redemptions">Has redemptions</option>
              <option value="missing_discount">Missing discount value</option>
            </select>
          </label>
          <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
            <button type="submit" className={adminBtnPrimary}>
              Apply filters
            </button>
            <Link href="/admin/workspace/promo-codes" className={adminBtnSecondary}>
              Clear
            </Link>
          </div>
        </form>
        <p className="mt-2 text-[10px] text-[#7A7164]">
          Showing {rows.length} of {totalFetched} recent rows (max {PROMO_CODE_TRACKER_FETCH_LIMIT}).
        </p>
      </section>

      <section className={`${adminCardBase} p-4 sm:p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Create promo code</h2>
        <div className="mt-3 rounded-xl border border-[#E8DFD0]/80 bg-[#FFFCF7] p-3 text-xs text-[#5C5346]">
          <p className="font-semibold text-[#1E1810]">Launch code example (Restaurantes)</p>
          <p className="mt-1 leading-relaxed">
            Code: <span className="font-mono">RESTO-LAUNCH-25-V2</span> · Category: Restaurantes · Package scope:{" "}
            <span className="font-mono">restaurantes_base_monthly</span> · Discount: 25% off · Type: Discount
          </p>
          <p className="mt-1 text-[#7A7164]">
            Public launch codes are not tied to one business. Assigned/private codes store customer/business for tracking
            only — checkout is not hard-blocked by exact business name.
          </p>
        </div>
        <form id="promo-code-create-form" action={createPromoCodeAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <PromoCodeQuickCreateControls />
          </div>
          <label className="block text-xs font-semibold text-[#5C5346] sm:col-span-2">
            Code (empty = generate)
            <input name="code" placeholder="LX-PROMO-…" className={`${adminInputClass} mt-1 font-mono uppercase`} />
            <span className="mt-1 block text-[10px] font-normal text-[#7A7164]">
              Leave blank to auto-generate a Leonix code on save. The server normalizes and enforces uniqueness.
            </span>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Type
            <select name="code_type" defaultValue="discount" className={`${adminInputClass} mt-1`}>
              {PROMO_CODE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Discount type (when Type = Discount)
            <select name="promo_type" defaultValue="percent_off" className={`${adminInputClass} mt-1`}>
              <option value="percent_off">Percent off</option>
              <option value="amount_off">Amount off ($)</option>
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Percent off (1–100)
            <input name="percent_off" type="number" min={1} max={100} step={1} placeholder="25" className={`${adminInputClass} mt-1`} />
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Amount off ($)
            <input name="amount_off_dollars" type="number" min={0.01} step={0.01} placeholder="99.00" className={`${adminInputClass} mt-1`} />
          </label>
          <label className="block text-xs font-semibold text-[#5C5346] sm:col-span-2">
            Revenue OS package scope (optional)
            <select name="package_scope" defaultValue="" className={`${adminInputClass} mt-1 font-mono`}>
              {PROMO_CODE_PACKAGE_SCOPE_OPTIONS.map((opt) => (
                <option key={opt.value || "any"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-[10px] font-normal text-[#7A7164]">
              Example: restaurantes_base_monthly — limits checkout to that Revenue OS package key. Blank = any package
              (category-only code).
            </span>
            <details className="mt-2">
              <summary className="cursor-pointer text-[10px] font-semibold text-[#7A7164]">
                Advanced: custom package key
              </summary>
              <input
                name="package_scope_custom"
                placeholder="custom_package_key"
                className={`${adminInputClass} mt-1 font-mono lowercase`}
              />
              <span className="mt-1 block text-[10px] font-normal text-[#7A7164]">
                Overrides the dropdown when set. Use only for keys not yet in the Revenue OS matrix.
              </span>
            </details>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Initial status
            <select name="status" defaultValue="active" className={`${adminInputClass} mt-1`}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Category
            <select name="category" className={`${adminInputClass} mt-1`}>
              <option value="">—</option>
              {PROMO_CODE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Package tier
            <select name="package_tier" className={`${adminInputClass} mt-1`}>
              <option value="">—</option>
              {PROMO_CODE_PACKAGE_TIERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346] sm:col-span-2">
            Contract term
            <select name="contract_term" defaultValue="month_to_month" className={`${adminInputClass} mt-1`}>
              {PROMO_CODE_CONTRACT_TERMS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Start
            <input type="datetime-local" name="starts_at" defaultValue={defaultStartLocal()} className={`${adminInputClass} mt-1`} />
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            End
            <input type="datetime-local" name="ends_at" defaultValue={defaultEndLocal()} className={`${adminInputClass} mt-1`} />
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Customer
            <input name="customer_name" className={`${adminInputClass} mt-1`} />
            <span className="mt-1 block text-[10px] font-normal text-[#7A7164]">
              Optional tracking only — does not hard-block checkout by exact name.
            </span>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Business
            <input name="business_name" className={`${adminInputClass} mt-1`} />
            <span className="mt-1 block text-[10px] font-normal text-[#7A7164]">
              Optional tracking for assigned/private codes. Mismatch flags appear after paid usage.
            </span>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Email
            <input name="customer_email" type="email" className={`${adminInputClass} mt-1`} />
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Phone
            <input name="customer_phone" className={`${adminInputClass} mt-1`} />
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
                Sales rep ID
                <input name="sales_rep_id" className={`${adminInputClass} mt-1`} />
                <span className="mt-1 block text-[10px] font-normal text-[#7A7164]">Used for attribution and follow-up.</span>
              </label>
              <label className="block text-xs font-semibold text-[#5C5346]">
                Sales rep name
                <input name="sales_rep_name" className={`${adminInputClass} mt-1`} />
              </label>
            </>
          )}
          <label className="block text-xs font-semibold text-[#5C5346] sm:col-span-2">
            Package entitlement ID (optional)
            <input
              name="package_entitlement_id"
              placeholder="uuid del entitlement vinculado"
              className={`${adminInputClass} mt-1 font-mono text-xs`}
            />
          </label>
          <label className="block text-xs font-semibold text-[#5C5346] sm:col-span-2">
            Notas (metadata)
            <textarea name="notes" rows={2} className={`${adminInputClass} mt-1`} />
            <span className="mt-1 block text-[10px] font-normal text-[#7A7164]">Internal admin notes only.</span>
          </label>
          <div className="sm:col-span-2">
            <PromoCodeLifecyclePreview />
          </div>
          <div className="sm:col-span-2">
            <button type="submit" className={adminBtnPrimary} disabled={unavailable}>
              Create promo code
            </button>
          </div>
        </form>
      </section>

      <section className={`${adminCardBase} p-4 sm:p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Recent codes</h2>
        {rows.length === 0 ? (
          <p className="mt-3 text-sm text-[#5C5346]/90">No codes match the filters.</p>
        ) : (
          <ul className="mt-4 space-y-4">
            {rows.map((row) => {
              const effective = effectivePromoCodeStatus(row);
              const preview = buildPromoCodeRulePreview({ codeType: row.code_type, status: effective });
              const ruleBadges = promoCodeRuleBadges(preview);
              const customer = formatPromoCustomerLine(row);
              const sales = formatPromoSalesRepLine(row);
              const usage = usageLedger.get(row.id) ?? [];
              const attentionFlags = computePromoAttentionFlags(row, usage);
              const usageMode = promoCodeUsageMode(row);
              const discountSummary = formatPromoDiscountSummary(row);
              const missingDiscount = promoCodeMissingDiscount(row);

              return (
                <li key={row.id} className="rounded-xl border border-[#E8DFD0]/80 bg-[#FFFCF7] p-3 text-xs">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-sm font-bold text-[#1E1810]">{row.code}</p>
                      <p className="mt-0.5 text-[#5C5346]">
                        {row.code_type}
                        {usageMode === "assigned_private" ? " · assigned/private" : " · public launch"}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadgeClass(effective)}`}>
                      {effective}
                      {effective !== row.status ? ` (stored: ${row.status})` : ""}
                    </span>
                  </div>

                  <div className="mt-2 grid gap-1 sm:grid-cols-2">
                    <p className="text-[#5C5346]">
                      <span className="font-semibold text-[#1E1810]">Discount:</span>{" "}
                      <span className={missingDiscount ? "font-semibold text-rose-700" : ""}>{discountSummary}</span>
                    </p>
                    <p className="text-[#5C5346]">
                      <span className="font-semibold text-[#1E1810]">Category:</span> {formatPromoCategoryScope(row)}
                    </p>
                    <p className="text-[#5C5346] sm:col-span-2">
                      <span className="font-semibold text-[#1E1810]">Package scope:</span> {formatPromoPackageScope(row)}
                    </p>
                  </div>

                  {customer ? (
                    <p className="mt-1 text-[#5C5346]">
                      <span className="font-semibold text-[#1E1810]">Assigned:</span> {customer}
                    </p>
                  ) : null}
                  {sales ? (
                    <p className="text-[#7A7164]">
                      <span className="font-semibold">Sales rep:</span> {sales}
                    </p>
                  ) : null}

                  {row.package_entitlement_id ? (
                    <p className="mt-1">
                      <Link
                        href="/admin/workspace/package-entitlements"
                        className="font-semibold text-[#6B5B2E] underline"
                      >
                        Entitlement: {truncateId(row.package_entitlement_id)}
                      </Link>
                    </p>
                  ) : null}

                  <p className="mt-1 text-[#7A7164]">
                    {fmt(row.starts_at)} → {fmt(row.ends_at)} · redemptions {row.redemption_count}
                    {row.max_redemptions != null ? ` / ${row.max_redemptions}` : ""}
                  </p>

                  {attentionFlags.length ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {attentionFlags.map((flag) => (
                        <span
                          key={flag}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${attentionBadgeClass(flag)}`}
                        >
                          {promoAttentionFlagLabel(flag)}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {ruleBadges.length ? (
                    <p className="mt-1 text-[10px] text-[#7A7164]">{ruleBadges.join(" · ")}</p>
                  ) : null}

                  <div className="mt-3 rounded-lg border border-[#E8DFD0]/60 bg-white/60 p-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">Usage</p>
                    {usage.length === 0 ? (
                      <p className="mt-1 text-[#5C5346]">No linked paid usage yet.</p>
                    ) : (
                      <ul className="mt-2 space-y-3">
                        {usage.map((entry) => {
                          const entryMismatch = computeUsageEntryMismatchFlags(row, entry);
                          const webhookRedeemed =
                            entry.redemptionStatus === "redeemed" && entry.paymentStatus === "paid";
                          return (
                            <li key={entry.redemptionId} className="rounded-md border border-[#E8DFD0]/50 p-2">
                              {entry.usedBusinessName ? (
                                <p>
                                  <span className="font-semibold text-[#1E1810]">Used by business:</span>{" "}
                                  {entry.usedBusinessName}
                                </p>
                              ) : null}
                              {entry.usedEmail ? (
                                <p>
                                  <span className="font-semibold text-[#1E1810]">Customer email:</span> {entry.usedEmail}
                                </p>
                              ) : null}
                              {entry.listingId ? (
                                <p>
                                  <span className="font-semibold text-[#1E1810]">Listing ID:</span>{" "}
                                  <span className="font-mono">{truncateId(entry.listingId, 12)}</span>
                                </p>
                              ) : null}
                              {entry.leonixAdId ? (
                                <p>
                                  <span className="font-semibold text-[#1E1810]">Leonix Ad ID:</span>{" "}
                                  <span className="font-mono">{truncateId(entry.leonixAdId, 12)}</span>
                                </p>
                              ) : null}
                              {entry.paymentRecordId ? (
                                <p>
                                  <span className="font-semibold text-[#1E1810]">Payment record:</span>{" "}
                                  <span className="font-mono">{truncateId(entry.paymentRecordId, 12)}</span>
                                </p>
                              ) : null}
                              {entry.stripeCheckoutSessionId ? (
                                <p>
                                  <span className="font-semibold text-[#1E1810]">Stripe session:</span>{" "}
                                  <span className="font-mono">{truncateId(entry.stripeCheckoutSessionId, 16)}</span>
                                </p>
                              ) : null}
                              <p>
                                <span className="font-semibold text-[#1E1810]">Payment status:</span>{" "}
                                {entry.paymentStatus ?? "—"}
                              </p>
                              <p>
                                <span className="font-semibold text-[#1E1810]">Redeemed after webhook:</span>{" "}
                                {webhookRedeemed ? "yes" : entry.redemptionStatus === "redeemed" ? "partial" : "no"}
                              </p>
                              {entry.redeemedAt ? (
                                <p>
                                  <span className="font-semibold text-[#1E1810]">Redeemed at:</span> {fmt(entry.redeemedAt)}
                                </p>
                              ) : null}
                              <p>
                                <span className="font-semibold text-[#1E1810]">Discount applied:</span>{" "}
                                {entry.amountDiscountCents != null
                                  ? money(entry.amountDiscountCents)
                                  : entry.discountCents > 0
                                    ? money(entry.discountCents)
                                    : "—"}
                              </p>
                              {entry.amountTotalCents != null ? (
                                <p>
                                  <span className="font-semibold text-[#1E1810]">Final amount:</span>{" "}
                                  {money(entry.amountTotalCents)}
                                </p>
                              ) : null}
                              {entryMismatch.length ? (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {entryMismatch.map((flag) => (
                                    <span
                                      key={flag}
                                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${attentionBadgeClass(flag)}`}
                                    >
                                      {promoAttentionFlagLabel(flag)}
                                    </span>
                                  ))}
                                </div>
                              ) : null}
                              <div className="mt-2 flex flex-wrap gap-2">
                                {entry.paymentTrackerHref ? (
                                  <Link href={entry.paymentTrackerHref} className={adminBtnSecondary}>
                                    View payment
                                  </Link>
                                ) : null}
                                {entry.publicAdUrl ? (
                                  <Link href={entry.publicAdUrl} className={adminBtnSecondary} target="_blank">
                                    View published ad
                                  </Link>
                                ) : null}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-2">
                    {effective !== "revoked" && effective !== "redeemed" ? (
                      <form action={revokePromoCodeAction}>
                        <input type="hidden" name="id" value={row.id} />
                        <input type="hidden" name="q" value={filterQ} />
                        <input type="hidden" name="category" value={filterCategory} />
                        <input type="hidden" name="code_type" value={filterType} />
                        <input type="hidden" name="status" value={filterStatus} />
                        <input type="hidden" name="attention" value={filterAttention} />
                        <button type="submit" className={adminBtnSecondary}>
                          Revoke
                        </button>
                      </form>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
