"use client";

import { useEffect } from "react";
import { BR_HIGHLIGHT_PRESET_DEFS } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/brHighlightMeta";
import { normalizeRentasBrowseHighlightToken } from "@/app/clasificados/rentas/shared/rentasBrowseContract";
import type { RentasLandingCopy } from "@/app/clasificados/rentas/rentasLandingCopy";
import { RentasLocationButton } from "./RentasLocationButton";
import {
  RENTAS_BTN_PRIMARY,
  RENTAS_BTN_SECONDARY,
  RENTAS_FIELD,
} from "../shared/rentasLeonixPublicUi";

const RENTAS_HIGHLIGHT_FACET_DEFS = BR_HIGHLIGHT_PRESET_DEFS.slice(0, 12);

export type RentasFiltersDrawerProps = {
  open: boolean;
  onClose: () => void;
  onApply: () => void;
  onClear: () => void;
  lang: "es" | "en";
  copy: RentasLandingCopy;
  variant?: "landing" | "results";
  propertyType: string;
  onPropertyType: (v: string) => void;
  priceBand: string;
  onPriceBand: (v: string) => void;
  beds: string;
  onBeds: (v: string) => void;
  cityDraft: string;
  onCityDraft: (v: string) => void;
  zipDraft: string;
  onZipDraft: (v: string) => void;
  bathsMinDraft: string;
  onBathsMinDraft: (v: string) => void;
  halfBathsMinDraft: string;
  onHalfBathsMinDraft: (v: string) => void;
  rentMinDraft: string;
  onRentMinDraft: (v: string) => void;
  rentMaxDraft: string;
  onRentMaxDraft: (v: string) => void;
  depositMinDraft: string;
  onDepositMinDraft: (v: string) => void;
  depositMaxDraft: string;
  onDepositMaxDraft: (v: string) => void;
  leaseDraft: string;
  onLeaseDraft: (v: string) => void;
  estadoDraft: string;
  onEstadoDraft: (v: string) => void;
  parkingMinDraft: string;
  onParkingMinDraft: (v: string) => void;
  sqftMinDraft: string;
  onSqftMinDraft: (v: string) => void;
  sqftMaxDraft: string;
  onSqftMaxDraft: (v: string) => void;
  amuebladoDraft: boolean;
  onAmuebladoDraft: (v: boolean) => void;
  mascotasDraft: boolean;
  onMascotasDraft: (v: boolean) => void;
  highlightKeysDraft: string[];
  onHighlightKeysDraft: (v: string[]) => void;
  poolDraft: boolean;
  onPoolDraft: (v: boolean) => void;
  kindDraft: string;
  onKindDraft: (v: string) => void;
  subtypeDraft: string;
  onSubtypeDraft: (v: string) => void;
  priceOptions: { value: string; label: string }[];
};

function GroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#5C5346]">{children}</p>
  );
}

function ToggleChip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={
        "inline-flex h-[32px] items-center rounded-md border px-3 text-xs font-semibold transition " +
        (pressed
          ? "border-[#7A1E2C]/50 bg-[#7A1E2C] text-[#FFFDF7]"
          : "border-[#C9A84A]/45 bg-white text-[#3D3428] hover:border-[#C9A84A]/70")
      }
    >
      {children}
    </button>
  );
}

export function RentasFiltersDrawer({
  open,
  onClose,
  onApply,
  onClear,
  lang,
  copy,
  variant = "results",
  propertyType,
  onPropertyType,
  priceBand,
  onPriceBand,
  beds,
  onBeds,
  cityDraft,
  onCityDraft,
  zipDraft,
  onZipDraft,
  bathsMinDraft,
  onBathsMinDraft,
  halfBathsMinDraft,
  onHalfBathsMinDraft,
  rentMinDraft,
  onRentMinDraft,
  rentMaxDraft,
  onRentMaxDraft,
  depositMinDraft,
  onDepositMinDraft,
  depositMaxDraft,
  onDepositMaxDraft,
  leaseDraft,
  onLeaseDraft,
  estadoDraft,
  onEstadoDraft,
  parkingMinDraft,
  onParkingMinDraft,
  sqftMinDraft,
  onSqftMinDraft,
  sqftMaxDraft,
  onSqftMaxDraft,
  amuebladoDraft,
  onAmuebladoDraft,
  mascotasDraft,
  onMascotasDraft,
  highlightKeysDraft,
  onHighlightKeysDraft,
  poolDraft,
  onPoolDraft,
  kindDraft,
  onKindDraft,
  subtypeDraft,
  onSubtypeDraft,
  priceOptions,
}: RentasFiltersDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const filtersLabel = lang === "es" ? "Filtros" : "Filters";
  const closeLabel = lang === "es" ? "Cerrar" : "Close";
  const applyLabel = copy.results.applyFilters;
  const clearLabel = lang === "es" ? "Limpiar filtros" : "Clear filters";
  const isLanding = variant === "landing";

  return (
    <>
      <button type="button" className="fixed inset-0 z-[60] bg-black/40" aria-label={closeLabel} onClick={onClose} />
      <div
        className={
          "fixed z-[61] flex flex-col overflow-hidden border border-[#D6C7AD]/90 bg-[#FFFDF7] shadow-[0_-12px_48px_-16px_rgba(42,36,22,0.28)] " +
          "inset-x-0 bottom-0 top-[12vh] rounded-t-2xl max-lg:max-h-[88vh] " +
          "lg:inset-y-0 lg:left-auto lg:right-0 lg:top-0 lg:w-full lg:max-w-[400px] lg:rounded-none lg:rounded-l-2xl"
        }
        role="dialog"
        aria-modal="true"
        aria-labelledby="rentas-filters-drawer-title"
      >
        <div className="flex items-center justify-between border-b border-[#E8DFD0]/80 px-4 py-3">
          <h2 id="rentas-filters-drawer-title" className="font-serif text-sm font-bold text-[#2A4536]">
            {filtersLabel}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#D6C7AD] px-3 py-1 text-xs font-semibold text-[#2C2416] hover:bg-[#FAF7F2]"
          >
            {closeLabel}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          {!isLanding ? (
            <>
              <GroupLabel>{lang === "es" ? "Ubicación" : "Location"}</GroupLabel>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="block text-left text-[11px] font-semibold text-[#5C5346]">
                  {copy.results.cityLabel}
                  <input value={cityDraft} onChange={(e) => onCityDraft(e.target.value)} className={RENTAS_FIELD} autoComplete="address-level2" />
                </label>
                <label className="block text-left text-[11px] font-semibold text-[#5C5346]">
                  {copy.results.zipLabel}
                  <input value={zipDraft} onChange={(e) => onZipDraft(e.target.value)} inputMode="numeric" className={RENTAS_FIELD} autoComplete="postal-code" />
                </label>
              </div>
            </>
          ) : null}

          <GroupLabel>{lang === "es" ? "Propiedad" : "Property"}</GroupLabel>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <label className="block text-left text-[11px] font-semibold text-[#5C5346]">
              {copy.search.tipo}
              <select value={propertyType} onChange={(e) => onPropertyType(e.target.value)} className={RENTAS_FIELD}>
                <option value="">{copy.search.tipoPlaceholder}</option>
                <option value="casa">{copy.search.optCasa}</option>
                <option value="departamento">{copy.search.optDepto}</option>
                <option value="terreno">{copy.search.optTerreno}</option>
                <option value="comercial">{copy.search.optComercial}</option>
              </select>
            </label>
            <label className="block text-left text-[11px] font-semibold text-[#5C5346]">
              {copy.search.recs}
              <select value={beds} onChange={(e) => onBeds(e.target.value)} className={RENTAS_FIELD}>
                <option value="">{copy.search.recsAny}</option>
                <option value="1">1+</option>
                <option value="2">2+</option>
                <option value="3">3+</option>
                <option value="4">4+</option>
              </select>
            </label>
            <label className="block text-left text-[11px] font-semibold text-[#5C5346] sm:col-span-2">
              {copy.search.precio}
              <select value={priceBand} onChange={(e) => onPriceBand(e.target.value)} className={RENTAS_FIELD}>
                {priceOptions.map((o) => (
                  <option key={o.value || "any"} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {!isLanding ? (
            <>
              <GroupLabel>{lang === "es" ? "Precio" : "Price"}</GroupLabel>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="block text-left text-[11px] font-semibold text-[#5C5346]">
                  {copy.results.rentMinLabel}
                  <input value={rentMinDraft} onChange={(e) => onRentMinDraft(e.target.value)} inputMode="numeric" className={RENTAS_FIELD} placeholder="0" />
                </label>
                <label className="block text-left text-[11px] font-semibold text-[#5C5346]">
                  {copy.results.rentMaxLabel}
                  <input value={rentMaxDraft} onChange={(e) => onRentMaxDraft(e.target.value)} inputMode="numeric" className={RENTAS_FIELD} placeholder="—" />
                </label>
                <label className="block text-left text-[11px] font-semibold text-[#5C5346]">
                  {copy.results.depositMinLabel}
                  <input value={depositMinDraft} onChange={(e) => onDepositMinDraft(e.target.value)} inputMode="numeric" className={RENTAS_FIELD} placeholder="0" />
                </label>
                <label className="block text-left text-[11px] font-semibold text-[#5C5346]">
                  {copy.results.depositMaxLabel}
                  <input value={depositMaxDraft} onChange={(e) => onDepositMaxDraft(e.target.value)} inputMode="numeric" className={RENTAS_FIELD} placeholder="—" />
                </label>
              </div>

              <GroupLabel>{lang === "es" ? "Disponibilidad" : "Availability"}</GroupLabel>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="block text-left text-[11px] font-semibold text-[#5C5346]">
                  {copy.results.leaseLabel}
                  <select value={leaseDraft} onChange={(e) => onLeaseDraft(e.target.value)} className={RENTAS_FIELD}>
                    <option value="">{copy.results.leaseAny}</option>
                    <option value="mes-a-mes">mes-a-mes</option>
                    <option value="6-meses">6-meses</option>
                    <option value="12-meses">12-meses</option>
                    <option value="1-ano">1-ano</option>
                    <option value="2-anos">2-anos</option>
                  </select>
                </label>
                <label className="block text-left text-[11px] font-semibold text-[#5C5346]">
                  {lang === "es" ? "Estado del anuncio" : "Listing status"}
                  <select value={estadoDraft} onChange={(e) => onEstadoDraft(e.target.value)} className={RENTAS_FIELD}>
                    <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
                    <option value="disponible">{lang === "es" ? "Disponible" : "Available"}</option>
                    <option value="pendiente">{lang === "es" ? "Pendiente" : "Pending"}</option>
                    <option value="bajo_contrato">{lang === "es" ? "Bajo contrato" : "Under contract"}</option>
                    <option value="rentado">{lang === "es" ? "Rentado" : "Rented"}</option>
                  </select>
                </label>
                <label className="block text-left text-[11px] font-semibold text-[#5C5346]">
                  {copy.results.bathsMinLabel}
                  <select value={bathsMinDraft} onChange={(e) => onBathsMinDraft(e.target.value)} className={RENTAS_FIELD}>
                    <option value="">{copy.results.bathsAny}</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                  </select>
                </label>
                <label className="block text-left text-[11px] font-semibold text-[#5C5346]">
                  {copy.results.halfBathsMinLabel}
                  <select value={halfBathsMinDraft} onChange={(e) => onHalfBathsMinDraft(e.target.value)} className={RENTAS_FIELD}>
                    <option value="">{copy.results.bathsAny}</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                  </select>
                </label>
              </div>

              <GroupLabel>{lang === "es" ? "Características" : "Features"}</GroupLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                <ToggleChip pressed={amuebladoDraft} onClick={() => onAmuebladoDraft(!amuebladoDraft)}>
                  {copy.results.furnishedToggle}
                </ToggleChip>
                <ToggleChip pressed={mascotasDraft} onClick={() => onMascotasDraft(!mascotasDraft)}>
                  {copy.results.petsToggle}
                </ToggleChip>
                <ToggleChip pressed={poolDraft} onClick={() => onPoolDraft(!poolDraft)}>
                  {copy.results.poolToggle}
                </ToggleChip>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block text-left text-[11px] font-semibold text-[#5C5346]">
                  {copy.results.parkingMinLabel}
                  <input value={parkingMinDraft} onChange={(e) => onParkingMinDraft(e.target.value)} inputMode="numeric" className={RENTAS_FIELD} placeholder="0" />
                </label>
                <label className="block text-left text-[11px] font-semibold text-[#5C5346]">
                  {copy.results.sqftMinLabel}
                  <input value={sqftMinDraft} onChange={(e) => onSqftMinDraft(e.target.value)} inputMode="numeric" className={RENTAS_FIELD} placeholder="0" />
                </label>
                <label className="block text-left text-[11px] font-semibold text-[#5C5346]">
                  {copy.results.sqftMaxLabel}
                  <input value={sqftMaxDraft} onChange={(e) => onSqftMaxDraft(e.target.value)} inputMode="numeric" className={RENTAS_FIELD} placeholder="—" />
                </label>
                <label className="block text-left text-[11px] font-semibold text-[#5C5346]">
                  {copy.results.kindLabel}
                  <select value={kindDraft} onChange={(e) => onKindDraft(e.target.value)} className={RENTAS_FIELD}>
                    <option value="">{copy.results.kindAny}</option>
                    <option value="casa">casa</option>
                    <option value="departamento">departamento</option>
                    <option value="terreno">terreno</option>
                    <option value="comercial">comercial</option>
                  </select>
                </label>
                <label className="block text-left text-[11px] font-semibold text-[#5C5346] sm:col-span-2">
                  {copy.results.subtypeLabel}
                  <input value={subtypeDraft} onChange={(e) => onSubtypeDraft(e.target.value)} className={RENTAS_FIELD} placeholder="casa · apartamento · oficina" autoComplete="off" />
                </label>
              </div>

              <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#5C5346]">{copy.results.highlightsHelp}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {RENTAS_HIGHLIGHT_FACET_DEFS.map((d) => {
                  const k = normalizeRentasBrowseHighlightToken(d.key);
                  const on = highlightKeysDraft.includes(k);
                  return (
                    <ToggleChip
                      key={d.key}
                      pressed={on}
                      onClick={() => {
                        onHighlightKeysDraft(
                          (() => {
                            const set = new Set(highlightKeysDraft.map((x) => normalizeRentasBrowseHighlightToken(x)).filter(Boolean));
                            if (set.has(k)) set.delete(k);
                            else set.add(k);
                            return [...set].sort();
                          })()
                        );
                      }}
                    >
                      {d.label}
                    </ToggleChip>
                  );
                })}
              </div>

              <div className="mt-4">
                <RentasLocationButton
                  lang={lang}
                  copy={{
                    geoSearchDisabledTitle: copy.results.geoSearchDisabledTitle,
                    geoSearchDisabledBody: copy.results.geoSearchDisabledBody,
                  }}
                />
              </div>
            </>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              <ToggleChip pressed={amuebladoDraft} onClick={() => onAmuebladoDraft(!amuebladoDraft)}>
                {copy.results.furnishedToggle}
              </ToggleChip>
              <ToggleChip pressed={mascotasDraft} onClick={() => onMascotasDraft(!mascotasDraft)}>
                {copy.results.petsToggle}
              </ToggleChip>
            </div>
          )}
        </div>

        <div className="flex gap-2 border-t border-[#E8DFD0]/80 p-4">
          <button type="button" className={`${RENTAS_BTN_SECONDARY} flex-1`} onClick={onClear}>
            {clearLabel}
          </button>
          <button
            type="button"
            className={`${RENTAS_BTN_PRIMARY} flex-[1.2]`}
            onClick={() => {
              onApply();
              onClose();
            }}
          >
            {applyLabel}
          </button>
        </div>
      </div>
    </>
  );
}
