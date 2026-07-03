"use client";

import { useCallback, useEffect, useState } from "react";
import { buildPromoCodeRulePreview, promoCodeRuleBadges } from "@/app/lib/listingPlans/promoCodeLifecycle";

const PREVIEW_FORM_ID = "promo-code-create-form";

function boolLabel(v: boolean): string {
  return v ? "Yes" : "No";
}

export function PromoCodeLifecyclePreview() {
  const [rule, setRule] = useState(() =>
    buildPromoCodeRulePreview({ codeType: "entitlement", status: "active" }),
  );

  const refresh = useCallback(() => {
    const form = document.getElementById(PREVIEW_FORM_ID);
    if (!(form instanceof HTMLFormElement)) return;
    const fd = new FormData(form);
    setRule(
      buildPromoCodeRulePreview({
        codeType: String(fd.get("code_type") ?? "entitlement"),
        status: String(fd.get("status") ?? "active"),
      }),
    );
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

  const badges = promoCodeRuleBadges(rule);

  return (
    <div className="space-y-3 rounded-xl border border-[#E8DFD0]/90 bg-[#F8F4EC]/60 p-3">
      <p className="text-xs font-bold text-[#1E1810]">Preview — promo rules (G1.6D/F)</p>
      <p className="text-[10px] text-[#7A7164]">From packagePricingRules / promoCodeLifecycle. Checkout validation enabled for Restaurantes; redemption after paid webhook.</p>

      <ul className="grid gap-1 text-xs text-[#5C5346] sm:grid-cols-2">
        <li>Non-stackable: {boolLabel(rule.nonStackable)}</li>
        <li>One-time use: {boolLabel(rule.oneTimeUse)}</li>
        <li>Requires owner approval: {boolLabel(rule.requiresOwnerApproval)}</li>
        <li>Can discount payment: {boolLabel(rule.canDiscountPayment)}</li>
        <li>Can create package entitlement: {boolLabel(rule.canCreatePackageEntitlement)}</li>
        <li>Subscriber identity (newsletter/SMS): {boolLabel(rule.requiresSubscriberIdentity)}</li>
      </ul>

      {badges.length ? <p className="text-[10px] text-[#7A7164]">Badges: {badges.join(" · ")}</p> : null}

      {rule.warnings.length ? (
        <ul className="list-disc pl-4 text-[10px] text-amber-900">
          {rule.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
