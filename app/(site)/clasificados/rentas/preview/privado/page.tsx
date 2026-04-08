import { Suspense } from "react";
import RentasPrivadoTemplatePreviewClient from "./components/RentasPrivadoTemplatePreviewClient";

export default function RentasPrivadoPreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[#F9F6F1]" aria-hidden />}>
      <RentasPrivadoTemplatePreviewClient />
    </Suspense>
  );
}
