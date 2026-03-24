"use client";

import { BrSectionShell } from "../components/BrSectionShell";
import { brHintClass, brInputClass, brLabelClass } from "../helpers/brFieldStyles";
import type { NegocioFormApi } from "../types/negocioFormApi";

export function AgentePrincipalSection({ state, setState }: NegocioFormApi) {
  const { agente } = state;
  const p = (k: keyof typeof agente, v: string) =>
    setState((s) => ({ ...s, agente: { ...s.agente, [k]: v } }));

  return (
    <BrSectionShell
      title="Agente principal"
      description="Agrega la información del agente principal que atenderá al cliente. Puedes incluir WhatsApp si quieres facilitar el primer contacto."
    >
      <div>
        <label className={brLabelClass}>Foto del agente (URL)</label>
        <input className={`${brInputClass} mt-2`} value={agente.fotoUrl} onChange={(e) => p("fotoUrl", e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={brLabelClass}>Nombre completo</label>
          <input className={`${brInputClass} mt-2`} value={agente.nombreCompleto} onChange={(e) => p("nombreCompleto", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>Cargo / rol</label>
          <input className={`${brInputClass} mt-2`} value={agente.cargo} onChange={(e) => p("cargo", e.target.value)} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={brLabelClass}>Teléfono directo</label>
          <input className={`${brInputClass} mt-2`} inputMode="tel" value={agente.telDirecto} onChange={(e) => p("telDirecto", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>WhatsApp</label>
          <input className={`${brInputClass} mt-2`} inputMode="tel" value={agente.whatsapp} onChange={(e) => p("whatsapp", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={brLabelClass}>Correo</label>
        <input className={`${brInputClass} mt-2`} type="email" value={agente.email} onChange={(e) => p("email", e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={brLabelClass}>Licencia individual</label>
          <input className={`${brInputClass} mt-2`} value={agente.licenciaIndividual} onChange={(e) => p("licenciaIndividual", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>Idiomas</label>
          <input className={`${brInputClass} mt-2`} value={agente.idiomas} onChange={(e) => p("idiomas", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={brLabelClass}>Horarios</label>
        <input className={`${brInputClass} mt-2`} value={agente.horarios} onChange={(e) => p("horarios", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>URL de perfil</label>
        <input className={`${brInputClass} mt-2`} value={agente.perfilUrl} onChange={(e) => p("perfilUrl", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Frase de presentación</label>
        <textarea className={`${brInputClass} mt-2 min-h-[80px]`} value={agente.frasePresentacion} onChange={(e) => p("frasePresentacion", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Disponibilidad / tiempos de respuesta</label>
        <p className={brHintClass}>Ej. Respondo el mismo día, citas con cita previa…</p>
        <input className={`${brInputClass} mt-2`} value={agente.disponibilidad} onChange={(e) => p("disponibilidad", e.target.value)} />
      </div>
    </BrSectionShell>
  );
}
