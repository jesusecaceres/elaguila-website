"use client";

import type { Dispatch, SetStateAction } from "react";
import ListingRulesConfirmationSection from "@/app/clasificados/en-venta/shared/components/ListingRulesConfirmationSection";
import { BR_PREVIEW_NEGOCIO } from "@/app/clasificados/bienes-raices/shared/constants/brPublishRoutes";
import type { BienesRaicesNegocioFormState, BienesRaicesAdvertiserType } from "../../schema/bienesRaicesNegocioFormState";
import { BrPreviewHint, brCardClass, brSectionTitleClass, brSubTitleClass } from "./brFormPrimitives";

import { BrNegocioPrePublishInventoryShell } from "./BrNegocioPrePublishInventoryShell";

const ADV_LABEL: Record<Exclude<BienesRaicesAdvertiserType, "">, string> = {
  agente_individual: "Agente individual",
  equipo_agentes: "Equipo de agentes",
  oficina_brokerage: "Oficina / brokerage",
  constructor_desarrollador: "Constructor / desarrollador",
};

export function ResumenPublicarNegocioSection({
  state,
  setState,
  lang = "es",
  hideInventoryShell = false,
}: {
  state: BienesRaicesNegocioFormState;
  setState: Dispatch<SetStateAction<BienesRaicesNegocioFormState>>;
  lang?: "es" | "en";
  hideInventoryShell?: boolean;
}) {
  const adv = state.advertiserType;
  const nPhotos = state.media.photoUrls.filter((u) => u.trim()).length;
  const nVid = state.media.listingVideoSlots.filter(
    (sl) => sl.status === "ready" || sl.fallbackUrl.trim()
  ).length;
  const ctasOn = [
    state.cta.permitirSolicitarInfo && "Info",
    state.cta.permitirProgramarVisita && "Visita",
    state.cta.permitirLlamar && "Llamada",
    state.cta.permitirWhatsapp && "WhatsApp",
  ].filter(Boolean) as string[];

  const confirmAll =
    state.trust.confirmarInformacion && state.trust.confirmarFotos && state.trust.confirmarReglas;

  return (
    <section className={brCardClass}>
      <h2 className={brSectionTitleClass}>Publicar</h2>
      <p className={brSubTitleClass}>
        Revisa el resumen y confirma las casillas. La publicación final se hace desde la vista previa con el botón{" "}
        <strong className="text-[#1E1810]">Publicar anuncio</strong> o <strong className="text-[#1E1810]">Agregar al inventario</strong>.
      </p>
      <BrPreviewHint>
        Abre <span className="font-mono text-[#6E5418]">{BR_PREVIEW_NEGOCIO}</span> desde la barra superior (“Vista previa”).
        Ahí verás el diseño final y el único botón de publicación.
      </BrPreviewHint>
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
          <span className="font-bold text-[#5C5346]">Botones habilitados: </span>
          {ctasOn.length ? ctasOn.join(", ") : "Ninguno (revisa paso de botones y enlaces)"}
        </li>
      </ul>
      <BrNegocioPrePublishInventoryShell
        lang={lang}
        hidden={hideInventoryShell}
        items={state.additionalInventoryProperties}
        onItemsChange={(items) => setState((s) => ({ ...s, additionalInventoryProperties: items }))}
      />
      <div className="mt-6">
        <ListingRulesConfirmationSection
          lang="es"
          subject="property"
          confirmAccurate={state.trust.confirmarInformacion}
          confirmPhotos={state.trust.confirmarFotos}
          confirmRules={state.trust.confirmarReglas}
          onAccurate={(v) =>
            setState((s) => ({ ...s, trust: { ...s.trust, confirmarInformacion: v } }))
          }
          onPhotos={(v) => setState((s) => ({ ...s, trust: { ...s.trust, confirmarFotos: v } }))}
          onRules={(v) => setState((s) => ({ ...s, trust: { ...s.trust, confirmarReglas: v } }))}
        />
      </div>
      {!confirmAll ? (
        <p className="mt-3 text-sm text-amber-950/90">
          Marca las tres confirmaciones antes de publicar desde la vista previa.
        </p>
      ) : null}
    </section>
  );
}
