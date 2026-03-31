"use client";

import type { BienesRaicesNegocioFormState } from "../../schema/bienesRaicesNegocioFormState";
import { BrField, brCardClass, brSectionTitleClass, brSubTitleClass, brTextareaClass } from "./brFormPrimitives";

export function DescripcionCompletaNegocioSection({
  state,
  setState,
}: {
  state: BienesRaicesNegocioFormState;
  setState: React.Dispatch<React.SetStateAction<BienesRaicesNegocioFormState>>;
}) {
  return (
    <section className={brCardClass}>
      <h2 className={brSectionTitleClass}>Descripción completa</h2>
      <p className={brSubTitleClass}>
        Este texto alimenta el cuerpo principal del anuncio en la vista previa. Sé concreto: ubicación, distribución, mejoras,
        amenidades y estilo de vida.
      </p>
      <div className="mt-5">
        <BrField
          label="Descripción"
          hint="Sugerencias: qué hace especial el vecindario, luz natural, remodelaciones recientes, escuelas cercanas, accesos."
        >
          <textarea
            className={brTextareaClass}
            value={state.descripcionLarga}
            onChange={(e) => setState((s) => ({ ...s, descripcionLarga: e.target.value }))}
            placeholder="Describe el inmueble con el tono profesional que quieres mostrar a compradores o inquilinos."
          />
        </BrField>
      </div>
    </section>
  );
}
