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
import { IdentityImageUrlRow } from "../shared/IdentityImageUrlRow";

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
        <IdentityImageUrlRow
          label="Foto del agente"
          hint="Sube una imagen o pega un enlace; retrato o cuadrado luce bien en la tarjeta."
          value={ia.fotoUrl}
          onChange={(url) => setState((s) => ({ ...s, identityAgente: { ...s.identityAgente, fotoUrl: url } }))}
        />
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
        <IdentityImageUrlRow
          label="Logo del brokerage"
          hint="Opcional. Sube el archivo o usa URL."
          value={ia.logoBrokerageUrl}
          onChange={(url) =>
            setState((s) => ({ ...s, identityAgente: { ...s.identityAgente, logoBrokerageUrl: url } }))
          }
        />
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
      <div className="mt-6 space-y-3 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] p-4">
        <p className="text-xs leading-relaxed text-[#5C5346]">
          Las casillas de abajo solo activan pasos siguientes: los formularios detallados siguen en sus pasos para mantener el
          flujo ordenado.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <label className="flex max-w-md cursor-pointer items-start gap-2 text-sm font-medium text-[#2C2416]">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 rounded border-[#C9B46A] text-[#B8954A] focus:ring-[#C9B46A]"
              checked={ia.segundoAgenteActivo}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  identityAgente: { ...s.identityAgente, segundoAgenteActivo: e.target.checked },
                }))
              }
            />
            <span>
              Agregar segundo agente
              <span className="mt-0.5 block text-xs font-normal text-[#5C5346]">
                Si lo marcas, abrimos los campos en el <span className="font-semibold">paso 10 — Segundo agente</span> (siguiente
                sección del asistente).
              </span>
            </span>
          </label>
          <label className="flex max-w-md cursor-pointer items-start gap-2 text-sm font-medium text-[#2C2416]">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 rounded border-[#C9B46A] text-[#B8954A] focus:ring-[#C9B46A]"
              checked={state.asesorFinancieroActivo}
              onChange={(e) => setState((s) => ({ ...s, asesorFinancieroActivo: e.target.checked }))}
            />
            <span>
              Agregar asesor de préstamos
              <span className="mt-0.5 block text-xs font-normal text-[#5C5346]">
                Si lo marcas, los datos del asesor se capturan en el{" "}
                <span className="font-semibold">paso 11 — Asesor de préstamos</span>.
              </span>
            </span>
          </label>
        </div>
      </div>
    </section>
  );
}
