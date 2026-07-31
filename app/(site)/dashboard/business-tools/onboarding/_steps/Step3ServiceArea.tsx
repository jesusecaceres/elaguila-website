"use client";

import type { BusinessIdentityCopy } from "../../_components/businessIdentityCopy";
import type { WizardDraftPayload } from "../wizardTypes";

export function Step3ServiceArea({
  t,
  payload,
  onChange,
}: {
  t: BusinessIdentityCopy["wizard"]["step3"];
  payload: WizardDraftPayload;
  onChange: (next: WizardDraftPayload) => void;
}) {
  const isPhysical = payload.serviceArea.areaKind === "physical_address";
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-[#1E1810]">{t.title}</h2>

      <fieldset>
        <legend className="text-sm font-semibold text-[#3D3428]">{t.kindLabel}</legend>
        <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={t.kindLabel}>
          <button
            type="button"
            role="radio"
            aria-checked={isPhysical}
            onClick={() => onChange({ ...payload, serviceArea: { ...payload.serviceArea, areaKind: "physical_address" } })}
            className={`min-h-[44px] rounded-xl border px-4 py-2.5 text-sm font-semibold ${
              isPhysical ? "border-[#C9A84A] bg-[#FBF7EF] text-[#1E1810]" : "border-[#E8DFD0] bg-white text-[#5C5346] hover:bg-[#FAF7F2]"
            }`}
          >
            {t.kindPhysical}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={payload.serviceArea.areaKind === "service_area_text"}
            onClick={() => onChange({ ...payload, serviceArea: { ...payload.serviceArea, areaKind: "service_area_text" } })}
            className={`min-h-[44px] rounded-xl border px-4 py-2.5 text-sm font-semibold ${
              payload.serviceArea.areaKind === "service_area_text"
                ? "border-[#C9A84A] bg-[#FBF7EF] text-[#1E1810]"
                : "border-[#E8DFD0] bg-white text-[#5C5346] hover:bg-[#FAF7F2]"
            }`}
          >
            {t.kindServiceArea}
          </button>
        </div>
      </fieldset>

      <div>
        <label htmlFor="serviceAreaText" className="block text-sm font-semibold text-[#3D3428]">
          {t.textLabel}
        </label>
        <p className="mt-0.5 text-xs text-[#7A7164]">{isPhysical ? t.textHintPhysical : t.textHintServiceArea}</p>
        <textarea
          id="serviceAreaText"
          rows={3}
          value={payload.serviceArea.rawText}
          onChange={(e) => onChange({ ...payload, serviceArea: { ...payload.serviceArea, rawText: e.target.value } })}
          className="mt-2 w-full rounded-xl border border-[#E8DFD0] bg-white px-3.5 py-2.5 text-sm text-[#1E1810] shadow-sm focus:border-[#C9A84A] focus:outline-none focus:ring-2 focus:ring-[#C9A84A]/30"
        />
      </div>
    </div>
  );
}
