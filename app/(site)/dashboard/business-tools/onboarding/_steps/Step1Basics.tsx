"use client";

import type { BusinessIdentityCopy } from "../../_components/businessIdentityCopy";
import type { WizardDraftPayload } from "../wizardTypes";

export function Step1Basics({
  t,
  payload,
  onChange,
  errors,
}: {
  t: BusinessIdentityCopy["wizard"]["step1"];
  payload: WizardDraftPayload;
  onChange: (next: WizardDraftPayload) => void;
  errors: readonly string[];
}) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-[#1E1810]">{t.title}</h2>

      <div>
        <label htmlFor="displayName" className="block text-sm font-semibold text-[#3D3428]">
          {t.displayNameLabel}
        </label>
        <p className="mt-0.5 text-xs text-[#7A7164]">{t.displayNameHint}</p>
        <input
          id="displayName"
          type="text"
          value={payload.basics.displayName}
          onChange={(e) => onChange({ ...payload, basics: { ...payload.basics, displayName: e.target.value } })}
          aria-invalid={errors.length > 0}
          aria-describedby={errors.length > 0 ? "displayName-error" : undefined}
          className="mt-2 w-full min-h-[44px] rounded-xl border border-[#E8DFD0] bg-white px-3.5 py-2.5 text-sm text-[#1E1810] shadow-sm focus:border-[#C9A84A] focus:outline-none focus:ring-2 focus:ring-[#C9A84A]/30"
        />
        {errors.length > 0 ? (
          <p id="displayName-error" role="alert" className="mt-1 text-xs text-[#7A1E2C]">
            {errors[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="legalName" className="block text-sm font-semibold text-[#3D3428]">
          {t.legalNameLabel}
        </label>
        <input
          id="legalName"
          type="text"
          value={payload.basics.legalName}
          onChange={(e) => onChange({ ...payload, basics: { ...payload.basics, legalName: e.target.value } })}
          className="mt-2 w-full min-h-[44px] rounded-xl border border-[#E8DFD0] bg-white px-3.5 py-2.5 text-sm text-[#1E1810] shadow-sm focus:border-[#C9A84A] focus:outline-none focus:ring-2 focus:ring-[#C9A84A]/30"
        />
      </div>

      <div>
        <label htmlFor="publicName" className="block text-sm font-semibold text-[#3D3428]">
          {t.publicNameLabel}
        </label>
        <p className="mt-0.5 text-xs text-[#7A7164]">{t.publicNameHint}</p>
        <input
          id="publicName"
          type="text"
          value={payload.basics.publicName}
          onChange={(e) => onChange({ ...payload, basics: { ...payload.basics, publicName: e.target.value } })}
          className="mt-2 w-full min-h-[44px] rounded-xl border border-[#E8DFD0] bg-white px-3.5 py-2.5 text-sm text-[#1E1810] shadow-sm focus:border-[#C9A84A] focus:outline-none focus:ring-2 focus:ring-[#C9A84A]/30"
        />
      </div>

      <div>
        <span className="block text-sm font-semibold text-[#3D3428]">{t.languageLabel}</span>
        <div className="mt-2 flex gap-2" role="radiogroup" aria-label={t.languageLabel}>
          {(["es", "en"] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={payload.basics.primaryLanguage === option}
              onClick={() => onChange({ ...payload, basics: { ...payload.basics, primaryLanguage: option } })}
              className={`min-h-[40px] rounded-xl border px-4 py-2 text-sm font-semibold ${
                payload.basics.primaryLanguage === option
                  ? "border-[#C9A84A] bg-[#FBF7EF] text-[#1E1810]"
                  : "border-[#E8DFD0] bg-white text-[#5C5346] hover:bg-[#FAF7F2]"
              }`}
            >
              {option === "es" ? "Español" : "English"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
