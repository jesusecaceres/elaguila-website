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
  effectivePromoCodeStatus,
  fetchPromoCodesForTracker,
  formatPromoCustomerLine,
  formatPromoSalesRepLine,
} from "@/app/admin/_lib/promoCodeData";
import { promoCodeRuleBadges, buildPromoCodeRulePreview } from "@/app/lib/listingPlans/promoCodeLifecycle";
import { createPromoCodeAction, revokePromoCodeAction } from "./actions";
import { PromoCodeLifecyclePreview } from "./PromoCodeLifecyclePreview";

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

  const { rows: rawRows, unavailable, note, totalFetched } = await fetchPromoCodesForTracker({
    q: filterQ || undefined,
    category: filterCategory || undefined,
    code_type: filterType || undefined,
    status: filterStatus || undefined,
    limit: PROMO_CODE_TRACKER_FETCH_LIMIT,
  });
  const rows = filterPromoCodesForAccess(rawRows, access);

  return (
    <div className="max-w-5xl space-y-6">
      <AdminPageHeader
        eyebrow="Workspace · Monetization · Promo lifecycle"
        title="Promo codes"
        subtitle={
          salesRepLocked
            ? "Limited view: only your promo codes attributed to your sales rep ID."
            : "Admin-only promo-code lifecycle manager. This is not the public Cupones CMS."
        }
        helperText="Rules from packagePricingRules and promoCodeLifecycle. No public redemption or Stripe Checkout."
        rightSlot={
          <div className="flex flex-wrap gap-2">
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
        <p className="font-bold">Important</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed">
          <li>Admin-only promo-code lifecycle manager. This is not the public Cupones CMS.</li>
          <li>Promo code = discount/attribution; package entitlement = visibility/access (may be linked).</li>
          <li>Newsletter/SMS codes are placeholders for future unique generation.</li>
          <li>No public redemption, Stripe Checkout, paid commissions, or Servicios sorting in this gate.</li>
        </ul>
      </div>

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
        <form id="promo-code-create-form" action={createPromoCodeAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-[#5C5346] sm:col-span-2">
            Code (empty = generate)
            <input name="code" placeholder="LX-PROMO-…" className={`${adminInputClass} mt-1 font-mono uppercase`} />
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Type
            <select name="code_type" defaultValue="entitlement" className={`${adminInputClass} mt-1`}>
              {PROMO_CODE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
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
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Business
            <input name="business_name" className={`${adminInputClass} mt-1`} />
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
              const badges = promoCodeRuleBadges(preview);
              const customer = formatPromoCustomerLine(row);
              const sales = formatPromoSalesRepLine(row);
              return (
                <li key={row.id} className="rounded-xl border border-[#E8DFD0]/80 bg-[#FFFCF7] p-3 text-xs">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-mono text-sm font-bold text-[#1E1810]">{row.code}</p>
                      <p className="mt-0.5 text-[#5C5346]">
                        {row.code_type}
                        {row.category ? ` · ${row.category}` : ""}
                        {row.package_tier ? ` · ${row.package_tier}` : ""}
                        {row.contract_term ? ` · ${row.contract_term.replace(/_/g, " ")}` : ""}
                      </p>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${statusBadgeClass(effective)}`}>
                      {effective}
                      {effective !== row.status ? ` (stored: ${row.status})` : ""}
                    </span>
                  </div>
                  {customer ? <p className="mt-1 text-[#5C5346]">{customer}</p> : null}
                  {sales ? <p className="text-[#7A7164]">Sales: {sales}</p> : null}
                  {row.package_entitlement_id ? (
                    <p className="mt-1">
                      <Link
                        href="/admin/workspace/package-entitlements"
                        className="font-semibold text-[#6B5B2E] underline"
                      >
                        Entitlement: {row.package_entitlement_id.slice(0, 8)}…
                      </Link>
                    </p>
                  ) : null}
                  <p className="mt-1 text-[#7A7164]">
                    {fmt(row.starts_at)} → {fmt(row.ends_at)} · redemptions {row.redemption_count}
                    {row.max_redemptions != null ? ` / ${row.max_redemptions}` : ""}
                  </p>
                  {badges.length ? <p className="mt-1 text-[10px] text-[#7A7164]">{badges.join(" · ")}</p> : null}
                  {effective !== "revoked" && effective !== "redeemed" ? (
                    <form action={revokePromoCodeAction} className="mt-2">
                      <input type="hidden" name="id" value={row.id} />
                      <input type="hidden" name="q" value={filterQ} />
                      <input type="hidden" name="category" value={filterCategory} />
                      <input type="hidden" name="code_type" value={filterType} />
                      <input type="hidden" name="status" value={filterStatus} />
                      <button type="submit" className={adminBtnSecondary}>
                        Revoke
                      </button>
                    </form>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
