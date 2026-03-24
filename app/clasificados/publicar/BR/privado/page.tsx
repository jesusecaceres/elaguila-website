import { Suspense } from "react";
import LeonixBRPrivadoApplication from "./application/LeonixBRPrivadoApplication";

export default function PublicarBrPrivadoPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#F2F2F2] pt-24 text-sm font-medium text-[#111111]/70">
          Cargando formulario…
        </main>
      }
    >
      <LeonixBRPrivadoApplication />
    </Suspense>
  );
}
