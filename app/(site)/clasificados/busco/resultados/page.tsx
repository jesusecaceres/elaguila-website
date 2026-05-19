import { Suspense } from "react";

import { BuscoResultsClient } from "../BuscoResultsClient";

export default function BuscoResultadosPage() {
  return (
    <Suspense
      fallback={<BuscoResultadosFallback />}
    >
      <BuscoResultsClient />
    </Suspense>
  );
}

function BuscoResultadosFallback() {
  return <div className="min-h-screen bg-[#F4EFE6] pt-28 text-center text-sm text-[#5C564E]">…</div>;
}
