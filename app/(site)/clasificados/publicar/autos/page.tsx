import type { Metadata } from "next";
import { Suspense } from "react";
import { PublicarAutosBranchClient } from "@/app/publicar/autos/PublicarAutosBranchClient";

export const metadata: Metadata = {
  title: "Publicar en Autos | Leonix Clasificados",
  description: "Elige entre vendedor privado o dealer de autos antes de iniciar tu aplicación.",
};

export default function ClasificadosPublicarAutosCheckpointPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] bg-[#F6F0E2] px-4 pt-10" aria-busy="true">
          <div className="mx-auto max-w-lg animate-pulse rounded-xl bg-[#FFFCF7] h-40" />
        </div>
      }
    >
      <PublicarAutosBranchClient />
    </Suspense>
  );
}
