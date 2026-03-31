"use client";

import type { BienesRaicesNegocioFormState } from "../../schema/bienesRaicesNegocioFormState";
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
  return (
    <section className={brCardClass}>
      <h2 className={brSectionTitleClass}>Información principal del anuncio</h2>
      <p className={brSubTitleClass}>Lo básico que aparece en el encabezado, precio y ubicación de la vista previa.</p>
      <BrPreviewHint>
        Título, precio, estado del anuncio y dirección alimentan el hero y la franja superior del preview.
      </BrPreviewHint>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <BrField label="Título del anuncio" hint="Claro y atractivo; es el titular principal.">
          <input
            className={brInputClass}
            value={state.titulo}
            onChange={(e) => setState((s) => ({ ...s, titulo: e.target.value }))}
            placeholder="Ej. Casa moderna con alberca en zona tranquila"
          />
        </BrField>
        <BrField label="Precio" hint="Solo números o con formato; se muestra destacado en dorado.">
          <input
            className={brInputClass}
            value={state.precio}
            onChange={(e) => setState((s) => ({ ...s, precio: e.target.value }))}
            placeholder="1250000"
          />
        </BrField>
        <BrField label="Tipo de operación" hint="Ej. Venta, Renta, Preventa.">
          <input
            className={brInputClass}
            value={state.tipoOperacion}
            onChange={(e) => setState((s) => ({ ...s, tipoOperacion: e.target.value }))}
          />
        </BrField>
        <BrField label="Estado del anuncio" hint="Aparece como etiqueta junto al precio.">
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
        <BrField label="Dirección o ubicación principal" hint="Calle y número o referencia visible.">
          <input
            className={brInputClass}
            value={state.direccion}
            onChange={(e) => setState((s) => ({ ...s, direccion: e.target.value }))}
          />
        </BrField>
        <BrField label="Colonia / zona / sector">
          <input
            className={brInputClass}
            value={state.colonia}
            onChange={(e) => setState((s) => ({ ...s, colonia: e.target.value }))}
          />
        </BrField>
        <BrField label="Ciudad">
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
          />
        </BrField>
        <BrField label="Código postal">
          <input
            className={brInputClass}
            value={state.codigoPostal}
            onChange={(e) => setState((s) => ({ ...s, codigoPostal: e.target.value }))}
          />
        </BrField>
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
