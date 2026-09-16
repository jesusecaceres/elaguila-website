import type { Metadata } from "next";
import { Suspense } from "react";
import { ClasificadosServiciosPreviewClient } from "./ClasificadosServiciosPreviewClient";
import { PREVIEW_NOINDEX_METADATA } from "@/app/lib/seo/previewRouteMetadata";
import { ConciergeReturnBanner } from "@/app/components/business/ConciergeReturnBanner";

export const metadata: Metadata = {
  ...PREVIEW_NOINDEX_METADATA,
  title: "Vista previa · Servicios · Leonix Clasificados",
  description: "Vista previa del perfil de negocio desde el borrador de la aplicación.",
  alternates: {
    canonical: "/clasificados/publicar/servicios/preview",
  },
  openGraph: {
    title: "Vista previa · Servicios · Leonix",
    description: "Vista previa del perfil de negocio en Servicios.",
    url: "/clasificados/publicar/servicios/preview",
    siteName: "LEONIX",
    type: "website",
  },
};

export default function ClasificadosServiciosPreviewPage() {
  return (
    <>
      {/* P0 Sales Ad Creation Flow (Gates 5+6) — renders nothing unless a staff Create-for-Client
          handoff wrote return context for THIS tab; a real customer's own preview is unaffected. */}
      <ConciergeReturnBanner editHref="/publicar/servicios" />
      <Suspense fallback={<div className="min-h-screen bg-[#F9F8F6]" aria-busy="true" />}>
        <ClasificadosServiciosPreviewClient />
      </Suspense>
    </>
  );
}
