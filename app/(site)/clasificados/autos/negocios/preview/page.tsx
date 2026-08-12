import type { Metadata } from "next";
import { Suspense } from "react";
import { AutosNegociosPreviewClient } from "./AutosNegociosPreviewClient";
import { PREVIEW_NOINDEX_METADATA } from "@/app/lib/seo/previewRouteMetadata";

// Package F Build F2, Gate 3 (P0 SEO/indexing fix) — see autos/privado/preview for the same fix
// and reasoning.
export const metadata: Metadata = {
  ...PREVIEW_NOINDEX_METADATA,
  title: "Vista previa — Auto · Negocio",
  description:
    "Vista previa del anuncio de concesionario en Leonix Media — un vehículo, una página.",
  alternates: {
    canonical: "/clasificados/autos/negocios/preview",
  },
};

export default function ClasificadosAutosNegociosPreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <AutosNegociosPreviewClient />
    </Suspense>
  );
}
