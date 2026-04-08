import { Suspense } from "react";
import { AutosPagoExitoClient } from "./AutosPagoExitoClient";

export default function AutosPagoExitoPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <AutosPagoExitoClient />
    </Suspense>
  );
}
