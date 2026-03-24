"use client";

import { BrSectionShell } from "../components/BrSectionShell";
import { brHintClass, brInputClass, brLabelClass } from "../helpers/brFieldStyles";
import type { PrivadoFormApi } from "../types/privadoFormApi";

export function UbicacionSection({ state, setState }: PrivadoFormApi) {
  const { inmueble } = state;
  const p = (k: keyof typeof inmueble, v: string | boolean) =>
    setState((s) => ({ ...s, inmueble: { ...s.inmueble, [k]: v } }));

  return (
    <BrSectionShell
      title="Ubicación"
      description="Agrega la dirección del inmueble. Si no quieres mostrarla completa al público, puedes ocultarla."
    >
      <div>
        <label className={brLabelClass}>Dirección</label>
        <textarea className={`${brInputClass} mt-2 min-h-[64px]`} value={inmueble.direccionCompleta} onChange={(e) => p("direccionCompleta", e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={brLabelClass}>Ciudad</label>
          <input className={`${brInputClass} mt-2`} value={inmueble.ciudad} onChange={(e) => p("ciudad", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>Estado</label>
          <input className={`${brInputClass} mt-2`} value={inmueble.estado} onChange={(e) => p("estado", e.target.value)} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={brLabelClass}>Código postal</label>
          <input className={`${brInputClass} mt-2`} value={inmueble.codigoPostal} onChange={(e) => p("codigoPostal", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>Colonia o zona</label>
          <p className={brHintClass}>Así ubicamos mejor la propiedad en el mapa.</p>
          <input className={`${brInputClass} mt-2`} value={inmueble.coloniaZona} onChange={(e) => p("coloniaZona", e.target.value)} />
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-[#111111]">
        <input type="checkbox" checked={inmueble.ocultarDireccionExacta} onChange={(e) => p("ocultarDireccionExacta", e.target.checked)} />
        Ocultar dirección exacta al público
      </label>
    </BrSectionShell>
  );
}
