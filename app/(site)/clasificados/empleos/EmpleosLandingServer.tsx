import { Suspense } from "react";
import { EmpleosLandingPage } from "./EmpleosLandingPageClient";

export function EmpleosLandingServer() {
  return (
    <Suspense fallback={<div className="min-h-screen" aria-busy="true" />}>
      <EmpleosLandingPage />
    </Suspense>
  );
}
