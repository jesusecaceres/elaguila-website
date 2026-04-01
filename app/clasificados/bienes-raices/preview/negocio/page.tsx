import { Suspense } from "react";
import { BienesRaicesNegocioPreviewRoot } from "./components/BienesRaicesNegocioPreviewClient";

function PreviewFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F9F6F1] text-[#5C5346]">
      Cargando vista previa…
    </div>
  );
}

export default function BienesRaicesNegocioPreviewRoutePage() {
  return (
    <Suspense fallback={<PreviewFallback />}>
      <BienesRaicesNegocioPreviewRoot />
    </Suspense>
  );
}
