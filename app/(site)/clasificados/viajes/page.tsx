import { Suspense } from "react";

import { ViajesLandingPage } from "./components/ViajesLandingPage";

export default function ClasificadosViajesPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen bg-gradient-to-b from-[#f0e6d8] via-[#f5ebe0] to-[#fffcf7]"
          aria-busy="true"
        />
      }
    >
      <ViajesLandingPage />
    </Suspense>
  );
}
