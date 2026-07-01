"use client";

import { useEffect, useMemo } from "react";
import { useEnVentaDetailField } from "@/app/clasificados/en-venta/publish/EnVentaDetailFieldCopyContext";
import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import { getZipRecord, normalizeZipInput } from "@/app/data/locations/californiaLocationHelpers";
import type { EnVentaFreeApplicationState } from "../schema/enVentaFreeFormState";
import type { EnVentaFreeSectionProps } from "../types/sectionProps";
import { inputClass, labelClass } from "../helpers/fieldCx";
import { validateEnVentaLocation } from "@/app/clasificados/en-venta/shared/utils/validateEnVentaLocation";
import { nextCityZipFromCityInput, nextCityZipFromZipInput } from "@/app/clasificados/lib/locationPairUx";
import {
  EN_VENTA_DEFAULT_COUNTRY,
  EN_VENTA_DEFAULT_STATE,
  US_STATE_OPTIONS,
} from "@/app/(site)/clasificados/en-venta/shared/constants/enVentaLocationContract";

const COPY = {
  es: {
    title: "Ubicación",
    desc: "Indica dónde está el artículo. Ciudad, estado y país ayudan a compradores cercanos a encontrarlo.",
    city: "Ciudad",
    state: "Estado",
    zip: "ZIP",
    country: "País",
    zipHint: "Opcional. Ingresa un ZIP de 5 dígitos si lo conoces.",
    countryHint: "Predeterminado: Estados Unidos. Edita si el artículo está en otro país.",
    publishLocHint: "La ubicación aparece en el anuncio y en la búsqueda pública.",
  },
  en: {
    title: "Location",
    desc: "Tell buyers where the item is. City, state, and country help nearby shoppers find it.",
    city: "City",
    state: "State",
    zip: "ZIP",
    country: "Country",
    zipHint: "Optional. Enter a 5-digit ZIP if you know it.",
    countryHint: "Default: United States. Edit if the item is in another country.",
    publishLocHint: "Location appears on the listing and in public search.",
  },
} as const;

export function LocationSection<S extends EnVentaFreeApplicationState>({
  lang,
  state,
  setState,
}: EnVentaFreeSectionProps<S>) {
  const t = COPY[lang];
  const ovZip = useEnVentaDetailField("zip");
  const validation = useMemo(
    () => validateEnVentaLocation(state.city, state.zip, state.state, state.country),
    [state.city, state.zip, state.state, state.country]
  );

  useEffect(() => {
    if (state.city.trim()) return;
    const zip5 = normalizeZipInput(state.zip);
    if (!zip5) return;
    const rec = getZipRecord(zip5);
    if (rec) {
      setState((s) => (s.city === rec.city ? s : { ...s, city: rec.city, state: s.state || EN_VENTA_DEFAULT_STATE }));
    }
  }, [state.zip, state.city, setState]);

  const msg = validation.ok ? null : lang === "es" ? validation.messageEs : validation.messageEn;
  const warningMsg =
    validation.ok && validation.warningEs
      ? lang === "es"
        ? validation.warningEs
        : validation.warningEn ?? validation.warningEs
      : null;
  const cityInvalid = !validation.ok && validation.code === "missing_city";
  const zipInvalid = !validation.ok && validation.code === "incomplete_zip";

  return (
    <SectionShell lang={lang} title={t.title} description={t.desc}>
      <p className="text-xs font-medium text-[#111111]/55">{t.publishLocHint}</p>
      <div className="mt-4">
        <CityAutocomplete
          lang={lang}
          variant="light"
          freeText
          required
          label={t.city}
          value={state.city}
          onChange={(v) =>
            setState((s) => {
              const next = nextCityZipFromCityInput({ city: s.city, zip: s.zip }, v);
              return { ...s, city: next.city, zip: next.zip };
            })
          }
          placeholder={lang === "es" ? "Ej: Modesto, San José…" : "e.g. Modesto, San Jose…"}
          invalid={cityInvalid}
        />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          {t.state}
          <select
            className={`${inputClass} mt-2`}
            value={state.state || EN_VENTA_DEFAULT_STATE}
            onChange={(e) => setState((s) => ({ ...s, state: e.target.value }))}
          >
            {US_STATE_OPTIONS.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.name}
              </option>
            ))}
          </select>
        </label>
        <div>
          <label className={labelClass}>{ovZip?.label ?? t.zip}</label>
          <p className="mt-1 text-xs text-[#111111]/60">{ovZip?.help ?? t.zipHint}</p>
          <input
            className={`${inputClass} mt-2 ${zipInvalid ? "border-red-500 ring-1 ring-red-500/35" : ""}`}
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            value={state.zip}
            onChange={(e) => {
              setState((s) => {
                const next = nextCityZipFromZipInput({ city: s.city, zip: s.zip }, e.target.value);
                return { ...s, city: next.city, zip: next.zip };
              });
            }}
            placeholder={ovZip?.placeholder ?? (lang === "es" ? "Ej: 95350" : "e.g. 95350")}
            aria-invalid={zipInvalid}
          />
        </div>
      </div>
      <div className="mt-4">
        <label className={labelClass}>{t.country}</label>
        <p className="mt-1 text-xs text-[#111111]/60">{t.countryHint}</p>
        <input
          className={`${inputClass} mt-2`}
          value={state.country || EN_VENTA_DEFAULT_COUNTRY}
          onChange={(e) => setState((s) => ({ ...s, country: e.target.value }))}
          placeholder={EN_VENTA_DEFAULT_COUNTRY}
          autoComplete="country-name"
        />
      </div>
      {msg ? (
        <p className="mt-3 rounded-xl border border-red-300/80 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
          {msg}
        </p>
      ) : null}
      {warningMsg ? (
        <p className="mt-3 rounded-xl border border-amber-300/80 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          {warningMsg}
        </p>
      ) : null}
    </SectionShell>
  );
}
