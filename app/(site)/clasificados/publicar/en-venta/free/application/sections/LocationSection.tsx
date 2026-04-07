"use client";

import { useEffect, useMemo } from "react";
import SectionShell from "@/app/clasificados/en-venta/shared/components/SectionShell";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import { getZipRecord, normalizeZipInput } from "@/app/data/locations/californiaLocationHelpers";
import type { EnVentaFreeApplicationState } from "../schema/enVentaFreeFormState";
import type { EnVentaFreeSectionProps } from "../types/sectionProps";
import { inputClass, labelClass } from "../helpers/fieldCx";
import { validateEnVentaLocation } from "@/app/clasificados/en-venta/shared/utils/validateEnVentaLocation";
import { nextCityZipFromCityInput, nextCityZipFromZipInput } from "@/app/clasificados/lib/locationPairUx";

const COPY = {
  es: {
    title: "Ubicación",
    desc: "Usa ciudad o ZIP para ubicar tu anuncio. Puedes escribir ciudad, ZIP o ambos. Si agregas ambos, deben coincidir. Esto ayuda a resultados cercanos y distancia aproximada más adelante.",
    city: "Ciudad",
    zip: "ZIP (opcional)",
    zipHint: "5 dígitos",
  },
  en: {
    title: "Location",
    desc: "Use city or ZIP to place your listing. You can enter city, ZIP, or both. If you enter both, they must match. This helps nearby results and approximate distance later.",
    city: "City",
    zip: "ZIP (optional)",
    zipHint: "5 digits",
  },
} as const;

export function LocationSection<S extends EnVentaFreeApplicationState>({
  lang,
  state,
  setState,
}: EnVentaFreeSectionProps<S>) {
  const t = COPY[lang];
  const validation = useMemo(
    () => validateEnVentaLocation(state.city, state.zip),
    [state.city, state.zip]
  );

  useEffect(() => {
    if (state.city.trim()) return;
    const zip5 = normalizeZipInput(state.zip);
    if (!zip5) return;
    const rec = getZipRecord(zip5);
    if (rec) {
      setState((s) => (s.city === rec.city ? s : { ...s, city: rec.city }));
    }
  }, [state.zip, state.city, setState]);

  const msg = validation.ok ? null : lang === "es" ? validation.messageEs : validation.messageEn;
  const cityInvalid =
    !validation.ok &&
    (validation.code === "bad_city" || validation.code === "mismatch" || validation.code === "missing_both");
  const zipInvalid =
    !validation.ok &&
    (validation.code === "bad_zip" ||
      validation.code === "mismatch" ||
      validation.code === "incomplete_zip" ||
      validation.code === "missing_both");

  return (
    <SectionShell lang={lang} title={t.title} description={t.desc}>
      <div>
        <CityAutocomplete
          lang={lang}
          variant="light"
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
      <div>
        <label className={labelClass}>{t.zip}</label>
        <p className="mt-1 text-xs text-[#111111]/60">{t.zipHint}</p>
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
          placeholder={lang === "es" ? "Ej: 95350" : "e.g. 95350"}
          aria-invalid={zipInvalid}
        />
      </div>
      {msg ? (
        <p className="mt-3 rounded-xl border border-red-300/80 bg-red-50 px-3 py-2 text-sm text-red-900" role="alert">
          {msg}
        </p>
      ) : null}
    </SectionShell>
  );
}
