"use client";

import { BrSectionShell } from "../components/BrSectionShell";
import { brHintClass, brInputClass, brLabelClass } from "../helpers/brFieldStyles";
import type { PrivadoFormApi } from "../types/privadoFormApi";

export function DescripcionSection({ state, setState }: PrivadoFormApi) {
  const { inmueble } = state;

  return (
    <BrSectionShell
      title="Descripción"
      description="Describe lo mejor del inmueble sin repetir solo números. Aquí cuenta la experiencia de vivir o usar la propiedad."
    >
      <div>
        <label className={brLabelClass}>Descripción completa</label>
        <p className={brHintClass}>Menciona luz, vecindario, accesos y lo que te gusta del lugar.</p>
        <textarea
          className={`${brInputClass} mt-2 min-h-[140px]`}
          value={inmueble.descripcion}
          onChange={(e) =>
            setState((s) => ({ ...s, inmueble: { ...s.inmueble, descripcion: e.target.value } }))
          }
        />
      </div>
    </BrSectionShell>
  );
}
