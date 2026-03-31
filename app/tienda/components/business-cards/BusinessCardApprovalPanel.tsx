"use client";

import type { Lang } from "../../types/tienda";
import type { BusinessCardApprovalChecks } from "../../product-configurators/business-cards/types";
import { bcPick, businessCardBuilderCopy } from "../../data/businessCardBuilderCopy";

export function BusinessCardApprovalPanel(props: {
  lang: Lang;
  approval: BusinessCardApprovalChecks;
  onChange: (patch: Partial<BusinessCardApprovalChecks>) => void;
  disabled?: boolean;
}) {
  const { lang, approval, onChange, disabled } = props;

  const rows: Array<{ key: keyof BusinessCardApprovalChecks; label: { es: string; en: string } }> = [
    { key: "spellingReviewed", label: businessCardBuilderCopy.approvalItems.spelling },
    { key: "layoutReviewed", label: businessCardBuilderCopy.approvalItems.layout },
    { key: "printAsApproved", label: businessCardBuilderCopy.approvalItems.printAsSubmitted },
    { key: "noRedesignExpectation", label: businessCardBuilderCopy.approvalItems.noRedesign },
  ];

  return (
    <section className="rounded-2xl border border-[rgba(201,168,74,0.28)] bg-[linear-gradient(180deg,rgba(201,168,74,0.10),rgba(0,0,0,0.2))] p-5 sm:p-6">
      <h2 className="text-base font-semibold text-white">{bcPick(businessCardBuilderCopy.approvalTitle, lang)}</h2>
      <p className="mt-2 text-sm text-[rgba(255,247,226,0.78)] leading-relaxed">
        {bcPick(businessCardBuilderCopy.approvalIntro, lang)}
      </p>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <label
            key={row.key}
            className={[
              "flex items-start gap-3 rounded-xl border border-[rgba(255,255,255,0.10)] bg-[rgba(255,255,255,0.04)] px-3 py-3 cursor-pointer",
              disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-[rgba(255,255,255,0.06)]",
            ].join(" ")}
          >
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-[rgba(201,168,74,0.45)]"
              checked={approval[row.key]}
              disabled={disabled}
              onChange={(e) => onChange({ [row.key]: e.target.checked })}
            />
            <span className="text-sm text-[rgba(255,255,255,0.88)] leading-snug">{bcPick(row.label, lang)}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
