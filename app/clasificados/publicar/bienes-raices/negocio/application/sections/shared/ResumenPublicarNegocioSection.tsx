"use client";

import type { BienesRaicesNegocioFormState, BienesRaicesAdvertiserType } from "../../schema/bienesRaicesNegocioFormState";
import { brCardClass, brSectionTitleClass, brSubTitleClass } from "./brFormPrimitives";

const ADV_LABEL: Record<Exclude<BienesRaicesAdvertiserType, "">, string> = {
  agente_individual: "Agente individual",
  equipo_agentes: "Equipo de agentes",
  oficina_brokerage: "Oficina / brokerage",
  constructor_desarrollador: "Constructor / desarrollador",
};

export function ResumenPublicarNegocioSection({ state }: { state: BienesRaicesNegocioFormState }) {
  const adv = state.advertiserType;
  const nPhotos = state.media.photoUrls.filter((u) => u.trim()).length;
  const nVid = state.media.videoUrls.filter((u) => u.trim()).length;
  const ctasOn = [
    state.cta.permitirSolicitarInfo && "Info",
    state.cta.permitirProgramarVisita && "Visita",
    state.cta.permitirLlamar && "Llamada",
    state.cta.permitirWhatsapp && "WhatsApp",
  ].filter(Boolean) as string[];

  return (
    <section className={brCardClass}>
      <h2 className={brSectionTitleClass}>Publicar</h2>
      <p className={brSubTitleClass}>
        Negocio es pago por publicación (sin membresías en este lanzamiento). Revisa el resumen y confirma cuando el backend de
        cobro esté conectado.
      </p>
      <ul className="mt-5 space-y-3 text-sm text-[#2C2416]">
        <li className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2.5">
          <span className="font-bold text-[#5C5346]">Tipo de anunciante: </span>
          {adv ? ADV_LABEL[adv] : "— (elige en paso 1)"}
        </li>
        <li className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2.5">
          <span className="font-bold text-[#5C5346]">Medios: </span>
          {nPhotos} fotos · {Math.min(nVid, 2)} videos (máx. 2 en vista previa)
        </li>
        <li className="rounded-xl border border-[#E8DFD0] bg-white px-3 py-2.5">
          <span className="font-bold text-[#5C5346]">Contacto habilitado: </span>
          {ctasOn.length ? ctasOn.join(", ") : "Ninguno (revisa paso de contacto)"}
        </li>
      </ul>
      <button
        type="button"
        className="mt-6 w-full rounded-xl border-2 border-[#B8954A] bg-[#FFFCF7] px-4 py-3.5 text-sm font-bold text-[#6E5418] hover:bg-[#FFF6E7] sm:w-auto"
        onClick={() => {
          /* integración de cobro / API pendiente */
        }}
      >
        Publicar anuncio (Negocio)
      </button>
      <p className="mt-3 text-xs text-[#5C5346]/75">
        Tip: usa “Vista previa” en el paso anterior para validar hero, galería y detalles antes de pagar.
      </p>
    </section>
  );
}
