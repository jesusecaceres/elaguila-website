"use client";

import { BrPrivadoCiudadZonaCombobox } from "@/app/clasificados/publicar/bienes-raices/privado/application/components/BrPrivadoCiudadZonaCombobox";
import {
  AiField,
  aiCardClass,
  aiHintClass,
  aiLabelClass,
  aiTitleClass,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/formPrimitives";
import { RENTAS_PLAZO_LABELS } from "@/app/clasificados/rentas/shared/utils/rentasPublishConstants";
import {
  RENTAS_SERVICIOS_INCLUIDOS_DEFS,
  formatRentasDepositUsdPreview,
  formatRentasMensualAnuncioPreview,
  rentasDisponibilidadIsIsoDate,
  rentasServicioIncluidoLabel,
  type RentasServicioIncluidoId,
  RENTAS_US_STATE_DATALIST_OPTIONS,
  RENTAS_COUNTRY_SUGGESTIONS,
} from "@/app/clasificados/rentas/shared/rentasPublishFormHelpers";
import type { RentasNegocioFormState } from "../negocio/schema/rentasNegocioFormState";
import type { RentasPrivadoFormState } from "../privado/schema/rentasPrivadoFormState";
import {
  RENTAS_TIPO_DE_RENTA_OPTIONS,
  rentasTipoDeRentaOptionLabel,
} from "@/app/clasificados/rentas/shared/rentasRentalTypeTaxonomy";
import { rentasFlowGroupActive } from "@/app/clasificados/rentas/shared/rentasRentalTypeApply";
import { RentasTipoFlowDetailFields } from "@/app/clasificados/publicar/rentas/shared/RentasTipoFlowDetailFields";
import { getRentasAnuncioFormCopy } from "./rentasAnuncioFormCopy";
import type { Dispatch, SetStateAction } from "react";

function precioDigitsUnbounded(raw: string): string {
  return String(raw ?? "").replace(/\D/g, "");
}

function toggleServicioKey(current: RentasServicioIncluidoId[], id: RentasServicioIncluidoId): RentasServicioIncluidoId[] {
  const set = new Set(current);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  return [...set];
}

type EstadoOpt<T> = { id: T; label: string };

type Props<T extends RentasPrivadoFormState | RentasNegocioFormState> = {
  state: T;
  setState: Dispatch<SetStateAction<T>>;
  fieldClass: string;
  textareaFieldClass: string;
  estadoOptions: EstadoOpt<T["estadoAnuncio"]>[];
  lang: "es" | "en";
};

export function RentasAnuncioFormSection<T extends RentasPrivadoFormState | RentasNegocioFormState>({
  state,
  setState,
  fieldClass,
  textareaFieldClass,
  estadoOptions,
  lang,
}: Props<T>) {
  const c = getRentasAnuncioFormCopy(lang);

  const rentPreview = formatRentasMensualAnuncioPreview(state.rentaMensual);
  const depositPreview = formatRentasDepositUsdPreview(state.deposito);
  const dispIso = rentasDisponibilidadIsIsoDate(state.disponibilidad);
  const dispLegacyNote = state.disponibilidad.trim() && !dispIso ? state.disponibilidad : "";
  const showOtroPlazo = state.plazoContrato === "otro";
  const servicioOtro = state.serviciosIncluidosKeys.includes("otro");
  const showLegacyUbicacionExtra =
    state.ubicacionLinea.trim() !== "" && state.ubicacionLinea.trim() !== state.direccionLinea1.trim();
  const flowGroup = rentasFlowGroupActive(state);
  const hideAmuebladoMascotas = flowGroup === "storage_parking";

  return (
    <section className={`${aiCardClass} min-w-0`}>
      <h2 className={aiTitleClass}>{c.sectionTitle}</h2>
      <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
        <div className="sm:col-span-2">
          <AiField required label={c.titleLabel}>
            <input
              className={fieldClass}
              value={state.titulo}
              onChange={(e) => setState((s) => ({ ...s, titulo: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
          <AiField label={c.rentalTypeLabel} hint={c.rentalTypeHint}>
            <select
              className={fieldClass}
              value={state.tipoDeRenta}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  tipoDeRenta: e.target.value as typeof s.tipoDeRenta,
                  tipoDeRentaOtro: e.target.value === "otro" ? s.tipoDeRentaOtro : "",
                }))
              }
            >
              <option value="">—</option>
              {RENTAS_TIPO_DE_RENTA_OPTIONS.map((o) => (
                <option key={o.id} value={o.id}>
                  {rentasTipoDeRentaOptionLabel(o.id, lang)}
                </option>
              ))}
            </select>
          </AiField>
          {state.tipoDeRenta === "otro" ? (
            <AiField label={c.specifyOtherTypeLabel} hint={c.specifyOtherTypeHint}>
              <input
                className={fieldClass}
                value={state.tipoDeRentaOtro}
                onChange={(e) => setState((s) => ({ ...s, tipoDeRentaOtro: e.target.value }))}
                autoComplete="off"
              />
            </AiField>
          ) : null}
        </div>
        <div className="sm:col-span-2">
          <AiField label={c.conditionsLabel} hint={c.conditionsHint}>
            <textarea
              className={textareaFieldClass}
              rows={3}
              value={state.condicionesAlquiler}
              onChange={(e) => setState((s) => ({ ...s, condicionesAlquiler: e.target.value }))}
              placeholder={c.conditionsPlaceholder}
            />
          </AiField>
        </div>
        <RentasTipoFlowDetailFields state={state} setState={setState} fieldClass={fieldClass} lang={lang} />
        <AiField required label={c.monthlyRentLabel} hint={c.monthlyRentHint}>
          <input
            className={fieldClass}
            inputMode="numeric"
            value={state.rentaMensual}
            onChange={(e) => setState((s) => ({ ...s, rentaMensual: precioDigitsUnbounded(e.target.value) }))}
            autoComplete="off"
          />
          {rentPreview ? (
            <p className="mt-2 text-sm font-semibold [font-variant-numeric:tabular-nums] text-[#6E5418]">
              {c.inListingText}
              <span className="text-[#1E1810]" aria-live="polite">
                {rentPreview}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-xs text-[#5C5346]/85">
              {state.rentaMensual.trim() ? c.rentReviewText : c.rentExampleText}
            </p>
          )}
        </AiField>
        <AiField label={c.depositLabel} hint={c.depositHint}>
          <input
            className={fieldClass}
            inputMode="numeric"
            value={state.deposito}
            onChange={(e) => setState((s) => ({ ...s, deposito: precioDigitsUnbounded(e.target.value) }))}
            autoComplete="off"
          />
          {depositPreview ? (
            <p className="mt-2 text-sm font-semibold [font-variant-numeric:tabular-nums] text-[#6E5418]">
              {c.inListingText}
              <span className="text-[#1E1810]" aria-live="polite">
                {depositPreview}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-xs text-[#5C5346]/85">
              {state.deposito.trim() ? c.depositReviewText : c.depositExampleText}
            </p>
          )}
        </AiField>
        <AiField label={c.contractTermLabel}>
          <select
            className={fieldClass}
            value={state.plazoContrato}
            onChange={(e) => {
              const v = e.target.value as T["plazoContrato"];
              setState((s) => ({
                ...s,
                plazoContrato: v,
                plazoContratoOtro: v === "otro" ? s.plazoContratoOtro : "",
              }));
            }}
          >
            <option value="">—</option>
            {Object.entries(RENTAS_PLAZO_LABELS).map(([key, lbl]) => (
              <option key={key} value={key}>
                {lbl[lang]}
              </option>
            ))}
          </select>
        </AiField>
        {showOtroPlazo ? (
          <div className="sm:col-span-2">
            <AiField label={c.specifyTermLabel} hint={c.specifyTermHint}>
              <input
                className={fieldClass}
                value={state.plazoContratoOtro}
                onChange={(e) => setState((s) => ({ ...s, plazoContratoOtro: e.target.value }))}
                autoComplete="off"
                placeholder={c.specifyTermPlaceholder}
              />
            </AiField>
          </div>
        ) : null}
        <AiField label={c.availabilityLabel} hint={c.availabilityHint}>
          <input
            className={fieldClass}
            type="date"
            value={dispIso ? state.disponibilidad : ""}
            onChange={(e) => {
              const v = e.target.value;
              setState((s) => ({ ...s, disponibilidad: v }));
            }}
          />
          {dispLegacyNote ? (
            <p className="mt-2 text-xs leading-relaxed text-[#5C5346]">
              {c.availabilityLegacyPrefix}
              {dispLegacyNote}
              {c.availabilityLegacySuffix}
            </p>
          ) : null}
        </AiField>
        {hideAmuebladoMascotas ? null : (
          <>
            <AiField label={c.furnishedLabel}>
              <select
                className={fieldClass}
                value={state.amueblado}
                onChange={(e) =>
                  setState((s) => ({ ...s, amueblado: e.target.value as typeof s.amueblado }))
                }
              >
                <option value="">—</option>
                <option value="amueblado">{c.furnishedOption}</option>
                <option value="sin_amueblar">{c.unfurnishedOption}</option>
              </select>
            </AiField>
            <AiField label={c.petsLabel}>
              <select
                className={fieldClass}
                value={state.mascotas}
                onChange={(e) => setState((s) => ({ ...s, mascotas: e.target.value as typeof s.mascotas }))}
              >
                <option value="">—</option>
                <option value="permitidas">{c.petsAllowedOption}</option>
                <option value="no_permitidas">{c.petsNotAllowedOption}</option>
              </select>
            </AiField>
          </>
        )}
        <div className="sm:col-span-2">
          <span className={aiLabelClass}>{c.servicesHeading}</span>
          <p className={aiHintClass}>{c.servicesHint}</p>
          <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-2">
            {RENTAS_SERVICIOS_INCLUIDOS_DEFS.map((d) => (
              <label key={d.id} className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#C9B46A]"
                  checked={state.serviciosIncluidosKeys.includes(d.id)}
                  onChange={() =>
                    setState((s) => ({
                      ...s,
                      serviciosIncluidosKeys: toggleServicioKey(s.serviciosIncluidosKeys, d.id),
                    }))
                  }
                />
                <span className="min-w-0">{rentasServicioIncluidoLabel(d.id, lang)}</span>
              </label>
            ))}
            <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-snug">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-[#C9B46A]"
                checked={state.serviciosIncluidosKeys.includes("otro")}
                onChange={() =>
                  setState((s) => {
                    const hadOtro = s.serviciosIncluidosKeys.includes("otro");
                    const next = toggleServicioKey(s.serviciosIncluidosKeys, "otro");
                    const nowOtro = next.includes("otro");
                    return {
                      ...s,
                      serviciosIncluidosKeys: next,
                      serviciosIncluidosOtro: hadOtro && !nowOtro ? "" : s.serviciosIncluidosOtro,
                    };
                  })
                }
              />
              <span className="min-w-0">{c.otherServiceLabel}</span>
            </label>
          </div>
          {servicioOtro ? (
            <div className="mt-3">
              <AiField label={c.specifyServiceLabel} hint={c.specifyServiceHint}>
                <input
                  className={fieldClass}
                  value={state.serviciosIncluidosOtro}
                  onChange={(e) => setState((s) => ({ ...s, serviciosIncluidosOtro: e.target.value }))}
                  autoComplete="off"
                />
              </AiField>
            </div>
          ) : null}
        </div>
        <div className="sm:col-span-2">
          <AiField label={c.requirementsLabel} hint={c.requirementsHint}>
            <textarea
              className={textareaFieldClass}
              rows={3}
              value={state.requisitos}
              onChange={(e) => setState((s) => ({ ...s, requisitos: e.target.value }))}
            />
          </AiField>
        </div>
        <div className="sm:col-span-2 grid min-w-0 gap-4 sm:grid-cols-2 sm:items-end sm:gap-5">
          <AiField label={c.listingStatusLabel}>
            <select
              className={fieldClass}
              value={state.estadoAnuncio}
              onChange={(e) => setState((s) => ({ ...s, estadoAnuncio: e.target.value as typeof s.estadoAnuncio }))}
            >
              {estadoOptions.map((o) => (
                <option key={String(o.id)} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </AiField>
          <AiField label={c.zoneLabel} hint={c.zoneHint}>
            <input
              className={fieldClass}
              value={state.zonaVecindario}
              onChange={(e) => setState((s) => ({ ...s, zonaVecindario: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2">
          <AiField label={c.addressLine1Label} hint={c.addressLine1Hint}>
            <input
              className={fieldClass}
              value={state.direccionLinea1}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  direccionLinea1: e.target.value,
                  direccionNumero: "",
                  direccionCalle: "",
                }))
              }
              autoComplete="street-address"
              placeholder={c.addressLine1Placeholder}
            />
          </AiField>
        </div>
        <div className="sm:col-span-2 grid min-w-0 gap-4 sm:grid-cols-2 sm:items-end sm:gap-5">
          <AiField label={c.addressLine2Label} hint={c.addressLine2Hint}>
            <input
              className={fieldClass}
              value={state.direccionLinea2}
              onChange={(e) => setState((s) => ({ ...s, direccionLinea2: e.target.value }))}
              autoComplete="address-line2"
              placeholder={c.addressLine2Placeholder}
            />
          </AiField>
          <AiField label={c.showExactAddressLabel} hint={c.showExactAddressHint}>
            <label className="flex min-h-[44px] items-center gap-3 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] px-3 py-2 text-sm text-[#2C2416]">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={Boolean(state.mostrarDireccionExacta)}
                onChange={(e) => setState((s) => ({ ...s, mostrarDireccionExacta: e.target.checked }))}
              />
              <span className="min-w-0">{c.showExactAddressCheckbox}</span>
            </label>
          </AiField>
        </div>
        <div className="sm:col-span-2">
          <AiField label={c.crossStreetLabel} hint={c.crossStreetHint}>
            <input
              className={fieldClass}
              value={state.direccionCruceCercano}
              onChange={(e) => setState((s) => ({ ...s, direccionCruceCercano: e.target.value }))}
              autoComplete="off"
              placeholder={c.crossStreetPlaceholder}
            />
          </AiField>
        </div>
        <div className="sm:col-span-2 grid min-w-0 gap-4 sm:grid-cols-3 sm:gap-5">
          <AiField required label={c.cityLabel} hint={c.cityHint}>
            <BrPrivadoCiudadZonaCombobox
              className={fieldClass}
              value={state.ciudad}
              onChange={(v) => setState((s) => ({ ...s, ciudad: v }))}
            />
          </AiField>
          <AiField label={c.stateLabel}>
            <select
              className={fieldClass}
              value={state.direccionEstado}
              onChange={(e) => setState((s) => ({ ...s, direccionEstado: e.target.value }))}
              autoComplete="address-level1"
            >
              {RENTAS_US_STATE_DATALIST_OPTIONS.map((opt) => (
                <option key={opt.code} value={opt.code}>
                  {opt.label}
                </option>
              ))}
            </select>
          </AiField>
          <AiField label={c.zipLabel} hint={c.zipHint}>
            <input
              className={fieldClass}
              value={state.direccionCodigoPostal}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  direccionCodigoPostal: e.target.value.trim(),
                }))
              }
              autoComplete="postal-code"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2">
          <AiField label={c.countryLabel} hint={c.countryHint}>
            <input
              className={fieldClass}
              list="rentas-country-suggestions"
              value={state.direccionPais}
              onChange={(e) => setState((s) => ({ ...s, direccionPais: e.target.value }))}
              autoComplete="country"
              placeholder="United States"
            />
            <datalist id="rentas-country-suggestions">
              {RENTAS_COUNTRY_SUGGESTIONS.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </datalist>
          </AiField>
        </div>
        {showLegacyUbicacionExtra ? (
          <details className="sm:col-span-2 min-w-0 rounded-lg border border-[#E8DFD0] bg-[#FAF6EE] px-3 py-2.5">
            <summary className="cursor-pointer text-sm font-medium text-[#5C5346]">{c.legacyLocationSummary}</summary>
            <p className={`${aiHintClass} mt-2`}>{c.legacyLocationHint}</p>
            <input
              className={`mt-2 ${fieldClass}`}
              value={state.ubicacionLinea}
              onChange={(e) => setState((s) => ({ ...s, ubicacionLinea: e.target.value }))}
              autoComplete="off"
            />
          </details>
        ) : null}
        <p className="sm:col-span-2 text-xs text-[#5C5346]">{c.previewLocationNote}</p>
        <div className="sm:col-span-2">
          <AiField label={c.descriptionLabel} hint={c.descriptionHint}>
            <textarea
              className={textareaFieldClass}
              rows={8}
              value={state.descripcion}
              onChange={(e) => setState((s) => ({ ...s, descripcion: e.target.value }))}
            />
          </AiField>
        </div>
      </div>
    </section>
  );
}
