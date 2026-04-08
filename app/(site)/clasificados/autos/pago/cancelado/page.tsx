import { Suspense } from "react";
import { AutosPagoCanceladoClient } from "./AutosPagoCanceladoClient";

export default function AutosPagoCanceladoPage() {
  return (
    <Suspense fallback={<div className="min-h-[40vh] bg-[color:var(--lx-page)]" aria-busy="true" />}>
      <AutosPagoCanceladoClient />
    </Suspense>
  );
}
