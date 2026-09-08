"use client";

import { useState } from "react";
import { countriesSortedByLabel, countryLabel } from "@/app/lib/business/countries";
import { COVERAGE_LEVELS, DELIVERY_MODELS, RADIUS_PRESETS } from "@/app/lib/business/constants";
import { hasStateProvinceData, stateProvinceOptions, allStateProvinceLabels } from "@/app/lib/business/statesProvinces";
import { fillTemplate } from "@/app/lib/business/copyTemplate";
import { SearchableSelect } from "../../_components/SearchableSelect";
import { ChipListInput } from "../../_components/ChipListInput";
import { OptionToggleGroup } from "../../_components/OptionToggleGroup";
import { CodedMultiSelect } from "../../_components/CodedMultiSelect";
import { RegionShortcutBar } from "../../_components/RegionShortcutBar";
import type { BusinessIdentityCopy, Lang } from "../../_components/businessIdentityCopy";
import { clearCountryDependentGeography, type WizardDraftPayloadV2 } from "../wizardTypes";
import type { CoverageLevel, DeliveryModel, ServiceCoverageV1, StructuredLocationDetailsV1 } from "@/app/lib/business/types";

function TextField({
  id,
  label,
  value,
  onChange,
  type = "text",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold text-[#3D3428]">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full min-h-[44px] rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#1E1810]"
      />
    </div>
  );
}

const emptyCoverage: ServiceCoverageV1 = { schemaVersion: 1, level: "" };

export function Step5Location({
  t,
  lang,
  payload,
  onChange,
  errors,
}: {
  t: BusinessIdentityCopy["wizard"]["step5"];
  lang: Lang;
  payload: WizardDraftPayloadV2;
  onChange: (next: WizardDraftPayloadV2) => void;
  errors: readonly string[];
}) {
  // "hybrid" is a derived, never customer-selected tag (see deriveEffectiveOperatingModels in
  // wizardTypes.ts) — it's never present in the live draft, so each section here is gated purely
  // on its own primary mode. Selecting more than one primary mode already shows multiple
  // sections at once, which is what "hybrid" means in practice.
  const models = payload.operatingModel.operatingModels;
  const showPhysical = models.includes("fixed_location");
  const showMultiple = models.includes("multiple_locations");

  const details = payload.serviceArea.structuredDetails;
  const coverage = details.coverage ?? emptyCoverage;

  function patchDetails(patch: Partial<StructuredLocationDetailsV1>) {
    onChange({ ...payload, serviceArea: { ...payload.serviceArea, structuredDetails: { ...details, ...patch } } });
  }
  function patchCoverage(patch: Partial<ServiceCoverageV1>) {
    patchDetails({ coverage: { ...coverage, ...patch } });
  }

  const countryOptions = countriesSortedByLabel(lang).map((c) => ({ value: c.code, label: c[lang] }));
  const country = payload.serviceArea.country;

  const [showCustomRadius, setShowCustomRadius] = useState(coverage.radiusValue !== undefined && !RADIUS_PRESETS.includes(coverage.radiusValue));

  const inheritedCity = !details.baseCity && details.city ? details.city : null;
  const inheritedPlace = inheritedCity ? [details.city, details.stateProvince].filter(Boolean).join(", ") : "";

  const tc = t.coverage;

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-[#1E1810]">{t.title}</h2>

      <SearchableSelect
        label={t.countryLabel}
        options={countryOptions}
        value={country}
        onSelect={(v) => {
          if (v === country) return;
          // Gate BCO-3R-B.5 — changing the business country must never leave stale, now-
          // incompatible city/state/postal geography from the previous country behind (the
          // "Albania / San Jose, CA" contradiction). Multi-country/worldwide's own independent
          // country selections are untouched — see clearCountryDependentGeography.
          onChange({ ...payload, serviceArea: { ...payload.serviceArea, country: v, structuredDetails: clearCountryDependentGeography(details) } });
        }}
        noResultsLabel={tc.noResultsLabel}
      />
      {errors.includes("country") ? <p role="alert" className="text-xs text-[#7A1E2C]">{t.countryLabel}</p> : null}
      {country === "OTHER" ? (
        <TextField id="customCountryName" label={t.countryOtherNameLabel} value={details.customCountryName ?? ""} onChange={(v) => patchDetails({ customCountryName: v })} />
      ) : null}

      {showPhysical ? (
        <fieldset className="space-y-3 rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2]/50 p-4">
          <legend className="px-1 text-sm font-bold text-[#1E1810]">{t.physicalTitle}</legend>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField id="streetNumber" label={t.streetNumberLabel} value={details.streetNumber ?? ""} onChange={(v) => patchDetails({ streetNumber: v })} />
            <TextField id="streetName" label={t.streetNameLabel} value={details.streetName ?? ""} onChange={(v) => patchDetails({ streetName: v })} />
            <TextField id="unit" label={t.unitLabel} value={details.unit ?? ""} onChange={(v) => patchDetails({ unit: v })} />
            <TextField id="neighborhood" label={t.neighborhoodLabel} value={details.neighborhood ?? ""} onChange={(v) => patchDetails({ neighborhood: v })} />
            <TextField id="city" label={t.cityLabel} value={details.city ?? ""} onChange={(v) => patchDetails({ city: v })} />
            <TextField id="stateProvince" label={t.stateProvinceLabel} value={details.stateProvince ?? ""} onChange={(v) => patchDetails({ stateProvince: v })} />
            <TextField id="postalCode" label={t.postalCodeLabel} value={details.postalCode ?? ""} onChange={(v) => patchDetails({ postalCode: v })} />
          </div>
          <div>
            <span className="block text-xs font-semibold text-[#3D3428]">{t.addressVisibilityLabel}</span>
            <div className="mt-1.5 flex flex-col gap-1.5">
              {(["public_exact", "city_only", "private"] as const).map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-xs text-[#3D3428]">
                  <input
                    type="radio"
                    name="addressVisibility"
                    checked={details.addressVisibility === opt}
                    onChange={() => patchDetails({ addressVisibility: opt })}
                    className="h-4 w-4"
                  />
                  {t.addressVisibilityOptions[opt]}
                </label>
              ))}
            </div>
          </div>
        </fieldset>
      ) : null}

      <fieldset className="space-y-4 rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2]/50 p-4">
        <legend className="px-1 text-sm font-bold text-[#1E1810]">{tc.title}</legend>
        {errors.includes("coverage") ? (
          <p role="alert" className="text-xs text-[#7A1E2C]">
            {tc.errorSummaryTitle}
          </p>
        ) : null}

        <OptionToggleGroup
          legend={tc.title}
          mode="single"
          columns={2}
          options={COVERAGE_LEVELS.map((o) => ({ value: o.value, label: o[lang] }))}
          selected={coverage.level ? [coverage.level] : []}
          onToggle={(v) => patchCoverage({ level: v as CoverageLevel })}
        />

        {coverage.level === "local" ? (
          <div className="space-y-3 border-t border-dashed border-[#E8DFD0] pt-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">{tc.localSectionTitle}</h3>
            {inheritedCity ? (
              <p className="rounded-lg border border-dashed border-[#D6C7AD] bg-white p-2 text-xs text-[#5C5346]">
                {fillTemplate(tc.inheritedLocationTemplate, { value: inheritedPlace })}{" "}
                <button
                  type="button"
                  onClick={() => patchDetails({ baseCity: details.city, baseStateProvince: details.stateProvince, basePostalCode: details.postalCode })}
                  className="font-semibold text-[#8A6B1F] underline"
                >
                  {tc.useInheritedLocation}
                </button>
              </p>
            ) : null}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <TextField id="baseCity" label={tc.baseCityLabel} value={details.baseCity ?? ""} onChange={(v) => patchDetails({ baseCity: v })} />
              <TextField id="baseStateProvince" label={tc.baseStateProvinceLabel} value={details.baseStateProvince ?? ""} onChange={(v) => patchDetails({ baseStateProvince: v })} />
              <TextField id="basePostalCode" label={tc.basePostalCodeLabel} value={details.basePostalCode ?? ""} onChange={(v) => patchDetails({ basePostalCode: v })} />
            </div>
            <div>
              <span className="block text-xs font-semibold text-[#3D3428]">{tc.radiusPresetLabel}</span>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {RADIUS_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    role="radio"
                    aria-checked={!showCustomRadius && coverage.radiusValue === preset}
                    onClick={() => {
                      setShowCustomRadius(false);
                      patchCoverage({ radiusValue: preset, radiusUnit: coverage.radiusUnit ?? "miles" });
                    }}
                    className={`min-h-[36px] rounded-lg border px-3 py-1.5 text-xs font-semibold ${
                      !showCustomRadius && coverage.radiusValue === preset ? "border-[#C9A84A] bg-[#FBF7EF]" : "border-[#E8DFD0] bg-white"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
                <button
                  type="button"
                  role="radio"
                  aria-checked={showCustomRadius}
                  onClick={() => setShowCustomRadius(true)}
                  className={`min-h-[36px] rounded-lg border px-3 py-1.5 text-xs font-semibold ${showCustomRadius ? "border-[#C9A84A] bg-[#FBF7EF]" : "border-[#E8DFD0] bg-white"}`}
                >
                  {tc.radiusCustomLabel}
                </button>
              </div>
            </div>
            {showCustomRadius ? (
              <TextField
                id="radiusCustomValue"
                label={tc.radiusCustomValueLabel}
                type="number"
                value={coverage.radiusValue?.toString() ?? ""}
                onChange={(v) => patchCoverage({ radiusValue: v ? Number(v) : undefined })}
              />
            ) : null}
            <div>
              <span className="block text-xs font-semibold text-[#3D3428]">{tc.radiusUnitLabel}</span>
              <div className="mt-1.5 flex gap-2">
                {(["miles", "kilometers"] as const).map((u) => (
                  <button
                    key={u}
                    type="button"
                    role="radio"
                    aria-checked={coverage.radiusUnit === u}
                    onClick={() => patchCoverage({ radiusUnit: u })}
                    className={`min-h-[36px] rounded-lg border px-3 py-1.5 text-xs font-semibold ${coverage.radiusUnit === u ? "border-[#C9A84A] bg-[#FBF7EF]" : "border-[#E8DFD0] bg-white"}`}
                  >
                    {t.radiusUnitOptions[u]}
                  </button>
                ))}
              </div>
            </div>
            <ChipListInput
              id="nearbyNeighborhoods"
              label={tc.nearbyNeighborhoodsLabel}
              values={coverage.nearbyNeighborhoods ?? []}
              onChange={(v) => patchCoverage({ nearbyNeighborhoods: v })}
              placeholder={t.addChipHint}
              removeLabel={t.removeChip}
            />
            <TextField id="localNote" label={tc.localNoteLabel} value={coverage.localNote ?? ""} onChange={(v) => patchCoverage({ localNote: v })} />
          </div>
        ) : null}

        {coverage.level === "multi_city" ? (
          <div className="space-y-3 border-t border-dashed border-[#E8DFD0] pt-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">{tc.multiCitySectionTitle}</h3>
            <TextField id="citiesStateProvince" label={tc.citiesStateProvinceLabel} value={coverage.citiesStateProvince ?? ""} onChange={(v) => patchCoverage({ citiesStateProvince: v })} />
            <ChipListInput
              id="multiCitiesServed"
              label={tc.citiesServedLabel}
              values={coverage.citiesServed ?? []}
              onChange={(v) => patchCoverage({ citiesServed: v })}
              placeholder={t.addChipHint}
              removeLabel={t.removeChip}
            />
          </div>
        ) : null}

        {coverage.level === "one_state" ? (
          <div className="space-y-3 border-t border-dashed border-[#E8DFD0] pt-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">{tc.oneStateSectionTitle}</h3>
            {hasStateProvinceData(country) ? (
              <SearchableSelect
                label={tc.stateProvinceLabel}
                options={stateProvinceOptions(country, lang)}
                value={coverage.stateProvince ?? ""}
                onSelect={(v) => patchCoverage({ stateProvince: v })}
                noResultsLabel={tc.noResultsLabel}
              />
            ) : (
              <TextField id="oneStateManual" label={tc.stateProvinceManualLabel} value={coverage.stateProvince ?? ""} onChange={(v) => patchCoverage({ stateProvince: v })} />
            )}
            <ChipListInput
              id="excludedCitiesOrAreas"
              label={tc.excludedCitiesLabel}
              values={coverage.excludedCitiesOrAreas ?? []}
              onChange={(v) => patchCoverage({ excludedCitiesOrAreas: v })}
              placeholder={t.addChipHint}
              removeLabel={t.removeChip}
            />
          </div>
        ) : null}

        {coverage.level === "multi_state" ? (
          <div className="space-y-3 border-t border-dashed border-[#E8DFD0] pt-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">{tc.multiStateSectionTitle}</h3>
            {hasStateProvinceData(country) ? (
              <>
                <CodedMultiSelect
                  id="multiStatesServed"
                  label={tc.statesProvincesServedLabel}
                  options={stateProvinceOptions(country, lang)}
                  selectedValues={coverage.statesProvincesServed ?? []}
                  onChange={(next) => patchCoverage({ statesProvincesServed: next })}
                  noResultsLabel={tc.noResultsLabel}
                  removeLabel={t.removeChip}
                />
                <button
                  type="button"
                  onClick={() =>
                    patchCoverage({
                      statesProvincesServed: Array.from(new Set([...(coverage.statesProvincesServed ?? []), ...allStateProvinceLabels(country, lang)])),
                      multiStateSelectAllConfirmed: true,
                    })
                  }
                  className="min-h-[36px] rounded-lg border border-[#C9A84A] bg-white px-3 py-1.5 text-xs font-semibold text-[#1E1810]"
                >
                  {fillTemplate(tc.selectAllStatesTemplate, { n: allStateProvinceLabels(country, lang).length, country: countryLabel(country, lang) })}
                </button>
              </>
            ) : (
              <ChipListInput
                id="multiStatesServedManual"
                label={tc.statesProvincesServedLabel}
                values={coverage.statesProvincesServed ?? []}
                onChange={(v) => patchCoverage({ statesProvincesServed: v })}
                placeholder={t.addChipHint}
                removeLabel={t.removeChip}
              />
            )}
            <ChipListInput
              id="excludedStatesProvinces"
              label={tc.excludedStatesLabel}
              values={coverage.excludedStatesProvinces ?? []}
              onChange={(v) => patchCoverage({ excludedStatesProvinces: v })}
              placeholder={t.addChipHint}
              removeLabel={t.removeChip}
            />
          </div>
        ) : null}

        {coverage.level === "nationwide" ? (
          <div className="space-y-3 border-t border-dashed border-[#E8DFD0] pt-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">{tc.nationwideSectionTitle}</h3>
            <label className="flex items-center gap-2 text-sm font-medium text-[#3D3428]">
              <input type="checkbox" checked={coverage.nationwideConfirmed ?? false} onChange={(e) => patchCoverage({ nationwideConfirmed: e.target.checked })} className="h-4 w-4" />
              {tc.nationwideConfirmLabel}
            </label>
            <ChipListInput
              id="nationwideExcluded"
              label={tc.excludedRegionsLabel}
              values={coverage.excludedStatesProvinces ?? []}
              onChange={(v) => patchCoverage({ excludedStatesProvinces: v })}
              placeholder={t.addChipHint}
              removeLabel={t.removeChip}
            />
          </div>
        ) : null}

        {coverage.level === "multi_country" ? (
          <div className="space-y-3 border-t border-dashed border-[#E8DFD0] pt-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">{tc.multiCountrySectionTitle}</h3>
            <CodedMultiSelect
              id="countriesServedCodes"
              label={tc.countriesServedLabel}
              options={countryOptions.filter((o) => o.value !== "OTHER")}
              selectedValues={coverage.countriesServedCodes ?? []}
              onChange={(next) => patchCoverage({ countriesServedCodes: next })}
              addPlaceholder={tc.addCountryPlaceholder}
              noResultsLabel={tc.noResultsLabel}
              removeLabel={t.removeChip}
              countLabel={(n) => fillTemplate(tc.countSelectedTemplate, { n })}
            />
            <RegionShortcutBar
              lang={lang}
              legend={tc.regionShortcutsLegend}
              selectedCountryCodes={coverage.countriesServedCodes ?? []}
              regionSelections={coverage.regionSelections ?? []}
              onChange={({ countryCodes, regionSelections }) => patchCoverage({ countriesServedCodes: countryCodes, regionSelections })}
              t={{
                selectAllLabel: (n) => fillTemplate(tc.selectAllInRegionTemplate, { n }),
                confirmLabel: tc.confirmLabel,
                cancelLabel: tc.cancelLabel,
                chooseSpecificLabel: tc.chooseSpecificLabel,
                searchPlaceholder: tc.searchWithinRegionPlaceholder,
                noResultsLabel: tc.noResultsLabel,
                countSelectedInRegion: (n) => fillTemplate(tc.countSelectedInRegionTemplate, { n }),
              }}
            />
            <CodedMultiSelect
              id="excludedCountries"
              label={tc.excludedCountriesLabel}
              options={countryOptions.filter((o) => o.value !== "OTHER")}
              selectedValues={coverage.excludedCountries ?? []}
              onChange={(next) => patchCoverage({ excludedCountries: next })}
              addPlaceholder={tc.addCountryPlaceholder}
              noResultsLabel={tc.noResultsLabel}
              removeLabel={t.removeChip}
            />
          </div>
        ) : null}

        {coverage.level === "worldwide" ? (
          <div className="space-y-3 border-t border-dashed border-[#E8DFD0] pt-3">
            <h3 className="text-xs font-bold uppercase tracking-wide text-[#8A6B1F]">{tc.worldwideSectionTitle}</h3>
            <label className="flex items-center gap-2 text-sm font-medium text-[#3D3428]">
              <input type="checkbox" checked={coverage.worldwideConfirmed ?? false} onChange={(e) => patchCoverage({ worldwideConfirmed: e.target.checked })} className="h-4 w-4" />
              {tc.worldwideConfirmLabel}
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <TextField id="primaryTimeZone" label={tc.primaryTimeZoneLabel} value={coverage.primaryTimeZone ?? ""} onChange={(v) => patchCoverage({ primaryTimeZone: v })} />
            </div>
            <ChipListInput
              id="additionalTimeZones"
              label={tc.additionalTimeZonesLabel}
              values={coverage.additionalTimeZones ?? []}
              onChange={(v) => patchCoverage({ additionalTimeZones: v })}
              placeholder={t.addChipHint}
              removeLabel={t.removeChip}
            />
            <ChipListInput
              id="worldwideLanguages"
              label={tc.worldwideLanguagesLabel}
              values={details.languagesServed ?? []}
              onChange={(v) => patchDetails({ languagesServed: v })}
              placeholder={t.addChipHint}
              removeLabel={t.removeChip}
            />
            <CodedMultiSelect
              id="worldwideExcludedCountries"
              label={tc.worldwideExcludedCountriesLabel}
              options={countryOptions.filter((o) => o.value !== "OTHER")}
              selectedValues={coverage.excludedCountries ?? []}
              onChange={(next) => patchCoverage({ excludedCountries: next })}
              addPlaceholder={tc.addCountryPlaceholder}
              noResultsLabel={tc.noResultsLabel}
              removeLabel={t.removeChip}
            />
            <OptionToggleGroup
              legend={tc.deliveryModelLabel}
              mode="multiple"
              columns={2}
              options={DELIVERY_MODELS.map((o) => ({ value: o.value, label: o[lang] }))}
              selected={coverage.deliveryModels ?? []}
              onToggle={(v) => {
                const cur = coverage.deliveryModels ?? [];
                const next = cur.includes(v as DeliveryModel) ? cur.filter((x) => x !== v) : [...cur, v as DeliveryModel];
                patchCoverage({ deliveryModels: next });
              }}
            />
            {(coverage.deliveryModels ?? []).includes("other") ? (
              <TextField id="deliveryModelOtherNote" label={tc.deliveryModelOtherNoteLabel} value={coverage.deliveryModelOtherNote ?? ""} onChange={(v) => patchCoverage({ deliveryModelOtherNote: v })} />
            ) : null}
          </div>
        ) : null}
      </fieldset>

      {showMultiple ? (
        <fieldset className="space-y-3 rounded-2xl border border-[#E8DFD0] bg-[#FAF7F2]/50 p-4">
          <legend className="px-1 text-sm font-bold text-[#1E1810]">{t.multipleLocationsTitle}</legend>
          <label className="flex items-center gap-2 text-sm font-medium text-[#3D3428]">
            <input type="checkbox" checked={details.hasMultipleLocations ?? false} onChange={(e) => patchDetails({ hasMultipleLocations: e.target.checked })} className="h-4 w-4" />
            {t.multipleLocationsCheckbox}
          </label>
          {details.hasMultipleLocations ? (
            <TextField
              id="approximateLocationCount"
              label={t.multipleLocationsCountLabel}
              type="number"
              value={details.approximateLocationCount?.toString() ?? ""}
              onChange={(v) => patchDetails({ approximateLocationCount: v ? Number(v) : undefined })}
            />
          ) : null}
          <p className="text-xs text-[#7A7164]">{t.multipleLocationsNote}</p>
        </fieldset>
      ) : null}
    </div>
  );
}
