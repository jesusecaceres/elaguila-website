import type { Metadata } from "next";
import { Suspense } from "react";
import ComidaLocalApplicationClient from "./ComidaLocalApplicationClient";

export const metadata: Metadata = {
  title: "Publicar Comida Local | Leonix Media",
  description:
    "Crea una ficha simple para vender comida local, pop-ups o puestos móviles.",
  alternates: {
    canonical: "/publicar/comida-local",
  },
};

export default function PublicarComidaLocalPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[#FFFCF7]" aria-busy="true" />}>
      <ComidaLocalApplicationClient />
    </Suspense>
  );
}
