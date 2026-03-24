import { Suspense } from "react";
import { EnVentaPreviewPage } from "./EnVentaPreviewPage";

export default function EnVentaPreviewRoutePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-white">
          <div className="mx-auto max-w-6xl px-4 py-24 text-center text-sm text-[#111111]/50">Loading…</div>
        </main>
      }
    >
      <EnVentaPreviewPage />
    </Suspense>
  );
}
