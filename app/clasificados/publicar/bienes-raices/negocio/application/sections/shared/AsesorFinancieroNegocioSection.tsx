"use client";

import type { BienesRaicesNegocioFormState } from "../../schema/bienesRaicesNegocioFormState";
import { BrField, brInputClass, brCardClass, brSectionTitleClass, brSubTitleClass, brTextareaClass } from "./brFormPrimitives";

export function AsesorFinancieroNegocioSection({
  state,
  setState,
}: {
  state: BienesRaicesNegocioFormState;
  setState: React.Dispatch<React.SetStateAction<BienesRaicesNegocioFormState>>;
}) {
  const a = state.asesorFinanciero;

  if (!state.asesorFinancieroActivo) {
    return (
      <section className={brCardClass}>
        <h2 className={brSectionTitleClass}>Asesor de préstamos / financiamiento</h2>
        <p className={brSubTitleClass}>
          Marca la casilla en el paso de identidad para mostrar este módulo opcional en la vista previa, o actívalo aquí.
        </p>
        <label className="mt-4 flex cursor-pointer items-center gap-2 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] p-4 text-sm font-medium text-[#2C2416]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[#C9B46A] text-[#B8954A] focus:ring-[#C9B46A]"
            checked={false}
            onChange={() => setState((s) => ({ ...s, asesorFinancieroActivo: true }))}
          />
          Incluir bloque de asesor de préstamos
        </label>
      </section>
    );
  }

  return (
    <section className={brCardClass}>
      <h2 className={brSectionTitleClass}>Asesor de préstamos / financiamiento</h2>
      <p className={brSubTitleClass}>
        Aparece como tarjeta de apoyo junto al contacto principal. Puedes desactivarlo si cambias de opinión.
      </p>
      <label className="mt-4 flex cursor-pointer items-center gap-2 text-sm font-medium text-[#2C2416]">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-[#C9B46A] text-[#B8954A] focus:ring-[#C9B46A]"
          checked={state.asesorFinancieroActivo}
          onChange={(e) => setState((s) => ({ ...s, asesorFinancieroActivo: e.target.checked }))}
        />
        Mostrar asesor en el anuncio
      </label>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <BrField label="Nombre">
          <input
            className={brInputClass}
            value={a.nombre}
            onChange={(e) => setState((s) => ({ ...s, asesorFinanciero: { ...s.asesorFinanciero, nombre: e.target.value } }))}
          />
        </BrField>
        <BrField label="Foto (URL)" hint="Opcional.">
          <input
            className={brInputClass}
            value={a.fotoUrl}
            onChange={(e) =>
              setState((s) => ({ ...s, asesorFinanciero: { ...s.asesorFinanciero, fotoUrl: e.target.value } }))
            }
          />
        </BrField>
        <BrField label="Rol / título">
          <input
            className={brInputClass}
            value={a.rol}
            onChange={(e) => setState((s) => ({ ...s, asesorFinanciero: { ...s.asesorFinanciero, rol: e.target.value } }))}
          />
        </BrField>
        <BrField label="Compañía">
          <input
            className={brInputClass}
            value={a.compania}
            onChange={(e) =>
              setState((s) => ({ ...s, asesorFinanciero: { ...s.asesorFinanciero, compania: e.target.value } }))
            }
          />
        </BrField>
        <BrField label="Teléfono">
          <input
            className={brInputClass}
            value={a.telefono}
            onChange={(e) =>
              setState((s) => ({ ...s, asesorFinanciero: { ...s.asesorFinanciero, telefono: e.target.value } }))
            }
          />
        </BrField>
        <BrField label="Correo" hint="Opcional.">
          <input
            type="email"
            className={brInputClass}
            value={a.email}
            onChange={(e) => setState((s) => ({ ...s, asesorFinanciero: { ...s.asesorFinanciero, email: e.target.value } }))}
          />
        </BrField>
        <BrField label="Sitio web" hint="Opcional.">
          <input
            className={brInputClass}
            value={a.sitioWeb}
            onChange={(e) =>
              setState((s) => ({ ...s, asesorFinanciero: { ...s.asesorFinanciero, sitioWeb: e.target.value } }))
            }
          />
        </BrField>
        <BrField label="NMLS / licencia" hint="Opcional.">
          <input
            className={brInputClass}
            value={a.nmls}
            onChange={(e) => setState((s) => ({ ...s, asesorFinanciero: { ...s.asesorFinanciero, nmls: e.target.value } }))}
          />
        </BrField>
      </div>
      <div className="mt-5">
        <BrField label="Texto corto de apoyo">
          <textarea
            className={brTextareaClass}
            value={a.textoApoyo}
            onChange={(e) =>
              setState((s) => ({ ...s, asesorFinanciero: { ...s.asesorFinanciero, textoApoyo: e.target.value } }))
            }
            placeholder="Ej. Preaprobación en 24 h, programas FHA/VA."
          />
        </BrField>
      </div>
    </section>
  );
}
