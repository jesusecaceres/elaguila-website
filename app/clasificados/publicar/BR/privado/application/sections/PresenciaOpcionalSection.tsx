"use client";

import { BrSectionShell } from "../components/BrSectionShell";
import { brHintClass, brInputClass, brLabelClass } from "../helpers/brFieldStyles";
import type { PrivadoFormApi } from "../types/privadoFormApi";

export function PresenciaOpcionalSection({ state, setState }: PrivadoFormApi) {
  const { presencia } = state;
  const p = (k: keyof typeof presencia, v: string) =>
    setState((s) => ({ ...s, presencia: { ...s.presencia, [k]: v } }));

  return (
    <BrSectionShell
      title="Presencia opcional"
      description="Si quieres, agrega un sitio o redes. Todo esto es opcional."
    >
      <div>
        <label className={brLabelClass}>Sitio web</label>
        <input className={`${brInputClass} mt-2`} value={presencia.website} onChange={(e) => p("website", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Facebook</label>
        <p className={brHintClass}>Pega la URL completa de tu perfil o página.</p>
        <input className={`${brInputClass} mt-2`} value={presencia.facebook} onChange={(e) => p("facebook", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Instagram</label>
        <input className={`${brInputClass} mt-2`} value={presencia.instagram} onChange={(e) => p("instagram", e.target.value)} />
      </div>
    </BrSectionShell>
  );
}
