"use client";

import { BrSectionShell } from "../components/BrSectionShell";
import { brHintClass, brInputClass, brLabelClass } from "../helpers/brFieldStyles";
import type { PrivadoFormApi } from "../types/privadoFormApi";

export function ContactoSection({ state, setState }: PrivadoFormApi) {
  const { anunciante } = state;

  return (
    <BrSectionShell title="Contacto" description="Cómo te pueden escribir o llamar los interesados.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={brLabelClass}>Teléfono</label>
          <input
            className={`${brInputClass} mt-2`}
            inputMode="tel"
            value={anunciante.telefono}
            onChange={(e) =>
              setState((s) => ({ ...s, anunciante: { ...s.anunciante, telefono: e.target.value } }))
            }
          />
        </div>
        <div>
          <label className={brLabelClass}>WhatsApp (opcional)</label>
          <input
            className={`${brInputClass} mt-2`}
            inputMode="tel"
            value={anunciante.whatsapp}
            onChange={(e) =>
              setState((s) => ({ ...s, anunciante: { ...s.anunciante, whatsapp: e.target.value } }))
            }
          />
        </div>
      </div>
      <div>
        <label className={brLabelClass}>Correo</label>
        <input
          className={`${brInputClass} mt-2`}
          type="email"
          value={anunciante.email}
          onChange={(e) =>
            setState((s) => ({ ...s, anunciante: { ...s.anunciante, email: e.target.value } }))
          }
        />
      </div>
      <div>
        <label className={brLabelClass}>Método preferido</label>
        <select
          className={`${brInputClass} mt-2`}
          value={anunciante.metodoPreferido}
          onChange={(e) =>
            setState((s) => ({
              ...s,
              anunciante: {
                ...s.anunciante,
                metodoPreferido: e.target.value as typeof anunciante.metodoPreferido,
              },
            }))
          }
        >
          <option value="telefono">Teléfono</option>
          <option value="whatsapp">WhatsApp</option>
          <option value="correo">Correo</option>
          <option value="ambos">Varios / me da igual</option>
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={brLabelClass}>Horarios para responder</label>
          <p className={brHintClass}>Ej. tardes entre semana, fines de semana…</p>
          <input
            className={`${brInputClass} mt-2`}
            value={anunciante.horarios}
            onChange={(e) =>
              setState((s) => ({ ...s, anunciante: { ...s.anunciante, horarios: e.target.value } }))
            }
          />
        </div>
        <div>
          <label className={brLabelClass}>Idiomas</label>
          <input
            className={`${brInputClass} mt-2`}
            placeholder="Ej. español, inglés"
            value={anunciante.idiomas}
            onChange={(e) =>
              setState((s) => ({ ...s, anunciante: { ...s.anunciante, idiomas: e.target.value } }))
            }
          />
        </div>
      </div>
    </BrSectionShell>
  );
}
