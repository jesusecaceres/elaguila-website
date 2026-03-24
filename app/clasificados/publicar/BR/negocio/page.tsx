import { Suspense } from "react";
import LeonixBRNegocioApplication from "./application/LeonixBRNegocioApplication";

export default function PublicarBrNegocioPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#D9D9D9] pt-24 text-sm font-medium text-[#111111]/70">
          Cargando formulario…
        </div>
      }
    >
      <LeonixBRNegocioApplication />
    </Suspense>
  );
}
