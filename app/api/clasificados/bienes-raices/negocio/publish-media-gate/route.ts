/**
 * Gate QB-BOUNDARY-04 — the SERVER seam that enforces the semantic media contract for a Bienes
 * Raíces NEGOCIO (business / agent) publish that does NOT go through Quick server custody.
 *
 * WHY THIS ROUTE IS BACK
 * ----------------------
 * It existed before the product-boundary work, and ran on EVERY `bienes-raices` + `business`
 * browser publish. QB-BOUNDARY-02 replaced it with `POST /quick-publish`, a server operation that
 * both validates and WRITES — strictly better, but reachable only when the browser declares the
 * Quick package key. An adversarial review showed what that costs: omit one client field and the
 * publish falls through to the old unguarded browser INSERT with no media check at all. That is
 * weaker than the state before either gate existed.
 *
 * So both seams now exist, and together they are exhaustive:
 *   - a declared Quick publish goes through `/quick-publish`, where the server holds the pen;
 *   - EVERY other business publish passes through here first, fail-closed, exactly as it did
 *     before — a refusal, a non-200 or an unreachable gate all abort the publish.
 *
 * PRODUCT AWARENESS
 * -----------------
 * The contract is skipped only for a PROVEN Full agent, resolved from server-owned records by
 * `resolveQuickBusinessPublishIdentity` — the blocker the boundary work closed, kept closed. An
 * undetermined product enforces, because a first publish precedes payment and the only other
 * signal is one the browser can omit.
 *
 * WHAT IT PROVES, AND WHAT IT DOES NOT
 *  - It proves the contract is evaluated by the SERVER, from server-held rules, on the media
 *    descriptor the publisher is about to write. The browser cannot decide the outcome, cannot
 *    see the rules, and cannot reinterpret a refusal.
 *  - It does NOT make the `listings` INSERT itself server-mediated on this path. That insert
 *    remains a browser→Postgres write governed by RLS. A client that bypassed
 *    `publishLeonixRealEstateListingCore` entirely and spoke to Supabase directly would not pass
 *    through here. Closing that last gap needs a database-side constraint — a migration this
 *    mission may not apply — and is recorded as a residual rather than papered over. The Quick
 *    product itself no longer has that gap: `/quick-publish` writes its rows server-side.
 *
 * SECURITY POSTURE
 *  - Identity comes from the bearer token, never from the body.
 *  - The contract, the roles that satisfy it and the refusal copy are all server-side constants.
 *  - The body carries only a role descriptor (`roles: (string|null)[]`) and, optionally, the
 *    listing being amended — never image bytes and never a URL — so this route stores nothing,
 *    writes no row, and charges nothing.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getBearerUserId } from "@/app/api/clasificados/_lib/bearerUser";
import { enforceQuickBusinessPublishMedia } from "@/app/lib/quickBusiness/quickBusinessMediaSemantics";
import { resolveQuickBusinessPublishIdentity } from "@/app/lib/listingPlans/quickBusinessProductIdentityServer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Hard cap so a malformed caller cannot turn this into an unbounded loop. */
const MAX_ROLES = 64;

export async function POST(request: NextRequest) {
  const userId = await getBearerUserId(request);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "auth_required" }, { status: 401 });
  }

  let body: { roles?: unknown; listingId?: unknown; basePackageKey?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  if (!Array.isArray(body.roles) || body.roles.length > MAX_ROLES) {
    return NextResponse.json({ ok: false, error: "invalid_body" }, { status: 400 });
  }

  // The owner is the bearer, never the body. A body `listingId` can only ever narrow the
  // entitlement read, which is itself owner-scoped, so naming another customer's Full listing
  // resolves to nothing rather than to an escape.
  const identity = await resolveQuickBusinessPublishIdentity({
    category: "bienes-raices",
    ownerUserId: userId,
    listingId: typeof body.listingId === "string" ? body.listingId.trim() || null : null,
    declaredPackageKey: typeof body.basePackageKey === "string" ? body.basePackageKey : null,
  });
  if (!identity.enforceQuickContract) {
    return NextResponse.json({ ok: true, product: identity.product, enforced: false });
  }

  const items = body.roles.map((r) => ({ role: typeof r === "string" ? r : null, mime: null }));
  const result = enforceQuickBusinessPublishMedia({ category: "bienes-negocio", items });
  if (result && !result.ok) {
    return NextResponse.json(result.body, { status: result.status });
  }

  return NextResponse.json({ ok: true, product: identity.product, enforced: true });
}
