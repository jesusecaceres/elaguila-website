import type { Metadata } from "next";
import { Suspense } from "react";

import BuscoQuickShellClient from "../BuscoQuickShellClient";

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
      <BuscoQuickShellClient mode="preview" />
    </Suspense>
  );
}
