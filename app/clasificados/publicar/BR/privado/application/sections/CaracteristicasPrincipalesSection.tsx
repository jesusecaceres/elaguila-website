"use client";

import { BrSectionShell } from "../components/BrSectionShell";
import { brHintClass, brInputClass, brLabelClass } from "../helpers/brFieldStyles";
import type { PrivadoFormApi } from "../types/privadoFormApi";

export function CaracteristicasPrincipalesSection({ state, setState }: PrivadoFormApi) {
  const { inmueble } = state;
  const p = (k: keyof typeof inmueble, v: string) =>
    setState((s) => ({ ...s, inmueble: { ...s.inmueble, [k]: v } }));

  return (
    <BrSectionShell
      title="Características y áreas"
      description="Incluye lo más importante. Si no tienes una medida exacta, usa la más cercana disponible."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={brLabelClass}>Recámaras</label>
          <input className={`${brInputClass} mt-2`} inputMode="numeric" value={inmueble.recamaras} onChange={(e) => p("recamaras", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>Baños completos</label>
          <input className={`${brInputClass} mt-2`} inputMode="numeric" value={inmueble.banosCompletos} onChange={(e) => p("banosCompletos", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>Estacionamientos</label>
          <input className={`${brInputClass} mt-2`} value={inmueble.estacionamientos} onChange={(e) => p("estacionamientos", e.target.value)} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={brLabelClass}>Construcción (pies²)</label>
          <input className={`${brInputClass} mt-2`} value={inmueble.piesConstruccion} onChange={(e) => p("piesConstruccion", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>Terreno (pies²)</label>
          <input className={`${brInputClass} mt-2`} value={inmueble.piesTerreno} onChange={(e) => p("piesTerreno", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={brLabelClass}>Interior — notas</label>
        <p className={brHintClass}>Cocina, closets, pisos… lo que quieras destacar.</p>
        <textarea className={`${brInputClass} mt-2 min-h-[64px]`} value={inmueble.resumenInterior} onChange={(e) => p("resumenInterior", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Exterior — notas</label>
        <textarea className={`${brInputClass} mt-2 min-h-[64px]`} value={inmueble.resumenExterior} onChange={(e) => p("resumenExterior", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Servicios y comunidad</label>
        <textarea className={`${brInputClass} mt-2 min-h-[64px]`} value={inmueble.resumenServicios} onChange={(e) => p("resumenServicios", e.target.value)} />
      </div>
    </BrSectionShell>
  );
}
