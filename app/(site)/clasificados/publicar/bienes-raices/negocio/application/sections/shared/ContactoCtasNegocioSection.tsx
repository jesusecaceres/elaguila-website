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
} from "./brFormPrimitives";

export function ContactoCtasNegocioSection({
  state,
  setState,
}: {
  state: BienesRaicesNegocioFormState;
  setState: React.Dispatch<React.SetStateAction<BienesRaicesNegocioFormState>>;
}) {
  const c = state.cta;
  return (
    <section className={brCardClass}>
      <h2 className={brSectionTitleClass}>Contacto y CTAs</h2>
      <p className={brSubTitleClass}>
        Controla qué botones aparecen en el carril de la vista previa: información, visita, llamada y WhatsApp.
      </p>
      <BrPreviewHint>
        Cada interruptor enciende o apaga el botón correspondiente en el carril de contacto del preview.
      </BrPreviewHint>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {(
          [
            ["permitirSolicitarInfo", "Permitir solicitar información"],
            ["permitirProgramarVisita", "Permitir programar visita"],
            ["permitirLlamar", "Permitir llamar"],
            ["permitirWhatsapp", "Permitir WhatsApp"],
          ] as const
        ).map(([key, label]) => (
          <label
            key={key}
            className="flex cursor-pointer items-center gap-2 rounded-xl border border-[#E8DFD0] bg-white px-3 py-2.5 text-sm font-medium text-[#2C2416]"
          >
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[#C9B46A] text-[#B8954A] focus:ring-[#C9B46A]"
              checked={c[key]}
              onChange={(e) =>
                setState((s) => ({
                  ...s,
                  cta: { ...s.cta, [key]: e.target.checked },
                }))
              }
            />
            {label}
          </label>
        ))}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <BrField label="Mensaje prellenado del formulario" hint="Texto sugerido cuando alguien escribe desde el anuncio.">
          <textarea
            className={brTextareaClass}
            value={c.mensajePrellenado}
            onChange={(e) =>
              setState((s) => ({ ...s, cta: { ...s.cta, mensajePrellenado: e.target.value } }))
            }
          />
        </BrField>
        <BrField label="Instrucciones de contacto" hint="Opcional. Ej. “Respondo en menos de 2 horas”.">
          <textarea
            className={brTextareaClass}
            value={c.instruccionesContacto}
            onChange={(e) =>
              setState((s) => ({ ...s, cta: { ...s.cta, instruccionesContacto: e.target.value } }))
            }
          />
        </BrField>
        <BrField label="Horario preferido de contacto" hint="Opcional.">
          <input
            className={brInputClass}
            value={c.horarioPreferido}
            onChange={(e) =>
              setState((s) => ({ ...s, cta: { ...s.cta, horarioPreferido: e.target.value } }))
            }
          />
        </BrField>
      </div>
      <div className="mt-6 rounded-xl border border-[#E8DFD0] bg-[#FFFCF7] p-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm font-bold text-[#1E1810]">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-[#C9B46A] text-[#B8954A] focus:ring-[#C9B46A]"
            checked={c.openHouseActivo}
            onChange={(e) =>
              setState((s) => ({ ...s, cta: { ...s.cta, openHouseActivo: e.target.checked } }))
            }
          />
          Open house / visita abierta
        </label>
        {c.openHouseActivo ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <BrField label="Fecha">
              <input
                type="date"
                className={brInputClass}
                value={c.openHouseFecha}
                onChange={(e) =>
                  setState((s) => ({ ...s, cta: { ...s.cta, openHouseFecha: e.target.value } }))
                }
              />
            </BrField>
            <BrField label="Hora inicio">
              <input
                type="time"
                className={brInputClass}
                value={c.openHouseInicio}
                onChange={(e) =>
                  setState((s) => ({ ...s, cta: { ...s.cta, openHouseInicio: e.target.value } }))
                }
              />
            </BrField>
            <BrField label="Hora fin">
              <input
                type="time"
                className={brInputClass}
                value={c.openHouseFin}
                onChange={(e) =>
                  setState((s) => ({ ...s, cta: { ...s.cta, openHouseFin: e.target.value } }))
                }
              />
            </BrField>
            <div className="sm:col-span-2">
              <BrField label="Notas">
                <input
                  className={brInputClass}
                  value={c.openHouseNotas}
                  onChange={(e) =>
                    setState((s) => ({ ...s, cta: { ...s.cta, openHouseNotas: e.target.value } }))
                  }
                />
              </BrField>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
