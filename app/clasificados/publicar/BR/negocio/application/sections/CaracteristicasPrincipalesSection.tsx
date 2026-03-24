"use client";

import { BrSectionShell } from "../components/BrSectionShell";
import { brHintClass, brInputClass, brLabelClass } from "../helpers/brFieldStyles";
import type { NegocioFormApi } from "../types/negocioFormApi";

export function CaracteristicasPrincipalesSection({ state, setState }: NegocioFormApi) {
  const { inmueble } = state;
  const patch = (k: keyof typeof inmueble, v: string) =>
    setState((s) => ({ ...s, inmueble: { ...s.inmueble, [k]: v } }));

  return (
    <BrSectionShell
      title="Características principales"
      description="Incluye los datos principales para que el cliente entienda rápido el tamaño y tipo del inmueble. Si no tienes una medida exacta, usa la más cercana disponible."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={brLabelClass}>Recámaras</label>
          <input className={`${brInputClass} mt-2`} inputMode="numeric" value={inmueble.recamaras} onChange={(e) => patch("recamaras", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>Baños completos</label>
          <input className={`${brInputClass} mt-2`} inputMode="numeric" value={inmueble.banosCompletos} onChange={(e) => patch("banosCompletos", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>Medios baños</label>
          <input className={`${brInputClass} mt-2`} inputMode="numeric" value={inmueble.mediosBanos} onChange={(e) => patch("mediosBanos", e.target.value)} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={brLabelClass}>Construcción (pies²)</label>
          <input className={`${brInputClass} mt-2`} value={inmueble.piesConstruccion} onChange={(e) => patch("piesConstruccion", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>Terreno (pies²)</label>
          <input className={`${brInputClass} mt-2`} value={inmueble.piesTerreno} onChange={(e) => patch("piesTerreno", e.target.value)} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={brLabelClass}>Niveles</label>
          <input className={`${brInputClass} mt-2`} value={inmueble.niveles} onChange={(e) => patch("niveles", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>Estacionamientos</label>
          <input className={`${brInputClass} mt-2`} value={inmueble.estacionamientos} onChange={(e) => patch("estacionamientos", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>Año de construcción</label>
          <input className={`${brInputClass} mt-2`} value={inmueble.anioConstruccion} onChange={(e) => patch("anioConstruccion", e.target.value)} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={brLabelClass}>Estado de conservación</label>
          <input className={`${brInputClass} mt-2`} value={inmueble.estadoConservacion} onChange={(e) => patch("estadoConservacion", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>Estilo / diseño</label>
          <input className={`${brInputClass} mt-2`} value={inmueble.estiloDiseno} onChange={(e) => patch("estiloDiseno", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={brLabelClass}>Condición general</label>
        <p className={brHintClass}>Describe en una línea cómo se siente el inmueble al entrar.</p>
        <input className={`${brInputClass} mt-2`} value={inmueble.condicionGeneral} onChange={(e) => patch("condicionGeneral", e.target.value)} />
      </div>
    </BrSectionShell>
  );
}
