"use client";

import { useEffect, useState } from "react";
import { getCanonicalCityName, normalizeZipInput } from "@/app/data/locations/californiaLocationHelpers";
import { BienesRaicesUseLocationButton } from "@/app/clasificados/bienes-raices/components/BienesRaicesUseLocationButton";
import { setBrLastCity } from "@/app/clasificados/bienes-raices/shared/brFirstPartyPrefs";
import type { BrResultsCopy } from "../bienesRaicesResultsCopy";
import type { BrResultsParsedState } from "../lib/brResultsUrlState";
import type { Lang } from "@/app/clasificados/config/clasificadosHub";

const INPUT =
  "w-full rounded-xl border border-[#E8DFD0] bg-white px-3 py-2.5 text-sm text-[#1E1810] outline-none focus:border-[#C9B46A]/65";
const LABEL = "mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-[#5C5346]/75";

type Props = {
  parsed: BrResultsParsedState;
  copy: BrResultsCopy;
  lang: Lang;
  /** Merge into URL; omit page reset when `preservePage` true (pagination). */
  onPatch: (patch: Record<string, string | null>, preservePage?: boolean) => void;
  idPrefix?: string;
};

export function BienesRaicesResultsFilters({ parsed, copy, lang, onPatch, idPrefix = "br-f" }: Props) {
  const [q, setQ] = useState(parsed.q);
  const [city, setCity] = useState(parsed.city);
  const [zip, setZip] = useState(parsed.zip);
  const [priceMin, setPriceMin] = useState(parsed.priceMin);
  const [priceMax, setPriceMax] = useState(parsed.priceMax);

  useEffect(() => {
    setQ(parsed.q);
    setCity(parsed.city);
    setZip(parsed.zip);
    setPriceMin(parsed.priceMin);
    setPriceMax(parsed.priceMax);
  }, [parsed.q, parsed.city, parsed.zip, parsed.priceMin, parsed.priceMax]);

  const commitText = () => {
    const rawCity = city.trim();
    const canon = rawCity ? getCanonicalCityName(rawCity) || rawCity : "";
    const zipNorm = normalizeZipInput(zip);
    if (canon) setBrLastCity(canon);
    onPatch({
      q: q.trim() || null,
      city: canon || null,
      zip: zipNorm || null,
      priceMin: priceMin.trim() || null,
      priceMax: priceMax.trim() || null,
    });
  };

  return (
    <div className="rounded-2xl border border-[#E8DFD0]/95 bg-[#FDFBF7] p-3 shadow-[0_12px_40px_-22px_rgba(42,36,22,0.2)] sm:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <label className="min-w-0 md:col-span-2 xl:col-span-1">
              <span className={LABEL}>{copy.searchLabel}</span>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#B8954A]" aria-hidden>
                  ⌕
                </span>
                <input
                  id={`${idPrefix}-q`}
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onBlur={commitText}
                  placeholder={copy.searchPlaceholder}
                  className={INPUT + " pl-9"}
                />
              </div>
            </label>
            <label className="min-w-0">
              <span className={LABEL}>{copy.cityLabel}</span>
              <input
                id={`${idPrefix}-city`}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                onBlur={commitText}
                placeholder={copy.cityPlaceholder}
                className={INPUT}
              />
            </label>
            <label className="min-w-0">
              <span className={LABEL}>{copy.zipLabel}</span>
              <input
                id={`${idPrefix}-zip`}
                inputMode="numeric"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                onBlur={commitText}
                placeholder={copy.zipPlaceholder}
                className={INPUT}
                autoComplete="postal-code"
              />
            </label>
            <label>
              <span className={LABEL}>{copy.operationLabel}</span>
            <select
              value={parsed.operationType}
              onChange={(e) => {
                const v = e.target.value as BrResultsParsedState["operationType"];
                onPatch({ operationType: v || null });
              }}
              className={INPUT}
            >
              <option value="">{copy.operationAny}</option>
              <option value="venta">{copy.operationSale}</option>
              <option value="renta">{copy.operationRent}</option>
            </select>
          </label>
          <label>
            <span className={LABEL}>{copy.typeLabel}</span>
            <select
              value={parsed.propertyType}
              onChange={(e) => {
                const v = e.target.value;
                const tipoLegacy =
                  v === "departamento" ? "depto" : v === "casa" || v === "terreno" || v === "comercial" ? v : "";
                onPatch({
                  propertyType: v || null,
                  tipo: tipoLegacy || null,
                });
              }}
              className={INPUT}
            >
              <option value="">{copy.typeAny}</option>
              <option value="casa">{copy.typeHouse}</option>
              <option value="departamento">{copy.typeApt}</option>
              <option value="terreno">{copy.typeLand}</option>
              <option value="comercial">{copy.typeCommercial}</option>
            </select>
          </label>
          </div>
          <BienesRaicesUseLocationButton lang={lang} />
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <label>
          <span className={LABEL}>{copy.priceMinLabel}</span>
          <input
            inputMode="numeric"
            value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            onBlur={commitText}
            placeholder={copy.priceMinPlaceholder}
            className={INPUT}
          />
        </label>
        <label>
          <span className={LABEL}>{copy.priceMaxLabel}</span>
          <input
            inputMode="numeric"
            value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            onBlur={commitText}
            placeholder={copy.priceMaxPlaceholder}
            className={INPUT}
          />
        </label>
        <label>
          <span className={LABEL}>{copy.bedsLabel}</span>
          <select
            value={parsed.beds}
            onChange={(e) => onPatch({ beds: e.target.value || null, recs: e.target.value || null })}
            className={INPUT}
          >
            <option value="">{copy.bedsAny}</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
        </label>
        <label>
          <span className={LABEL}>{copy.bathsLabel}</span>
          <select
            value={parsed.baths}
            onChange={(e) => onPatch({ baths: e.target.value || null })}
            className={INPUT}
          >
            <option value="">{copy.bathsAny}</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
        </label>
        <label>
          <span className={LABEL}>{copy.sellerLabel}</span>
          <select
            value={parsed.sellerType}
            onChange={(e) =>
              onPatch({
                sellerType: (e.target.value as BrResultsParsedState["sellerType"]) || null,
              })
            }
            className={INPUT}
          >
            <option value="">{copy.sellerAny}</option>
            <option value="privado">{copy.sellerPrivate}</option>
            <option value="negocio">{copy.sellerBusiness}</option>
          </select>
        </label>
        <div className="flex flex-col justify-end gap-2 sm:flex-row sm:items-center">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#1E1810]">
            <input
              type="checkbox"
              checked={parsed.pets === "true"}
              onChange={(e) => onPatch({ pets: e.target.checked ? "true" : null })}
              className="h-4 w-4 rounded border-[#E8DFD0] text-[#B8954A] focus:ring-[#C9B46A]/50"
            />
            {copy.togglePets}
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#1E1810]">
            <input
              type="checkbox"
              checked={parsed.furnished === "true"}
              onChange={(e) => onPatch({ furnished: e.target.checked ? "true" : null })}
              className="h-4 w-4 rounded border-[#E8DFD0] text-[#B8954A] focus:ring-[#C9B46A]/50"
            />
            {copy.toggleFurnished}
          </label>
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-[#E8DFD0] bg-white px-3 py-2 text-sm text-[#1E1810]">
            <input
              type="checkbox"
              checked={parsed.pool === "true"}
              onChange={(e) => onPatch({ pool: e.target.checked ? "true" : null })}
              className="h-4 w-4 rounded border-[#E8DFD0] text-[#B8954A] focus:ring-[#C9B46A]/50"
            />
            {copy.togglePool}
          </label>
        </div>
        <p className="text-[10px] leading-snug text-[#5C5346]/85">{copy.amenityTogglesHint}</p>
      </div>

    </div>
  );
}
