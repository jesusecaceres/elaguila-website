import { Suspense } from "react";
import LeonixBRNegocioApplication from "./application/LeonixBRNegocioApplication";

export default function PublicarBrNegocioPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#E8E8E8] pt-24 text-sm font-medium text-[#111111]/70">
          Cargando formulario…
        </main>
      }
    >
      <LeonixBRNegocioApplication />
    </Suspense>
  );
}
