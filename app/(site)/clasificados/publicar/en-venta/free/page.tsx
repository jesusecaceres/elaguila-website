import { Suspense } from "react";
import LeonixEnVentaFreeApplication from "./application/LeonixEnVentaFreeApplication";

export default function EnVentaFreePublishPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#D9D9D9] pt-24 text-sm font-medium text-[#111111]/70">
          Cargando…
        </main>
      }
    >
      <LeonixEnVentaFreeApplication />
    </Suspense>
  );
}
