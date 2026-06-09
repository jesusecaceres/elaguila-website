import { cookies } from "next/headers";

import { requireAdminCookie } from "@/app/lib/supabase/server";

import { ComingSoonGate } from "./ComingSoonGate";

const COMING_SOON_LOCKED = process.env.NEXT_PUBLIC_COMING_SOON_LOCK === "true";

/**
 * Public lock overlay — skipped when `leonix_admin` cookie is set so authorized
 * staff can preview locked pages (STAFF-ADMIN-01). Anonymous visitors stay gated.
 */
export async function ComingSoonGateRoot({ children }: { children: React.ReactNode }) {
  if (!COMING_SOON_LOCKED) {
    return <>{children}</>;
  }

  const cookieStore = await cookies();
  if (requireAdminCookie(cookieStore)) {
    return <>{children}</>;
  }

  return <ComingSoonGate />;
}
