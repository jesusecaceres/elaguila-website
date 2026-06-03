import { Suspense } from "react";
import { PublishAuthGate } from "./PublishAuthGate";

function PublishAuthGateFallback() {
  return (
    <div
      className="flex min-h-[40vh] items-center justify-center px-4 text-center text-sm text-[#3D3428]"
      role="status"
      aria-live="polite"
    >
      <p>…</p>
    </div>
  );
}

/** Wrap publish / draft-preview / publish-checkout routes — blocks forms until Supabase session exists. */
export function PublishAuthGateLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<PublishAuthGateFallback />}>
      <PublishAuthGate>{children}</PublishAuthGate>
    </Suspense>
  );
}
