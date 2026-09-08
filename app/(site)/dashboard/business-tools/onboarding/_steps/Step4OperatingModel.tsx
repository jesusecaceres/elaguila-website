"use client";

import { OPERATING_MODELS, SALES_CHANNELS, SALES_RELATIONSHIPS } from "@/app/lib/business/constants";
import type { OperatingModel, SalesChannel, SalesRelationship } from "@/app/lib/business/types";
import { OptionToggleGroup, WhyWeAsk } from "../../_components/OptionToggleGroup";
import type { BusinessIdentityCopy, Lang } from "../../_components/businessIdentityCopy";
import type { WizardDraftPayloadV2 } from "../wizardTypes";

function toggleValue<T extends string>(list: readonly T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

// Gate BCO-3R-B.1: "hybrid" is never customer-selectable (derived automatically from picking
// more than one primary mode — see deriveEffectiveOperatingModels in wizardTypes.ts).
// "multiple_locations" is a separate standalone business fact, not one of the primary modes.
const PRIMARY_MODE_OPTIONS = OPERATING_MODELS.filter((o) => o.value !== "hybrid" && o.value !== "multiple_locations");

export function Step4OperatingModel({
  t,
  whyWeAskLabel,
  lang,
  payload,
  onChange,
}: {
  t: BusinessIdentityCopy["wizard"]["step4"];
  whyWeAskLabel: string;
  lang: Lang;
  payload: WizardDraftPayloadV2;
  onChange: (next: WizardDraftPayloadV2) => void;
}) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-[#1E1810]">{t.title}</h2>

      <OptionToggleGroup
        legend={t.operatingModelLabel}
        mode="multiple"
        columns={2}
        options={PRIMARY_MODE_OPTIONS.map((o) => ({ value: o.value, label: o[lang] }))}
        selected={payload.operatingModel.operatingModels}
        onToggle={(v) =>
          onChange({
            ...payload,
            operatingModel: { ...payload.operatingModel, operatingModels: toggleValue(payload.operatingModel.operatingModels, v as OperatingModel) },
          })
        }
      />
      <p className="text-xs text-[#7A7164]">{t.operatingModelHint}</p>

      <label className="flex items-center gap-2 text-sm font-medium text-[#3D3428]">
        <input
          type="checkbox"
          checked={payload.operatingModel.operatingModels.includes("multiple_locations")}
          onChange={() =>
            onChange({
              ...payload,
              operatingModel: { ...payload.operatingModel, operatingModels: toggleValue(payload.operatingModel.operatingModels, "multiple_locations" as OperatingModel) },
            })
          }
          className="h-4 w-4"
        />
        {t.multipleLocationsFactLabel}
      </label>

      <WhyWeAsk label={whyWeAskLabel} text={t.whyWeAskText} />

      <OptionToggleGroup
        legend={t.salesRelationshipLabel}
        mode="multiple"
        columns={2}
        options={SALES_RELATIONSHIPS.map((o) => ({ value: o.value, label: o[lang] }))}
        selected={payload.operatingModel.salesRelationships}
        onToggle={(v) =>
          onChange({
            ...payload,
            operatingModel: { ...payload.operatingModel, salesRelationships: toggleValue(payload.operatingModel.salesRelationships, v as SalesRelationship) },
          })
        }
      />

      <OptionToggleGroup
        legend={t.salesChannelLabel}
        mode="multiple"
        columns={2}
        options={SALES_CHANNELS.map((o) => ({ value: o.value, label: o[lang] }))}
        selected={payload.operatingModel.salesChannels}
        onToggle={(v) =>
          onChange({
            ...payload,
            operatingModel: { ...payload.operatingModel, salesChannels: toggleValue(payload.operatingModel.salesChannels, v as SalesChannel) },
          })
        }
      />
    </div>
  );
}
