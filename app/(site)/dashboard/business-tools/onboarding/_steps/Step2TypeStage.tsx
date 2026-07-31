"use client";

import type { BusinessIdentityCopy } from "../../_components/businessIdentityCopy";
import type { WizardDraftPayload } from "../wizardTypes";

export function Step2TypeStage({
  t,
  payload,
  onChange,
}: {
  t: BusinessIdentityCopy["wizard"]["step2"];
  payload: WizardDraftPayload;
  onChange: (next: WizardDraftPayload) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-[#1E1810]">{t.title}</h2>

      <fieldset>
        <legend className="text-sm font-semibold text-[#3D3428]">{t.typeLabel}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {t.typeOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={payload.typeStage.broadBusinessType === option.value}
              onClick={() => onChange({ ...payload, typeStage: { ...payload.typeStage, broadBusinessType: option.value } })}
              className={`min-h-[44px] rounded-xl border px-4 py-2.5 text-left text-sm font-semibold ${
                payload.typeStage.broadBusinessType === option.value
                  ? "border-[#C9A84A] bg-[#FBF7EF] text-[#1E1810]"
                  : "border-[#E8DFD0] bg-white text-[#5C5346] hover:bg-[#FAF7F2]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-[#3D3428]">{t.stageLabel}</legend>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {t.stageOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={payload.typeStage.businessStage === option.value}
              onClick={() => onChange({ ...payload, typeStage: { ...payload.typeStage, businessStage: option.value } })}
              className={`min-h-[44px] rounded-xl border px-4 py-2.5 text-left text-sm font-semibold ${
                payload.typeStage.businessStage === option.value
                  ? "border-[#C9A84A] bg-[#FBF7EF] text-[#1E1810]"
                  : "border-[#E8DFD0] bg-white text-[#5C5346] hover:bg-[#FAF7F2]"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
