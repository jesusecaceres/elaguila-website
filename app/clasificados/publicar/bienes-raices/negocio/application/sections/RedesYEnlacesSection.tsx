"use client";

import { BrSectionShell } from "../components/BrSectionShell";
import { brHintClass, brInputClass, brLabelClass } from "../helpers/brFieldStyles";
import type { NegocioFormApi } from "../types/negocioFormApi";

export function RedesYEnlacesSection({ state, setState }: NegocioFormApi) {
  const { redes } = state;
  const p = (k: keyof typeof redes, v: string) =>
    setState((s) => ({ ...s, redes: { ...s.redes, [k]: v } }));

  return (
    <BrSectionShell
      title="Redes y enlaces"
      description="Pega la URL completa de tu red social o sitio web. Solo agrega enlaces que sí quieras mostrar al público."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={brLabelClass}>Facebook</label>
          <input className={`${brInputClass} mt-2`} value={redes.facebook} onChange={(e) => p("facebook", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>Instagram</label>
          <input className={`${brInputClass} mt-2`} value={redes.instagram} onChange={(e) => p("instagram", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>LinkedIn</label>
          <input className={`${brInputClass} mt-2`} value={redes.linkedin} onChange={(e) => p("linkedin", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>YouTube</label>
          <input className={`${brInputClass} mt-2`} value={redes.youtube} onChange={(e) => p("youtube", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>TikTok</label>
          <input className={`${brInputClass} mt-2`} value={redes.tiktok} onChange={(e) => p("tiktok", e.target.value)} />
        </div>
        <div>
          <label className={brLabelClass}>WhatsApp (enlace)</label>
          <input className={`${brInputClass} mt-2`} value={redes.whatsappLink} onChange={(e) => p("whatsappLink", e.target.value)} />
        </div>
      </div>
      <div>
        <label className={brLabelClass}>URL para agendar cita</label>
        <input className={`${brInputClass} mt-2`} value={redes.urlAgendarCita} onChange={(e) => p("urlAgendarCita", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>URL de perfil profesional</label>
        <input className={`${brInputClass} mt-2`} value={redes.urlPerfilProfesional} onChange={(e) => p("urlPerfilProfesional", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Sitio web principal (negocio)</label>
        <input className={`${brInputClass} mt-2`} value={redes.websitePrincipal} onChange={(e) => p("websitePrincipal", e.target.value)} />
      </div>
      <div>
        <label className={brLabelClass}>Enlaces adicionales</label>
        <p className={brHintClass}>Un enlace por línea si necesitas varios.</p>
        <textarea className={`${brInputClass} mt-2 min-h-[72px]`} value={redes.enlacesCustom} onChange={(e) => p("enlacesCustom", e.target.value)} />
      </div>
    </BrSectionShell>
  );
}
