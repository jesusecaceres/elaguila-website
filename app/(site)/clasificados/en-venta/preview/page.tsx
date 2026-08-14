import { Suspense } from "react";
import type { Metadata } from "next";
import { EnVentaPreviewPage } from "./EnVentaPreviewPage";
import { PREVIEW_NOINDEX_METADATA } from "@/app/lib/seo/previewRouteMetadata";

// Package F Build F2, Gate 3 (P0 SEO/indexing fix) — this route had no metadata export at all,
// so it inherited the root layout's indexable robots default. Same shared noindex guard every
// other preview route uses.
export const metadata: Metadata = {
  ...PREVIEW_NOINDEX_METADATA,
};

export default function EnVentaPreviewRoutePage() {
  return (
    <Suspense
      fallback={
        <main
          className="min-h-screen text-[#5C5346]/80"
          style={{ backgroundColor: "#F8F4EA" }}
        >
          <div className="mx-auto max-w-6xl px-4 py-24 text-center text-sm">Cargando vista previa…</div>
        </main>
      }
    >
      <EnVentaPreviewPage />
    </Suspense>
  );
}
