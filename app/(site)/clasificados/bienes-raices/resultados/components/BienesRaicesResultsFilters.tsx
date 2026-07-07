"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getCanonicalCityName, normalizeZipInput } from "@/app/data/locations/californiaLocationHelpers";
import { BienesRaicesUseLocationButton } from "@/app/clasificados/bienes-raices/components/BienesRaicesUseLocationButton";
import { US_STATE_OPTIONS } from "@/app/clasificados/shared/constants/leonixPropertyLocationContract";
import { setBrLastCity } from "@/app/clasificados/bienes-raices/shared/brFirstPartyPrefs";
import {
  CAT_STD_FILTER_CHIP,
  CAT_STD_FILTER_CHIP_GRID,
  CAT_STD_FILTER_HELPER,
  CAT_STD_FILTER_SECTION_HEADING,
} from "@/app/(site)/clasificados/components/categoryStandard/categoryStandardStyles";
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
  /** Drawer uses single-column sections; inline panel may use wider grids. */
  layout?: "drawer" | "inline";
};

function FilterSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3 border-b border-[#D6C7AD]/40 pb-5 last:border-b-0 last:pb-0">
      <h3 className={CAT_STD_FILTER_SECTION_HEADING}>{title}</h3>
      {children}
    </section>
  );
}

function AmenityChip({
  id,
  checked,
  label,
  onChange,
}: {
  id: string;
  checked: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <label htmlFor={id} className={CAT_STD_FILTER_CHIP}>
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 shrink-0 rounded border-[#E8DFD0] text-[#B8954A] focus:ring-[#C9B46A]/50"
      />
      <span>{label}</span>
    </label>
  );
}

export function BienesRaicesResultsFilters({
  parsed,
  copy,
  lang,
  onPatch,
  idPrefix = "br-f",
  layout = "drawer",
}: Props) {
  const isDrawer = layout === "drawer";
  const pairGrid = isDrawer ? "grid gap-3 grid-cols-1 sm:grid-cols-2" : "grid gap-3 sm:grid-cols-2";

  const [q, setQ] = useState(parsed.q);
  const [city, setCity] = useState(parsed.city);
  const [state, setState] = useState(parsed.state || "CA");
  const [country, setCountry] = useState(parsed.country || "United States");
  const [zip, setZip] = useState(parsed.zip);
  const [priceMin, setPriceMin] = useState(parsed.priceMin);
  const [priceMax, setPriceMax] = useState(parsed.priceMax);

  useEffect(() => {
    setQ(parsed.q);
    setCity(parsed.city);
    setState(parsed.state || "CA");
    setCountry(parsed.country || "United States");
    setZip(parsed.zip);
    setPriceMin(parsed.priceMin);
    setPriceMax(parsed.priceMax);
  }, [parsed.q, parsed.city, parsed.state, parsed.country, parsed.zip, parsed.priceMin, parsed.priceMax]);

  const commitText = () => {
    const rawCity = city.trim();
    const canon = rawCity ? getCanonicalCityName(rawCity) || rawCity : "";
    const zipNorm = normalizeZipInput(zip);
    if (canon) setBrLastCity(canon);
    onPatch({
      q: q.trim() || null,
      city: canon || null,
      state: state.trim() || null,
      country:
        country.trim() && country.trim().toLowerCase() !== "united states" ? country.trim() : null,
      zip: zipNorm || null,
      priceMin: priceMin.trim() || null,
      priceMax: priceMax.trim() || null,
    });
  };

  return (
    <div className={isDrawer ? "space-y-5" : "rounded-2xl border border-[#E8DFD0]/80 bg-[#FFFDF7] p-4 sm:p-5"}>
      <FilterSection title={copy.sectionSearchWhat}>
        <label className="block min-w-0">
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
      </FilterSection>

      <FilterSection title={copy.sectionOperationType}>
        <div className={pairGrid}>
          <label className="block min-w-0">
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
          <label className="block min-w-0">
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
      </FilterSection>

      <FilterSection title={copy.sectionWhere}>
        <label className="block min-w-0">
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
        <div className={pairGrid}>
          <label className="block min-w-0">
            <span className={LABEL}>{copy.stateLabel}</span>
            <select
              id={`${idPrefix}-state`}
              value={state || "CA"}
              onChange={(e) => {
                setState(e.target.value);
                onPatch({ state: e.target.value || null });
              }}
              className={INPUT}
            >
              {US_STATE_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.code} — {opt.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block min-w-0">
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
        </div>
        <label className="block min-w-0">
          <span className={LABEL}>{copy.countryLabel}</span>
          <input
            id={`${idPrefix}-country`}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            onBlur={commitText}
            placeholder={lang === "es" ? "Estados Unidos" : "United States"}
            className={INPUT}
            autoComplete="country-name"
          />
        </label>
        <BienesRaicesUseLocationButton lang={lang} />
      </FilterSection>

      <FilterSection title={copy.sectionBudget}>
        <div className={pairGrid}>
          <label className="block min-w-0">
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
          <label className="block min-w-0">
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
        </div>
      </FilterSection>

      <FilterSection title={copy.sectionSize}>
        <div className={pairGrid}>
          <label className="block min-w-0">
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
          <label className="block min-w-0">
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
        </div>
      </FilterSection>

      <FilterSection title={copy.sectionNeeds}>
        <div className={CAT_STD_FILTER_CHIP_GRID}>
          <AmenityChip
            id={`${idPrefix}-pets`}
            checked={parsed.pets === "true"}
            label={copy.togglePets}
            onChange={(next) => onPatch({ pets: next ? "true" : null })}
          />
          <AmenityChip
            id={`${idPrefix}-furnished`}
            checked={parsed.furnished === "true"}
            label={copy.toggleFurnished}
            onChange={(next) => onPatch({ furnished: next ? "true" : null })}
          />
          <AmenityChip
            id={`${idPrefix}-pool`}
            checked={parsed.pool === "true"}
            label={copy.togglePool}
            onChange={(next) => onPatch({ pool: next ? "true" : null })}
          />
        </div>
        <p className={CAT_STD_FILTER_HELPER}>{copy.amenityTogglesHint}</p>
      </FilterSection>

      <FilterSection title={copy.sectionPoster}>
        <label className="block min-w-0">
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
      </FilterSection>
    </div>
  );
}
