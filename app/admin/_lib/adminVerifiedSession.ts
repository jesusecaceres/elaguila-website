/**
 * Identity-verified admin session for PUBLICATION-WRITE routes (2026-09 final closeout).
 *
 * `requireAdminCookie()` only checks the coarse, unsigned marker `leonix_admin=1` (see adminSession.ts: it is
 * "an admin session exists", never the authority boundary). Routes that change what is publicly live used it as
 * their ONLY gate, so a raw HTTP client sending `Cookie: leonix_admin=1` plus a listing UUID (UUIDs are visible in
 * public URLs) could suspend / restore / republish / feature listings.
 *
 * This helper re-verifies identity through the same resolver every Business/Sales staff write already uses
 * (`resolveSalesWorkspaceAccess`): a REAL Supabase Auth user + matching active roster row, or the HMAC-signed
 * bootstrap token. Fails closed: no marker, no identity, an unknown user, an inactive roster row or an
 * unconfigured bootstrap secret all deny.
 */
import { resolveSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";

type CookieJar = Parameters<typeof resolveSalesWorkspaceAccess>[0];

export async function isVerifiedAdminSession(jar: CookieJar): Promise<boolean> {
  try {
    const access = await resolveSalesWorkspaceAccess(jar);
    return access.ok === true;
  } catch {
    return false;
  }
}
