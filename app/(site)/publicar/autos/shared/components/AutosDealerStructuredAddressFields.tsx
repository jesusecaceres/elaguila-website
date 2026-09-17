"use client";

import CityAutocomplete from "@/app/components/CityAutocomplete";
import { BusinessAddressVerifiedInput } from "@/app/components/forms/BusinessAddressVerifiedInput";
import type { BusinessAddress } from "@/app/lib/businessAddress/businessAddressContract";
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
  /** Single combined "Dirección" entry — replaces the old separate street-number/street-name pair. */
  street: string;
  unitOrSuite: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  helperMaps: string;
  helperSearch: string;
  selectEmpty: string;
};

/** Autos lang is "es" | "en" already; BusinessAddressVerifiedInput takes the same union. */
function toBusinessAddressLang(lang: AutosNegociosLang): "es" | "en" {
  return lang === "en" ? "en" : "es";
}

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
  // The provider contract combines number+name into one `street` line. Existing structured
  // rows may still carry them split (legacy data); combine for display, and going forward this
  // field writes the full line into `dealerStreetName` alone (`dealerStreetNumber` cleared) —
  // `buildDealerDisplayAddress` already renders `name` alone correctly when `num` is empty.
  const combinedStreet = [values.dealerStreetNumber, values.dealerStreetName]
    .map((v) => (v ?? "").trim())
    .filter(Boolean)
    .join(" ");
  const addressValue: BusinessAddress = {
    street: combinedStreet,
    unit: values.dealerUnitOrSuite || undefined,
    city: values.dealerAddressCity ?? "",
    region: values.dealerAddressState ?? "",
    postalCode: values.dealerAddressZip ?? "",
    country: values.dealerAddressCountry ?? AUTOS_DEFAULT_COUNTRY,
    verificationStatus: values.dealerAddressVerificationStatus ?? "unverified",
    provider: values.dealerAddressProvider ?? null,
    providerPlaceId: values.dealerAddressProviderPlaceId ?? null,
    manualEntry: values.dealerAddressVerificationStatus !== "user_confirmed",
  };

  return (
    <div className="sm:col-span-2 space-y-4">
      <p className="text-xs leading-relaxed text-[color:var(--lx-muted)]">
        {labels.helperMaps} {labels.helperSearch}
      </p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={LABEL}>{labels.street}</label>
          <BusinessAddressVerifiedInput
            lang={toBusinessAddressLang(lang)}
            inputClassName={INPUT}
            locationHint={[values.dealerAddressCity, values.dealerAddressState]
              .map((v) => (v ?? "").trim())
              .filter(Boolean)
              .join(", ")}
            value={addressValue}
            onChange={(next) =>
              onPatch({
                dealerStreetName: next.street || undefined,
                dealerStreetNumber: undefined,
                dealerAddressVerificationStatus: next.verificationStatus,
                dealerAddressProvider: next.provider ?? null,
                dealerAddressProviderPlaceId: next.providerPlaceId ?? null,
                // A picked suggestion carries its own city/region/postal — auto-fill those too,
                // same as the proven Servicios pattern. Manual typing only ever touches street.
                ...(next.verificationStatus === "user_confirmed"
                  ? {
                      dealerAddressCity: next.city || values.dealerAddressCity,
                      dealerAddressState: next.region || values.dealerAddressState,
                      dealerAddressZip: next.postalCode || values.dealerAddressZip,
                      dealerAddressCountry: next.country || values.dealerAddressCountry,
                    }
                  : {}),
              })
            }
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
