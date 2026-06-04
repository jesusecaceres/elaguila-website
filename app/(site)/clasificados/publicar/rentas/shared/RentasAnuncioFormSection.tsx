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
  coerceRentasPostalDigits5,
  formatRentasDepositUsdPreview,
  formatRentasMensualAnuncioPreview,
  rentasDisponibilidadIsIsoDate,
  type RentasServicioIncluidoId,
} from "@/app/clasificados/rentas/shared/rentasPublishFormHelpers";
import type { RentasNegocioFormState } from "../negocio/schema/rentasNegocioFormState";
import type { RentasPrivadoFormState } from "../privado/schema/rentasPrivadoFormState";
import { RENTAS_TIPO_DE_RENTA_OPTIONS } from "@/app/clasificados/rentas/shared/rentasRentalTypeTaxonomy";
import { rentasFlowGroupActive } from "@/app/clasificados/rentas/shared/rentasRentalTypeApply";
import { RentasTipoFlowDetailFields } from "@/app/clasificados/publicar/rentas/shared/RentasTipoFlowDetailFields";
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
};

export function RentasAnuncioFormSection<T extends RentasPrivadoFormState | RentasNegocioFormState>({
  state,
  setState,
  fieldClass,
  textareaFieldClass,
  estadoOptions,
}: Props<T>) {
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
      <h2 className={aiTitleClass}>Anuncio</h2>
      <div className="mt-4 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
        <div className="sm:col-span-2">
          <AiField required label="Título">
            <input
              className={fieldClass}
              value={state.titulo}
              onChange={(e) => setState((s) => ({ ...s, titulo: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2 grid min-w-0 gap-4 sm:grid-cols-2 sm:gap-5">
          <AiField label="Tipo de renta" hint="Describe con más detalle qué ofreces; ayuda a la vista previa y a los resultados.">
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
                  {o.label}
                </option>
              ))}
            </select>
          </AiField>
          {state.tipoDeRenta === "otro" ? (
            <AiField label="Especifica el tipo de renta" hint="Se mostrará tal como lo escribas (no solo “Otro”).">
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
          <AiField
            label="Condiciones importantes del alquiler"
            hint="Agrega reglas, condiciones o detalles importantes del espacio. Evita lenguaje discriminatorio; enfócate en reglas del hogar, ocupación, uso del espacio y requisitos claros."
          >
            <textarea
              className={textareaFieldClass}
              rows={3}
              value={state.condicionesAlquiler}
              onChange={(e) => setState((s) => ({ ...s, condicionesAlquiler: e.target.value }))}
              placeholder="Ej. ambiente tranquilo, no fumar, máximo 1 persona, ideal para estudiante o trabajador, se requiere comprobante de ingresos…"
            />
          </AiField>
        </div>
        <RentasTipoFlowDetailFields state={state} setState={setState} fieldClass={fieldClass} />
        <AiField
          required
          label="Renta mensual (USD)"
          hint="Escribe solo números (sin símbolos). Abajo ves cómo quedará en el anuncio."
        >
          <input
            className={fieldClass}
            inputMode="numeric"
            value={state.rentaMensual}
            onChange={(e) => setState((s) => ({ ...s, rentaMensual: precioDigitsUnbounded(e.target.value) }))}
            autoComplete="off"
          />
          {rentPreview ? (
            <p className="mt-2 text-sm font-semibold [font-variant-numeric:tabular-nums] text-[#6E5418]">
              En el anuncio:{" "}
              <span className="text-[#1E1810]" aria-live="polite">
                {rentPreview}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-xs text-[#5C5346]/85">
              {state.rentaMensual.trim()
                ? "Revisa el número (debe ser mayor que cero)."
                : "Ejemplo: al escribir 2500 se mostrará la renta en dólares con formato y “/ mes”."}
            </p>
          )}
        </AiField>
        <AiField label="Depósito (USD)" hint="Solo números (dólares enteros). Sin “/ mes” en el anuncio.">
          <input
            className={fieldClass}
            inputMode="numeric"
            value={state.deposito}
            onChange={(e) => setState((s) => ({ ...s, deposito: precioDigitsUnbounded(e.target.value) }))}
            autoComplete="off"
          />
          {depositPreview ? (
            <p className="mt-2 text-sm font-semibold [font-variant-numeric:tabular-nums] text-[#6E5418]">
              En el anuncio:{" "}
              <span className="text-[#1E1810]" aria-live="polite">
                {depositPreview}
              </span>
            </p>
          ) : (
            <p className="mt-2 text-xs text-[#5C5346]/85">
              {state.deposito.trim()
                ? "Revisa el monto (debe ser mayor que cero)."
                : "Ejemplo: 10000 se mostrará como depósito en dólares con formato."}
            </p>
          )}
        </AiField>
        <AiField label="Plazo del contrato">
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
                {lbl.es}
              </option>
            ))}
          </select>
        </AiField>
        {showOtroPlazo ? (
          <div className="sm:col-span-2">
            <AiField
              label="Especifica el plazo"
              hint="Ej. 3 meses renovable, temporada, contrato flexible…"
            >
              <input
                className={fieldClass}
                value={state.plazoContratoOtro}
                onChange={(e) => setState((s) => ({ ...s, plazoContratoOtro: e.target.value }))}
                autoComplete="off"
                placeholder="Ej. 3 meses renovable, temporada, contrato flexible…"
              />
            </AiField>
          </div>
        ) : null}
        <AiField label="Disponibilidad" hint="Elige la fecha en que estará disponible (o conserva un texto guardado antes).">
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
              Texto guardado anteriormente: «{dispLegacyNote}». Elige una fecha arriba para reemplazarlo, o déjalo y seguirá
              mostrándose así en el anuncio.
            </p>
          ) : null}
        </AiField>
        {hideAmuebladoMascotas ? null : (
          <>
            <AiField label="Amueblado">
              <select
                className={fieldClass}
                value={state.amueblado}
                onChange={(e) =>
                  setState((s) => ({ ...s, amueblado: e.target.value as typeof s.amueblado }))
                }
              >
                <option value="">—</option>
                <option value="amueblado">Amueblado</option>
                <option value="sin_amueblar">Sin amueblar</option>
              </select>
            </AiField>
            <AiField label="Mascotas">
              <select
                className={fieldClass}
                value={state.mascotas}
                onChange={(e) => setState((s) => ({ ...s, mascotas: e.target.value as typeof s.mascotas }))}
              >
                <option value="">—</option>
                <option value="permitidas">Permitidas</option>
                <option value="no_permitidas">No permitidas</option>
              </select>
            </AiField>
          </>
        )}
        <div className="sm:col-span-2">
          <span className={aiLabelClass}>Servicios incluidos</span>
          <p className={aiHintClass}>Marca lo que aplica. En el anuncio se listan en limpio, sin emojis.</p>
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
                <span className="min-w-0">
                  {d.emoji} {d.label}
                </span>
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
              <span className="min-w-0">✏️ Otro</span>
            </label>
          </div>
          {servicioOtro ? (
            <div className="mt-3">
              <AiField label="Especifica el servicio" hint="Aparece junto a los demás en el anuncio.">
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
          <AiField
            label="Requisitos"
            hint="Ej. comprobante de ingresos, meses de depósito, carta de recomendación, verificación de antecedentes…"
          >
            <textarea
              className={textareaFieldClass}
              rows={3}
              value={state.requisitos}
              onChange={(e) => setState((s) => ({ ...s, requisitos: e.target.value }))}
            />
          </AiField>
        </div>
        <div className="sm:col-span-2 grid min-w-0 gap-4 sm:grid-cols-2 sm:items-end sm:gap-5">
          <AiField label="Estado del anuncio">
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
          <AiField label="Zona o vecindario" hint="Opcional. Barrio, colonia o referencia local (no sustituye la ciudad).">
            <input
              className={fieldClass}
              value={state.zonaVecindario}
              onChange={(e) => setState((s) => ({ ...s, zonaVecindario: e.target.value }))}
              autoComplete="off"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2">
          <AiField label="Dirección línea 1" hint="Calle y número para ubicar la propiedad.">
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
              placeholder="Calle y número"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2 grid min-w-0 gap-4 sm:grid-cols-2 sm:items-end sm:gap-5">
          <AiField label="Dirección línea 2" hint="Departamento, unidad, suite, edificio… (opcional).">
            <input
              className={fieldClass}
              value={state.direccionLinea2}
              onChange={(e) => setState((s) => ({ ...s, direccionLinea2: e.target.value }))}
              autoComplete="address-line2"
              placeholder="Departamento, unidad, suite…"
            />
          </AiField>
          <AiField
            label="Mostrar dirección exacta cuando aplique"
            hint="Si no activas esta opción, mostraremos una ubicación aproximada. / If you do not enable this, we will show an approximate location."
          >
            <label className="flex min-h-[44px] items-center gap-3 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] px-3 py-2 text-sm text-[#2C2416]">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={Boolean(state.mostrarDireccionExacta)}
                onChange={(e) => setState((s) => ({ ...s, mostrarDireccionExacta: e.target.checked }))}
              />
              <span className="min-w-0">Permitir mostrar la dirección exacta en el anuncio.</span>
            </label>
          </AiField>
        </div>
        <div className="sm:col-span-2">
          <AiField
            label="Calles principales o cruce cercano (opcional)"
            hint="Si no quieres mostrar la dirección exacta, puedes indicar calles principales, un cruce cercano o una referencia general."
          >
            <input
              className={fieldClass}
              value={state.direccionCruceCercano}
              onChange={(e) => setState((s) => ({ ...s, direccionCruceCercano: e.target.value }))}
              autoComplete="off"
              placeholder="Calles principales o cruce cercano"
            />
          </AiField>
        </div>
        <div className="sm:col-span-2 grid min-w-0 gap-4 sm:grid-cols-3 sm:gap-5">
          <AiField
            required
            label="Ciudad"
            hint="Escribe y elige una sugerencia, o escribe la ciudad. Sirve para ubicación y filtros."
          >
            <BrPrivadoCiudadZonaCombobox
              className={fieldClass}
              value={state.ciudad}
              onChange={(v) => setState((s) => ({ ...s, ciudad: v }))}
            />
          </AiField>
          <AiField label="Estado">
            <input
              className={fieldClass}
              value={state.direccionEstado}
              onChange={(e) => setState((s) => ({ ...s, direccionEstado: e.target.value }))}
              autoComplete="address-level1"
              placeholder="CA"
            />
          </AiField>
          <AiField label="Código postal" hint="Hasta 5 dígitos (EE. UU.).">
            <input
              className={fieldClass}
              inputMode="numeric"
              maxLength={5}
              value={state.direccionCodigoPostal}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  direccionCodigoPostal: coerceRentasPostalDigits5(e.target.value),
                }))
              }
              autoComplete="postal-code"
            />
          </AiField>
        </div>
        {showLegacyUbicacionExtra ? (
          <details className="sm:col-span-2 min-w-0 rounded-lg border border-[#E8DFD0] bg-[#FAF6EE] px-3 py-2.5">
            <summary className="cursor-pointer text-sm font-medium text-[#5C5346]">
              Texto de ubicación adicional (borrador anterior)
            </summary>
            <p className={`${aiHintClass} mt-2`}>
              Solo si necesitas conservar o editar un texto distinto a la dirección principal.
            </p>
            <input
              className={`mt-2 ${fieldClass}`}
              value={state.ubicacionLinea}
              onChange={(e) => setState((s) => ({ ...s, ubicacionLinea: e.target.value }))}
              autoComplete="off"
            />
          </details>
        ) : null}
        <p className="sm:col-span-2 text-xs text-[#5C5346]">
          Para vista previa indica la ciudad
          <span className="text-[#B8954A]" aria-hidden>
            {" "}
            *
          </span>{" "}
          y la referencia (dirección exacta o cruce cercano). El mapa se genera automáticamente a partir de la referencia reunida.
        </p>
        <div className="sm:col-span-2">
          <AiField
            label="Descripción principal"
            hint="Describe la propiedad, el espacio, las reglas importantes y lo que debe saber la persona interesada."
          >
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
