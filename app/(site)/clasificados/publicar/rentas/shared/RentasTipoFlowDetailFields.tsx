"use client";

import { AiField } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/formPrimitives";
import { formatRentasSqftPreview } from "@/app/clasificados/rentas/shared/rentasPublishFormHelpers";
import type { RentasNegocioFormState } from "@/app/clasificados/publicar/rentas/negocio/schema/rentasNegocioFormState";
import type { RentasPrivadoFormState } from "@/app/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState";
import { rentasFlowGroupActive } from "@/app/clasificados/rentas/shared/rentasRentalTypeApply";
import type { OfficialLocale } from "@/app/lib/language";
import type { Dispatch, SetStateAction } from "react";

type S = RentasPrivadoFormState | RentasNegocioFormState;
type Lang = OfficialLocale;

function siNoOptions(lang: Lang): { id: "" | "si" | "no"; label: string }[] {
  return [
    { id: "", label: "—" },
    { id: "si", label: lang === "en" ? "Yes" : "Sí" },
    { id: "no", label: lang === "en" ? "No" : "No" },
  ];
}

type Props<T extends S> = {
  state: T;
  setState: Dispatch<SetStateAction<T>>;
  fieldClass: string;
  lang: Lang;
};

export function RentasTipoFlowDetailFields<T extends S>({ state, setState, fieldClass, lang }: Props<T>) {
  const g = rentasFlowGroupActive(state);
  const siNo = siNoOptions(lang);
  const inListing = lang === "en" ? "In listing: " : "En el anuncio: ";

  if (g === "unset") return null;

  if (g === "room_shared") {
    return (
      <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
        <AiField label={lang === "en" ? "Bathroom type" : "Tipo de baño"}>
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
            <option value="privado">{lang === "en" ? "Private" : "Privado"}</option>
            <option value="compartido">{lang === "en" ? "Shared" : "Compartido"}</option>
            <option value="no_incluido">{lang === "en" ? "Not included" : "No incluido"}</option>
          </select>
        </AiField>
        <AiField label={lang === "en" ? "Kitchen" : "Cocina"}>
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
            <option value="privada">{lang === "en" ? "Private" : "Privada"}</option>
            <option value="compartida">{lang === "en" ? "Shared" : "Compartida"}</option>
            <option value="no_incluida">{lang === "en" ? "Not included" : "No incluida"}</option>
          </select>
        </AiField>
        <AiField label={lang === "en" ? "Private entrance" : "Entrada privada"}>
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
        <AiField label={lang === "en" ? "Laundry available" : "Lavandería disponible"}>
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
          <AiField label={lang === "en" ? "Maximum occupants" : "Máximo de ocupantes"} hint={lang === "en" ? "Numbers only." : "Solo números."}>
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
          <AiField
            label={lang === "en" ? "Shared space preferences" : "Preferencias del espacio compartido"}
            hint={
              lang === "en"
                ? "Optional. Add important details for co-living, house rules or reasonable space preferences."
                : "Opcional. Agrega detalles importantes para convivencia, reglas del hogar o preferencias razonables para el espacio."
            }
          >
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
              placeholder={
                lang === "en"
                  ? "E.g. quiet environment, no smoking, quiet hours, preference for one person, etc."
                  : "Ej. ambiente tranquilo, no fumar, horario de descanso, preferencia para una persona, etc."
              }
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
          <AiField
            label={lang === "en" ? "Approximate size" : "Tamaño aproximado"}
            hint={lang === "en" ? "Free text or measurements (e.g. 12 × 24 ft)." : "Texto libre o medidas (ej. 12 × 24 ft)."}
          >
            <input
              className={fieldClass}
              value={state.rentasAlmacenTamanoAprox}
              onChange={(e) => setState((s) => ({ ...s, rentasAlmacenTamanoAprox: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <AiField label={lang === "en" ? "24/7 access" : "Acceso 24/7"}>
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
        <AiField label={lang === "en" ? "Electricity available" : "Electricidad disponible"}>
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
        <AiField label={lang === "en" ? "Security / controlled access" : "Seguridad / acceso controlado"}>
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
          <AiField label={lang === "en" ? "Permitted use" : "Uso permitido"}>
            <input
              className={fieldClass}
              value={state.rentasAlmacenUsoPermitido}
              onChange={(e) => setState((s) => ({ ...s, rentasAlmacenUsoPermitido: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2">
          <AiField
            label={lang === "en" ? "Height / dimensions" : "Altura / dimensiones"}
            hint={lang === "en" ? "If applicable (door, ceiling, van accessible…)." : "Si aplica (puerta, techo, van accessible…)."}
          >
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
          <AiField label={lang === "en" ? "Permitted use" : "Uso permitido"}>
            <input
              className={fieldClass}
              value={state.rentasComercialUsoPermitido}
              onChange={(e) => setState((s) => ({ ...s, rentasComercialUsoPermitido: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <AiField
          label={lang === "en" ? "Size (ft²)" : "Tamaño (ft²)"}
          hint={lang === "en" ? "Numbers only (approximate square feet)." : "Solo números (pies cuadrados aproximados)."}
        >
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
              {inListing}
              <span className="text-[#1E1810]">{sizePreview}</span>
            </p>
          ) : null}
        </AiField>
        <AiField label={lang === "en" ? "Restroom available" : "Baño disponible"}>
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
          <AiField label={lang === "en" ? "Hours / access" : "Horario / acceso"}>
            <input
              className={fieldClass}
              value={state.rentasComercialHorarioAcceso}
              onChange={(e) => setState((s) => ({ ...s, rentasComercialHorarioAcceso: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2">
          <AiField label={lang === "en" ? "Minimum contract" : "Contrato mínimo"}>
            <input
              className={fieldClass}
              value={state.rentasComercialContratoMinimo}
              onChange={(e) => setState((s) => ({ ...s, rentasComercialContratoMinimo: e.target.value }))}
              autoComplete="off"
              placeholder={lang === "en" ? "E.g. 1 year, 6 renewable months…" : "Ej. 1 año, 6 meses renovable…"}
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
          <AiField label={lang === "en" ? "Permitted use" : "Uso permitido"}>
            <input
              className={fieldClass}
              value={state.rentasLoteUsoPermitido}
              onChange={(e) => setState((s) => ({ ...s, rentasLoteUsoPermitido: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2">
          <AiField label={lang === "en" ? "Available utilities" : "Servicios disponibles"}>
            <input
              className={fieldClass}
              value={state.rentasLoteServiciosDisponibles}
              onChange={(e) => setState((s) => ({ ...s, rentasLoteServiciosDisponibles: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2">
          <AiField label={lang === "en" ? "Access" : "Acceso"}>
            <input
              className={fieldClass}
              value={state.rentasLoteAcceso}
              onChange={(e) => setState((s) => ({ ...s, rentasLoteAcceso: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2">
          <AiField label={lang === "en" ? "Zoning" : "Zonificación"} hint={lang === "en" ? "If applicable." : "Si aplica."}>
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
