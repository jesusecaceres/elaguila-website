"use client";

import { BrSectionShell } from "../components/BrSectionShell";
import { brHintClass, brInputClass, brLabelClass } from "../helpers/brFieldStyles";
import type { NegocioFormApi } from "../types/negocioFormApi";

export function EquipoAdicionalSection({ state, setState }: NegocioFormApi) {
  const { equipo } = state;
  const p = (k: keyof typeof equipo, v: string) =>
    setState((s) => ({ ...s, equipo: { ...s.equipo, [k]: v } }));

  return (
    <BrSectionShell
      title="Equipo adicional"
      description="Opcional: más contactos del equipo. No construimos aquí el carril de ‘más anuncios’, solo dejamos los datos listos."
    >
      <div>
        <label className={brLabelClass}>Co-agente</label>
        <input className={`${brInputClass} mt-2`} value={equipo.coAgente} onChange={(e) => p("coAgente", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Broker responsable</label>
        <input className={`${brInputClass} mt-2`} value={equipo.brokerResponsable} onChange={(e) => p("brokerResponsable", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Contacto de oficina</label>
        <input className={`${brInputClass} mt-2`} value={equipo.contactoOficina} onChange={(e) => p("contactoOficina", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Contacto secundario</label>
        <input className={`${brInputClass} mt-2`} value={equipo.contactoSecundario} onChange={(e) => p("contactoSecundario", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Contacto de préstamos / financiamiento</label>
        <input className={`${brInputClass} mt-2`} value={equipo.contactoFinanciamiento} onChange={(e) => p("contactoFinanciamiento", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Más miembros del equipo</label>
        <p className={brHintClass}>Nombres y roles breves, uno por línea si quieres.</p>
        <textarea className={`${brInputClass} mt-2 min-h-[88px]`} value={equipo.masMiembros} onChange={(e) => p("masMiembros", e.target.value)} />
      </div>
    </BrSectionShell>
  );
}
