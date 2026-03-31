"use client";

import type { BienesRaicesNegocioFormState } from "../../schema/bienesRaicesNegocioFormState";
import { BrField, brInputClass, brCardClass, brSectionTitleClass, brSubTitleClass, brTextareaClass } from "./brFormPrimitives";

export function SegundoAgenteNegocioSection({
  state,
  setState,
}: {
  state: BienesRaicesNegocioFormState;
  setState: React.Dispatch<React.SetStateAction<BienesRaicesNegocioFormState>>;
}) {
  const adv = state.advertiserType;
  const sg = state.segundoAgente;

  if (adv === "equipo_agentes") {
    return (
      <section className={brCardClass}>
        <h2 className={brSectionTitleClass}>Segundo agente</h2>
        <p className={brSubTitleClass}>
          Para equipos, el segundo agente se captura en el paso de identidad (nombre y rol). Si necesitas ajustar algo,
          regresa un paso.
        </p>
      </section>
    );
  }

  if (adv !== "agente_individual" || !state.identityAgente.segundoAgenteActivo) {
    return (
      <section className={brCardClass}>
        <h2 className={brSectionTitleClass}>Segundo agente</h2>
        <p className={brSubTitleClass}>
          Activa “Agregar segundo agente” en el paso de identidad (agente individual) para mostrar este bloque en la vista
          previa.
        </p>
      </section>
    );
  }

  return (
    <section className={brCardClass}>
      <h2 className={brSectionTitleClass}>Segundo agente</h2>
      <p className={brSubTitleClass}>Estos datos alimentan la segunda tarjeta en el carril de contacto de la vista previa.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <BrField label="Nombre">
          <input
            className={brInputClass}
            value={sg.nombre}
            onChange={(e) => setState((s) => ({ ...s, segundoAgente: { ...s.segundoAgente, nombre: e.target.value } }))}
          />
        </BrField>
        <BrField label="Foto (URL)" hint="Opcional.">
          <input
            className={brInputClass}
            value={sg.fotoUrl}
            onChange={(e) => setState((s) => ({ ...s, segundoAgente: { ...s.segundoAgente, fotoUrl: e.target.value } }))}
          />
        </BrField>
        <BrField label="Rol">
          <input
            className={brInputClass}
            value={sg.rol}
            onChange={(e) => setState((s) => ({ ...s, segundoAgente: { ...s.segundoAgente, rol: e.target.value } }))}
          />
        </BrField>
        <BrField label="Teléfono">
          <input
            className={brInputClass}
            value={sg.telefono}
            onChange={(e) => setState((s) => ({ ...s, segundoAgente: { ...s.segundoAgente, telefono: e.target.value } }))}
          />
        </BrField>
        <BrField label="Correo" hint="Opcional.">
          <input
            type="email"
            className={brInputClass}
            value={sg.email}
            onChange={(e) => setState((s) => ({ ...s, segundoAgente: { ...s.segundoAgente, email: e.target.value } }))}
          />
        </BrField>
      </div>
      <div className="mt-5">
        <BrField label="Bio corta" hint="Opcional.">
          <textarea
            className={brTextareaClass}
            value={sg.bio}
            onChange={(e) => setState((s) => ({ ...s, segundoAgente: { ...s.segundoAgente, bio: e.target.value } }))}
          />
        </BrField>
      </div>
    </section>
  );
}
