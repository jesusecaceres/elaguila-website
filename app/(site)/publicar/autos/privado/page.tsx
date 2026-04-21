import type { Metadata } from "next";
import { Suspense } from "react";
import { AutosPrivadoApplication } from "./components/AutosPrivadoApplication";

export const metadata: Metadata = {
  title: "Autos · Privado — Publicar",
  description: "Publica un vehículo de vendedor particular con Leonix Media — clasificados y autos NorCal.",
  alternates: {
    canonical: "/publicar/autos/privado",
  },
};

export default function PublicarAutosPrivadoPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <AutosPrivadoApplication />
    </Suspense>
  );
}
