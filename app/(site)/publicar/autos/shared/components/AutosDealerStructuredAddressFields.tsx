"use client";

import CityAutocomplete from "@/app/components/CityAutocomplete";
import type { DealerStructuredAddressPatch } from "@/app/lib/clasificados/autos/autosDealerStructuredAddress";
import {
  AUTOS_DEFAULT_COUNTRY,
  AUTOS_DEFAULT_STATE,
} from "@/app/lib/clasificados/autos/autosLocationContract";
import { autosDraftTextValue } from "@/app/lib/clasificados/autos/autosPublishFormText";
import {
  autosVehicleCityHelper,
  autosVehicleCityPlaceholder,
  autosVehicleCountryHelper,
  autosVehicleZipHelper,
} from "@/app/lib/clasificados/autos/autosVehicleLocationCopy";
import { US_STATE_OPTIONS } from "@/app/publicar/autos/negocios/lib/autoDealerTaxonomy";
import type { AutosNegociosLang } from "@/app/clasificados/autos/negocios/lib/autosNegociosLang";

const INPUT =
  "mt-1.5 min-h-[46px] w-full rounded-xl border border-[color:var(--lx-nav-border)] bg-[#FFFCF7] px-3.5 py-2.5 text-[15px] leading-snug text-[color:var(--lx-text)] outline-none ring-[color:var(--lx-focus-ring)] focus:ring-2";

const LABEL = "block text-xs font-bold uppercase tracking-[0.1em] text-[color:var(--lx-muted)]";

export type AutosDealerStructuredAddressLabels = {
  streetNumber: string;
  streetName: string;
  unitOrSuite: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  helperMaps: string;
  helperSearch: string;
  selectEmpty: string;
};

export function AutosDealerStructuredAddressFields({
  labels,
  values,
  onPatch,
  lang,
}: {
  labels: AutosDealerStructuredAddressLabels;
  values: DealerStructuredAddressPatch;
  onPatch: (patch: Partial<DealerStructuredAddressPatch>) => void;
  lang: AutosNegociosLang;
}) {
  return (
    <div className="sm:col-span-2 space-y-4">
      <p className="text-xs leading-relaxed text-[color:var(--lx-muted)]">
        {labels.helperMaps} {labels.helperSearch}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={LABEL}>{labels.streetNumber}</label>
          <input
            className={INPUT}
            value={values.dealerStreetNumber ?? ""}
            onChange={(e) => onPatch({ dealerStreetNumber: autosDraftTextValue(e.target.value) })}
            autoComplete="off"
          />
        </div>
        <div>
          <label className={LABEL}>{labels.streetName}</label>
          <input
            className={INPUT}
            value={values.dealerStreetName ?? ""}
            onChange={(e) => onPatch({ dealerStreetName: autosDraftTextValue(e.target.value) })}
            autoComplete="street-address"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL}>{labels.unitOrSuite}</label>
          <input
            className={INPUT}
            value={values.dealerUnitOrSuite ?? ""}
            onChange={(e) => onPatch({ dealerUnitOrSuite: autosDraftTextValue(e.target.value) })}
            autoComplete="off"
          />
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL}>{labels.city}</label>
          <CityAutocomplete
            value={values.dealerAddressCity ?? ""}
            onChange={(v) => onPatch({ dealerAddressCity: v || undefined })}
            lang={lang}
            variant="brForm"
            freeText
            placeholder={autosVehicleCityPlaceholder(lang)}
          />
          <p className="mt-1.5 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{autosVehicleCityHelper(lang)}</p>
        </div>
        <div>
          <label className={LABEL}>{labels.state}</label>
          <select
            className={INPUT}
            value={values.dealerAddressState?.trim() || AUTOS_DEFAULT_STATE}
            onChange={(e) => onPatch({ dealerAddressState: e.target.value || undefined })}
          >
            {US_STATE_OPTIONS.map((s) => (
              <option key={s || "empty"} value={s}>
                {s || labels.selectEmpty}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={LABEL}>{labels.zipCode}</label>
          <input
            className={INPUT}
            value={values.dealerAddressZip ?? ""}
            onChange={(e) => onPatch({ dealerAddressZip: autosDraftTextValue(e.target.value) || undefined })}
            autoComplete="postal-code"
          />
          <p className="mt-1.5 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{autosVehicleZipHelper(lang)}</p>
        </div>
        <div className="sm:col-span-2">
          <label className={LABEL}>{labels.country}</label>
          <input
            className={INPUT}
            value={values.dealerAddressCountry ?? AUTOS_DEFAULT_COUNTRY}
            onChange={(e) => onPatch({ dealerAddressCountry: autosDraftTextValue(e.target.value) || undefined })}
            autoComplete="country-name"
          />
          <p className="mt-1.5 text-[11px] leading-relaxed text-[color:var(--lx-muted)]">{autosVehicleCountryHelper(lang)}</p>
        </div>
      </div>
    </div>
  );
}
