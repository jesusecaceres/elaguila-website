"use client";

import { AUTHORIZATION_ROLES } from "@/app/lib/business/constants";
import type { AuthorizationRole } from "@/app/lib/business/types";
import { OptionToggleGroup } from "../../_components/OptionToggleGroup";
import type { BusinessIdentityCopy, Lang } from "../../_components/businessIdentityCopy";
import type { WizardDraftPayloadV2 } from "../wizardTypes";

export function Step7Authorization({
  t,
  lang,
  payload,
  onChange,
  errors,
}: {
  t: BusinessIdentityCopy["wizard"]["step7"];
  lang: Lang;
  payload: WizardDraftPayloadV2;
  onChange: (next: WizardDraftPayloadV2) => void;
  errors: readonly string[];
}) {
  const auth = payload.ownershipAuthorization;
  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-[#1E1810]">{t.title}</h2>

      <OptionToggleGroup
        legend={t.roleLabel}
        mode="single"
        columns={2}
        options={AUTHORIZATION_ROLES.map((o) => ({ value: o.value, label: o[lang] }))}
        selected={auth.role ? [auth.role] : []}
        onToggle={(v) => onChange({ ...payload, ownershipAuthorization: { ...auth, role: v as AuthorizationRole } })}
      />

      {auth.role === "authorized_representative" ? (
        <div className="space-y-3 rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2]/50 p-4">
          <div>
            <label htmlFor="representativeRelationship" className="block text-xs font-semibold text-[#3D3428]">
              {t.representativeRelationshipLabel}
            </label>
            <input
              id="representativeRelationship"
              type="text"
              value={auth.representativeRelationship}
              onChange={(e) => onChange({ ...payload, ownershipAuthorization: { ...auth, representativeRelationship: e.target.value } })}
              placeholder={t.representativeRelationshipPlaceholder}
              className="mt-1 w-full min-h-[44px] rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#1E1810]"
            />
          </div>
          <div>
            <label htmlFor="representativeContactEmail" className="block text-xs font-semibold text-[#3D3428]">
              {t.representativeContactEmailLabel}
            </label>
            <input
              id="representativeContactEmail"
              type="email"
              value={auth.representativeContactEmail}
              onChange={(e) => onChange({ ...payload, ownershipAuthorization: { ...auth, representativeContactEmail: e.target.value } })}
              className="mt-1 w-full min-h-[44px] rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#1E1810]"
            />
          </div>
          <div>
            <label htmlFor="representativeNote" className="block text-xs font-semibold text-[#3D3428]">
              {t.representativeNoteLabel}
            </label>
            <textarea
              id="representativeNote"
              value={auth.representativeNote}
              onChange={(e) => onChange({ ...payload, ownershipAuthorization: { ...auth, representativeNote: e.target.value } })}
              rows={2}
              className="mt-1 w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#1E1810]"
            />
          </div>
          <p className="text-xs text-[#7A7164]">{t.manualReviewNote}</p>
          <p className="text-xs text-[#7A7164]">{t.noFakeInviteNote}</p>
        </div>
      ) : null}

      <label className="flex items-start gap-2.5 rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2]/60 p-4 text-sm text-[#3D3428]">
        <input type="checkbox" checked={auth.confirmed} onChange={(e) => onChange({ ...payload, ownershipAuthorization: { ...auth, confirmed: e.target.checked } })} className="mt-0.5 h-4 w-4" />
        {t.confirmLabel}
      </label>
      {errors.length > 0 ? (
        <p role="alert" className="text-xs text-[#7A1E2C]">
          {t.roleLabel}
        </p>
      ) : null}

      <p className="text-xs text-[#7A7164]">{t.noOwnershipTransferNote}</p>
    </div>
  );
}
