"use client";

import {
  BIENES_RAICES_SUBCATEGORIES,
  BR_PROPERTY_TYPE_OPTIONS,
} from "@/app/clasificados/bienes-raices/shared/fields/bienesRaicesTaxonomy";
import { BrSectionShell } from "../components/BrSectionShell";
import { brHintClass, brInputClass, brLabelClass } from "../helpers/brFieldStyles";
import type { PrivadoFormApi } from "../types/privadoFormApi";

export function InformacionPrincipalSection({ state, setState }: PrivadoFormApi) {
  const { inmueble } = state;
  const p = (k: keyof typeof inmueble, v: string | boolean) =>
    setState((s) => ({ ...s, inmueble: { ...s.inmueble, [k]: v } }));

  return (
    <BrSectionShell
      title="Información principal del inmueble"
      description="Cuéntanos lo esencial. Este flujo es más rápido que el de negocio, pero igual de claro para quien busca."
    >
      <div>
        <label className={brLabelClass}>Título del anuncio</label>
        <p className={brHintClass}>Escribe un título claro. Ejemplo: Terreno en esquina con servicios en la zona.</p>
        <input className={`${brInputClass} mt-2`} value={inmueble.titulo} onChange={(e) => p("titulo", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Operación</label>
        <select className={`${brInputClass} mt-2`} value={inmueble.operacion} onChange={(e) => p("operacion", e.target.value)}>
          <option value="">Selecciona…</option>
          <option value="venta">Venta</option>
          <option value="renta">Renta</option>
          <option value="otro">Otro</option>
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={brLabelClass}>Tipo de propiedad</label>
          <select className={`${brInputClass} mt-2`} value={inmueble.tipoPropiedad} onChange={(e) => p("tipoPropiedad", e.target.value)}>
            <option value="">Selecciona…</option>
            {BR_PROPERTY_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label.es}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={brLabelClass}>Subtipo</label>
          <select className={`${brInputClass} mt-2`} value={inmueble.subtipo} onChange={(e) => p("subtipo", e.target.value)}>
            <option value="">Opcional</option>
            {BIENES_RAICES_SUBCATEGORIES.map((x) => (
              <option key={x.key} value={x.key}>
                {x.label.es}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className={brLabelClass}>Precio</label>
          <input className={`${brInputClass} mt-2`} inputMode="decimal" value={inmueble.precio} onChange={(e) => p("precio", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>Moneda</label>
          <select className={`${brInputClass} mt-2`} value={inmueble.moneda} onChange={(e) => p("moneda", e.target.value)}>
            <option value="MXN">MXN</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-[#111111]">
        <input type="checkbox" checked={inmueble.mostrarPrecio} onChange={(e) => p("mostrarPrecio", e.target.checked)} />
        Mostrar precio en la ficha pública
      </label>
      <div>
        <label className={brLabelClass}>Estatus</label>
        <input className={`${brInputClass} mt-2`} placeholder="Ej. Disponible" value={inmueble.estatus} onChange={(e) => p("estatus", e.target.value)} />
      </div>
    </BrSectionShell>
  );
}
