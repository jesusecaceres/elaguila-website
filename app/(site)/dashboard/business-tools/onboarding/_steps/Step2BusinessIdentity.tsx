"use client";

import { businessLanguageLabel, businessLanguagesSortedByLabel } from "@/app/lib/business/languages";
import { SearchableSelect } from "../../_components/SearchableSelect";
import { WhyWeAsk } from "../../_components/OptionToggleGroup";
import type { BusinessIdentityCopy, Lang } from "../../_components/businessIdentityCopy";
import type { WizardDraftPayloadV2 } from "../wizardTypes";

export function Step2BusinessIdentity({
  t,
  whyWeAskLabel,
  lang,
  payload,
  onChange,
  errors,
}: {
  t: BusinessIdentityCopy["wizard"]["step2"];
  whyWeAskLabel: string;
  lang: Lang;
  payload: WizardDraftPayloadV2;
  onChange: (next: WizardDraftPayloadV2) => void;
  errors: readonly string[];
}) {
  const languageOptions = businessLanguagesSortedByLabel(lang).map((l) => ({ value: l.code, label: l[lang] }));
  const additionalOptions = languageOptions.filter((o) => !payload.basics.businessAdditionalLanguages.includes(o.value) && o.value !== payload.basics.businessPrimaryLanguage);

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

      <WhyWeAsk label={whyWeAskLabel} text={t.whyWeAskText} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <input
            id="publicName"
            type="text"
            value={payload.basics.publicName}
            onChange={(e) => onChange({ ...payload, basics: { ...payload.basics, publicName: e.target.value } })}
            className="mt-2 w-full min-h-[44px] rounded-xl border border-[#E8DFD0] bg-white px-3.5 py-2.5 text-sm text-[#1E1810] shadow-sm focus:border-[#C9A84A] focus:outline-none focus:ring-2 focus:ring-[#C9A84A]/30"
          />
        </div>
      </div>
      <p className="text-xs text-[#7A7164]">{t.legalVsPublicHelp}</p>

      <SearchableSelect
        id="businessPrimaryLanguage"
        label={t.businessPrimaryLanguageLabel}
        options={languageOptions}
        value={payload.basics.businessPrimaryLanguage}
        onSelect={(v) => onChange({ ...payload, basics: { ...payload.basics, businessPrimaryLanguage: v } })}
        noResultsLabel={lang === "es" ? "Sin resultados" : "No results"}
      />
      <p className="text-xs text-[#7A7164]">{t.businessPrimaryLanguageHint}</p>

      <div>
        <span className="block text-sm font-semibold text-[#3D3428]">{t.additionalLanguagesLabel}</span>
        <div className="mt-2 flex flex-wrap gap-2">
          {payload.basics.businessAdditionalLanguages.map((code) => (
            <span key={code} className="inline-flex items-center gap-1.5 rounded-full border border-[#E8DFD0] bg-[#FAF7F2] px-3 py-1 text-xs font-semibold text-[#3D3428]">
              {businessLanguageLabel(code, lang)}
              <button
                type="button"
                aria-label={t.removeLanguage}
                onClick={() =>
                  onChange({
                    ...payload,
                    basics: { ...payload.basics, businessAdditionalLanguages: payload.basics.businessAdditionalLanguages.filter((c) => c !== code) },
                  })
                }
                className="text-[#7A1E2C]"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="mt-2 max-w-sm">
          <SearchableSelect
            id="additionalLanguagePicker"
            label={t.addLanguage}
            options={additionalOptions}
            value=""
            onSelect={(v) =>
              onChange({ ...payload, basics: { ...payload.basics, businessAdditionalLanguages: [...payload.basics.businessAdditionalLanguages, v] } })
            }
            noResultsLabel={lang === "es" ? "Sin resultados" : "No results"}
          />
        </div>
      </div>

      <div className="max-w-xs">
        <label htmlFor="yearStarted" className="block text-sm font-semibold text-[#3D3428]">
          {t.yearStartedLabel}
        </label>
        <p className="mt-0.5 text-xs text-[#7A7164]">{t.yearStartedHint}</p>
        <input
          id="yearStarted"
          type="number"
          inputMode="numeric"
          min={1800}
          max={new Date().getFullYear()}
          value={payload.basics.yearStarted ?? ""}
          onChange={(e) => onChange({ ...payload, basics: { ...payload.basics, yearStarted: e.target.value ? Number(e.target.value) : null } })}
          className="mt-2 w-full min-h-[44px] rounded-xl border border-[#E8DFD0] bg-white px-3.5 py-2.5 text-sm text-[#1E1810] shadow-sm focus:border-[#C9A84A] focus:outline-none focus:ring-2 focus:ring-[#C9A84A]/30"
        />
      </div>

      <p className="text-xs text-[#7A7164]">{t.noPermanentRecordNote}</p>
    </div>
  );
}
