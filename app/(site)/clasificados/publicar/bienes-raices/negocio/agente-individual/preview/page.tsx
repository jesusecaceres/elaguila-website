import { Suspense } from "react";
import { BrAgenteResidencialLocaleProvider } from "../application/BrAgenteResidencialLocaleContext";
import AgenteIndividualResidencialPreviewClient from "./AgenteIndividualResidencialPreviewClient";

export default function AgenteIndividualResidencialPreviewRoutePage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[#F9F6F1]" />}>
      <BrAgenteResidencialLocaleProvider>
        <AgenteIndividualResidencialPreviewClient />
      </BrAgenteResidencialLocaleProvider>
    </Suspense>
  );
}
