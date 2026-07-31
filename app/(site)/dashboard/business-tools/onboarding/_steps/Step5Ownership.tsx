"use client";

import type { BusinessIdentityCopy } from "../../_components/businessIdentityCopy";
import type { WizardDraftPayload } from "../wizardTypes";

export function Step5Ownership({
  t,
  payload,
  onChange,
}: {
  t: BusinessIdentityCopy["wizard"]["step5"];
  payload: WizardDraftPayload;
  onChange: (next: WizardDraftPayload) => void;
}) {
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-[#1E1810]">{t.title}</h2>
      <p className="text-sm leading-relaxed text-[#5C5346]/95">{t.disclosure}</p>

      <label className="flex items-start gap-3 rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2]/60 p-4">
        <input
          type="checkbox"
          checked={payload.ownershipConfirmation.confirmed}
          onChange={(e) => onChange({ ...payload, ownershipConfirmation: { ...payload.ownershipConfirmation, confirmed: e.target.checked } })}
          className="mt-0.5 h-5 w-5 shrink-0"
        />
        <span className="text-sm leading-relaxed text-[#1E1810]">{t.confirmLabel}</span>
      </label>

      <label className="flex items-center gap-3 text-sm text-[#3D3428]">
        <input
          type="checkbox"
          checked={payload.ownershipConfirmation.settingUpForSomeoneElse}
          onChange={(e) =>
            onChange({ ...payload, ownershipConfirmation: { ...payload.ownershipConfirmation, settingUpForSomeoneElse: e.target.checked } })
          }
          className="h-4 w-4"
        />
        {t.settingUpForSomeoneElse}
      </label>
    </div>
  );
}
