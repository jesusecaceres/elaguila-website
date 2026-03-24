import { Suspense } from "react";
import LeonixBRPrivadoApplication from "./application/LeonixBRPrivadoApplication";

export default function PublicarBrPrivadoPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#D9D9D9] pt-24 text-sm font-medium text-[#111111]/70">
          Cargando formulario…
        </div>
      }
    >
      <LeonixBRPrivadoApplication />
    </Suspense>
  );
}
