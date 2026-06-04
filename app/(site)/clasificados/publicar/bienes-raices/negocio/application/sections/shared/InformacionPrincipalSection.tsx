"use client";

import type { BienesRaicesNegocioFormState } from "../../schema/bienesRaicesNegocioFormState";
import { formatUsdWhole } from "@/app/(site)/clasificados/bienes-raices/shared/realEstateAddressPriceFormat";
import { BrField, BrPreviewHint, brInputClass, brCardClass, brSectionTitleClass, brSubTitleClass } from "./brFormPrimitives";

const STATUS_OPTS: Array<{ v: BienesRaicesNegocioFormState["listingStatus"]; l: string }> = [
  { v: "en_venta", l: "En venta" },
  { v: "en_renta", l: "En renta" },
  { v: "disponible_pronto", l: "Disponible pronto" },
  { v: "preconstruccion", l: "Preconstrucción" },
  { v: "bajo_contrato", l: "Bajo contrato" },
];

export function InformacionPrincipalSection({
  state,
  setState,
}: {
  state: BienesRaicesNegocioFormState;
  setState: React.Dispatch<React.SetStateAction<BienesRaicesNegocioFormState>>;
}) {
  const precioPreview = formatUsdWhole(state.precio);

  return (
    <section className={brCardClass}>
      <h2 className={brSectionTitleClass}>Información principal del anuncio</h2>
      <p className={brSubTitleClass}>Lo básico que aparece en el encabezado, precio y ubicación de la vista previa.</p>
      <BrPreviewHint>
        Título, precio, estado del anuncio y dirección alimentan el hero y la franja superior del preview.
      </BrPreviewHint>
      <BrPreviewHint>
        Para una vista previa completa: título y precio son obligatorios; indica ciudad o dirección de referencia (al menos
        uno).
      </BrPreviewHint>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <BrField required label="Título del anuncio" hint="Claro y atractivo; es el titular principal.">
          <input
            className={brInputClass}
            value={state.titulo}
            onChange={(e) => setState((s) => ({ ...s, titulo: e.target.value }))}
            placeholder="Ej. Casa moderna con alberca en zona tranquila"
          />
        </BrField>
        <BrField required label="Precio" hint="Solo números o con formato; se muestra destacado en dorado.">
          <input
            className={brInputClass}
            value={state.precio}
            onChange={(e) => setState((s) => ({ ...s, precio: e.target.value }))}
            placeholder="1250000"
          />
          {precioPreview ? (
            <p className="mt-1.5 text-xs font-medium text-[#5C5346]">Vista previa: {precioPreview}</p>
          ) : null}
        </BrField>
        <BrField
          label="Estado del anuncio"
          hint="Etiqueta junto al precio. El tipo de publicación (paso 2) define la operación mostrada en el resumen; aquí ajustas el estado del listado."
        >
          <select
            className={brInputClass}
            value={state.listingStatus}
            onChange={(e) =>
              setState((s) => ({ ...s, listingStatus: e.target.value as BienesRaicesNegocioFormState["listingStatus"] }))
            }
          >
            {STATUS_OPTS.map((o) => (
              <option key={o.v} value={o.v}>
                {o.l}
              </option>
            ))}
          </select>
        </BrField>
        <BrField label="Calle y número" hint="Número y nombre de la calle (sin unidad).">
          <input
            className={brInputClass}
            value={state.direccion}
            onChange={(e) => setState((s) => ({ ...s, direccion: e.target.value }))}
            autoComplete="street-address"
          />
        </BrField>
        <BrField label="Unidad / apt / suite / espacio" hint="Opcional: Space B, Apt 2, Suite 100, etc.">
          <input
            className={brInputClass}
            value={state.direccionLinea2}
            onChange={(e) => setState((s) => ({ ...s, direccionLinea2: e.target.value }))}
            autoComplete="address-line2"
          />
        </BrField>
        <BrField label="Ciudad" hint="Si no hay dirección arriba, la ciudad cumple el requisito de ubicación para la vista previa.">
          <input
            className={brInputClass}
            value={state.ciudad}
            onChange={(e) => setState((s) => ({ ...s, ciudad: e.target.value }))}
          />
        </BrField>
        <BrField label="Estado">
          <input
            className={brInputClass}
            value={state.estado}
            onChange={(e) => setState((s) => ({ ...s, estado: e.target.value }))}
            placeholder="CA"
            autoComplete="address-level1"
          />
        </BrField>
        <BrField label="Código postal">
          <input
            className={brInputClass}
            value={state.codigoPostal}
            onChange={(e) => setState((s) => ({ ...s, codigoPostal: e.target.value }))}
            autoComplete="postal-code"
            inputMode="numeric"
          />
        </BrField>
        <BrField label="Colonia / zona / sector" hint="Contexto opcional; no reemplaza ciudad, estado ni ZIP.">
          <input
            className={brInputClass}
            value={state.colonia}
            onChange={(e) => setState((s) => ({ ...s, colonia: e.target.value }))}
          />
        </BrField>
        <div className="sm:col-span-2">
          <BrField
            label="Mostrar dirección exacta"
            hint="Si está desactivado, en cards y mapa solo se usa ciudad/zona aproximada (no calle y número)."
          >
            <label className="flex min-h-[44px] items-center gap-3 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] px-3 py-2 text-sm text-[#1E1810]">
              <input
                type="checkbox"
                className="h-4 w-4"
                checked={Boolean(state.mostrarDireccionExacta)}
                onChange={(e) => setState((s) => ({ ...s, mostrarDireccionExacta: e.target.checked }))}
              />
              <span className="min-w-0">Permitir mostrar calle y número en preview, resultados y mapa.</span>
            </label>
          </BrField>
        </div>
        <div className="sm:col-span-2">
          <BrField label="Descripción corta (opcional)" hint="Resumen rápido; la descripción larga va en su paso.">
            <input
              className={brInputClass}
              value={state.descripcionCorta}
              onChange={(e) => setState((s) => ({ ...s, descripcionCorta: e.target.value }))}
            />
          </BrField>
        </div>
      </div>
    </section>
  );
}
