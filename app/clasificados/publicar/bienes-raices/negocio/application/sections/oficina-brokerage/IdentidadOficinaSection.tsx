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

export function IdentidadOficinaSection({
  state,
  setState,
}: {
  state: BienesRaicesNegocioFormState;
  setState: React.Dispatch<React.SetStateAction<BienesRaicesNegocioFormState>>;
}) {
  const io = state.identityOficina;
  return (
    <section className={brCardClass}>
      <h2 className={brSectionTitleClass}>Identidad del negocio — Oficina / brokerage</h2>
      <p className={brSubTitleClass}>
        El logo y nombre de oficina anclan la tarjeta profesional. Los contactos aparecen en el carril de acciones.
      </p>
      <BrPreviewHint>
        En el preview, la oficina lidera la tarjeta lateral; el contacto principal refuerza confianza junto a las CTAs.
      </BrPreviewHint>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <BrField label="Nombre de la oficina">
          <input
            className={brInputClass}
            value={io.nombreOficina}
            onChange={(e) =>
              setState((s) => ({ ...s, identityOficina: { ...s.identityOficina, nombreOficina: e.target.value } }))
            }
          />
        </BrField>
        <BrField label="Logo (URL)">
          <input
            className={brInputClass}
            value={io.logoUrl}
            onChange={(e) => setState((s) => ({ ...s, identityOficina: { ...s.identityOficina, logoUrl: e.target.value } }))}
          />
        </BrField>
        <BrField label="Teléfono principal">
          <input
            className={brInputClass}
            value={io.telPrincipal}
            onChange={(e) =>
              setState((s) => ({ ...s, identityOficina: { ...s.identityOficina, telPrincipal: e.target.value } }))
            }
          />
        </BrField>
        <BrField label="Correo">
          <input
            type="email"
            className={brInputClass}
            value={io.email}
            onChange={(e) => setState((s) => ({ ...s, identityOficina: { ...s.identityOficina, email: e.target.value } }))}
          />
        </BrField>
        <BrField label="Sitio web">
          <input
            className={brInputClass}
            value={io.sitioWeb}
            onChange={(e) => setState((s) => ({ ...s, identityOficina: { ...s.identityOficina, sitioWeb: e.target.value } }))}
          />
        </BrField>
        <BrField label="Horario">
          <input
            className={brInputClass}
            value={io.horario}
            onChange={(e) => setState((s) => ({ ...s, identityOficina: { ...s.identityOficina, horario: e.target.value } }))}
          />
        </BrField>
        <BrField label="Dirección de oficina" hint="Calle, ciudad; se puede resumir en la vista previa.">
          <input
            className={brInputClass}
            value={io.direccionOficina}
            onChange={(e) =>
              setState((s) => ({ ...s, identityOficina: { ...s.identityOficina, direccionOficina: e.target.value } }))
            }
          />
        </BrField>
        <BrField label="Áreas de servicio">
          <input
            className={brInputClass}
            value={io.areasServicio}
            onChange={(e) =>
              setState((s) => ({ ...s, identityOficina: { ...s.identityOficina, areasServicio: e.target.value } }))
            }
          />
        </BrField>
        <BrField label="Contacto principal" hint="Nombre visible en la tarjeta.">
          <input
            className={brInputClass}
            value={io.contactoPrincipal}
            onChange={(e) =>
              setState((s) => ({ ...s, identityOficina: { ...s.identityOficina, contactoPrincipal: e.target.value } }))
            }
          />
        </BrField>
        <BrField label="Contacto secundario" hint="Opcional.">
          <input
            className={brInputClass}
            value={io.contactoSecundario}
            onChange={(e) =>
              setState((s) => ({ ...s, identityOficina: { ...s.identityOficina, contactoSecundario: e.target.value } }))
            }
          />
        </BrField>
      </div>
      <div className="mt-5">
        <BrField label="Bio corta de la oficina">
          <textarea
            className={brTextareaClass}
            value={io.bio}
            onChange={(e) => setState((s) => ({ ...s, identityOficina: { ...s.identityOficina, bio: e.target.value } }))}
          />
        </BrField>
      </div>
      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">Redes sociales</p>
        <div className="mt-2">
          <RedesGrid
            redes={io.redes}
            onChange={(next) => setState((s) => ({ ...s, identityOficina: { ...s.identityOficina, redes: next } }))}
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
          Incluir asesor de préstamos
        </label>
      </div>
    </section>
  );
}
