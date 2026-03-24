"use client";

import { BrSectionShell } from "../components/BrSectionShell";
import { brHintClass, brInputClass, brLabelClass } from "../helpers/brFieldStyles";
import type { NegocioFormApi } from "../types/negocioFormApi";

export function ContactoCTASection({ state, setState }: NegocioFormApi) {
  const { contacto } = state;

  return (
    <BrSectionShell title="Contacto y llamados a la acción" description="Define cómo quieres que te contacten los interesados.">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={brLabelClass}>CTA principal</label>
          <p className={brHintClass}>Ej. Agendar visita, pedir información, llamar ahora…</p>
          <input
            className={`${brInputClass} mt-2`}
            value={contacto.ctaPrincipal}
            onChange={(e) =>
              setState((s) => ({ ...s, contacto: { ...s.contacto, ctaPrincipal: e.target.value } }))
            }
          />
        </div>
        <div>
          <label className={brLabelClass}>CTA secundario</label>
          <input
            className={`${brInputClass} mt-2`}
            value={contacto.ctaSecundario}
            onChange={(e) =>
              setState((s) => ({ ...s, contacto: { ...s.contacto, ctaSecundario: e.target.value } }))
            }
          />
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-[#111111]">
        <input
          type="checkbox"
          checked={contacto.mostrarTelefono}
          onChange={(e) =>
            setState((s) => ({
              ...s,
              contacto: { ...s.contacto, mostrarTelefono: e.target.checked },
            }))
          }
        />
        Mostrar teléfono en la ficha
      </label>
      <label className="flex cursor-pointer items-center gap-2 text-sm text-[#111111]">
        <input
          type="checkbox"
          checked={contacto.permitirMensajes}
          onChange={(e) =>
            setState((s) => ({
              ...s,
              contacto: { ...s.contacto, permitirMensajes: e.target.checked },
            }))
          }
        />
        Permitir mensajes desde Leonix
      </label>
      <div>
        <label className={brLabelClass}>Permitir solicitud de visita</label>
        <input
          className={`${brInputClass} mt-2`}
          placeholder="Ej. Sí, con cita / solo fin de semana"
          value={contacto.permitirVisita}
          onChange={(e) =>
            setState((s) => ({ ...s, contacto: { ...s.contacto, permitirVisita: e.target.value } }))
          }
        />
      </div>
      <div>
        <label className={brLabelClass}>Tiempo estimado de respuesta</label>
        <input
          className={`${brInputClass} mt-2`}
          placeholder="Ej. Mismo día hábil"
          value={contacto.tiempoRespuesta}
          onChange={(e) =>
            setState((s) => ({ ...s, contacto: { ...s.contacto, tiempoRespuesta: e.target.value } }))
          }
        />
      </div>
      <div>
        <label className={brLabelClass}>Disponibilidad general</label>
        <textarea
          className={`${brInputClass} mt-2 min-h-[72px]`}
          value={contacto.disponibilidadGeneral}
          onChange={(e) =>
            setState((s) => ({ ...s, contacto: { ...s.contacto, disponibilidadGeneral: e.target.value } }))
          }
        />
      </div>
    </BrSectionShell>
  );
}
