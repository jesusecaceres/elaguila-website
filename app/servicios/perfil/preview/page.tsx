import { Suspense } from "react";
import { ServiciosPreviewClient } from "./ServiciosPreviewClient";

export default function ServiciosPreviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9F8F6]" />}>
      <ServiciosPreviewClient />
    </Suspense>
  );
}
