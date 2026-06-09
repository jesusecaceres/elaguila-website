"use client";

import { OfertasLocalesAiItemReviewPanel } from "@/app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel";

type Props = {
  ofertaLocalId: string;
};

export function OfertasLocalesAdminAiItemReviewSection({ ofertaLocalId }: Props) {
  return (
    <div className="rounded-xl border border-[#E8DFD0] bg-white p-4">
      <h4 className="text-xs font-bold uppercase text-[#7A7164]">Revisión de artículos AI</h4>
      <p className="mt-1 text-xs text-[#7A7164]">
        Aprueba o rechaza artículos extraídos. Solo artículos aprobados y activos bajo oferta aprobada son públicos.
      </p>
      <div className="mt-4">
        <OfertasLocalesAiItemReviewPanel lang="es" ofertaLocalId={ofertaLocalId} />
      </div>
    </div>
  );
}
