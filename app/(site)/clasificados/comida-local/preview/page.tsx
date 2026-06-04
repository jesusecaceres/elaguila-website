import type { Metadata } from "next";
import { Suspense } from "react";
import { ComidaLocalPreviewClient } from "./ComidaLocalPreviewClient";

export const metadata: Metadata = {
  title: "Vista previa — Comida Local | Leonix Media",
  description: "Vista previa del borrador de tu ficha de Comida Local en Leonix Clasificados.",
  robots: { index: false, follow: false },
};

export default function ComidaLocalPreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[#FFFCF7]" aria-busy="true" />}>
      <ComidaLocalPreviewClient />
    </Suspense>
  );
}
