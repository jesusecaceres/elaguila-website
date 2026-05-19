import type { Metadata } from "next";
import { Suspense } from "react";

import MascotasPerdidosQuickFormClient from "./MascotasPerdidosQuickFormClient";

export const metadata: Metadata = {
  title: "Mascotas y Perdidos — Publicar aviso — LEONIX",
  description:
    "Publica un aviso gratuito y sencillo para mascotas perdidas o encontradas, adopciones u objetos perdidos o encontrados.",
  alternates: {
    canonical: "/publicar/mascotas-y-perdidos/quick",
  },
};

export default function PublicarMascotasPerdidosQuickPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <MascotasPerdidosQuickFormClient />
    </Suspense>
  );
}
