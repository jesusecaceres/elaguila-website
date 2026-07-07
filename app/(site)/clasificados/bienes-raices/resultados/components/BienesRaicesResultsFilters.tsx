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
import {
  getBrFilterOptionsBySection,
  getBrFilterLabel,
  getBrDrawerSectionLabel,
  type BrFilterOption,
  type BrDrawerSection,
} from "@/app/clasificados/bienes-raices/shared/bienesRaicesFilterOptions";

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
  const [colonia, setColonia] = useState("");
  const [beds, setBeds] = useState(parsed.beds);
  const [baths, setBaths] = useState(parsed.baths);

  useEffect(() => {
    setQ(parsed.q);
    setCity(parsed.city);
    setState(parsed.state || "CA");
    setCountry(parsed.country || "United States");
    setZip(parsed.zip);
    setPriceMin(parsed.priceMin);
    setPriceMax(parsed.priceMax);
    setBeds(parsed.beds);
    setBaths(parsed.baths);
  }, [parsed.q, parsed.city, parsed.state, parsed.country, parsed.zip, parsed.priceMin, parsed.priceMax, parsed.beds, parsed.baths]);

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
      colonia: colonia.trim() || null,
      beds: beds || null,
      baths: baths || null,
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
        <label className="block min-w-0">
          <span className={LABEL}>{lang === "es" ? "Colonia / vecindario" : "Neighborhood"}</span>
          <input
            id={`${idPrefix}-colonia`}
            value={colonia}
            onChange={(e) => setColonia(e.target.value)}
            onBlur={commitText}
            placeholder={lang === "es" ? "Ej: Downtown, Hills" : "Ex: Downtown, Hills"}
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
          <AmenityChip
            id={`${idPrefix}-patio`}
            checked={false}
            label={lang === "es" ? "Patio" : "Patio"}
            onChange={(next) => onPatch({ patio: next ? "true" : null })}
          />
          <AmenityChip
            id={`${idPrefix}-balcony`}
            checked={false}
            label={lang === "es" ? "Balcón" : "Balcony"}
            onChange={(next) => onPatch({ balcony: next ? "true" : null })}
          />
          <AmenityChip
            id={`${idPrefix}-view`}
            checked={false}
            label={lang === "es" ? "Vista" : "View"}
            onChange={(next) => onPatch({ view: next ? "true" : null })}
          />
          <AmenityChip
            id={`${idPrefix}-gated`}
            checked={false}
            label={lang === "es" ? "Comunidad cerrada" : "Gated community"}
            onChange={(next) => onPatch({ gated: next ? "true" : null })}
          />
          <AmenityChip
            id={`${idPrefix}-homeOffice`}
            checked={false}
            label={lang === "es" ? "Oficina en casa" : "Home office"}
            onChange={(next) => onPatch({ homeOffice: next ? "true" : null })}
          />
          <AmenityChip
            id={`${idPrefix}-solar`}
            checked={false}
            label={lang === "es" ? "Paneles solares" : "Solar panels"}
            onChange={(next) => onPatch({ solar: next ? "true" : null })}
          />
          <AmenityChip
            id={`${idPrefix}-fireplace`}
            checked={false}
            label={lang === "es" ? "Chimenea" : "Fireplace"}
            onChange={(next) => onPatch({ fireplace: next ? "true" : null })}
          />
          <AmenityChip
            id={`${idPrefix}-laundry`}
            checked={false}
            label={lang === "es" ? "Lavandería" : "Laundry"}
            onChange={(next) => onPatch({ laundry: next ? "true" : null })}
          />
          <AmenityChip
            id={`${idPrefix}-coveredParking`}
            checked={false}
            label={lang === "es" ? "Estacionamiento techado" : "Covered parking"}
            onChange={(next) => onPatch({ coveredParking: next ? "true" : null })}
          />
          <AmenityChip
            id={`${idPrefix}-accessControl`}
            checked={false}
            label={lang === "es" ? "Acceso controlado" : "Controlled access"}
            onChange={(next) => onPatch({ accessControl: next ? "true" : null })}
          />
          <AmenityChip
            id={`${idPrefix}-elevator`}
            checked={false}
            label={lang === "es" ? "Elevador" : "Elevator"}
            onChange={(next) => onPatch({ elevator: next ? "true" : null })}
          />
          <AmenityChip
            id={`${idPrefix}-terrace`}
            checked={false}
            label={lang === "es" ? "Terraza" : "Terrace"}
            onChange={(next) => onPatch({ terrace: next ? "true" : null })}
          />
          <AmenityChip
            id={`${idPrefix}-gym`}
            checked={false}
            label={lang === "es" ? "Gimnasio" : "Gym"}
            onChange={(next) => onPatch({ gym: next ? "true" : null })}
          />
          <AmenityChip
            id={`${idPrefix}-amenities`}
            checked={false}
            label={lang === "es" ? "Amenidades del desarrollo" : "Development amenities"}
            onChange={(next) => onPatch({ amenities: next ? "true" : null })}
          />
          <AmenityChip
            id={`${idPrefix}-walkInCloset`}
            checked={false}
            label={lang === "es" ? "Walk-in closet" : "Walk-in closet"}
            onChange={(next) => onPatch({ walkInCloset: next ? "true" : null })}
          />
          <AmenityChip
            id={`${idPrefix}-highCeilings`}
            checked={false}
            label={lang === "es" ? "Techos altos" : "High ceilings"}
            onChange={(next) => onPatch({ highCeilings: next ? "true" : null })}
          />
          <AmenityChip
            id={`${idPrefix}-smartHome`}
            checked={false}
            label={lang === "es" ? "Smart home" : "Smart home"}
            onChange={(next) => onPatch({ smartHome: next ? "true" : null })}
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

      {/* Additional sections for expanded drawer - marked as deferred until filter support is added */}
      {isDrawer && (
        <>
          <FilterSection title={lang === "es" ? "¿Condición y disponibilidad?" : "Condition & availability?"}>
            <label className="block min-w-0">
              <span className={LABEL}>{lang === "es" ? "Condición" : "Condition"}</span>
              <select
                value=""
                onChange={() => {}}
                className={INPUT}
                disabled
              >
                <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
                <option value="excelente">{lang === "es" ? "Excelente" : "Excellent"}</option>
                <option value="buena">{lang === "es" ? "Buena" : "Good"}</option>
                <option value="regular">{lang === "es" ? "Regular" : "Fair"}</option>
                <option value="necesita_reparacion">{lang === "es" ? "Para remodelar" : "Fixer-upper"}</option>
              </select>
            </label>
            <p className={CAT_STD_FILTER_HELPER}>{lang === "es" ? "Próximamente" : "Coming soon"}</p>
          </FilterSection>

          <FilterSection title={lang === "es" ? "¿Terreno?" : "Land?"}>
            <label className="block min-w-0">
              <span className={LABEL}>{lang === "es" ? "Tipo de terreno" : "Terrain type"}</span>
              <select
                value=""
                onChange={() => {}}
                className={INPUT}
                disabled
              >
                <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
                <option value="residential">{lang === "es" ? "Lote residencial" : "Residential lot"}</option>
                <option value="commercial">{lang === "es" ? "Lote comercial" : "Commercial lot"}</option>
                <option value="agricultural">{lang === "es" ? "Rancho / agrícola" : "Ranch / agricultural"}</option>
              </select>
            </label>
            <div className={CAT_STD_FILTER_CHIP_GRID}>
              <AmenityChip
                id={`${idPrefix}-buildReady`}
                checked={false}
                label={lang === "es" ? "Listo para construir" : "Build-ready"}
                onChange={() => {}}
              />
              <AmenityChip
                id={`${idPrefix}-fenced`}
                checked={false}
                label={lang === "es" ? "Cercado" : "Fenced"}
                onChange={() => {}}
              />
              <AmenityChip
                id={`${idPrefix}-utilities`}
                checked={false}
                label={lang === "es" ? "Servicios disponibles" : "Utilities available"}
                onChange={() => {}}
              />
            </div>
            <p className={CAT_STD_FILTER_HELPER}>{lang === "es" ? "Próximamente" : "Coming soon"}</p>
          </FilterSection>

          <FilterSection title={lang === "es" ? "¿Comercial / inversión?" : "Commercial / investment?"}>
            <label className="block min-w-0">
              <span className={LABEL}>{lang === "es" ? "Tipo comercial" : "Commercial type"}</span>
              <select
                value=""
                onChange={() => {}}
                className={INPUT}
                disabled
              >
                <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
                <option value="office">{lang === "es" ? "Oficina" : "Office"}</option>
                <option value="retail">{lang === "es" ? "Local" : "Retail"}</option>
                <option value="warehouse">{lang === "es" ? "Bodega" : "Warehouse"}</option>
                <option value="restaurant">{lang === "es" ? "Restaurante" : "Restaurant"}</option>
                <option value="mixed">{lang === "es" ? "Mixto" : "Mixed-use"}</option>
                <option value="industrial">{lang === "es" ? "Industrial" : "Industrial"}</option>
              </select>
            </label>
            <p className={CAT_STD_FILTER_HELPER}>{lang === "es" ? "Próximamente" : "Coming soon"}</p>
          </FilterSection>

          <FilterSection title={lang === "es" ? "Medios" : "Media"}>
            <div className={CAT_STD_FILTER_CHIP_GRID}>
              <AmenityChip
                id={`${idPrefix}-hasPhotos`}
                checked={false}
                label={lang === "es" ? "Con fotos" : "Has photos"}
                onChange={() => {}}
              />
              <AmenityChip
                id={`${idPrefix}-hasVideo`}
                checked={false}
                label={lang === "es" ? "Con video" : "Has video"}
                onChange={() => {}}
              />
              <AmenityChip
                id={`${idPrefix}-hasVirtualTour`}
                checked={false}
                label={lang === "es" ? "Con tour virtual" : "Has virtual tour"}
                onChange={() => {}}
              />
              <AmenityChip
                id={`${idPrefix}-hasFloorPlan`}
                checked={false}
                label={lang === "es" ? "Con plano / floor plan" : "Has floor plan"}
                onChange={() => {}}
              />
            </div>
            <p className={CAT_STD_FILTER_HELPER}>{lang === "es" ? "Próximamente" : "Coming soon"}</p>
          </FilterSection>
        </>
      )}
    </div>
  );
}
