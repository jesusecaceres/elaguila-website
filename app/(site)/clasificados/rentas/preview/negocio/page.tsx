import { Suspense } from "react";
import RentasNegocioPreviewClient from "./components/RentasNegocioPreviewClient";

export default function RentasNegocioPreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[#F9F6F1]" aria-hidden />}>
      <RentasNegocioPreviewClient />
    </Suspense>
  );
}
