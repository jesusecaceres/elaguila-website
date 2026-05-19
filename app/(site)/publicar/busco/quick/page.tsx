import type { Metadata } from "next";
import { Suspense } from "react";

import BuscoQuickFormClient from "./BuscoQuickFormClient";

export const metadata: Metadata = {
  title: "Busco / Se busca — Publicar solicitud — LEONIX",
  description:
    "Publica una solicitud local para encontrar artículos, ayuda, grupos, transporte o recursos. No es una sección de citas.",
  alternates: {
    canonical: "/publicar/busco/quick",
  },
};

export default function PublicarBuscoQuickPage() {
  return (
    <Suspense fallback={<div className="min-h-[50vh] bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <BuscoQuickFormClient />
    </Suspense>
  );
}
