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
  computePromoOsSummary,
  effectivePromoCodeStatus,
  fetchPromoCodesForTracker,
  fetchPromoUsageLedgerForCodes,
  type PromoCodeUsageEntry,
} from "@/app/admin/_lib/promoCodeData";
import { getPromoDeliveryStatusKey, PROMO_MANUAL_FOLLOW_UP_REMINDER } from "@/app/admin/_lib/promoCodeDisplayHelpers";
import { buildPromoRecentCardViews } from "@/app/admin/_lib/promoCodeRecentCardMapper";
import {
  PROMO_OS_CREAM_CARD,
  PROMO_OS_CREAM_PANEL,
  PROMO_OS_SERIF_TITLE,
} from "@/app/admin/_lib/promoCodeOsV2Theme";
import { promoCodeRuleBadges, buildPromoCodeRulePreview } from "@/app/lib/listingPlans/promoCodeLifecycle";
import { createPromoCodeAction, revokePromoCodeAction } from "./actions";
import { PromoCodeFieldGuidance } from "./PromoCodeFieldGuidance";
import { PromoCodeLifecyclePreview } from "./PromoCodeLifecyclePreview";
import { PromoCodeQuickCreateControls } from "./PromoCodeQuickCreateControls";
import { PromoCodeRecentCodesPanel } from "./PromoCodeRecentCodesPanel";

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

function alertFromSearch(sp: Record<string, string | undefined>) {
  if (sp.created === "1") {
    return { kind: "ok" as const, text: `Promo code created: ${sp.code ?? "—"}` };
  }
  if (sp.revoked === "1") return { kind: "ok" as const, text: "Code revoked (record not deleted)." };
  if (sp.error === "duplicate_code") {
    return { kind: "err" as const, text: "Code already exists. Use another or leave the field empty to generate one." };
  }
  const friendlyErrors: Record<string, string> = {
    newsletter_email_required:
      "Newsletter codes need a customer email so Leonix can send or track the unique code.",
    sms_phone_required: "SMS codes need a phone number so Leonix can send or track the unique code.",
    discount_value_required: "Discount codes need a percent or dollar amount before saving.",
    invalid_percent: "Percent discount must be between 1 and 100.",
    invalid_amount: "Dollar discount must be greater than zero.",
    end_before_start: "End date must be after the start date.",
    invalid_code_type: "That promo purpose is not allowed. Pick a value from the dropdown.",
    invalid_status: "That status is not allowed. Use Draft or Active for new codes.",
  };
  if (sp.error && friendlyErrors[sp.error]) {
    return { kind: "err" as const, text: friendlyErrors[sp.error] };
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
  const filterDelivery = sp.delivery_status?.trim() ?? "";
  const isNewsletterView = filterType === "newsletter";

  const { rows: rawRows, unavailable, note, totalFetched } = await fetchPromoCodesForTracker({
    q: filterQ || undefined,
    category: filterCategory || undefined,
    code_type: filterType || undefined,
    status: filterStatus || undefined,
    attention: filterAttention || undefined,
    limit: PROMO_CODE_TRACKER_FETCH_LIMIT,
  });
  let rows = filterPromoCodesForAccess(rawRows, access);
  if (filterDelivery) {
    rows = rows.filter((row) => getPromoDeliveryStatusKey(row) === filterDelivery);
  }
  const usageLedger = unavailable
    ? new Map<string, PromoCodeUsageEntry[]>()
    : await fetchPromoUsageLedgerForCodes(rows.map((r) => r.id));
  const osSummary = computePromoOsSummary(rows, usageLedger);

  const ruleBadgesByRow = new Map<string, string[]>();
  for (const row of rows) {
    const effective = effectivePromoCodeStatus(row);
    const preview = buildPromoCodeRulePreview({ codeType: row.code_type, status: effective });
    ruleBadgesByRow.set(row.id, promoCodeRuleBadges(preview));
  }
  const recentCards = buildPromoRecentCardViews(rows, usageLedger, ruleBadgesByRow);

  return (
    <div className="max-w-5xl space-y-6">
      <AdminPageHeader
        eyebrow="Workspace · Revenue OS · Promo Admin OS"
        title="Promo codes"
        subtitle="Create and administer Revenue OS promo codes for discounts, tracking, and campaign attribution."
        helperText="Public Cupones / Ofertas Locales is a separate CMS. Promo codes can discount checkout or track customers — they do not grant paid placement, sorting, or visibility by themselves. Paid placement requires an active package entitlement or payment record."
        rightSlot={
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/leads/newsletter" className={adminBtnSecondary}>
              Newsletter inbox →
            </Link>
            <Link href="/admin/workspace/promo-codes?code_type=newsletter" className={adminBtnSecondary}>
              Launch 25 codes →
            </Link>
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

      <div className={`${PROMO_OS_CREAM_CARD} p-4 text-sm`}>
        <p className={PROMO_OS_SERIF_TITLE}>Promo Admin OS</p>
        <p className="mt-2 text-xs font-normal text-[#5C5346] leading-relaxed">
          Promo codes discount eligible website checkout payments. They do not grant placement, ranking, verification, or
          print/combo benefits by themselves. Redemption happens after paid webhook — not when the customer clicks Apply.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-xs font-normal text-[#5C5346] leading-relaxed">
          <li>Package entitlement = paid visibility truth (separate tracker).</li>
          <li>Validation is category/package scoped via Revenue OS checkout.</li>
          <li>Use filters below to audit active, redeemed, failed, expired, and category-specific codes.</li>
          <li>Each recent code card includes follow-up and next-action guidance.</li>
          <li>{PROMO_MANUAL_FOLLOW_UP_REMINDER}</li>
        </ul>
      </div>

      {!unavailable ? (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Active codes", value: osSummary.activeCount, accent: "text-emerald-800" },
            { label: "Redeemed / used", value: osSummary.usedCount, accent: "text-[#1E1810]" },
            { label: "Expiring soon (14d)", value: osSummary.expiringSoonCount, accent: "text-[#6B5B2E]" },
            { label: "Needs attention", value: osSummary.needsAttentionCount, accent: "text-[#7A1E2C]" },
          ].map((card) => (
            <div key={card.label} className={`${PROMO_OS_CREAM_PANEL} p-4`}>
              <p className="text-[10px] font-bold uppercase tracking-wide text-[#7A7164]">{card.label}</p>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${card.accent}`}>{card.value}</p>
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

      {isNewsletterView ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-950">
          <p className="font-bold">Newsletter / Launch 25 promo lookup</p>
          <p className="mt-2 text-xs leading-relaxed">
            Newsletter promo codes are tied to Launch 25 subscriber follow-up. Use the newsletter inbox for exports,
            BCC chunks, and manual outreach. {PROMO_MANUAL_FOLLOW_UP_REMINDER}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/admin/leads/newsletter" className={adminBtnSecondary}>
              Newsletter subscriber inbox →
            </Link>
            <Link href="/admin/workspace/promo-codes?code_type=newsletter" className={adminBtnSecondary}>
              Refresh newsletter codes
            </Link>
          </div>
        </div>
      ) : null}

      <section className={`${adminCardBase} p-4 sm:p-6`}>
        <h2 className="text-sm font-bold text-[#1E1810]">Search & filter</h2>
        <p className="mt-1 text-xs text-[#7A7164]">
          Search by code, email, customer name, business name, source, sales rep, or entitlement ID.
        </p>
        <form method="get" className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-semibold text-[#5C5346] sm:col-span-2">
            Search
            <input
              name="q"
              defaultValue={filterQ}
              placeholder={
                isNewsletterView
                  ? "code, email, customer name, business name, source…"
                  : "code, business, customer, email, sales rep, entitlement ID…"
              }
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
            Promo purpose
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
            Code status
            <select name="status" defaultValue={filterStatus} className={`${adminInputClass} mt-1`}>
              {PROMO_CODE_STATUSES.map((s) => (
                <option key={s.value || "all"} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-semibold text-[#5C5346]">
            Delivery status
            <select name="delivery_status" defaultValue={filterDelivery} className={`${adminInputClass} mt-1`}>
              <option value="">All delivery states</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
              <option value="pending">Pending</option>
              <option value="not_configured">Email not configured</option>
              <option value="not_sent">Not sent yet</option>
              <option value="unknown">Unknown / not sent</option>
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

      <section className={`${PROMO_OS_CREAM_CARD} p-4 sm:p-6`}>
        <h2 className={PROMO_OS_SERIF_TITLE}>Create promo code</h2>
        <div className={`${PROMO_OS_CREAM_PANEL} mt-3 p-3 text-xs text-[#5C5346]`}>
          <p className="font-semibold text-[#1E1810]">Before create checklist</p>
          <p className="mt-1 leading-relaxed">
            Discount codes affect checkout payment only — not placement, ranking, or print/combo benefits. Category scope
            is not listing ownership. Review the preset guide and preview rules before saving.
          </p>
        </div>
        <form id="promo-code-create-form" action={createPromoCodeAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <PromoCodeQuickCreateControls />
          </div>
          <PromoCodeFieldGuidance
            label="Code (empty = generate)"
            badge="optional"
            hint="Auto-generate is recommended. Custom only when admin needs a known code. Server normalizes and checks uniqueness."
            className="sm:col-span-2"
          >
            <input name="code" placeholder="LX-PROMO-…" className={`${adminInputClass} font-mono uppercase`} />
          </PromoCodeFieldGuidance>
          <PromoCodeFieldGuidance
            label="Promo purpose"
            badge="required"
            hint="Discount only affects checkout discount — does not grant placement or visibility."
          >
            <select name="code_type" defaultValue="discount" className={adminInputClass}>
              {PROMO_CODE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </PromoCodeFieldGuidance>
          <PromoCodeFieldGuidance
            label="Discount type"
            badge="required"
            hint="Percent or dollar amount applies when the promo purpose can discount payment."
          >
            <select name="promo_type" defaultValue="percent_off" className={adminInputClass}>
              <option value="percent_off">Percent off</option>
              <option value="amount_off">Amount off ($)</option>
            </select>
          </PromoCodeFieldGuidance>
          <PromoCodeFieldGuidance label="Percent off (1–100)" badge="required" hint="Required for percent discount codes.">
            <input name="percent_off" type="number" min={1} max={100} step={1} placeholder="25" className={adminInputClass} />
          </PromoCodeFieldGuidance>
          <PromoCodeFieldGuidance label="Amount off ($)" badge="required" hint="Required when discount type is amount off.">
            <input name="amount_off_dollars" type="number" min={0.01} step={0.01} placeholder="99.00" className={adminInputClass} />
          </PromoCodeFieldGuidance>
          <PromoCodeFieldGuidance
            label="Revenue OS package scope"
            badge="optional"
            hint="Limits which checkout package can use this code. Blank = any package in selected category. Does not grant placement."
            className="sm:col-span-2"
          >
            <select name="package_scope" defaultValue="" className={`${adminInputClass} font-mono`}>
              {PROMO_CODE_PACKAGE_SCOPE_OPTIONS.map((opt) => (
                <option key={opt.value || "any"} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <details className="mt-2">
              <summary className="cursor-pointer text-[10px] font-semibold text-[#7A7164]">
                Advanced: custom package key
              </summary>
              <input
                name="package_scope_custom"
                placeholder="custom_package_key"
                className={`${adminInputClass} mt-1 font-mono lowercase`}
              />
            </details>
          </PromoCodeFieldGuidance>
          <PromoCodeFieldGuidance label="Initial status" badge="required">
            <select name="status" defaultValue="active" className={adminInputClass}>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
            </select>
          </PromoCodeFieldGuidance>
          <PromoCodeFieldGuidance
            label="Category"
            badge="optional"
            hint="Optional for general newsletter codes. Important for category-specific codes. Not the same as listing ownership."
          >
            <select name="category" className={adminInputClass}>
              <option value="">—</option>
              {PROMO_CODE_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </PromoCodeFieldGuidance>
          <PromoCodeFieldGuidance
            label="Package tier"
            badge="tracking"
            hint="Tracking/entitlement context only. Does not grant print placement."
          >
            <select name="package_tier" className={adminInputClass}>
              <option value="">—</option>
              {PROMO_CODE_PACKAGE_TIERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </PromoCodeFieldGuidance>
          <PromoCodeFieldGuidance label="Contract term" badge="optional" className="sm:col-span-2">
            <select name="contract_term" defaultValue="month_to_month" className={adminInputClass}>
              {PROMO_CODE_CONTRACT_TERMS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </PromoCodeFieldGuidance>
          <PromoCodeFieldGuidance label="Start" badge="optional">
            <input type="datetime-local" name="starts_at" defaultValue={defaultStartLocal()} className={adminInputClass} />
          </PromoCodeFieldGuidance>
          <PromoCodeFieldGuidance label="End" badge="optional">
            <input type="datetime-local" name="ends_at" defaultValue={defaultEndLocal()} className={adminInputClass} />
          </PromoCodeFieldGuidance>
          <PromoCodeFieldGuidance
            label="Customer"
            badge="tracking"
            hint="Optional tracking — does not hard-block checkout by exact name."
          >
            <input name="customer_name" className={adminInputClass} />
          </PromoCodeFieldGuidance>
          <PromoCodeFieldGuidance
            label="Business"
            badge="tracking"
            hint="Optional tracking for assigned/private codes."
          >
            <input name="business_name" className={adminInputClass} />
          </PromoCodeFieldGuidance>
          <PromoCodeFieldGuidance
            label="Email"
            badge="optional"
            hint="Required for Newsletter promo purpose. Important for audit when a customer says code does not work."
          >
            <input name="customer_email" type="email" className={adminInputClass} />
          </PromoCodeFieldGuidance>
          <PromoCodeFieldGuidance
            label="Phone"
            badge="tracking"
            hint="Required for SMS promo purpose. Tracking for other types."
          >
            <input name="customer_phone" className={adminInputClass} />
          </PromoCodeFieldGuidance>
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
              <PromoCodeFieldGuidance label="Sales rep ID" badge="tracking" hint="Optional follow-up attribution.">
                <input name="sales_rep_id" className={adminInputClass} />
              </PromoCodeFieldGuidance>
              <PromoCodeFieldGuidance label="Sales rep name" badge="tracking">
                <input name="sales_rep_name" className={adminInputClass} />
              </PromoCodeFieldGuidance>
            </>
          )}
          <PromoCodeFieldGuidance
            label="Package entitlement ID"
            badge="risk"
            hint="Optional advanced field. Do not fill unless entitlement already exists."
            className="sm:col-span-2"
          >
            <input
              name="package_entitlement_id"
              placeholder="uuid del entitlement vinculado"
              className={`${adminInputClass} font-mono text-xs`}
            />
          </PromoCodeFieldGuidance>
          <PromoCodeFieldGuidance
            label="Notas (metadata)"
            badge="optional"
            hint="Internal only — never public. Set at creation; editable follow-up notes are a future admin gate."
            className="sm:col-span-2"
          >
            <textarea name="notes" rows={2} className={adminInputClass} />
          </PromoCodeFieldGuidance>
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

      <PromoCodeRecentCodesPanel
        cards={recentCards}
        revokeAction={revokePromoCodeAction}
        filterState={{
          q: filterQ,
          category: filterCategory,
          code_type: filterType,
          status: filterStatus,
          attention: filterAttention,
          delivery_status: filterDelivery,
        }}
      />
    </div>
  );
}
