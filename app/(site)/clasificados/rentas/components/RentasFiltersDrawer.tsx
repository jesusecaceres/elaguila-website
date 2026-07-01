"use client";

import { useEffect } from "react";
import { BR_HIGHLIGHT_PRESET_DEFS } from "@/app/clasificados/publicar/bienes-raices/negocio/application/schema/brHighlightMeta";
import { normalizeRentasBrowseHighlightToken } from "@/app/clasificados/rentas/shared/rentasBrowseContract";
import type { RentasLandingCopy } from "@/app/clasificados/rentas/rentasLandingCopy";
import {
  RENTAS_DRAWER_FOR_WHO,
  RENTAS_DRAWER_SPACE_TYPES,
  RENTAS_US_BUDGET_BANDS,
} from "@/app/clasificados/rentas/landing/rentasLandingGateway";
import {
  RENTAS_QUERY_RECS,
  RENTAS_QUERY_SUBTYPE,
} from "@/app/clasificados/rentas/shared/rentasBrowseContract";
import { RentasLocationButton } from "./RentasLocationButton";
import { US_STATE_OPTIONS } from "@/app/clasificados/shared/constants/leonixPropertyLocationContract";
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
  spaceType: string;
  onSpaceType: (v: string) => void;
  priceBand: string;
  onPriceBand: (v: string) => void;
  beds: string;
  onBeds: (v: string) => void;
  cityDraft: string;
  onCityDraft: (v: string) => void;
  stateDraft: string;
  onStateDraft: (v: string) => void;
  zipDraft: string;
  onZipDraft: (v: string) => void;
  countryDraft: string;
  onCountryDraft: (v: string) => void;
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
  roomBathDraft: string;
  onRoomBathDraft: (v: string) => void;
  roomKitchenDraft: string;
  onRoomKitchenDraft: (v: string) => void;
  branchDraft: string;
  onBranchDraft: (v: string) => void;
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
    <p className="mt-4 first:mt-0 text-[10px] font-bold uppercase tracking-[0.14em] text-[#5C5346]">{children}</p>
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
  spaceType,
  onSpaceType,
  priceBand,
  onPriceBand,
  beds,
  onBeds,
  cityDraft,
  onCityDraft,
  stateDraft,
  onStateDraft,
  zipDraft,
  onZipDraft,
  countryDraft,
  onCountryDraft,
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
  roomBathDraft,
  onRoomBathDraft,
  roomKitchenDraft,
  onRoomKitchenDraft,
  branchDraft,
  onBranchDraft,
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
  const spaceLabel = lang === "es" ? "Tipo de espacio" : "Space type";
  const budgetLabel = lang === "es" ? "Presupuesto" : "Budget";
  const locationLabel = lang === "es" ? "Ubicación" : "Location";
  const forWhoLabel = lang === "es" ? "Para quién" : "For who";
  const essentialsLabel = lang === "es" ? "Baño / cocina / essentials" : "Bath / kitchen / essentials";
  const rulesLabel = lang === "es" ? "Reglas / features" : "Rules / features";
  const posterLabel = lang === "es" ? "Publicador" : "Poster";

  const applyBudgetBand = (bandValue: string) => {
    const band = RENTAS_US_BUDGET_BANDS.find((b) => b.value === bandValue);
    if (!band) return;
    onRentMinDraft(band.rentMin != null ? String(band.rentMin) : "");
    onRentMaxDraft(band.rentMax != null ? String(band.rentMax) : "");
    onPriceBand("");
  };

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
          <GroupLabel>{spaceLabel}</GroupLabel>
          <label className="mt-2 block text-left text-[11px] font-semibold text-[#5C5346]">
            {lang === "es" ? "Selecciona tipo" : "Select type"}
            <select value={spaceType} onChange={(e) => onSpaceType(e.target.value)} className={RENTAS_FIELD}>
              <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
              {RENTAS_DRAWER_SPACE_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {lang === "es" ? opt.labelEs : opt.labelEn}
                </option>
              ))}
            </select>
          </label>

          <GroupLabel>{budgetLabel}</GroupLabel>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <label className="block text-left text-[11px] font-semibold text-[#5C5346]">
              {copy.results.rentMinLabel}
              <input value={rentMinDraft} onChange={(e) => onRentMinDraft(e.target.value)} inputMode="numeric" className={RENTAS_FIELD} placeholder="0" />
            </label>
            <label className="block text-left text-[11px] font-semibold text-[#5C5346]">
              {copy.results.rentMaxLabel}
              <input value={rentMaxDraft} onChange={(e) => onRentMaxDraft(e.target.value)} inputMode="numeric" className={RENTAS_FIELD} placeholder="—" />
            </label>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {RENTAS_US_BUDGET_BANDS.map((band) => (
              <ToggleChip
                key={band.value}
                pressed={
                  (band.rentMin == null || rentMinDraft === String(band.rentMin)) &&
                  (band.rentMax == null || rentMaxDraft === String(band.rentMax))
                }
                onClick={() => applyBudgetBand(band.value)}
              >
                {lang === "es" ? band.labelEs : band.labelEn}
              </ToggleChip>
            ))}
          </div>

          <GroupLabel>{locationLabel}</GroupLabel>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <label className="block text-left text-[11px] font-semibold text-[#5C5346]">
              {copy.results.cityLabel}
              <input value={cityDraft} onChange={(e) => onCityDraft(e.target.value)} className={RENTAS_FIELD} autoComplete="address-level2" />
            </label>
            <label className="block text-left text-[11px] font-semibold text-[#5C5346]">
              {copy.results.stateLabel}
              <select value={stateDraft || "CA"} onChange={(e) => onStateDraft(e.target.value)} className={RENTAS_FIELD}>
                {US_STATE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.code} — {opt.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-left text-[11px] font-semibold text-[#5C5346]">
              {copy.results.zipLabel}
              <input value={zipDraft} onChange={(e) => onZipDraft(e.target.value)} inputMode="numeric" className={RENTAS_FIELD} autoComplete="postal-code" />
            </label>
            <label className="block text-left text-[11px] font-semibold text-[#5C5346]">
              {copy.results.countryLabel}
              <input value={countryDraft} onChange={(e) => onCountryDraft(e.target.value)} className={RENTAS_FIELD} autoComplete="country-name" />
            </label>
          </div>

          <GroupLabel>{forWhoLabel}</GroupLabel>
          <div className="mt-2 flex flex-wrap gap-2">
            {RENTAS_DRAWER_FOR_WHO.filter((o) => o.wired).map((opt) => {
              const recsVal = opt.params[RENTAS_QUERY_RECS];
              const subtypeVal = opt.params[RENTAS_QUERY_SUBTYPE];
              const isOn =
                (recsVal && beds === recsVal) || (subtypeVal && spaceType === subtypeVal);
              return (
                <ToggleChip
                  key={opt.labelEn}
                  pressed={!!isOn}
                  onClick={() => {
                    if (recsVal) onBeds(recsVal);
                    if (subtypeVal) onSpaceType(subtypeVal);
                  }}
                >
                  {lang === "es" ? opt.labelEs : opt.labelEn}
                </ToggleChip>
              );
            })}
          </div>

          <GroupLabel>{essentialsLabel}</GroupLabel>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            <label className="block text-left text-[11px] font-semibold text-[#5C5346]">
              {lang === "es" ? "Baño" : "Bath"}
              <select value={roomBathDraft} onChange={(e) => onRoomBathDraft(e.target.value)} className={RENTAS_FIELD}>
                <option value="">{copy.results.bathsAny}</option>
                <option value="privado">{lang === "es" ? "Baño privado" : "Private bath"}</option>
                <option value="compartido">{lang === "es" ? "Baño compartido" : "Shared bath"}</option>
              </select>
            </label>
            <label className="block text-left text-[11px] font-semibold text-[#5C5346]">
              {lang === "es" ? "Cocina" : "Kitchen"}
              <select value={roomKitchenDraft} onChange={(e) => onRoomKitchenDraft(e.target.value)} className={RENTAS_FIELD}>
                <option value="">{copy.results.bathsAny}</option>
                <option value="privada">{lang === "es" ? "Cocina privada" : "Private kitchen"}</option>
                <option value="compartida">{lang === "es" ? "Cocina compartida" : "Shared kitchen"}</option>
              </select>
            </label>
            {!isLanding ? (
              <>
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
                  {copy.results.parkingMinLabel}
                  <input value={parkingMinDraft} onChange={(e) => onParkingMinDraft(e.target.value)} inputMode="numeric" className={RENTAS_FIELD} placeholder="0" />
                </label>
              </>
            ) : null}
          </div>

          <GroupLabel>{rulesLabel}</GroupLabel>
          <div className="mt-2 flex flex-wrap gap-2">
            <ToggleChip pressed={amuebladoDraft} onClick={() => onAmuebladoDraft(!amuebladoDraft)}>
              {copy.results.furnishedToggle}
            </ToggleChip>
            <ToggleChip pressed={mascotasDraft} onClick={() => onMascotasDraft(!mascotasDraft)}>
              {copy.results.petsToggle}
            </ToggleChip>
            {!isLanding ? (
              <ToggleChip pressed={poolDraft} onClick={() => onPoolDraft(!poolDraft)}>
                {copy.results.poolToggle}
              </ToggleChip>
            ) : null}
          </div>
          {!isLanding ? (
            <>
              <label className="mt-3 block text-left text-[11px] font-semibold text-[#5C5346]">
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
              <label className="mt-3 block text-left text-[11px] font-semibold text-[#5C5346]">
                {lang === "es" ? "Estado del anuncio" : "Listing status"}
                <select value={estadoDraft} onChange={(e) => onEstadoDraft(e.target.value)} className={RENTAS_FIELD}>
                  <option value="">{lang === "es" ? "Cualquiera" : "Any"}</option>
                  <option value="disponible">{lang === "es" ? "Disponible" : "Available"}</option>
                  <option value="pendiente">{lang === "es" ? "Pendiente" : "Pending"}</option>
                  <option value="bajo_contrato">{lang === "es" ? "Bajo contrato" : "Under contract"}</option>
                  <option value="rentado">{lang === "es" ? "Rentado" : "Rented"}</option>
                </select>
              </label>
            </>
          ) : null}

          <GroupLabel>{posterLabel}</GroupLabel>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                { id: "", label: lang === "es" ? "Todos" : "All" },
                { id: "privado", label: copy.results.branchPrivado },
                { id: "negocio", label: copy.results.branchNegocio },
              ] as const
            ).map((opt) => (
              <ToggleChip key={opt.id || "all"} pressed={branchDraft === opt.id} onClick={() => onBranchDraft(opt.id)}>
                {opt.label}
              </ToggleChip>
            ))}
          </div>

          {!isLanding ? (
            <>
              <GroupLabel>{lang === "es" ? "Recámaras" : "Bedrooms"}</GroupLabel>
              <label className="mt-2 block text-left text-[11px] font-semibold text-[#5C5346]">
                {copy.search.recs}
                <select value={beds} onChange={(e) => onBeds(e.target.value)} className={RENTAS_FIELD}>
                  <option value="">{copy.search.recsAny}</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                </select>
              </label>

              <GroupLabel>{copy.search.precio}</GroupLabel>
              <label className="mt-2 block text-left text-[11px] font-semibold text-[#5C5346]">
                <select value={priceBand} onChange={(e) => onPriceBand(e.target.value)} className={RENTAS_FIELD}>
                  {priceOptions.map((o) => (
                    <option key={o.value || "any"} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>

              <GroupLabel>{lang === "es" ? "Depósito" : "Deposit"}</GroupLabel>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <label className="block text-left text-[11px] font-semibold text-[#5C5346]">
                  {copy.results.depositMinLabel}
                  <input value={depositMinDraft} onChange={(e) => onDepositMinDraft(e.target.value)} inputMode="numeric" className={RENTAS_FIELD} placeholder="0" />
                </label>
                <label className="block text-left text-[11px] font-semibold text-[#5C5346]">
                  {copy.results.depositMaxLabel}
                  <input value={depositMaxDraft} onChange={(e) => onDepositMaxDraft(e.target.value)} inputMode="numeric" className={RENTAS_FIELD} placeholder="—" />
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
          ) : null}
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
