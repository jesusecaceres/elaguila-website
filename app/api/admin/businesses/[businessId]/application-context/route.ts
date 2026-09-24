/**
 * Assisted Publishing (Gate 07) — staff-side read of the neutral Business Identity projection
 * used to prefill EMPTY fields of a real category application. Read-only; the same
 * `view_business_detail` capability that already gates the business workspace page.
 *
 * P0 Staff-Assisted Category Access — this is also the ONE existing, proven place a staff actor
 * is re-verified server-side (real Supabase Auth + roster lookup) inside the SAME browser tab
 * that then navigates into the real public category application (HandoffClient.tsx). When the
 * caller also passes `?category=` and the actor holds `assisted_category_publishing`, this route
 * additionally mints the short-lived signed assisted-publishing cookie
 * (app/lib/auth/assistedPublishingSession.ts) on the SAME response — no second route, no new
 * auth system. Context/prefill still succeeds even when the capability is absent or minting
 * fails closed (e.g. secret not configured); only the cookie is skipped, so nothing here can
 * ever regress the existing prefill behavior.
 */
import { NextResponse, type NextRequest } from "next/server";
import { actorHasCapability, denialStatusCode, requireSalesWorkspaceAccess } from "@/app/admin/_lib/businessWorkspaceAccess";
import { buildBusinessApplicationContext } from "@/app/lib/business/applicationContext/businessApplicationContext";
import { applyAssistedPublishingCookie, readAssistedPublishingContext } from "@/app/lib/auth/assistedPublishingSession";
import { normalizePublicarGatewayDeepLink } from "@/app/(site)/publicar/publicarGatewayResolver";

export async function GET(req: NextRequest, { params }: { params: Promise<{ businessId: string }> }) {
  const access = await requireSalesWorkspaceAccess();
  if (!access.ok) return NextResponse.json({ ok: false, error: access.reason }, { status: denialStatusCode(access.reason) });
  if (!actorHasCapability(access.actor, "view_business_detail")) {
    return NextResponse.json({ ok: false, error: "role_not_permitted" }, { status: 403 });
  }
  const { businessId } = await params;
  const context = await buildBusinessApplicationContext(businessId);
  if (!context) return NextResponse.json({ ok: false, error: "business_not_found" }, { status: 404 });

  const res = NextResponse.json({
    ok: true,
    context,
    staffActor: { rosterId: access.actor.rosterId, email: access.actor.email, role: access.actor.role },
  });

  const category = normalizePublicarGatewayDeepLink(req.nextUrl.searchParams.get("category"));
  // QUICK SALES ENTRY CONSOLIDATION — never clobber a BOUND context. The Quick Sales custody route
  // re-mints this same cookie carrying the canonical listing id once the row exists (same-row
  // server authority). Re-minting here WITHOUT that id, for the same business and category, would
  // silently drop the binding and let the next save create a second row. A live context for the
  // same business + category is therefore left exactly as it is; only a context for a DIFFERENT
  // business or category (staff switching clients) is replaced.
  const live = readAssistedPublishingContext(req.cookies);
  const sameScope = Boolean(live) && live!.businessId === businessId && live!.category === category;
  const keepsBoundContext = sameScope && Boolean(live!.listingId);
  if (
    category &&
    !keepsBoundContext &&
    access.actor.rosterId &&
    access.actor.authUserId &&
    actorHasCapability(access.actor, "assisted_category_publishing")
  ) {
    applyAssistedPublishingCookie(res, {
      businessId,
      category,
      rosterId: access.actor.rosterId,
      authUserId: access.actor.authUserId,
      listingId: sameScope ? live!.listingId ?? null : null,
      clientUserId: sameScope ? live!.clientUserId ?? null : null,
      assistedAction: sameScope ? live!.assistedAction ?? null : null,
      packageKey: sameScope ? live!.packageKey ?? null : null,
    });
  }

  return res;
}
