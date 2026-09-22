import { Suspense } from "react";
import { cookies } from "next/headers";
import { PublishAuthGate } from "./PublishAuthGate";
import { readAssistedPublishingContext } from "@/app/lib/auth/assistedPublishingSession";

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

/**
 * Wrap publish / draft-preview / publish-checkout routes — blocks forms until EITHER a real
 * customer Supabase session exists OR a valid staff-assisted-publishing token is present.
 *
 * P0 Staff-Assisted Category Access (Gate 4) — this Server Component now reads the signed,
 * httpOnly assisted-publishing cookie server-side (real cryptographic verification, no DB call,
 * no client-forgeable input — see app/lib/auth/assistedPublishingSession.ts) and passes the
 * result down to the client gate. Normal customer requests never carry this cookie, so
 * `assisted` is `null` for 100% of real traffic and PublishAuthGate's existing Supabase-session
 * check runs completely unchanged. This one component pair is the single choke point every
 * category's application/preview route already renders through — no per-category changes needed.
 */
export async function PublishAuthGateLayout({ children }: { children: React.ReactNode }) {
  const jar = await cookies();
  const verified = readAssistedPublishingContext(jar);
  // Only what the banner and the UI context need crosses to the client: the business, the
  // category and the bound row. Roster and Auth ids stay server-side.
  const assisted = verified
    ? { businessId: verified.businessId, category: verified.category, listingId: verified.listingId ?? null }
    : null;

  return (
    <Suspense fallback={<PublishAuthGateFallback />}>
      <PublishAuthGate assisted={assisted}>{children}</PublishAuthGate>
    </Suspense>
  );
}
