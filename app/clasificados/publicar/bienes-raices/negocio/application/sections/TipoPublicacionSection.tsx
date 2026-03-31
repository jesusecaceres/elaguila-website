"use client";

import { BrSectionShell } from "../components/BrSectionShell";
import { brHintClass, brInputClass, brLabelClass } from "../helpers/brFieldStyles";
import type { NegocioFormApi } from "../types/negocioFormApi";

export function TipoPublicacionSection({ state, setState }: NegocioFormApi) {
  const { inmueble } = state;
  return (
    <BrSectionShell
      title="¿Cómo vas a publicar este inmueble?"
      description="En esta ruta publicas como negocio o profesional. Si vendes como particular, usa la ruta de vendedor particular."
    >
      <div>
        <label className={brLabelClass}>Operación</label>
        <p className={brHintClass}>Selecciona si es venta, renta u otro tipo de operación que ofrezcas.</p>
        <select
          className={`${brInputClass} mt-2`}
          value={inmueble.operacion}
          onChange={(e) =>
            setState((s) => ({ ...s, inmueble: { ...s.inmueble, operacion: e.target.value } }))
          }
        >
          <option value="">Selecciona…</option>
          <option value="venta">Venta</option>
          <option value="renta">Renta</option>
          <option value="venta-renta">Venta o renta</option>
          <option value="otro">Otro / proyecto</option>
        </select>
      </div>
      <div className="rounded-xl border border-[#A98C2A]/25 bg-white px-4 py-3 text-sm text-[#111111]/80">
        <span className="font-semibold text-[#111111]">Negocio o profesional</span>
        <p className="mt-1">
          Estás en el formulario para inmobiliarias, agentes, desarrolladores y equipos comerciales. Los datos del
          negocio y del agente principal van en secciones aparte.
        </p>
      </div>
    </BrSectionShell>
  );
}
