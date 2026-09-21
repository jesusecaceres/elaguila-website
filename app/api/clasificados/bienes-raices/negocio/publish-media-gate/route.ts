/**
 * Gate QB-MEDIA-03 — the SERVER seam that enforces the Quick Business semantic media contract for
 * Bienes Raíces NEGOCIO (business / agent) publishes.
 *
 * WHY THIS ROUTE EXISTS: three of the four Quick Business families publish through a server route,
 * so their publish handler can run the contract directly. Bienes Raíces Negocio publishes from the
 * BROWSER (`publishLeonixRealEstateListingCore` inserts through the RLS-governed Supabase browser
 * client), so it has no server publish handler to host the check. This route is that handler's
 * stand-in: `publishLeonixRealEstateListingCore` calls it before the insert and FAILS CLOSED —
 * a refusal, a non-200, or an unreachable gate all abort the publish.
 *
 * WHAT IT PROVES, AND WHAT IT DOES NOT
 *  - It proves the contract is evaluated by the SERVER, from server-held rules, on the media
 *    descriptor the publisher is about to write. The browser cannot decide the outcome, cannot
 *    see the rules, and cannot reinterpret a refusal.
 *  - It does NOT make the `listings` INSERT itself server-mediated. That insert is a
 *    browser→Postgres write governed by RLS, exactly as it was before this gate. A client that
 *    bypassed `publishLeonixRealEstateListingCore` entirely and spoke to Supabase directly would
 *    not pass through here. Closing that last gap requires a database-side constraint or an RLS
 *    policy — i.e. a migration — which this mission is explicitly not authorized to apply. This
 *    limitation is recorded in the technical evidence rather than papered over.
 *
 * SECURITY POSTURE
 *  - Identity comes from the bearer token, never from the body.
 *  - The contract, the roles that satisfy it and the refusal copy are all server-side constants.
 *  - The body carries only a role descriptor (`roles: (string|null)[]`) — never image bytes and
 *    never a URL — so this route stores nothing, writes no row, and charges nothing.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import { enforceQuickBusinessPublishMedia } from "@/app/lib/quickBusiness/quickBusinessMediaSemantics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Hard cap so a malformed caller cannot turn this into an unbounded loop. */
const MAX_ROLES = 64;

export async function POST(request: NextRequest) {
  const userId = await getBearerUserId(request);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  let body: { roles?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  if (!Array.isArray(body.roles) || body.roles.length > MAX_ROLES) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  const items = body.roles.map((r) => ({ role: typeof r === "string" ? r : null, mime: null }));
  const result = enforceQuickBusinessPublishMedia({ category: "bienes-negocio", items });
  if (result && !result.ok) {
    return NextResponse.json(result.body, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
