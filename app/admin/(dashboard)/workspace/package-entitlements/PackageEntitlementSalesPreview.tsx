"use client";

import { useCallback, useEffect, useState } from "react";
import { buildEntitlementPricingMetadata } from "@/app/admin/_lib/buildEntitlementPricingMetadata";

const PREVIEW_FORM_ID = "package-entitlement-create-form";

function readFormSnapshot(form: HTMLFormElement) {
  const fd = new FormData(form);
  return {
    packageTier: String(fd.get("package_tier") ?? "half_page"),
    contractTerm: String(fd.get("contract_term") ?? "month_to_month"),
    promoCodeType: String(fd.get("promo_code_type") ?? "entitlement"),
    salesRepId: String(fd.get("sales_rep_id") ?? "").trim() || null,
    salesRepName: String(fd.get("sales_rep_name") ?? "").trim() || null,
  };
}

function boolLabel(v: boolean): string {
  return v ? "Yes" : "No";
}

export function PackageEntitlementSalesPreview() {
  const [snap, setSnap] = useState(() =>
    buildEntitlementPricingMetadata({
      packageTier: "half_page",
      contractTerm: "month_to_month",
      promoCodeType: "entitlement",
    }),
  );

  const refresh = useCallback(() => {
    const form = document.getElementById(PREVIEW_FORM_ID);
    if (!(form instanceof HTMLFormElement)) return;
    setSnap(buildEntitlementPricingMetadata(readFormSnapshot(form)));
  }, []);

  useEffect(() => {
    const form = document.getElementById(PREVIEW_FORM_ID);
    if (!(form instanceof HTMLFormElement)) return;
    refresh();
    const onChange = () => refresh();
    form.addEventListener("input", onChange);
    form.addEventListener("change", onChange);
    return () => {
      form.removeEventListener("input", onChange);
      form.removeEventListener("change", onChange);
    };
  }, [refresh]);

  const { pricing, promo_rule: promo, sales_attribution: sales, commission_preview: comm, formatMoneyCents } = snap;
  const allWarnings = [
    ...snap.pricingWarnings,
    ...snap.promoWarnings,
    ...snap.salesWarnings,
    ...snap.commissionWarnings,
  ];

  return (
    <div className="space-y-3 rounded-xl border border-[#E8DFD0]/90 bg-[#F8F4EC]/60 p-3">
      <p className="text-xs font-bold text-[#1E1810]">Preview — price, promo & commission (G1.6D)</p>
      <p className="text-[10px] text-[#7A7164]">Does not charge or activate Stripe. Commission is informational estimate only.</p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-[#E8DFD0]/70 bg-[#FFFCF7] p-2.5 text-xs">
          <p className="font-bold text-[#1E1810]">Price</p>
          <ul className="mt-1.5 space-y-0.5 text-[#5C5346]">
            <li>Base monthly: {formatMoneyCents(pricing.base_monthly_price_cents)}</li>
            <li>Discount: {pricing.discount_percent}%</li>
            <li>Final monthly: {formatMoneyCents(pricing.discounted_monthly_price_cents)}</li>
            <li>Term months: {pricing.term_months}</li>
            <li>Estimated contract total: {formatMoneyCents(pricing.estimated_contract_total_cents)}</li>
          </ul>
          <p className="mt-1 text-[10px] text-[#7A7164]">{pricing.label}</p>
        </div>

        <div className="rounded-lg border border-[#E8DFD0]/70 bg-[#FFFCF7] p-2.5 text-xs">
          <p className="font-bold text-[#1E1810]">Promo / code</p>
          <ul className="mt-1.5 space-y-0.5 text-[#5C5346]">
            <li>Type: {promo.promo_code_type}</li>
            <li>Non-stackable: {boolLabel(promo.non_stackable)}</li>
            <li>One-time use: {boolLabel(promo.one_time_use)}</li>
            <li>Owner approval: {boolLabel(promo.requires_owner_approval)}</li>
            <li>Subscriber identity: {boolLabel(promo.requires_subscriber_identity)}</li>
            <li>Sales rep required: {boolLabel(promo.requires_sales_rep_attribution)}</li>
            <li>Can create entitlement: {boolLabel(promo.can_create_package_entitlement)}</li>
            <li>Can discount payment: {boolLabel(promo.can_discount_payment)}</li>
          </ul>
        </div>

        <div className="rounded-lg border border-[#E8DFD0]/70 bg-[#FFFCF7] p-2.5 text-xs">
          <p className="font-bold text-[#1E1810]">Sales attribution</p>
          <ul className="mt-1.5 space-y-0.5 text-[#5C5346]">
            <li>Sales rep ID: {sales.sales_rep_id ?? "—"}</li>
            <li>Sales rep name: {sales.sales_rep_name ?? "—"}</li>
            <li>Source: {sales.source}</li>
            <li>Created by admin: {sales.created_by_admin ?? "—"}</li>
            <li>Commission eligible (preview): {boolLabel(sales.commission_eligible)}</li>
            <li>Commission rule key: {sales.commission_rule_key ?? "—"}</li>
          </ul>
        </div>

        <div className="rounded-lg border border-amber-200/80 bg-amber-50/80 p-2.5 text-xs">
          <p className="font-bold text-amber-950">Future commission preview</p>
          <ul className="mt-1.5 space-y-0.5 text-amber-950/90">
            <li>Payment status: uncollected / not paid</li>
            <li>Commission eligible: {boolLabel(comm.commission_eligible)}</li>
            <li>
              Estimate:{" "}
              {comm.estimated_commission_cents != null
                ? formatMoneyCents(comm.estimated_commission_cents)
                : "— (pending cleared payment)"}
            </li>
          </ul>
          <p className="mt-1 text-[10px] leading-relaxed text-amber-900">{comm.warning}</p>
          <p className="mt-0.5 text-[10px] text-amber-800">{comm.estimated_commission_label}</p>
        </div>
      </div>

      {allWarnings.length > 0 ? (
        <ul className="list-disc space-y-0.5 pl-4 text-[10px] text-amber-900">
          {allWarnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
