import type { Metadata } from "next";
import { Suspense } from "react";

import MascotasPerdidosQuickPreviewClient from "./MascotasPerdidosQuickPreviewClient";

export const metadata: Metadata = {
  title: "Vista previa — Mascotas y Perdidos — LEONIX",
  description: "Vista previa de aviso Mascotas y Perdidos antes de publicar.",
  alternates: {
    canonical: "/publicar/mascotas-y-perdidos/quick/preview",
  },
};

export default function PublicarMascotasPerdidosQuickPreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F4EFE6]" aria-busy="true" />}>
      <MascotasPerdidosQuickPreviewClient />
    </Suspense>
  );
}
