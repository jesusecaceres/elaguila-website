"use client";

import { BrSectionShell } from "../components/BrSectionShell";
import { brHintClass, brInputClass, brLabelClass } from "../helpers/brFieldStyles";
import type { NegocioFormApi } from "../types/negocioFormApi";

export function InteriorSection({ state, setState }: NegocioFormApi) {
  const { inmueble } = state;
  const p = (k: keyof typeof inmueble, v: string) =>
    setState((s) => ({ ...s, inmueble: { ...s.inmueble, [k]: v } }));

  const fields: Array<{ key: keyof typeof inmueble; label: string; hint?: string }> = [
    { key: "cocina", label: "Cocina" },
    { key: "comedor", label: "Comedor" },
    { key: "sala", label: "Sala" },
    { key: "cuartoLavado", label: "Cuarto de lavado" },
    { key: "closets", label: "Closets / vestidores" },
    { key: "aireAcondicionado", label: "Aire acondicionado" },
    { key: "calefaccion", label: "Calefacción" },
    { key: "chimenea", label: "Chimenea" },
    { key: "electrodomesticos", label: "Electrodomésticos incluidos" },
    { key: "pisos", label: "Pisos" },
  ];

  return (
    <BrSectionShell title="Interior" description="Detalla lo que hace especial el interior. Si no aplica, puedes dejarlo vacío.">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <div key={String(f.key)}>
            <label className={brLabelClass}>{f.label}</label>
            <input className={`${brInputClass} mt-2`} value={String(inmueble[f.key] ?? "")} onChange={(e) => p(f.key, e.target.value)} />
          </div>
        ))}
      </div>
      <div>
        <label className={brLabelClass}>Detalles de cocina</label>
        <textarea className={`${brInputClass} mt-2 min-h-[64px]`} value={inmueble.kitchenFeatures} onChange={(e) => p("kitchenFeatures", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Comedor</label>
        <textarea className={`${brInputClass} mt-2 min-h-[64px]`} value={inmueble.diningDetails} onChange={(e) => p("diningDetails", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Recámaras y espacios</label>
        <p className={brHintClass}>Distribución, tamaños aproximados, iluminación…</p>
        <textarea className={`${brInputClass} mt-2 min-h-[72px]`} value={inmueble.roomDetails} onChange={(e) => p("roomDetails", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Otros detalles de interior</label>
        <textarea className={`${brInputClass} mt-2 min-h-[64px]`} value={inmueble.interiorFeatures} onChange={(e) => p("interiorFeatures", e.target.value)} />
      </div>
    </BrSectionShell>
  );
}
