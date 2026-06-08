"use client";

import type { BrNegocioPrePublishInventoryLang } from "../../brNegocioPrePublishInventoryShellCopy";
import { brNegocioPrePublishInventoryShellCopy } from "../../brNegocioPrePublishInventoryShellCopy";
import type {
  BrNegocioAdditionalInventoryPropertyDraft,
  BrNegocioInventoryDrawerFieldErrors,
} from "../../brNegocioAdditionalInventoryDraft";
import {
  BR_INVENTORY_DRAWER_PROPERTY_TYPES,
  brInventorySubtypeOptionsForType,
} from "../../brNegocioAdditionalInventoryDraft";
import { brInputClass, brTextareaClass, BrField } from "./brFormPrimitives";
import { BrNegocioPrePublishInventoryDrawerMedia } from "./BrNegocioPrePublishInventoryDrawerMedia";

type Props = {
  lang: BrNegocioPrePublishInventoryLang;
  draft: BrNegocioAdditionalInventoryPropertyDraft;
  errors: BrNegocioInventoryDrawerFieldErrors;
  onChange: (next: BrNegocioAdditionalInventoryPropertyDraft) => void;
};

export function BrNegocioPrePublishInventoryDrawerForm({ lang, draft, errors, onChange }: Props) {
  const copy = brNegocioPrePublishInventoryShellCopy(lang);
  const f = copy.fields;
  const subtypeOptions = brInventorySubtypeOptionsForType(draft.propertyType, lang);
  const errClass = "mt-1 text-xs font-medium text-[#B42318]";

  const patch = (partial: Partial<BrNegocioAdditionalInventoryPropertyDraft>) => {
    onChange({ ...draft, ...partial });
  };

  return (
    <div className="mt-4 space-y-4">
      <BrField label={f.title} required>
        <input
          className={brInputClass}
          value={draft.title}
          onChange={(e) => patch({ title: e.target.value })}
          autoComplete="off"
        />
        {errors.title ? <p className={errClass}>{errors.title}</p> : null}
      </BrField>

      <div className="grid gap-4 sm:grid-cols-2">
        <BrField label={f.propertyType} required>
          <select
            className={brInputClass}
            value={draft.propertyType}
            onChange={(e) => patch({ propertyType: e.target.value, propertySubtype: "" })}
          >
            <option value="">{lang === "es" ? "Selecciona…" : "Select…"}</option>
            {BR_INVENTORY_DRAWER_PROPERTY_TYPES.map((o) => (
              <option key={o.value} value={o.value}>
                {lang === "en" ? o.labelEn : o.labelEs}
              </option>
            ))}
          </select>
          {errors.propertyType ? <p className={errClass}>{errors.propertyType}</p> : null}
        </BrField>

        <BrField label={f.propertySubtype}>
          {subtypeOptions.length > 0 ? (
            <select
              className={brInputClass}
              value={draft.propertySubtype}
              onChange={(e) => patch({ propertySubtype: e.target.value })}
            >
              {subtypeOptions.map((o) => (
                <option key={o.value || "none"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              className={brInputClass}
              value={draft.propertySubtype}
              onChange={(e) => patch({ propertySubtype: e.target.value })}
              placeholder={lang === "es" ? "Opcional" : "Optional"}
            />
          )}
        </BrField>
      </div>

      <BrField label={f.price} required>
        <input
          className={brInputClass}
          inputMode="decimal"
          value={draft.price}
          onChange={(e) => patch({ price: e.target.value })}
          placeholder={lang === "es" ? "Ej. 650000" : "e.g. 650000"}
        />
        {errors.price ? <p className={errClass}>{errors.price}</p> : null}
      </BrField>

      <div className="grid gap-4 sm:grid-cols-2">
        <BrField label={f.bedrooms}>
          <input
            className={brInputClass}
            inputMode="numeric"
            value={draft.bedrooms}
            onChange={(e) => patch({ bedrooms: e.target.value })}
          />
        </BrField>
        <BrField label={f.bathrooms}>
          <input
            className={brInputClass}
            inputMode="decimal"
            value={draft.bathrooms}
            onChange={(e) => patch({ bathrooms: e.target.value })}
          />
        </BrField>
        <BrField label={f.interiorSqft}>
          <input
            className={brInputClass}
            inputMode="numeric"
            value={draft.interiorSqft}
            onChange={(e) => patch({ interiorSqft: e.target.value })}
          />
        </BrField>
        <BrField label={f.lotSqft}>
          <input
            className={brInputClass}
            inputMode="numeric"
            value={draft.lotSqft}
            onChange={(e) => patch({ lotSqft: e.target.value })}
          />
        </BrField>
      </div>

      <BrField label={f.streetLine1}>
        <input
          className={brInputClass}
          value={draft.streetLine1}
          onChange={(e) => patch({ streetLine1: e.target.value })}
          autoComplete="street-address"
        />
      </BrField>

      <BrField label={f.streetLine2}>
        <input
          className={brInputClass}
          value={draft.streetLine2}
          onChange={(e) => patch({ streetLine2: e.target.value })}
        />
      </BrField>

      <div className="grid gap-4 sm:grid-cols-3">
        <BrField label={f.city} required>
          <input
            className={brInputClass}
            value={draft.city}
            onChange={(e) => patch({ city: e.target.value })}
            autoComplete="address-level2"
          />
          {errors.city ? <p className={errClass}>{errors.city}</p> : null}
        </BrField>
        <BrField label={f.state} required>
          <input
            className={brInputClass}
            value={draft.state}
            onChange={(e) => patch({ state: e.target.value })}
            autoComplete="address-level1"
          />
          {errors.state ? <p className={errClass}>{errors.state}</p> : null}
        </BrField>
        <BrField label={f.zip}>
          <input
            className={brInputClass}
            inputMode="numeric"
            value={draft.zip}
            onChange={(e) => patch({ zip: e.target.value })}
            autoComplete="postal-code"
          />
        </BrField>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#E8DFD0] bg-white px-3 py-2.5">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4 rounded border-[#C9B46A]/60 text-[#6E5418]"
          checked={draft.showExactAddress}
          onChange={(e) => patch({ showExactAddress: e.target.checked })}
        />
        <span className="text-sm text-[#2C2416]">{f.showExactAddress}</span>
      </label>

      <BrField label={f.description}>
        <textarea
          className={brTextareaClass}
          value={draft.description}
          onChange={(e) => patch({ description: e.target.value })}
          rows={4}
        />
      </BrField>

      <BrNegocioPrePublishInventoryDrawerMedia lang={lang} draft={draft} onChange={onChange} />
    </div>
  );
}
