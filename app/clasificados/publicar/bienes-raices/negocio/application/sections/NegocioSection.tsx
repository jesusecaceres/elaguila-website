"use client";

import { BrSectionShell } from "../components/BrSectionShell";
import { brHintClass, brInputClass, brLabelClass } from "../helpers/brFieldStyles";
import type { NegocioFormApi } from "../types/negocioFormApi";

export function NegocioSection({ state, setState }: NegocioFormApi) {
  const { negocio } = state;
  const p = (k: keyof typeof negocio, v: string) =>
    setState((s) => ({ ...s, negocio: { ...s.negocio, [k]: v } }));

  return (
    <BrSectionShell
      title="Negocio / inmobiliaria"
      description="Escribe el nombre comercial tal como quieres que se vea en la ficha del anuncio. Este dato ayuda a generar más confianza."
    >
      <div>
        <label className={brLabelClass}>Nombre comercial</label>
        <input className={`${brInputClass} mt-2`} value={negocio.nombreComercial} onChange={(e) => p("nombreComercial", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Nombre legal (opcional)</label>
        <input className={`${brInputClass} mt-2`} value={negocio.nombreLegal} onChange={(e) => p("nombreLegal", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Logo del negocio (URL)</label>
        <p className={brHintClass}>Sube el logo en buena calidad para reforzar la confianza del negocio.</p>
        <input className={`${brInputClass} mt-2`} value={negocio.logoUrl} onChange={(e) => p("logoUrl", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Nombre del brokerage / marca madre</label>
        <input className={`${brInputClass} mt-2`} value={negocio.brokerageName} onChange={(e) => p("brokerageName", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Sitio web</label>
        <input className={`${brInputClass} mt-2`} value={negocio.website} onChange={(e) => p("website", e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={brLabelClass}>Teléfono de oficina</label>
          <input className={`${brInputClass} mt-2`} inputMode="tel" value={negocio.telOficina} onChange={(e) => p("telOficina", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>Correo de oficina</label>
          <input className={`${brInputClass} mt-2`} type="email" value={negocio.emailOficina} onChange={(e) => p("emailOficina", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={brLabelClass}>Dirección de oficina</label>
        <textarea className={`${brInputClass} mt-2 min-h-[64px]`} value={negocio.direccionOficina} onChange={(e) => p("direccionOficina", e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={brLabelClass}>Licencia del negocio / brokerage</label>
          <input className={`${brInputClass} mt-2`} value={negocio.licenciaBrokerage} onChange={(e) => p("licenciaBrokerage", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>Años de experiencia</label>
          <input className={`${brInputClass} mt-2`} value={negocio.aniosExperiencia} onChange={(e) => p("aniosExperiencia", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={brLabelClass}>Descripción del negocio</label>
        <textarea className={`${brInputClass} mt-2 min-h-[96px]`} value={negocio.descripcionNegocio} onChange={(e) => p("descripcionNegocio", e.target.value)} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={brLabelClass}>Horarios de atención</label>
          <input className={`${brInputClass} mt-2`} value={negocio.horariosAtencion} onChange={(e) => p("horariosAtencion", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>Idiomas</label>
          <input className={`${brInputClass} mt-2`} placeholder="Ej. Español, inglés" value={negocio.idiomas} onChange={(e) => p("idiomas", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={brLabelClass}>Cobertura / área de servicio</label>
        <input className={`${brInputClass} mt-2`} value={negocio.coberturaArea} onChange={(e) => p("coberturaArea", e.target.value)} />
      </div>
    </BrSectionShell>
  );
}
