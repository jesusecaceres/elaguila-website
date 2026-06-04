"use client";

import { AiField } from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/application/formPrimitives";
import { formatRentasSqftPreview } from "@/app/clasificados/rentas/shared/rentasPublishFormHelpers";
import type { RentasNegocioFormState } from "@/app/clasificados/publicar/rentas/negocio/schema/rentasNegocioFormState";
import type { RentasPrivadoFormState } from "@/app/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState";
import { rentasFlowGroupActive } from "@/app/clasificados/rentas/shared/rentasRentalTypeApply";
import type { Dispatch, SetStateAction } from "react";

type S = RentasPrivadoFormState | RentasNegocioFormState;

const SI_NO: { id: "" | "si" | "no"; label: string }[] = [
  { id: "", label: "—" },
  { id: "si", label: "Sí" },
  { id: "no", label: "No" },
];

type Props<T extends S> = {
  state: T;
  setState: Dispatch<SetStateAction<T>>;
  fieldClass: string;
};

export function RentasTipoFlowDetailFields<T extends S>({ state, setState, fieldClass }: Props<T>) {
  const g = rentasFlowGroupActive(state);
  if (g === "unset") return null;

  if (g === "room_shared") {
    return (
      <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
        <AiField label="Tipo de baño">
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
            <option value="privado">Privado</option>
            <option value="compartido">Compartido</option>
            <option value="no_incluido">No incluido</option>
          </select>
        </AiField>
        <AiField label="Cocina">
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
            <option value="privada">Privada</option>
            <option value="compartida">Compartida</option>
            <option value="no_incluida">No incluida</option>
          </select>
        </AiField>
        <AiField label="Entrada privada">
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
            {SI_NO.map((o) => (
              <option key={o.id || "x"} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </AiField>
        <AiField label="Lavandería disponible">
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
            {SI_NO.map((o) => (
              <option key={o.id || "x"} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </AiField>
        <div className="sm:col-span-2">
          <AiField label="Máximo de ocupantes" hint="Solo números.">
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
            label="Preferencias del espacio compartido"
            hint="Opcional. Agrega detalles importantes para convivencia, reglas del hogar o preferencias razonables para el espacio."
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
              placeholder="Ej. ambiente tranquilo, no fumar, horario de descanso, preferencia para una persona, etc."
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
          <AiField label="Tamaño aproximado" hint="Texto libre o medidas (ej. 12 × 24 ft).">
            <input
              className={fieldClass}
              value={state.rentasAlmacenTamanoAprox}
              onChange={(e) => setState((s) => ({ ...s, rentasAlmacenTamanoAprox: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <AiField label="Acceso 24/7">
          <select
            className={fieldClass}
            value={state.rentasAlmacenAcceso24h}
            onChange={(e) =>
              setState((s) => ({ ...s, rentasAlmacenAcceso24h: e.target.value as typeof s.rentasAlmacenAcceso24h }))
            }
          >
            {SI_NO.map((o) => (
              <option key={o.id || "x"} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </AiField>
        <AiField label="Electricidad disponible">
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
            {SI_NO.map((o) => (
              <option key={o.id || "x"} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </AiField>
        <AiField label="Seguridad / acceso controlado">
          <select
            className={fieldClass}
            value={state.rentasAlmacenSeguridad}
            onChange={(e) =>
              setState((s) => ({ ...s, rentasAlmacenSeguridad: e.target.value as typeof s.rentasAlmacenSeguridad }))
            }
          >
            {SI_NO.map((o) => (
              <option key={o.id || "x"} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </AiField>
        <div className="sm:col-span-2">
          <AiField label="Uso permitido">
            <input
              className={fieldClass}
              value={state.rentasAlmacenUsoPermitido}
              onChange={(e) => setState((s) => ({ ...s, rentasAlmacenUsoPermitido: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2">
          <AiField label="Altura / dimensiones" hint="Si aplica (puerta, techo, van accessible…).">
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
          <AiField label="Uso permitido">
            <input
              className={fieldClass}
              value={state.rentasComercialUsoPermitido}
              onChange={(e) => setState((s) => ({ ...s, rentasComercialUsoPermitido: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <AiField label="Tamaño (ft²)" hint="Solo números (pies cuadrados aproximados).">
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
              En el anuncio: <span className="text-[#1E1810]">{sizePreview}</span>
            </p>
          ) : null}
        </AiField>
        <AiField label="Baño disponible">
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
            {SI_NO.map((o) => (
              <option key={o.id || "x"} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </AiField>
        <div className="sm:col-span-2">
          <AiField label="Horario / acceso">
            <input
              className={fieldClass}
              value={state.rentasComercialHorarioAcceso}
              onChange={(e) => setState((s) => ({ ...s, rentasComercialHorarioAcceso: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2">
          <AiField label="Contrato mínimo">
            <input
              className={fieldClass}
              value={state.rentasComercialContratoMinimo}
              onChange={(e) => setState((s) => ({ ...s, rentasComercialContratoMinimo: e.target.value }))}
              autoComplete="off"
              placeholder="Ej. 1 año, 6 meses renovable…"
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
          <AiField label="Uso permitido">
            <input
              className={fieldClass}
              value={state.rentasLoteUsoPermitido}
              onChange={(e) => setState((s) => ({ ...s, rentasLoteUsoPermitido: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2">
          <AiField label="Servicios disponibles">
            <input
              className={fieldClass}
              value={state.rentasLoteServiciosDisponibles}
              onChange={(e) => setState((s) => ({ ...s, rentasLoteServiciosDisponibles: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2">
          <AiField label="Acceso">
            <input
              className={fieldClass}
              value={state.rentasLoteAcceso}
              onChange={(e) => setState((s) => ({ ...s, rentasLoteAcceso: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2">
          <AiField label="Zonificación" hint="Si aplica.">
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
