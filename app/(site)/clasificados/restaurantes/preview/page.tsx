import type { Metadata } from "next";
import { Suspense } from "react";
import RestaurantePreviewClient from "./RestaurantePreviewClient";
import { PREVIEW_NOINDEX_METADATA } from "@/app/lib/seo/previewRouteMetadata";
import { ConciergeReturnBanner } from "@/app/components/business/ConciergeReturnBanner";

// Package F Build F2, Gate 3 (P0 SEO/indexing fix) — see autos/privado/preview for the same fix
// and reasoning.
export const metadata: Metadata = {
  ...PREVIEW_NOINDEX_METADATA,
  title: "Vista previa — Restaurantes",
  description: "Vista previa del anuncio de restaurante en Leonix Clasificados.",
  alternates: {
    canonical: "/clasificados/restaurantes/preview",
  },
};

export default function RestaurantesPreviewPage() {
  return (
    <>
      {/* P0 Sales Ad Creation Flow (Gates 5+6) — renders nothing unless a staff Create-for-Client
          handoff wrote return context for THIS tab; a real customer's own preview is unaffected. */}
      <ConciergeReturnBanner editHref="/publicar/restaurantes" />
      <Suspense fallback={<div className="min-h-[40vh] bg-[#FDFBF7]" aria-busy="true" />}>
        <RestaurantePreviewClient />
      </Suspense>
    </>
  );
}
