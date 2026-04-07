import { Suspense } from "react";
import { PublicarAutosBranchClient } from "./PublicarAutosBranchClient";

export default function PublicarAutosPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] bg-[color:var(--lx-page)] px-4 pt-10" aria-busy="true">
          <div className="mx-auto max-w-3xl animate-pulse rounded-xl bg-[color:var(--lx-section)] h-40" />
        </div>
      }
    >
      <PublicarAutosBranchClient />
    </Suspense>
  );
}
