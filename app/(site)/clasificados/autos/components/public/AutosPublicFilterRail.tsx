"use client";

import type { AutosPublicBlueprintCopy } from "../../lib/autosPublicBlueprintCopy";
import type { AutosPublicFilterState } from "../../filters/autosPublicFilterTypes";

export type AutosPublicFilterOptions = {
  makes: string[];
  bodyStyles: string[];
  transmissions: string[];
  drivetrains: string[];
  fuelTypes: string[];
  titleStatuses: string[];
  /** Condition row: first option is “any”. */
  conditions: { value: AutosPublicFilterState["condition"]; label: string }[];
};

export function AutosPublicFilterRail({
  value,
  onChange,
  onReset,
  onApply,
  copy,
  options,
  idPrefix = "flt",
}: {
  value: AutosPublicFilterState;
  onChange: (patch: Partial<AutosPublicFilterState>) => void;
  onReset: () => void;
  onApply: () => void;
  copy: AutosPublicBlueprintCopy;
  options: AutosPublicFilterOptions;
  idPrefix?: string;
}) {
  const lab = "mb-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";
  const inp =
    "w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3 py-2 text-sm text-[color:var(--lx-text)] outline-none focus:ring-2 focus:ring-[color:var(--lx-focus-ring)]";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className={lab} htmlFor={`${idPrefix}-city`}>
          {copy.cityLabel}
        </label>
        <input
          id={`${idPrefix}-city`}
          className={inp}
          value={value.city}
          onChange={(e) => onChange({ city: e.target.value })}
          placeholder={copy.cityPlaceholder}
          autoComplete="address-level2"
        />
      </div>
      <div>
        <label className={lab} htmlFor={`${idPrefix}-zip`}>
          {copy.zipLabel}
        </label>
        <input
          id={`${idPrefix}-zip`}
          className={inp}
          inputMode="numeric"
          maxLength={5}
          value={value.zip}
          onChange={(e) => onChange({ zip: e.target.value.replace(/\D/g, "").slice(0, 5) })}
          placeholder={copy.zipPlaceholder}
          autoComplete="postal-code"
        />
      </div>
      <div>
        <label className={lab} htmlFor={`${idPrefix}-radius`}>
          {copy.filterRadius}
        </label>
        <input
          id={`${idPrefix}-radius`}
          className={`${inp} cursor-not-allowed opacity-60`}
          inputMode="numeric"
          disabled
          readOnly
          value={value.radiusMiles}
          placeholder="—"
          aria-describedby={`${idPrefix}-radius-hint`}
          aria-disabled="true"
        />
        <p id={`${idPrefix}-radius-hint`} className="mt-1 text-[10px] leading-snug text-[color:var(--lx-muted)]">
          {copy.filterRadiusHint}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={lab} htmlFor={`${idPrefix}-pmin`}>
            {copy.priceMin}
          </label>
          <input
            id={`${idPrefix}-pmin`}
            className={inp}
            inputMode="numeric"
            value={value.priceMin}
            onChange={(e) => onChange({ priceMin: e.target.value })}
          />
        </div>
        <div>
          <label className={lab} htmlFor={`${idPrefix}-pmax`}>
            {copy.priceMax}
          </label>
          <input
            id={`${idPrefix}-pmax`}
            className={inp}
            inputMode="numeric"
            value={value.priceMax}
            onChange={(e) => onChange({ priceMax: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className={lab} htmlFor={`${idPrefix}-make`}>
          {copy.filterMake}
        </label>
        <select
          id={`${idPrefix}-make`}
          className={inp}
          value={value.make}
          onChange={(e) => onChange({ make: e.target.value })}
        >
          <option value="">{copy.filterAny}</option>
          {options.makes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={lab} htmlFor={`${idPrefix}-model`}>
          {copy.filterModel}
        </label>
        <input
          id={`${idPrefix}-model`}
          className={inp}
          value={value.model}
          onChange={(e) => onChange({ model: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={lab} htmlFor={`${idPrefix}-ymin`}>
            {copy.yearFrom}
          </label>
          <input
            id={`${idPrefix}-ymin`}
            className={inp}
            inputMode="numeric"
            value={value.yearMin}
            onChange={(e) => onChange({ yearMin: e.target.value })}
          />
        </div>
        <div>
          <label className={lab} htmlFor={`${idPrefix}-ymax`}>
            {copy.yearTo}
          </label>
          <input
            id={`${idPrefix}-ymax`}
            className={inp}
            inputMode="numeric"
            value={value.yearMax}
            onChange={(e) => onChange({ yearMax: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className={lab} htmlFor={`${idPrefix}-cond`}>
          {copy.filterCondition}
        </label>
        <select
          id={`${idPrefix}-cond`}
          className={inp}
          value={value.condition}
          onChange={(e) => onChange({ condition: e.target.value as AutosPublicFilterState["condition"] })}
        >
          {options.conditions.map((o) => (
            <option key={o.value || "all"} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={lab} htmlFor={`${idPrefix}-seller`}>
          {copy.filterSeller}
        </label>
        <select
          id={`${idPrefix}-seller`}
          className={inp}
          value={value.sellerType}
          onChange={(e) => onChange({ sellerType: e.target.value as AutosPublicFilterState["sellerType"] })}
        >
          <option value="">{copy.sellerAll}</option>
          <option value="dealer">{copy.sellerDealer}</option>
          <option value="private">{copy.sellerPrivate}</option>
        </select>
      </div>
      <div>
        <label className={lab} htmlFor={`${idPrefix}-body`}>
          {copy.filterBody}
        </label>
        <select
          id={`${idPrefix}-body`}
          className={inp}
          value={value.bodyStyle}
          onChange={(e) => onChange({ bodyStyle: e.target.value })}
        >
          <option value="">{copy.filterAny}</option>
          {options.bodyStyles.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={lab} htmlFor={`${idPrefix}-trans`}>
          {copy.filterTransmission}
        </label>
        <select
          id={`${idPrefix}-trans`}
          className={inp}
          value={value.transmission}
          onChange={(e) => onChange({ transmission: e.target.value })}
        >
          <option value="">{copy.filterAny}</option>
          {options.transmissions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={lab} htmlFor={`${idPrefix}-drive`}>
          {copy.filterDrivetrain}
        </label>
        <select
          id={`${idPrefix}-drive`}
          className={inp}
          value={value.drivetrain}
          onChange={(e) => onChange({ drivetrain: e.target.value })}
        >
          <option value="">{copy.filterAny}</option>
          {options.drivetrains.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={lab} htmlFor={`${idPrefix}-fuel`}>
          {copy.filterFuel}
        </label>
        <select
          id={`${idPrefix}-fuel`}
          className={inp}
          value={value.fuelType}
          onChange={(e) => onChange({ fuelType: e.target.value })}
        >
          <option value="">{copy.filterAny}</option>
          {options.fuelTypes.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={lab} htmlFor={`${idPrefix}-mile-min`}>
            {copy.mileageMin}
          </label>
          <input
            id={`${idPrefix}-mile-min`}
            className={inp}
            inputMode="numeric"
            value={value.mileageMin}
            onChange={(e) => onChange({ mileageMin: e.target.value })}
          />
        </div>
        <div>
          <label className={lab} htmlFor={`${idPrefix}-mile-max`}>
            {copy.mileageMax}
          </label>
          <input
            id={`${idPrefix}-mile-max`}
            className={inp}
            inputMode="numeric"
            value={value.mileageMax}
            onChange={(e) => onChange({ mileageMax: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className={lab} htmlFor={`${idPrefix}-title`}>
          {copy.filterTitle}
        </label>
        <select
          id={`${idPrefix}-title`}
          className={inp}
          value={value.titleStatus}
          onChange={(e) => onChange({ titleStatus: e.target.value })}
        >
          <option value="">{copy.filterAny}</option>
          {options.titleStatuses.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        className="rounded-xl border border-[color:var(--lx-nav-border)] bg-[color:var(--lx-section)] py-2.5 text-sm font-semibold text-[color:var(--lx-text)] transition hover:bg-[color:var(--lx-nav-hover)]"
        onClick={onReset}
      >
        {copy.filterReset}
      </button>
      <button
        type="button"
        className="rounded-xl bg-[color:var(--lx-cta-dark)] py-2.5 text-sm font-bold text-[#FFFCF7] shadow-sm transition hover:bg-[color:var(--lx-cta-dark-hover)]"
        onClick={onApply}
      >
        {copy.filterApply}
      </button>
    </div>
  );
}
