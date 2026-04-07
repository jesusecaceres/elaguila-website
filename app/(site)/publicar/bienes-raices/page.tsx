import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicarBienesRaicesNegocioSelectorClient } from "./PublicarBienesRaicesNegocioSelectorClient";

export const metadata: Metadata = {
  title: "Publicar Bienes Raíces — Negocio | Leonix",
  description: "Elige el tipo de anunciante y la categoría de propiedad para publicar en Leonix Clasificados.",
};

export default function PublicarBienesRaicesNegocioSelectorPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] bg-[color:var(--lx-page)] px-4 pt-10" aria-busy="true">
          <div className="mx-auto max-w-2xl animate-pulse rounded-xl bg-[color:var(--lx-section)] h-40" />
        </div>
      }
    >
      <PublicarBienesRaicesNegocioSelectorClient />
    </Suspense>
  );
}
