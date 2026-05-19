import type { Metadata } from "next";
import { Suspense } from "react";

import BuscoQuickPreviewClient from "../BuscoQuickPreviewClient";

export const metadata: Metadata = {
  title: "Vista previa — Busco / Se busca — LEONIX",
  description: "Vista previa de solicitud Busco / Se busca antes de publicar.",
  alternates: {
    canonical: "/publicar/busco/quick/preview",
  },
};

export default function PublicarBuscoQuickPreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#D9D9D9]" aria-busy="true" />}>
      <BuscoQuickPreviewClient />
    </Suspense>
  );
}
