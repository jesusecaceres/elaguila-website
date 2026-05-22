import { Suspense } from "react";

import { CommunityListingsResultsClient } from "@/app/(site)/clasificados/community/CommunityListingsResultsClient";

export default function ComunidadResultadosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#ECEAE7] pt-28 text-center text-sm text-[#5C564E]">…</div>
      }
    >
      <CommunityListingsResultsClient
        category="comunidad"
        pageTitleEs="Comunidad y Eventos"
        pageTitleEn="Community & Events"
        backLandingHref="/clasificados/comunidad"
        backLandingLabelEs="Volver a Comunidad y Eventos"
        backLandingLabelEn="Back to Community & Events"
      />
    </Suspense>
  );
}
