import { Suspense } from "react";
import { PublicarAutosPrivadoPlaceholderClient } from "./PublicarAutosPrivadoPlaceholderClient";

export default function PublicarAutosPrivadoPage() {
  return (
    <Suspense
      fallback={<div className="min-h-[40vh] bg-[color:var(--lx-page)]" aria-busy="true" />}
    >
      <PublicarAutosPrivadoPlaceholderClient />
    </Suspense>
  );
}
