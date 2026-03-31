"use client";

import { BrSectionShell } from "../components/BrSectionShell";
import { brHintClass, brInputClass, brLabelClass } from "../helpers/brFieldStyles";
import type { NegocioFormApi } from "../types/negocioFormApi";

export function ExteriorSection({ state, setState }: NegocioFormApi) {
  const { inmueble } = state;
  const p = (k: keyof typeof inmueble, v: string) =>
    setState((s) => ({ ...s, inmueble: { ...s.inmueble, [k]: v } }));

  const quick: Array<{ key: keyof typeof inmueble; label: string }> = [
    { key: "patio", label: "Patio" },
    { key: "jardin", label: "Jardín" },
    { key: "terraza", label: "Terraza" },
    { key: "balcon", label: "Balcón" },
    { key: "alberca", label: "Alberca" },
    { key: "roofGarden", label: "Roof garden" },
    { key: "fachada", label: "Fachada" },
  ];

  return (
    <BrSectionShell title="Exterior y terreno" description="Ayuda al cliente a imaginar el exterior y el terreno.">
      <div className="grid gap-4 sm:grid-cols-2">
        {quick.map((f) => (
          <div key={String(f.key)}>
            <label className={brLabelClass}>{f.label}</label>
            <input className={`${brInputClass} mt-2`} value={String(inmueble[f.key] ?? "")} onChange={(e) => p(f.key, e.target.value)} />
          </div>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={brLabelClass}>Materiales de construcción</label>
          <input className={`${brInputClass} mt-2`} value={inmueble.materialesConstruccion} onChange={(e) => p("materialesConstruccion", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>Techo</label>
          <input className={`${brInputClass} mt-2`} value={inmueble.techo} onChange={(e) => p("techo", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={brLabelClass}>Lote / terreno</label>
        <p className={brHintClass}>Forma, topografía, frente, fondo…</p>
        <textarea className={`${brInputClass} mt-2 min-h-[72px]`} value={inmueble.loteDescripcion} onChange={(e) => p("loteDescripcion", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Estacionamiento / cochera</label>
        <textarea className={`${brInputClass} mt-2 min-h-[56px]`} value={inmueble.parkingDetails} onChange={(e) => p("parkingDetails", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Más sobre el terreno</label>
        <textarea className={`${brInputClass} mt-2 min-h-[56px]`} value={inmueble.lotDetails} onChange={(e) => p("lotDetails", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Exterior — otros</label>
        <textarea className={`${brInputClass} mt-2 min-h-[64px]`} value={inmueble.exteriorFeatures} onChange={(e) => p("exteriorFeatures", e.target.value)} />
      </div>
    </BrSectionShell>
  );
}
