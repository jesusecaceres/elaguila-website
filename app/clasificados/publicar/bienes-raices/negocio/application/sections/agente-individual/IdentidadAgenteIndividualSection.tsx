"use client";

import type { BienesRaicesNegocioFormState } from "../../schema/bienesRaicesNegocioFormState";
import {
  BrField,
  BrPreviewHint,
  brInputClass,
  brCardClass,
  brSectionTitleClass,
  brSubTitleClass,
  brTextareaClass,
} from "../shared/brFormPrimitives";

function RedesGrid({
  redes,
  onChange,
}: {
  redes: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {redes.map((r, i) => (
        <input
          key={i}
          className={brInputClass}
          value={r}
          onChange={(e) => {
            const next = [...redes];
            next[i] = e.target.value;
            onChange(next);
          }}
          placeholder={i === 0 ? "Ej. instagram.com/tuusuario" : `Enlace o red ${i + 1}`}
        />
      ))}
    </div>
  );
}

export function IdentidadAgenteIndividualSection({
  state,
  setState,
}: {
  state: BienesRaicesNegocioFormState;
  setState: React.Dispatch<React.SetStateAction<BienesRaicesNegocioFormState>>;
}) {
  const ia = state.identityAgente;
  return (
    <section className={brCardClass}>
      <h2 className={brSectionTitleClass}>Identidad del negocio — Agente individual</h2>
      <p className={brSubTitleClass}>
        Este bloque alimenta la tarjeta profesional y el carril de contacto. Activa las opciones al final si quieres segundo
        agente o asesor de préstamos en pasos siguientes.
      </p>
      <BrPreviewHint>
        Esta tarjeta es el perfil profesional del preview (foto, nombre, brokerage, licencia y chips de redes según confianza).
      </BrPreviewHint>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <BrField label="Nombre del agente">
          <input
            className={brInputClass}
            value={ia.nombre}
            onChange={(e) => setState((s) => ({ ...s, identityAgente: { ...s.identityAgente, nombre: e.target.value } }))}
          />
        </BrField>
        <BrField label="Foto del agente (URL)" hint="Imagen cuadrada o retrato; se usa en la tarjeta.">
          <input
            className={brInputClass}
            value={ia.fotoUrl}
            onChange={(e) => setState((s) => ({ ...s, identityAgente: { ...s.identityAgente, fotoUrl: e.target.value } }))}
          />
        </BrField>
        <BrField label="Título / rol">
          <input
            className={brInputClass}
            value={ia.rol}
            onChange={(e) => setState((s) => ({ ...s, identityAgente: { ...s.identityAgente, rol: e.target.value } }))}
          />
        </BrField>
        <BrField label="Brokerage">
          <input
            className={brInputClass}
            value={ia.brokerage}
            onChange={(e) => setState((s) => ({ ...s, identityAgente: { ...s.identityAgente, brokerage: e.target.value } }))}
          />
        </BrField>
        <BrField label="Logo del brokerage (URL)" hint="Opcional.">
          <input
            className={brInputClass}
            value={ia.logoBrokerageUrl}
            onChange={(e) =>
              setState((s) => ({ ...s, identityAgente: { ...s.identityAgente, logoBrokerageUrl: e.target.value } }))
            }
          />
        </BrField>
        <BrField label="Licencia">
          <input
            className={brInputClass}
            value={ia.licencia}
            onChange={(e) => setState((s) => ({ ...s, identityAgente: { ...s.identityAgente, licencia: e.target.value } }))}
          />
        </BrField>
        <BrField label="Teléfono directo">
          <input
            className={brInputClass}
            value={ia.telDirecto}
            onChange={(e) => setState((s) => ({ ...s, identityAgente: { ...s.identityAgente, telDirecto: e.target.value } }))}
          />
        </BrField>
        <BrField label="Teléfono de oficina" hint="Opcional.">
          <input
            className={brInputClass}
            value={ia.telOficina}
            onChange={(e) => setState((s) => ({ ...s, identityAgente: { ...s.identityAgente, telOficina: e.target.value } }))}
          />
        </BrField>
        <BrField label="Correo">
          <input
            type="email"
            className={brInputClass}
            value={ia.email}
            onChange={(e) => setState((s) => ({ ...s, identityAgente: { ...s.identityAgente, email: e.target.value } }))}
          />
        </BrField>
        <BrField label="Sitio web">
          <input
            className={brInputClass}
            value={ia.sitioWeb}
            onChange={(e) => setState((s) => ({ ...s, identityAgente: { ...s.identityAgente, sitioWeb: e.target.value } }))}
          />
        </BrField>
        <BrField label="Idiomas" hint="Ej. Inglés, español.">
          <input
            className={brInputClass}
            value={ia.idiomas}
            onChange={(e) => setState((s) => ({ ...s, identityAgente: { ...s.identityAgente, idiomas: e.target.value } }))}
          />
        </BrField>
        <BrField label="Áreas de servicio">
          <input
            className={brInputClass}
            value={ia.areasServicio}
            onChange={(e) =>
              setState((s) => ({ ...s, identityAgente: { ...s.identityAgente, areasServicio: e.target.value } }))
            }
          />
        </BrField>
      </div>
      <div className="mt-5">
        <BrField label="Bio corta">
          <textarea
            className={brTextareaClass}
            value={ia.bio}
            onChange={(e) => setState((s) => ({ ...s, identityAgente: { ...s.identityAgente, bio: e.target.value } }))}
            placeholder="Dos o tres líneas sobre tu experiencia y enfoque."
          />
        </BrField>
      </div>
      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">Redes sociales (hasta 5)</p>
        <div className="mt-2">
          <RedesGrid
            redes={ia.redes}
            onChange={(next) => setState((s) => ({ ...s, identityAgente: { ...s.identityAgente, redes: next } }))}
          />
        </div>
      </div>
      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] p-4 sm:flex-row sm:flex-wrap">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#2C2416]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[#C9B46A] text-[#B8954A] focus:ring-[#C9B46A]"
            checked={ia.segundoAgenteActivo}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                identityAgente: { ...s.identityAgente, segundoAgenteActivo: e.target.checked },
              }))
            }
          />
          Agregar segundo agente
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#2C2416]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[#C9B46A] text-[#B8954A] focus:ring-[#C9B46A]"
            checked={state.asesorFinancieroActivo}
            onChange={(e) => setState((s) => ({ ...s, asesorFinancieroActivo: e.target.checked }))}
          />
          Agregar asesor de préstamos
        </label>
      </div>
    </section>
  );
}
