import { Suspense } from "react";
import LeonixEnVentaProApplication from "./application/LeonixEnVentaProApplication";

export default function EnVentaProPublishPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#0f0f0f] pt-24 text-sm font-medium text-white/70">
          Cargando…
        </main>
      }
    >
      <LeonixEnVentaProApplication />
    </Suspense>
  );
}
