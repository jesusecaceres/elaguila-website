import { Suspense } from "react";

import { CommunityListingsResultsClient } from "@/app/(site)/clasificados/community/CommunityListingsResultsClient";

export default function ClasesResultadosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#ECEAE7] pt-28 text-center text-sm text-[#5C564E]">…</div>
      }
    >
      <CommunityListingsResultsClient
        category="clases"
        pageTitleEs="Clases publicadas"
        pageTitleEn="Published classes"
        backLandingHref="/clasificados/clases"
        backLandingLabelEs="Volver a Clases"
        backLandingLabelEn="Back to Classes"
      />
    </Suspense>
  );
}
