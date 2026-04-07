import { Suspense } from "react";
import BienesRaicesPrivadoPreviewClient from "./components/BienesRaicesPrivadoPreviewClient";

export default function BienesRaicesPrivadoPreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[#F9F6F1]" aria-hidden />}>
      <BienesRaicesPrivadoPreviewClient />
    </Suspense>
  );
}
