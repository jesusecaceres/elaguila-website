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
          placeholder={`Red o enlace ${i + 1}`}
        />
      ))}
    </div>
  );
}

export function IdentidadConstructorSection({
  state,
  setState,
}: {
  state: BienesRaicesNegocioFormState;
  setState: React.Dispatch<React.SetStateAction<BienesRaicesNegocioFormState>>;
}) {
  const ic = state.identityConstructor;
  return (
    <section className={brCardClass}>
      <h2 className={brSectionTitleClass}>Identidad del negocio — Constructor / desarrollador</h2>
      <p className={brSubTitleClass}>
        Conecta marca, proyecto y centro de ventas con la vista previa premium. El plano de sitio opcional se activa en la
        galería.
      </p>
      <BrPreviewHint>
        El preview muestra desarrollador + proyecto en la tarjeta profesional y el estado del desarrollo en la línea de
        confianza.
      </BrPreviewHint>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <BrField label="Nombre del desarrollador">
          <input
            className={brInputClass}
            value={ic.nombreDesarrollador}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                identityConstructor: { ...s.identityConstructor, nombreDesarrollador: e.target.value },
              }))
            }
          />
        </BrField>
        <IdentityImageUrlRow
          label="Logo del desarrollador"
          value={ic.logoUrl}
          onChange={(url) =>
            setState((s) => ({ ...s, identityConstructor: { ...s.identityConstructor, logoUrl: url } }))
          }
        />
        <BrField label="Nombre del proyecto / comunidad">
          <input
            className={brInputClass}
            value={ic.proyectoNombre}
            onChange={(e) =>
              setState((s) => ({ ...s, identityConstructor: { ...s.identityConstructor, proyectoNombre: e.target.value } }))
            }
          />
        </BrField>
        <BrField label="Modelo">
          <input
            className={brInputClass}
            value={ic.modelo}
            onChange={(e) =>
              setState((s) => ({ ...s, identityConstructor: { ...s.identityConstructor, modelo: e.target.value } }))
            }
          />
        </BrField>
        <BrField label="Dirección del centro de ventas">
          <input
            className={brInputClass}
            value={ic.direccionVentas}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                identityConstructor: { ...s.identityConstructor, direccionVentas: e.target.value },
              }))
            }
          />
        </BrField>
        <BrField label="Teléfono">
          <input
            className={brInputClass}
            value={ic.tel}
            onChange={(e) =>
              setState((s) => ({ ...s, identityConstructor: { ...s.identityConstructor, tel: e.target.value } }))
            }
          />
        </BrField>
        <BrField label="Correo">
          <input
            type="email"
            className={brInputClass}
            value={ic.email}
            onChange={(e) =>
              setState((s) => ({ ...s, identityConstructor: { ...s.identityConstructor, email: e.target.value } }))
            }
          />
        </BrField>
        <BrField label="Sitio web">
          <input
            className={brInputClass}
            value={ic.sitioWeb}
            onChange={(e) =>
              setState((s) => ({ ...s, identityConstructor: { ...s.identityConstructor, sitioWeb: e.target.value } }))
            }
          />
        </BrField>
        <BrField label="Horario de ventas">
          <input
            className={brInputClass}
            value={ic.horarioVentas}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                identityConstructor: { ...s.identityConstructor, horarioVentas: e.target.value },
              }))
            }
          />
        </BrField>
        <BrField label="Estado del desarrollo" hint="Ej. En construcción, Entrega inmediata.">
          <input
            className={brInputClass}
            value={ic.estadoDesarrollo}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                identityConstructor: { ...s.identityConstructor, estadoDesarrollo: e.target.value },
              }))
            }
          />
        </BrField>
        <BrField label="Fecha estimada de entrega">
          <input
            className={brInputClass}
            value={ic.entregaEstimada}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                identityConstructor: { ...s.identityConstructor, entregaEstimada: e.target.value },
              }))
            }
          />
        </BrField>
        <BrField label="Contacto principal">
          <input
            className={brInputClass}
            value={ic.contactoPrincipal}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                identityConstructor: { ...s.identityConstructor, contactoPrincipal: e.target.value },
              }))
            }
          />
        </BrField>
        <BrField label="Contacto secundario" hint="Opcional.">
          <input
            className={brInputClass}
            value={ic.contactoSecundario}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                identityConstructor: { ...s.identityConstructor, contactoSecundario: e.target.value },
              }))
            }
          />
        </BrField>
      </div>
      <div className="mt-5">
        <BrField label="Descripción del proyecto">
          <textarea
            className={brTextareaClass}
            value={ic.descripcionProyecto}
            onChange={(e) =>
              setState((s) => ({
                ...s,
                identityConstructor: { ...s.identityConstructor, descripcionProyecto: e.target.value },
              }))
            }
          />
        </BrField>
      </div>
      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-wide text-[#5C5346]/90">Redes sociales</p>
        <div className="mt-2">
          <RedesGrid
            redes={ic.redes}
            onChange={(next) => setState((s) => ({ ...s, identityConstructor: { ...s.identityConstructor, redes: next } }))}
          />
        </div>
      </div>
      <div className="mt-6 space-y-2 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] p-4">
        <label className="flex max-w-lg cursor-pointer items-start gap-2 text-sm font-medium text-[#2C2416]">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 rounded border-[#C9B46A] text-[#B8954A] focus:ring-[#C9B46A]"
            checked={state.asesorFinancieroActivo}
            onChange={(e) => setState((s) => ({ ...s, asesorFinancieroActivo: e.target.checked }))}
          />
          <span>
            Incluir asesor de préstamos
            <span className="mt-0.5 block text-xs font-normal text-[#5C5346]">
              Captura los detalles en el <span className="font-semibold">paso 11 — Asesor de préstamos</span>.
            </span>
          </span>
        </label>
      </div>
    </section>
  );
}
