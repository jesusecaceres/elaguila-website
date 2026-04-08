import { Suspense } from "react";
import RentasPrivadoPreviewClient from "./components/RentasPrivadoPreviewClient";

export default function RentasPrivadoPreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[#F9F6F1]" aria-hidden />}>
      <RentasPrivadoPreviewClient />
    </Suspense>
  );
}
