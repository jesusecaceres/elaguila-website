import type { Metadata } from "next";
import { AutosPrivadoPreviewClient } from "./AutosPrivadoPreviewClient";
import { PREVIEW_NOINDEX_METADATA } from "@/app/lib/seo/previewRouteMetadata";

// Package F Build F2, Gate 3 (P0 SEO/indexing fix) — this route set a self-referencing canonical
// but no robots directive, relying solely on robots.txt (which does not prevent an externally
// linked bare URL from being indexed). Same shared noindex guard every other preview route uses.
export const metadata: Metadata = {
  ...PREVIEW_NOINDEX_METADATA,
  title: "Vista previa — Auto · Privado",
  description:
    "Vista previa del anuncio de vendedor particular en Leonix Media — premium, sin stack de concesionario.",
  alternates: {
    canonical: "/clasificados/autos/privado/preview",
  },
};

export default function ClasificadosAutosPrivadoPreviewPage() {
  return <AutosPrivadoPreviewClient />;
}
