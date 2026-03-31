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
          placeholder={`Red o enlace ${i + 1}`}
        />
      ))}
    </div>
  );
}

export function IdentidadEquipoSection({
  state,
  setState,
}: {
  state: BienesRaicesNegocioFormState;
  setState: React.Dispatch<React.SetStateAction<BienesRaicesNegocioFormState>>;
}) {
  const ie = state.identityEquipo;
  return (
    <section className={brCardClass}>
      <h2 className={brSectionTitleClass}>Identidad del negocio — Equipo de agentes</h2>
      <p className={brSubTitleClass}>
        La imagen o foto principal representa al equipo en la tarjeta. Los nombres del segundo agente se reflejan en el carril
        de contacto.
      </p>
      <BrPreviewHint>
        El preview muestra la marca del equipo en la tarjeta profesional y el segundo contacto junto al carril si completaste
        datos.
      </BrPreviewHint>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <BrField label="Nombre del equipo">
          <input
            className={brInputClass}
            value={ie.nombreEquipo}
            onChange={(e) =>
              setState((s) => ({ ...s, identityEquipo: { ...s.identityEquipo, nombreEquipo: e.target.value } }))
            }
          />
        </BrField>
        <BrField label="Foto principal o imagen del equipo (URL)">
          <input
            className={brInputClass}
            value={ie.imagenUrl}
            onChange={(e) => setState((s) => ({ ...s, identityEquipo: { ...s.identityEquipo, imagenUrl: e.target.value } }))}
          />
        </BrField>
        <BrField label="Brokerage">
          <input
            className={brInputClass}
            value={ie.brokerage}
            onChange={(e) => setState((s) => ({ ...s, identityEquipo: { ...s.identityEquipo, brokerage: e.target.value } }))}
          />
        </BrField>
        <BrField label="Logo (URL)">
          <input
            className={brInputClass}
            value={ie.logoUrl}
            onChange={(e) => setState((s) => ({ ...s, identityEquipo: { ...s.identityEquipo, logoUrl: e.target.value } }))}
          />
        </BrField>
        <BrField label="Teléfono general">
          <input
            className={brInputClass}
            value={ie.telGeneral}
            onChange={(e) =>
              setState((s) => ({ ...s, identityEquipo: { ...s.identityEquipo, telGeneral: e.target.value } }))
            }
          />
        </BrField>
        <BrField label="Correo">
          <input
            type="email"
            className={brInputClass}
            value={ie.email}
            onChange={(e) => setState((s) => ({ ...s, identityEquipo: { ...s.identityEquipo, email: e.target.value } }))}
          />
        </BrField>
        <BrField label="Sitio web">
          <input
            className={brInputClass}
            value={ie.sitioWeb}
            onChange={(e) => setState((s) => ({ ...s, identityEquipo: { ...s.identityEquipo, sitioWeb: e.target.value } }))}
          />
        </BrField>
        <BrField label="Áreas de servicio">
          <input
            className={brInputClass}
            value={ie.areasServicio}
            onChange={(e) =>
              setState((s) => ({ ...s, identityEquipo: { ...s.identityEquipo, areasServicio: e.target.value } }))
            }
          />
        </BrField>
      </div>
      <div className="mt-5">
        <BrField label="Bio del equipo">
          <textarea
            className={brTextareaClass}
            value={ie.bio}
            onChange={(e) => setState((s) => ({ ...s, identityEquipo: { ...s.identityEquipo, bio: e.target.value } }))}
          />
        </BrField>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <BrField label="Agente principal — nombre">
          <input
            className={brInputClass}
            value={ie.agentePrincipalNombre}
            onChange={(e) =>
              setState((s) => ({ ...s, identityEquipo: { ...s.identityEquipo, agentePrincipalNombre: e.target.value } }))
            }
          />
        </BrField>
        <BrField label="Agente principal — rol">
          <input
            className={brInputClass}
            value={ie.agentePrincipalRol}
            onChange={(e) =>
              setState((s) => ({ ...s, identityEquipo: { ...s.identityEquipo, agentePrincipalRol: e.target.value } }))
            }
          />
        </BrField>
        <BrField label="Segundo agente — nombre">
          <input
            className={brInputClass}
            value={ie.segundoAgenteNombre}
            onChange={(e) =>
              setState((s) => ({ ...s, identityEquipo: { ...s.identityEquipo, segundoAgenteNombre: e.target.value } }))
            }
          />
        </BrField>
        <BrField label="Segundo agente — rol">
          <input
            className={brInputClass}
            value={ie.segundoAgenteRol}
            onChange={(e) =>
              setState((s) => ({ ...s, identityEquipo: { ...s.identityEquipo, segundoAgenteRol: e.target.value } }))
            }
          />
        </BrField>
      </div>
      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">Redes sociales</p>
        <div className="mt-2">
          <RedesGrid
            redes={ie.redes}
            onChange={(next) => setState((s) => ({ ...s, identityEquipo: { ...s.identityEquipo, redes: next } }))}
          />
        </div>
      </div>
      <div className="mt-6 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] p-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-[#2C2416]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[#C9B46A] text-[#B8954A] focus:ring-[#C9B46A]"
            checked={state.asesorFinancieroActivo}
            onChange={(e) => setState((s) => ({ ...s, asesorFinancieroActivo: e.target.checked }))}
          />
          Incluir asesor de préstamos (paso siguiente)
        </label>
      </div>
    </section>
  );
}
