import { Suspense } from "react";
import { EnVentaPreviewPage } from "./EnVentaPreviewPage";

export default function EnVentaPreviewRoutePage() {
  return (
    <Suspense
      fallback={
        <main
          className="min-h-screen text-[#5C5346]/80"
          style={{ backgroundColor: "#F3EBDD" }}
        >
          <div className="mx-auto max-w-6xl px-4 py-24 text-center text-sm">Cargando vista previa…</div>
        </main>
      }
    >
      <EnVentaPreviewPage />
    </Suspense>
  );
}
