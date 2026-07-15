"use client";

import { AiField } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/formPrimitives";
import { formatRentasSqftPreview } from "@/app/clasificados/rentas/shared/rentasPublishFormHelpers";
import type { RentasNegocioFormState } from "@/app/clasificados/publicar/rentas/negocio/schema/rentasNegocioFormState";
import type { RentasPrivadoFormState } from "@/app/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState";
import { rentasFlowGroupActive } from "@/app/clasificados/rentas/shared/rentasRentalTypeApply";
import { getLaunchUiMessages } from "@/app/lib/i18n/launchUiDictionaries";
import type { OfficialLocale } from "@/app/lib/language";
import type { Dispatch, SetStateAction } from "react";

type S = RentasPrivadoFormState | RentasNegocioFormState;
type Lang = OfficialLocale;

type Props<T extends S> = {
  state: T;
  setState: Dispatch<SetStateAction<T>>;
  fieldClass: string;
  lang: Lang;
};

export function RentasTipoFlowDetailFields<T extends S>({ state, setState, fieldClass, lang }: Props<T>) {
  const tf = getLaunchUiMessages(lang).rentas.tipoFlow;
  const g = rentasFlowGroupActive(state);
  const siNo = [
    { id: "" as const, label: "—" },
    { id: "si" as const, label: tf.yes },
    { id: "no" as const, label: tf.no },
  ];

  if (g === "unset") return null;

  if (g === "room_shared") {
    return (
      <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
        <AiField label={tf.bathroomType}>
          <select
            className={fieldClass}
            value={state.rentasEspacioTipoBano}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                rentasEspacioTipoBano: e.target.value as typeof s.rentasEspacioTipoBano,
              }))
            }
          >
            <option value="">—</option>
            <option value="privado">{tf.bathroomPrivate}</option>
            <option value="compartido">{tf.bathroomShared}</option>
            <option value="no_incluido">{tf.bathroomNotIncluded}</option>
          </select>
        </AiField>
        <AiField label={tf.kitchen}>
          <select
            className={fieldClass}
            value={state.rentasEspacioTipoCocina}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                rentasEspacioTipoCocina: e.target.value as typeof s.rentasEspacioTipoCocina,
              }))
            }
          >
            <option value="">—</option>
            <option value="privada">{tf.kitchenPrivate}</option>
            <option value="compartida">{tf.kitchenShared}</option>
            <option value="no_incluida">{tf.kitchenNotIncluded}</option>
          </select>
        </AiField>
        <AiField label={tf.privateEntrance}>
          <select
            className={fieldClass}
            value={state.rentasEspacioEntradaPrivada}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                rentasEspacioEntradaPrivada: e.target.value as typeof s.rentasEspacioEntradaPrivada,
              }))
            }
          >
            {siNo.map((o) => (
              <option key={o.id || "x"} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </AiField>
        <AiField label={tf.laundryAvailable}>
          <select
            className={fieldClass}
            value={state.rentasEspacioLavanderia}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                rentasEspacioLavanderia: e.target.value as typeof s.rentasEspacioLavanderia,
              }))
            }
          >
            {siNo.map((o) => (
              <option key={o.id || "x"} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </AiField>
        <div className="sm:col-span-2">
          <AiField label={tf.maxOccupants} hint={tf.maxOccupantsHint}>
            <input
              className={fieldClass}
              inputMode="numeric"
              value={state.rentasEspacioMaxOcupantes}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  rentasEspacioMaxOcupantes: e.target.value.replace(/\D/g, ""),
                }))
              }
              autoComplete="off"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2">
          <AiField label={tf.sharedSpacePreferences} hint={tf.sharedSpacePreferencesHint}>
            <textarea
              className={fieldClass}
              rows={4}
              value={state.rentasPreferenciasEspacioCompartido}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  rentasPreferenciasEspacioCompartido: e.target.value,
                }))
              }
              placeholder={tf.sharedSpacePreferencesPlaceholder}
              autoComplete="off"
            />
          </AiField>
        </div>
      </div>
    );
  }

  if (g === "storage_parking") {
    return (
      <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
        <div className="sm:col-span-2">
          <AiField label={tf.approximateSize} hint={tf.approximateSizeHint}>
            <input
              className={fieldClass}
              value={state.rentasAlmacenTamanoAprox}
              onChange={(e) => setState((s) => ({ ...s, rentasAlmacenTamanoAprox: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <AiField label={tf.access24h}>
          <select
            className={fieldClass}
            value={state.rentasAlmacenAcceso24h}
            onChange={(e) =>
              setState((s) => ({ ...s, rentasAlmacenAcceso24h: e.target.value as typeof s.rentasAlmacenAcceso24h }))
            }
          >
            {siNo.map((o) => (
              <option key={o.id || "x"} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </AiField>
        <AiField label={tf.electricityAvailable}>
          <select
            className={fieldClass}
            value={state.rentasAlmacenElectricidad}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                rentasAlmacenElectricidad: e.target.value as typeof s.rentasAlmacenElectricidad,
              }))
            }
          >
            {siNo.map((o) => (
              <option key={o.id || "x"} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </AiField>
        <AiField label={tf.securityControlled}>
          <select
            className={fieldClass}
            value={state.rentasAlmacenSeguridad}
            onChange={(e) =>
              setState((s) => ({ ...s, rentasAlmacenSeguridad: e.target.value as typeof s.rentasAlmacenSeguridad }))
            }
          >
            {siNo.map((o) => (
              <option key={o.id || "x"} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </AiField>
        <div className="sm:col-span-2">
          <AiField label={tf.permittedUse}>
            <input
              className={fieldClass}
              value={state.rentasAlmacenUsoPermitido}
              onChange={(e) => setState((s) => ({ ...s, rentasAlmacenUsoPermitido: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2">
          <AiField label={tf.heightDimensions} hint={tf.heightDimensionsHint}>
            <input
              className={fieldClass}
              value={state.rentasAlmacenDimensiones}
              onChange={(e) => setState((s) => ({ ...s, rentasAlmacenDimensiones: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
      </div>
    );
  }

  if (g === "commercial_space") {
    const sizePreview = formatRentasSqftPreview(state.rentasComercialTamanoFt2);
    return (
      <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
        <div className="sm:col-span-2">
          <AiField label={tf.permittedUse}>
            <input
              className={fieldClass}
              value={state.rentasComercialUsoPermitido}
              onChange={(e) => setState((s) => ({ ...s, rentasComercialUsoPermitido: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <AiField label={tf.sizeSqft} hint={tf.sizeSqftHint}>
          <input
            className={fieldClass}
            inputMode="numeric"
            value={state.rentasComercialTamanoFt2}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                rentasComercialTamanoFt2: e.target.value.replace(/\D/g, ""),
              }))
            }
            autoComplete="off"
          />
          {sizePreview ? (
            <p className="mt-2 text-sm font-semibold [font-variant-numeric:tabular-nums] text-[#6E5418]">
              {tf.inListingPrefix}
              <span className="text-[#1E1810]">{sizePreview}</span>
            </p>
          ) : null}
        </AiField>
        <AiField label={tf.restroomAvailable}>
          <select
            className={fieldClass}
            value={state.rentasComercialBanoDisponible}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                rentasComercialBanoDisponible: e.target.value as typeof s.rentasComercialBanoDisponible,
              }))
            }
          >
            {siNo.map((o) => (
              <option key={o.id || "x"} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </AiField>
        <div className="sm:col-span-2">
          <AiField label={tf.hoursAccess}>
            <input
              className={fieldClass}
              value={state.rentasComercialHorarioAcceso}
              onChange={(e) => setState((s) => ({ ...s, rentasComercialHorarioAcceso: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2">
          <AiField label={tf.minimumContract}>
            <input
              className={fieldClass}
              value={state.rentasComercialContratoMinimo}
              onChange={(e) => setState((s) => ({ ...s, rentasComercialContratoMinimo: e.target.value }))}
              autoComplete="off"
              placeholder={tf.minimumContractPlaceholder}
            />
          </AiField>
        </div>
      </div>
    );
  }

  if (g === "land_parcel") {
    return (
      <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
        <div className="sm:col-span-2">
          <AiField label={tf.permittedUse}>
            <input
              className={fieldClass}
              value={state.rentasLoteUsoPermitido}
              onChange={(e) => setState((s) => ({ ...s, rentasLoteUsoPermitido: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2">
          <AiField label={tf.availableUtilities}>
            <input
              className={fieldClass}
              value={state.rentasLoteServiciosDisponibles}
              onChange={(e) => setState((s) => ({ ...s, rentasLoteServiciosDisponibles: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2">
          <AiField label={tf.access}>
            <input
              className={fieldClass}
              value={state.rentasLoteAcceso}
              onChange={(e) => setState((s) => ({ ...s, rentasLoteAcceso: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2">
          <AiField label={tf.zoning} hint={tf.zoningHint}>
            <input
              className={fieldClass}
              value={state.rentasLoteZonificacion}
              onChange={(e) => setState((s) => ({ ...s, rentasLoteZonificacion: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
      </div>
    );
  }

  return null;
}
