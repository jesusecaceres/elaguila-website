"use client";

import { BROAD_BUSINESS_TYPES, BUSINESS_STAGES, SPECIFIC_BUSINESS_TYPE_SUGGESTIONS } from "@/app/lib/business/constants";
import type { BroadBusinessType, BusinessStage } from "@/app/lib/business/types";
import { SearchableSelect } from "../../_components/SearchableSelect";
import { OptionToggleGroup } from "../../_components/OptionToggleGroup";
import type { BusinessIdentityCopy, Lang } from "../../_components/businessIdentityCopy";
import type { WizardDraftPayloadV2 } from "../wizardTypes";

export function Step3CategoryStage({
  t,
  lang,
  payload,
  onChange,
  errors,
}: {
  t: BusinessIdentityCopy["wizard"]["step3"];
  lang: Lang;
  payload: WizardDraftPayloadV2;
  onChange: (next: WizardDraftPayloadV2) => void;
  errors: readonly string[];
}) {
  const broadType = payload.typeStage.broadBusinessType;
  const suggestions = broadType ? SPECIFIC_BUSINESS_TYPE_SUGGESTIONS[broadType as BroadBusinessType] ?? [] : [];
  const specificOptions = [
    ...suggestions.map((s) => ({ value: s.value, label: s[lang] })),
    { value: "other", label: t.specificTypeOtherLabel },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-[#1E1810]">{t.title}</h2>

      <OptionToggleGroup
        legend={t.broadTypeLabel}
        mode="single"
        columns={2}
        options={BROAD_BUSINESS_TYPES.map((o) => ({ value: o.value, label: o[lang] }))}
        selected={broadType ? [broadType] : []}
        onToggle={(v) =>
          onChange({
            ...payload,
            typeStage: { ...payload.typeStage, broadBusinessType: v as BroadBusinessType, specificBusinessType: "", customSpecificType: "" },
          })
        }
      />
      {errors.some((e) => e === "broadBusinessType") ? <p role="alert" className="text-xs text-[#7A1E2C]">{t.title}</p> : null}

      {broadType ? (
        <div>
          <SearchableSelect
            label={t.specificTypeLabel}
            options={specificOptions}
            value={payload.typeStage.specificBusinessType || (payload.typeStage.customSpecificType ? "other" : "")}
            onSelect={(v) =>
              onChange({
                ...payload,
                typeStage: {
                  ...payload.typeStage,
                  specificBusinessType: v === "other" ? "" : v,
                  customSpecificType: v === "other" ? payload.typeStage.customSpecificType : "",
                },
              })
            }
            placeholder={t.specificTypeHint}
            noResultsLabel={lang === "es" ? "Sin resultados" : "No results"}
          />
          {payload.typeStage.specificBusinessType === "" && (payload.typeStage.customSpecificType !== "" || specificOptions.length === 1) ? (
            <input
              type="text"
              value={payload.typeStage.customSpecificType}
              onChange={(e) => onChange({ ...payload, typeStage: { ...payload.typeStage, customSpecificType: e.target.value } })}
              placeholder={t.specificTypeOtherPlaceholder}
              className="mt-2 w-full min-h-[44px] rounded-xl border border-[#E8DFD0] bg-white px-3.5 py-2.5 text-sm text-[#1E1810] shadow-sm focus:border-[#C9A84A] focus:outline-none focus:ring-2 focus:ring-[#C9A84A]/30"
            />
          ) : null}
        </div>
      ) : null}

      <OptionToggleGroup
        legend={t.stageLabel}
        mode="single"
        columns={2}
        options={BUSINESS_STAGES.map((o) => ({ value: o.value, label: o[lang], description: t.stageDescriptions[o.value] }))}
        selected={payload.typeStage.businessStage ? [payload.typeStage.businessStage] : []}
        onToggle={(v) => onChange({ ...payload, typeStage: { ...payload.typeStage, businessStage: v as BusinessStage } })}
      />
    </div>
  );
}
