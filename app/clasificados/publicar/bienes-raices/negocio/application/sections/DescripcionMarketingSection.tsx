"use client";

import { BrSectionShell } from "../components/BrSectionShell";
import { brHintClass, brInputClass, brLabelClass } from "../helpers/brFieldStyles";
import type { NegocioFormApi } from "../types/negocioFormApi";

export function DescripcionMarketingSection({ state, setState }: NegocioFormApi) {
  const { inmueble } = state;
  const p = (k: keyof typeof inmueble, v: string) =>
    setState((s) => ({ ...s, inmueble: { ...s.inmueble, [k]: v } }));

  return (
    <BrSectionShell
      title="Descripción y marketing"
      description="Describe lo mejor de la propiedad de forma clara y convincente. Evita repetir solo medidas — aquí vende la experiencia de vivir o invertir en este inmueble."
    >
      <div>
        <label className={brLabelClass}>Resumen corto</label>
        <input className={`${brInputClass} mt-2`} value={inmueble.resumenCorto} onChange={(e) => p("resumenCorto", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Descripción completa</label>
        <textarea className={`${brInputClass} mt-2 min-h-[140px]`} value={inmueble.descripcionCompleta} onChange={(e) => p("descripcionCompleta", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Highlights</label>
        <p className={brHintClass}>Frases cortas, una por línea si quieres.</p>
        <textarea className={`${brInputClass} mt-2 min-h-[80px]`} value={inmueble.highlights} onChange={(e) => p("highlights", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Chips destacados</label>
        <input className={`${brInputClass} mt-2`} placeholder="Ej. Alberca, cocina integral, roof garden" value={inmueble.chipsDestacados} onChange={(e) => p("chipsDestacados", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Puntos fuertes de venta</label>
        <textarea className={`${brInputClass} mt-2 min-h-[72px]`} value={inmueble.puntosFuertes} onChange={(e) => p("puntosFuertes", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Frase principal de marketing</label>
        <input className={`${brInputClass} mt-2`} value={inmueble.fraseMarketing} onChange={(e) => p("fraseMarketing", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Amenidades clave</label>
        <textarea className={`${brInputClass} mt-2 min-h-[64px]`} value={inmueble.amenidadesClave} onChange={(e) => p("amenidadesClave", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Notas del vecindario</label>
        <p className={brHintClass}>Qué se siente vivir aquí: servicios, clima, comunidad…</p>
        <textarea className={`${brInputClass} mt-2 min-h-[72px]`} value={inmueble.notasVecindario} onChange={(e) => p("notasVecindario", e.target.value)} />
      </div>
    </BrSectionShell>
  );
}
