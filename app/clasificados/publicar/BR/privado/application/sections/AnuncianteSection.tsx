"use client";

import { BrSectionShell } from "../components/BrSectionShell";
import { brHintClass, brInputClass, brLabelClass } from "../helpers/brFieldStyles";
import type { PrivadoFormApi } from "../types/privadoFormApi";

export function AnuncianteSection({ state, setState }: PrivadoFormApi) {
  const { anunciante } = state;
  const p = (k: keyof typeof anunciante, v: string) =>
    setState((s) => ({ ...s, anunciante: { ...s.anunciante, [k]: v } }));

  return (
    <BrSectionShell
      title="Datos del anunciante"
      description="Quién publica el anuncio. Esto no es un onboarding de inmobiliaria — solo lo necesario para generar confianza."
    >
      <div>
        <label className={brLabelClass}>Nombre</label>
        <input className={`${brInputClass} mt-2`} value={anunciante.nombre} onChange={(e) => p("nombre", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Foto (URL, opcional)</label>
        <p className={brHintClass}>Si no la tienes, la puedes dejar vacía.</p>
        <input className={`${brInputClass} mt-2`} value={anunciante.fotoUrl} onChange={(e) => p("fotoUrl", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Relación con la propiedad</label>
        <select className={`${brInputClass} mt-2`} value={anunciante.relacion} onChange={(e) => p("relacion", e.target.value)}>
          <option value="">Selecciona…</option>
          <option value="dueño">Soy dueño(a)</option>
          <option value="familiar">Familiar o representante</option>
          <option value="administrador">Administrador(a) / encargado(a)</option>
        </select>
      </div>
      <div>
        <label className={brLabelClass}>Mensaje corto</label>
        <p className={brHintClass}>Una frase opcional para acompañar tu anuncio.</p>
        <textarea className={`${brInputClass} mt-2 min-h-[72px]`} value={anunciante.mensajeCorto} onChange={(e) => p("mensajeCorto", e.target.value)} />
      </div>
    </BrSectionShell>
  );
}
