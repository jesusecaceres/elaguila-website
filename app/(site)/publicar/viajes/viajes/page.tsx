import { Suspense } from "react";

import { PublicarViajesBranchClient } from "./PublicarViajesBranchClient";

export default function PublicarViajesPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] bg-[color:var(--lx-page)] px-4 pt-10" aria-busy="true">
          <div className="mx-auto max-w-3xl animate-pulse rounded-xl bg-[color:var(--lx-section)] h-40" />
        </div>
      }
    >
      <PublicarViajesBranchClient />
    </Suspense>
  );
}
